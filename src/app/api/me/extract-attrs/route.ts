import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

// POST /api/me/extract-attrs
// Body: { imageUrl, userId }
//
// Calls the VLM to analyze the user's uploaded face/body photo and extract
// structured physical attributes used by the try-on engine.
//
// Returns: {
//   faceShape, jawLine, cheekbones, skinUndertone, hairTexture, eyeShape,
//   build, height, posture, skinTone, hairColor, hairStyle, eyeColor
// }
export async function POST(req: NextRequest) {
  try {
    const { imageUrl, userId } = await req.json();
    if (!imageUrl) {
      return NextResponse.json({ ok: false, error: "imageUrl is required" }, { status: 400 });
    }

    // Authorization — user must be premium to use the VLM extraction
    if (userId) {
      const { db } = await import("@/lib/db");
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user?.isPremium) {
        return NextResponse.json(
          { ok: false, error: "Premium required for AI attribute extraction" },
          { status: 403 }
        );
      }
    }

    const zai = await ZAI.create();

    const prompt = `You are an expert fashion stylist and anthropometric analyst.
Analyze the person in this photo and extract these physical attributes.
Return STRICT JSON only (no markdown fences, no commentary) with this exact schema:

{
  "faceShape": "oval | round | square | heart | oblong | diamond",
  "jawLine": "defined | soft | sharp | wide",
  "cheekbones": "high | medium | low",
  "skinTone": "porcelain | fair | light | medium | olive | tan | deep | rich",
  "skinUndertone": "cool | warm | neutral",
  "hairTexture": "straight | wavy | curly | coily | kinky",
  "hairStyle": "buzz | short | mid-length | long | afro | bob | fade | buzz-cut | pixie | ponytail | bun | bald",
  "hairColor": "black | dark-brown | brown | auburn | red | blonde | gray | white",
  "eyeShape": "almond | round | hooded | monolid | upturned | downturned",
  "eyeColor": "brown | hazel | amber | green | blue | gray | black",
  "build": "slim-ectomorph | athletic-mesomorph | muscular | curvy-endomorph | plus-size | petite",
  "height": "short | average | tall",
  "posture": "upright | relaxed | slouched",
  "genderPresentation": "masculine | feminine | androgynous"
}

Only include keys you can confidently infer from the photo. If a key is unclear, set it to null.
Return ONLY the JSON object.`;

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      thinking: { type: "disabled" },
    });

    const content = response.choices[0]?.message?.content || "";

    // Strip any markdown fences if the model included them
    const cleaned = content
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsed: Record<string, any> = {};
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      // Try to find the first {...} block
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch (e2) { parsed = {}; }
      }
    }

    return NextResponse.json({ ok: true, data: parsed });
  } catch (err: any) {
    console.error("[extract-attrs]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to extract attributes", detail: String(err.message) },
      { status: 500 }
    );
  }
}
