import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/me/try-on-results?userId=...
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ ok: false, error: "userId is required" }, { status: 400 });
  }
  const items = await db.tryOnResult.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { product: { select: { title: true, slug: true } } },
    take: 20,
  });
  return NextResponse.json({ ok: true, data: items });
}

// DELETE /api/me/try-on-results?id=...  (clears a cached result)
export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
  }
  await db.tryOnResult.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
