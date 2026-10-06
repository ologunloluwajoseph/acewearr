import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";

// ============================================================================
//  POST /api/try-on
//  Body: { userId, productId }
//
//  Premium-only AI Virtual Try-On:
//    1. Loads the user's BodyProfile (manual fields + VLM-extracted attrs).
//    2. Loads the product's FRONT image + title + material + fit.
//    3. Uses VLM to generate a detailed natural-language description of how the
//       garment would look on this specific person — accounting for skin tone,
//       hair, build, body type, etc.
//    4. Uses the image-generation model to synthesize a photorealistic
//       visualization. We use the 768x1344 portrait size since clothing
//       try-on benefits from a full-body framing.
//    5. Caches the result in TryOnResult keyed by (userId, productId) so
//       subsequent views of the same product are instant.
//
//  Returns: { ok: true, data: { resultUrl, promptUsed, cached } }
// ============================================================================
export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  try {
    const { userId, productId } = await req.json();
    if (!userId || !productId) {
      return NextResponse.json(
        { ok: false, error: "userId and productId are required" },
        { status: 400 }
      );
    }

    // ---- Authorization + premium check ----
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }
    if (!user.isPremium) {
      return NextResponse.json(
        { ok: false, error: "Virtual Try-On is a premium feature. Upgrade to unlock." },
        { status: 403 }
      );
    }

    // ---- Load body profile ----
    const profile = await db.bodyProfile.findUnique({ where: { userId } });
    if (!profile || !profile.consentToRender) {
      return NextResponse.json(
        { ok: false, error: "Please complete your body profile and grant render consent first." },
        { status: 422 }
      );
    }

    // ---- Load product (include category so we can adapt the prompt) ----
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        images: { where: { angle: "FRONT" }, take: 1 },
      },
    });
    if (!product) {
      return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    }
    const frontImage = product.images[0];
    if (!frontImage) {
      return NextResponse.json({ ok: false, error: "Product has no FRONT image" }, { status: 422 });
    }

    // ---- Cache hit? ----
    const cached = await db.tryOnResult.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (cached) {
      return NextResponse.json({
        ok: true,
        data: {
          resultUrl: cached.resultUrl,
          promptUsed: cached.promptUsed,
          cached: true,
          durationMs: cached.durationMs ?? null,
        },
      });
    }

    // ---- Detect product category → drives framing, image size, prompt style ----
    const categorySlug = (product.category?.slug || "").toLowerCase();
    const title = (product.title || "").toLowerCase();
    const tags = (product.tags || "").toLowerCase();
    const tryOnMode = detectTryOnMode(categorySlug, title, tags);

    // ---- Build the VLM analysis prompt ----
    // Parse VLM-extracted attrs (may be null on first run)
    let vlmAttrs: Record<string, any> = {};
    try { vlmAttrs = JSON.parse(profile.vlmExtractedAttrs || "{}"); } catch {}

    const physicalDescription = buildPhysicalDescription(profile, vlmAttrs, user);

    // ---- Step 1: VLM analysis (category-aware) ----
    const zai = await ZAI.create();

    const garmentAnalysisResponse = await zai.chat.completions.createVision({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: tryOnMode.vlmPrompt,
            },
            { type: "image_url", image_url: { url: frontImage.url } },
          ],
        },
      ],
      thinking: { type: "disabled" },
    });
    const garmentAnalysis = (garmentAnalysisResponse.choices[0]?.message?.content || "")
      .trim()
      .slice(0, 500);

    // ---- Step 2: Compose the try-on image prompt (category-aware) ----
    const tryOnPrompt = composeTryOnPrompt({
      mode: tryOnMode,
      physicalDescription,
      garmentAnalysis,
      productTitle: product.title,
      material: product.material,
      fit: product.fit,
      faceImageUrl: profile.faceImageUrl,
      bodyImageUrl: profile.bodyImageUrl,
    });

    // ---- Step 3: Image generation (size depends on category) ----
    const imageResponse = await zai.images.generations.create({
      prompt: tryOnPrompt,
      size: tryOnMode.imageSize,
    });

    const imageBase64 = imageResponse.data[0]?.base64;
    if (!imageBase64) {
      return NextResponse.json(
        { ok: false, error: "Image generation returned no data" },
        { status: 500 }
      );
    }

    // ---- Save the rendered image ----
    const outDir = path.join(process.cwd(), "public", "uploads", "try-on");
    if (!existsSync(outDir)) await mkdir(outDir, { recursive: true });
    const filename = `try-on-${userId.slice(0, 8)}-${productId.slice(0, 8)}-${randomUUID().slice(0, 6)}.png`;
    const filepath = path.join(outDir, filename);
    await writeFile(filepath, Buffer.from(imageBase64, "base64"));
    const resultUrl = `/uploads/try-on/${filename}`;

    // ---- Persist result ----
    const durationMs = Date.now() - startedAt;
    const result = await db.tryOnResult.create({
      data: {
        userId,
        productId,
        resultUrl,
        promptUsed: tryOnPrompt,
        modelVersion: "zai-vlm-and-image-gen-v1",
        durationMs,
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        resultUrl: result.resultUrl,
        promptUsed: result.promptUsed,
        cached: false,
        durationMs,
        garmentAnalysis,
      },
    });
  } catch (err: any) {
    console.error("[try-on]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to generate try-on", detail: String(err.message) },
      { status: 500 }
    );
  }
}

