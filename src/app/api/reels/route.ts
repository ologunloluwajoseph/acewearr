import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/reels - returns active reels, latest first
export async function GET() {
  const reels = await db.reelItem.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true, slug: true, title: true,
          basePriceCents: true, currency: true, fit: true,
          images: { where: { angle: "FRONT" }, take: 1 },
          variants: { where: { isActive: true } },
        },
      },
    },
  });
  return NextResponse.json({ ok: true, data: reels });
}
