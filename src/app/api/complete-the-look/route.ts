import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/complete-the-look?productId=...
// Simple heuristic recommendation engine:
//  - For a Top: recommend a matching Bottom + Shoes + Accessory
//  - For a Bottom: recommend a matching Top + Shoes
//  - For Outerwear: recommend a Top + Bottom
//  - Returns 3-4 cross-sell candidates with the FRONT image and lowest-price variant.
export async function GET(req: NextRequest) {
  const productId = new URL(req.url).searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ ok: false, error: "productId required" }, { status: 400 });
  }

  const source = await db.product.findFirst({
    where: { OR: [{ id: productId }, { slug: productId }] },
    include: { category: true },
  });
  if (!source) {
    return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
  }

  const sourceCat = source.category?.slug;
  let targetCats: string[] = [];
  let count = 4;

  switch (sourceCat) {
    case "tops":
      targetCats = ["bottoms", "shoes", "accessories", "outerwear"];
      break;
    case "bottoms":
      targetCats = ["tops", "shoes", "accessories"];
      count = 3;
      break;
    case "outerwear":
      targetCats = ["tops", "bottoms", "accessories"];
      count = 3;
      break;
    case "shoes":
      targetCats = ["bottoms", "tops", "accessories"];
      count = 3;
      break;
    case "accessories":
      targetCats = ["tops", "bottoms", "shoes"];
      count = 3;
      break;
    default:
      targetCats = ["tops", "bottoms", "shoes", "accessories"];
  }

  const recs = await db.product.findMany({
    where: {
      isActive: true,
      id: { not: source.id },
      category: { slug: { in: targetCats } },
    },
    include: {
      category: true,
      images: { where: { angle: "FRONT" }, take: 1 },
      variants: { where: { isActive: true }, orderBy: { priceOverrideCents: "asc" } },
    },
    take: count,
  });

  // Sort to match the targetCat order so the "complete the look" makes sense
  const ordered = targetCats
    .map((slug) => recs.find((r) => r.category?.slug === slug))
    .filter((p): p is NonNullable<typeof p> => !!p);

  return NextResponse.json({
    ok: true,
    data: ordered.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      image: p.images[0]?.url,
      priceCents: p.variants[0]?.priceOverrideCents ?? p.basePriceCents,
      currency: p.currency,
      category: p.category?.slug ?? "",
      fit: p.fit,
    })),
  });
}
