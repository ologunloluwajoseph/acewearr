import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/seller/register
// Body: { userId, storeName }
// Converts a customer account to a seller account.
export async function POST(req: NextRequest) {
  try {
    const { userId, storeName } = await req.json();
    if (!userId || !storeName) {
      return NextResponse.json({ ok: false, error: "userId and storeName are required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }
    if (user.isSeller) {
      return NextResponse.json({ ok: false, error: "Already a seller" }, { status: 409 });
    }

    const storeSlug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const updated = await db.user.update({
      where: { id: userId },
      data: {
        isSeller: true,
        storeName,
        storeSlug,
        role: "SELLER",
        commissionRate: 10.0, // default 10% commission
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: updated.id,
        storeName: updated.storeName,
        storeSlug: updated.storeSlug,
        commissionRate: updated.commissionRate,
      },
    }, { status: 201 });
  } catch (err: any) {
    console.error("[seller.register]", err);
    return NextResponse.json({ ok: false, error: "Failed to register as seller" }, { status: 500 });
  }
}
