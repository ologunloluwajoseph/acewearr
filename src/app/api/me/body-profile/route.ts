import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/me/body-profile?userId=...
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ ok: false, error: "userId is required" }, { status: 400 });
  }
  const profile = await db.bodyProfile.findUnique({
    where: { userId },
    include: { user: { select: { isPremium: true, heightCm: true, weightKg: true, fitPreference: true } } },
  });
  return NextResponse.json({ ok: true, data: profile });
}

// POST /api/me/body-profile
// Body: { userId, ...fields }
// Creates or updates the user's body profile.
// If a new faceImageUrl is provided, the route will trigger a VLM extraction
// (performed by the client via /api/me/extract-attrs) — this route only persists.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      skinTone, hairStyle, hairColor, eyeColor, bodyType,
      bustChestCm, waistCm, hipCm, inseamCm, shoulderCm,
      faceImageUrl, bodyImageUrl,
      vlmExtractedAttrs,
      consentToRender,
    } = body;

    if (!userId) {
      return NextResponse.json({ ok: false, error: "userId is required" }, { status: 400 });
    }

    // Verify the user exists and is premium
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }
    if (!user.isPremium) {
      return NextResponse.json(
        { ok: false, error: "Body profile is a premium feature. Upgrade to unlock." },
        { status: 403 }
      );
    }

    const data = {
      skinTone, hairStyle, hairColor, eyeColor, bodyType,
      bustChestCm: bustChestCm ? Number(bustChestCm) : null,
      waistCm: waistCm ? Number(waistCm) : null,
      hipCm: hipCm ? Number(hipCm) : null,
      inseamCm: inseamCm ? Number(inseamCm) : null,
      shoulderCm: shoulderCm ? Number(shoulderCm) : null,
      faceImageUrl, bodyImageUrl,
      vlmExtractedAttrs,
      consentToRender: consentToRender ?? false,
    };

    const profile = await db.bodyProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    return NextResponse.json({ ok: true, data: profile });
  } catch (err: any) {
    console.error("[body-profile.create]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to save body profile", detail: String(err.message) },
      { status: 500 }
    );
  }
}

// DELETE /api/me/body-profile?userId=...
export async function DELETE(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ ok: false, error: "userId is required" }, { status: 400 });
  }
  await db.bodyProfile.deleteMany({ where: { userId } });
  return NextResponse.json({ ok: true });
}
