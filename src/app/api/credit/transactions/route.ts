import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/credit/transactions?userId=...
// Returns the user's credit transaction history (newest first).
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ ok: false, error: "userId is required" }, { status: 400 });
  }
  const transactions = await db.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { title: true, slug: true } },
    },
    take: 50,
  });
  return NextResponse.json({ ok: true, data: transactions });
}
