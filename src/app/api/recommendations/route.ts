import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================================
//  GET /api/recommendations?userId=...&productId=...&limit=...
//  Returns "You may also like" recommendations based on:
//  1. If productId given: same category, different product (cross-sell)
//  2. If userId given: based on purchase history + wishlist categories
//  3. Fallback: most popular (highest rated / most reviewed)
// ============================================================================
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const productId = searchParams.get("productId");
  const limit = Math.min(Number(searchParams.get("limit") || 4), 12);

  let products: any[] = [];

  if (productId) {
    // Cross-sell: same category, different product
    const source = await db.product.findUnique({ where: { id: productId }, select: { categoryId: true } });
    if (source) {
      products = await db.product.findMany({
        where: { isActive: true, id: { not: productId }, categoryId: source.categoryId },
        include: { images: { where: { angle: "FRONT" }, take: 1 }, variants: { where: { isActive: true } } },
        take: limit,
      });
    }
  }

  if (products.length < limit && userId) {
    // Based on purchase history
    const userOrders = await db.order.findMany({
      where: { userId, status: { in: ["PAID", "DELIVERED", "FULFILLED"] } },
      include: { items: { select: { productId: true } } },
    });
    const purchasedIds = new Set(userOrders.flatMap(o => o.items.map(i => i.productId)));

    // Get categories the user has bought from
    const purchasedProducts = await db.product.findMany({
      where: { id: { in: Array.from(purchasedIds) } },
      select: { categoryId: true },
    });
    const preferredCategories = [...new Set(purchasedProducts.map(p => p.categoryId))];

    if (preferredCategories.length > 0) {
      const recs = await db.product.findMany({
        where: {
          isActive: true,
          id: { notIn: Array.from(purchasedIds).concat(productId ? [productId] : []) },
          categoryId: { in: preferredCategories },
        },
        include: { images: { where: { angle: "FRONT" }, take: 1 }, variants: { where: { isActive: true } } },
        take: limit - products.length,
      });
      products = [...products, ...recs];
    }
  }

  // Fallback: most reviewed products (popular)
  if (products.length < limit) {
    const popular = await db.product.findMany({
      where: { isActive: true, id: { notIn: products.map(p => p.id) } },
      include: { images: { where: { angle: "FRONT" }, take: 1 }, variants: { where: { isActive: true } }, reviews: { where: { isHidden: false } } },
      take: limit - products.length,
    });
    // Sort by review count
    popular.sort((a, b) => (b.reviews?.length || 0) - (a.reviews?.length || 0));
    products = [...products, ...popular];
  }

  return NextResponse.json({
    ok: true,
    data: products.slice(0, limit).map(p => ({
      id: p.id, slug: p.slug, title: p.title,
      basePriceCents: p.basePriceCents, currency: p.currency, fit: p.fit,
      image: p.images[0]?.url || null,
      category: p.categoryId,
    })),
  });
}
