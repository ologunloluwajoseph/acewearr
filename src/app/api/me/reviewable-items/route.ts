import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/me/reviewable-items?userId=...
// Returns the user's order items that are eligible for review
// (order is DELIVERED + no existing review yet)
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ ok: false, error: "userId is required" }, { status: 400 });
  }
  const items = await db.orderItem.findMany({
    where: {
      reviewEligible: true,
      review: null,
      order: { userId, status: "DELIVERED" },
    },
    include: { product: { select: { id: true, slug: true, title: true } } },
    orderBy: { id: "asc" },
  });
  return NextResponse.json({ ok: true, data: items });
}
