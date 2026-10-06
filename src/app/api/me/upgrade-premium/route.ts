import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/me/upgrade-premium
// Body: { userId }
// Marks the user as premium. In production this would integrate with Stripe
// after a successful checkout — here it's a one-click demo upgrade.
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "userId is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    if (user.isPremium) {
      return NextResponse.json({ ok: true, data: user, message: "Already premium" });
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: { isPremium: true, premiumSince: new Date() },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (err: any) {
    console.error("[upgrade-premium]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to upgrade", detail: String(err.message) },
      { status: 500 }
    );
  }
}