// ============================================================================
//  Helpers
// ============================================================================

function buildPhysicalDescription(
  profile: any,
  vlm: Record<string, any>,
  user: any
): string {
  const parts: string[] = [];

  // Height / weight from user record
  if (user.heightCm) parts.push(`${user.heightCm}cm tall`);
  if (user.weightKg) parts.push(`weighing ${user.weightKg}kg`);

  // Body type
  if (profile.bodyType) {
    const bt = profile.bodyType.toLowerCase();
    if (bt.includes("ECTO")) parts.push("with a slim ectomorph build");
    else if (bt.includes("MESO")) parts.push("with an athletic mesomorph build");
    else if (bt.includes("ENDO")) parts.push("with a fuller endomorph build");
  }

  // Measurements
  const measures: string[] = [];
  if (profile.bustChestCm) measures.push(`${profile.bustChestCm}cm chest`);
  if (profile.waistCm) measures.push(`${profile.waistCm}cm waist`);
  if (profile.hipCm) measures.push(`${profile.hipCm}cm hips`);
  if (profile.shoulderCm) measures.push(`${profile.shoulderCm}cm shoulders`);
  if (measures.length) parts.push(`(${measures.join(", ")})`);

  // Skin tone
  if (profile.skinTone) {
    const toneMap: Record<string, string> = {
      porcelain: "porcelain fair skin",
      fair: "fair skin",
      light: "light skin",
      medium: "medium skin tone",
      olive: "olive skin tone",
      tan: "tan skin",
      deep: "deep brown skin",
      rich: "rich dark skin",
    };
    parts.push(toneMap[profile.skinTone] || `${profile.skinTone} skin`);
  }
  if (vlm.skinUndertone) parts.push(`with ${vlm.skinUndertone} undertones`);

  // Hair
  const hairParts: string[] = [];
  if (profile.hairStyle) hairParts.push(profile.hairStyle.replace(/-/g, " "));
  if (profile.hairColor) hairParts.push(profile.hairColor);
  if (vlm.hairTexture) hairParts.push(`${vlm.hairTexture} texture`);
  if (hairParts.length) parts.push(`with ${hairParts.join(" ")} hair`);

  // Face
  const faceParts: string[] = [];
  if (vlm.faceShape) faceParts.push(`${vlm.faceShape} face shape`);
  if (vlm.jawLine) faceParts.push(`${vlm.jawLine} jawline`);
  if (vlm.eyeShape) faceParts.push(`${vlm.eyeShape} eyes`);
  if (profile.eyeColor) faceParts.push(`${profile.eyeColor} eye color`);
  if (faceParts.length) parts.push(`featuring ${faceParts.join(", ")}`);

  // Build / posture
  if (vlm.build) parts.push(`build: ${vlm.build}`);
  if (vlm.posture) parts.push(`posture: ${vlm.posture}`);
  if (vlm.genderPresentation) parts.push(`gender presentation: ${vlm.genderPresentation}`);

  return parts.join(", ");
}

// ============================================================================
//  Try-on mode detection — drives framing, image size, and prompt style
//  based on the product category. Supports clothes, shoes, jewelry, wigs,
//  accessories, and everything in between.
// ============================================================================

