import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/credit/balance?userId=...
// Returns the user's current credit balance, limit, and used amount.
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ ok: false, error: "userId is required" }, { status: 400 });
  }
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      creditBalanceCents: true,
      creditLimitCents: true,
      creditUsedCents: true,
    },
  });
  if (!user) {
    return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, data: user });
}
