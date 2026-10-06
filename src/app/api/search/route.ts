import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================================
//  GET /api/search?q=...&limit=...
//  Full-text search across products by title, tags, material, and category.
// ============================================================================
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const limit = Math.min(Number(searchParams.get("limit") || 20), 50);

  if (!q || q.length < 2) {
    return NextResponse.json({ ok: true, data: [], query: q });
  }

  const products = await db.product.findMany({
    where: {
      isActive: true,
      OR: [
        { title: { contains: q } },
        { tags: { contains: q } },
        { material: { contains: q } },
        { description: { contains: q } },
        { category: { name: { contains: q } } },
        { category: { slug: { contains: q } } },
      ],
    },
    include: {
      images: { where: { angle: "FRONT" }, take: 1 },
      variants: { where: { isActive: true }, orderBy: { size: "asc" } },
      category: true,
      promoTags: { where: { isActive: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({
    ok: true,
    data: products,
    query: q,
    count: products.length,
  });
}
