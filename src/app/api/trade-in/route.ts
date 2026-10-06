import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/trade-in
// Body: { userId, productId, condition, ageMonths?, claimedCreditCents? }
// Marks a pre-owned AceWears item for trade-in store credit.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, productId, condition, ageMonths, claimedCreditCents = 0 } = body;

    if (!userId || !productId || !condition) {
      return NextResponse.json(
        { ok: false, error: "userId, productId and condition are required" },
        { status: 400 }
      );
    }
    const validConditions = ["NEW", "LIKE_NEW", "GOOD", "WORN"];
    if (!validConditions.includes(condition)) {
      return NextResponse.json(
        { ok: false, error: `Invalid condition. Must be one of: ${validConditions.join(", ")}` },
        { status: 400 }
      );
    }

    // Simple credit calc — in production this would use a pricing matrix
    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    }
    const conditionMultiplier: Record<string, number> = {
      NEW: 0.45, LIKE_NEW: 0.35, GOOD: 0.25, WORN: 0.15,
    };
    const computedCreditCents = Math.round(
      product.basePriceCents * conditionMultiplier[condition]
    );

    const tradeIn = await db.tradeInItem.create({
      data: {
        userId,
        productId,
        condition,
        ageMonths: ageMonths ? Number(ageMonths) : null,
        claimedCreditCents: claimedCreditCents || computedCreditCents,
        status: "SUBMITTED",
      },
      include: { product: { select: { title: true, slug: true } } },
    });

    return NextResponse.json({ ok: true, data: tradeIn }, { status: 201 });
  } catch (err: any) {
    console.error("[trade-in.create]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to submit trade-in", detail: String(err.message) },
      { status: 500 }
    );
  }
}

// GET /api/trade-in?userId=...
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ ok: false, error: "userId is required" }, { status: 400 });
  }
  const items = await db.tradeInItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { product: { select: { title: true, slug: true, images: { take: 1 } } } },
  });
  return NextResponse.json({ ok: true, data: items });
}