type TryOnMode = {
  kind:
    | "full-body"   // tops, bottoms, outerwear, dresses → full-body portrait
    | "lower-body"  // shoes, pants → from waist down
    | "face"        // earrings, necklace, makeup, glasses → face/upper-chest closeup
    | "head"        // wigs, hats, hair accessories → headshot
    | "accessory"   // belts, watches, bags → medium shot of the relevant body part
    | "full-body-default";
  imageSize: "768x1344" | "1024x1024" | "864x1152" | "1152x864";
  vlmPrompt: string;
  promptTemplate: (ctx: {
    physicalDescription: string;
    garmentAnalysis: string;
    productTitle: string;
    material: string | null;
    fit: string | null;
    refImageHint: string;
  }) => string;
};

function detectTryOnMode(categorySlug: string, title: string, tags: string): TryOnMode {
  const haystack = `${categorySlug} ${title} ${tags}`;

  // ---- Wigs / hair / hats → headshot ----
  if (/\b(wig|hairpiece|hair piece|extension|hat|cap|beanie|headwear|fascinator)\b/.test(haystack)) {
    return {
      kind: "head",
      imageSize: "864x1152",
      vlmPrompt: `You are a hair stylist. Describe this hairpiece / headwear in 60 words or fewer,
focusing on: style, color, length, texture, parting direction, and how it frames the face.
Do not describe any model in the photo. Output plain prose.`,
      promptTemplate: ({ physicalDescription, garmentAnalysis, productTitle, material, refImageHint }) =>
        `Photorealistic HEAD-AND-SHOULDERS portrait photograph of a real person — ${physicalDescription}.
They are wearing: ${productTitle}${material ? `, made of ${material}` : ""} on their head.
Hairpiece details (from the product image): ${garmentAnalysis}

${refImageHint}The hairpiece must sit naturally on the head — accurate hairline integration, realistic shadow at the crown, and natural blending with the face framing. The camera frames the head and shoulders only (headshot). The model faces the camera directly with a neutral expression. Soft studio lighting from the upper-left, neutral light-gray background. High-end beauty photography, shot on a Sony A7 IV with an 85mm f/1.4 lens. No text overlays, no logos, no other people in frame.`,
    };
  }

  // ---- Earrings / necklace / jewelry / glasses → face closeup ----
  if (/\b(earring|necklace|jewel|jewelry|bracelet|ring|pendant|chain|glasses|sunglass|nose ring|septum)\b/.test(haystack)) {
    return {
      kind: "face",
      imageSize: "864x1152",
      vlmPrompt: `You are a jewelry stylist. Describe this piece in 60 words or fewer,
focusing on: material (gold/silver/gemstone), color, size, setting, and how it sits on the body.
Do not describe any model in the photo. Output plain prose.`,
      promptTemplate: ({ physicalDescription, garmentAnalysis, productTitle, material, refImageHint }) =>
        `Photorealistic CLOSE-UP BEAUTY portrait of a real person's face and upper chest — ${physicalDescription}.
They are wearing: ${productTitle}${material ? `, made of ${material}` : ""}.
Jewelry details (from the product image): ${garmentAnalysis}

${refImageHint}The piece must sit naturally on the body — accurate placement (earlobe for earrings, collarbone for necklace, etc.), realistic reflection on metal/gemstones, and natural skin showing through. The camera frames the face, neck, and upper chest only (beauty closeup). The model faces the camera directly. Soft beauty-light lighting from the front, neutral light-gray background. High-end jewelry editorial photography, shot on a Sony A7 IV with a 90mm macro lens. No text overlays, no logos, no other people in frame.`,
    };
  }

  // ---- Shoes → lower-body shot ----
  if (/\b(shoe|sneaker|boot|sandal|heel|loafer|flat|oxford|derby)\b/.test(haystack) || categorySlug === "shoes") {
    return {
      kind: "lower-body",
      imageSize: "864x1152",
      vlmPrompt: `You are a footwear stylist. Describe this shoe in 60 words or fewer,
focusing on: silhouette, color, material (leather/suede/mesh), sole type, and styling context.
Do not describe any model in the photo. Output plain prose.`,
      promptTemplate: ({ physicalDescription, garmentAnalysis, productTitle, material, refImageHint }) =>
        `Photorealistic LOWER-BODY fashion photograph of a real person — ${physicalDescription}.
They are wearing: ${productTitle}${material ? `, made of ${material}` : ""} on their feet.
Footwear details (from the product image): ${garmentAnalysis}

${refImageHint}The shoes must fit naturally — accurate ankle/cuff break, realistic crease at the toe box, and natural contact with the floor. The camera frames from the waist down (lower body). The model stands in a relaxed three-quarter pose with feet shoulder-width apart. Soft studio lighting from the upper-left, neutral light-gray background. High-end footwear editorial photography, shot on a Sony A7 IV with a 50mm f/1.8 lens. No text overlays, no logos, no other people in frame.`,
    };
  }

  // ---- Belts / watches / bags → medium accessory shot ----
  if (/\b(belt|watch|bag|purse|wallet|clutch|tote|backpack|scarf|glove)\b/.test(haystack) || categorySlug === "accessories") {
    return {
      kind: "accessory",
      imageSize: "864x1152",
      vlmPrompt: `You are an accessories stylist. Describe this accessory in 60 words or fewer,
focusing on: material, color, hardware, size, and where it's worn/carried.
Do not describe any model in the photo. Output plain prose.`,
      promptTemplate: ({ physicalDescription, garmentAnalysis, productTitle, material, refImageHint }) =>
        `Photorealistic MEDIUM-SHOT fashion photograph of a real person — ${physicalDescription}.
They are wearing/carrying: ${productTitle}${material ? `, made of ${material}` : ""}.
Accessory details (from the product image): ${garmentAnalysis}

${refImageHint}The accessory must sit naturally on the body — accurate placement (waist for belts, wrist for watches, hand/shoulder for bags), realistic drape and weight. The camera frames from the chest to mid-thigh (medium shot). The model stands in a relaxed pose. Soft studio lighting from the upper-left, neutral light-gray background. High-end accessories editorial photography, shot on a Sony A7 IV with a 50mm f/1.8 lens. No text overlays, no logos, no other people in frame.`,
    };
  }

  // ---- Default: full-body (tops, bottoms, outerwear, dresses) ----
  return {
    kind: "full-body",
    imageSize: "768x1344",
    vlmPrompt: `You are a fashion stylist. Describe this garment in 60 words or fewer,
focusing on: silhouette, fit (slim/regular/relaxed/oversized), fabric weight and drape,
primary color, secondary details (buttons, lapels, pockets), and styling context.
Do not describe the model in the photo. Output plain prose.`,
    promptTemplate: ({ physicalDescription, garmentAnalysis, productTitle, material, fit, refImageHint }) =>
      `Photorealistic full-body fashion editorial photograph of a real person — ${physicalDescription}.
They are wearing: ${productTitle}${material ? `, made of ${material}` : ""}${fit ? `, ${fit.toLowerCase()} fit` : ""}.
Garment details (from the product image): ${garmentAnalysis}

${refImageHint}The garment must fit naturally on the body — accurate drape, folds, and tension at the shoulders, chest, waist, and hips. Natural lighting from the upper-left, soft shadows, neutral studio background (warm light gray). The model stands in a relaxed three-quarter pose, facing the camera at slight angle, hands visible at the sides. Crisp focus on the garment. High-end fashion e-commerce photography, shot on a Sony A7 IV with a 50mm f/1.8 lens. No text overlays, no logos other than the garment's own label, no other people in frame.`,
  };
}

function composeTryOnPrompt({
  mode,
  physicalDescription,
  garmentAnalysis,
  productTitle,
  material,
  fit,
  faceImageUrl,
  bodyImageUrl,
}: {
  mode: TryOnMode;
  physicalDescription: string;
  garmentAnalysis: string;
  productTitle: string;
  material: string | null;
  fit: string | null;
  faceImageUrl: string | null;
  bodyImageUrl: string | null;
}): string {
  const refImageHint =
    faceImageUrl || bodyImageUrl
      ? `Use the facial features, body proportions, and natural details (skin tone, hair, build) shown in the user's reference photo(s) to make the rendered person look like the actual user. `
      : "";

  return mode.promptTemplate({
    physicalDescription,
    garmentAnalysis,
    productTitle,
    material,
    fit,
    refImageHint,
  });
}
