import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/seller/products?userId=...
// Returns all products belonging to a seller.
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ ok: false, error: "userId is required" }, { status: 400 });
  }

  const products = await db.product.findMany({
    where: { sellerId: userId },
    include: {
      images: { where: { angle: "FRONT" }, take: 1 },
      variants: { where: { isActive: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    ok: true,
    data: products.map(p => ({
      id: p.id, slug: p.slug, title: p.title,
      basePriceCents: p.basePriceCents, currency: p.currency,
      isActive: p.isActive, fit: p.fit,
      image: p.images[0]?.url || null,
      totalStock: p.variants.reduce((s, v) => s + v.stockCount, 0),
      variantCount: p.variants.length,
    })),
  });
}

// POST /api/seller/products
// Body: { userId, ...productData }
// Creates a product owned by a seller (with commission tracking).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, title, slug, description, basePriceCents, categoryId, images, variants } = body;

    if (!userId || !title || !basePriceCents) {
      return NextResponse.json({ ok: false, error: "userId, title, and basePriceCents are required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user?.isSeller) {
      return NextResponse.json({ ok: false, error: "Not a seller account" }, { status: 403 });
    }

    const product = await db.product.create({
      data: {
        title, slug: slug || title.toLowerCase().replace(/\s+/g, "-"),
        description: description || "", basePriceCents: Number(basePriceCents),
        sellerId: userId, categoryId,
        images: { create: (images || []).map((img: any, i: number) => ({ angle: img.angle || "FRONT", url: img.url, orderIdx: i })) },
        variants: { create: (variants || []).map((v: any) => ({ sku: v.sku, size: v.size, color: v.color || null, stockCount: Number(v.stockCount) || 0 })) },
      },
    });

    return NextResponse.json({ ok: true, data: product }, { status: 201 });
  } catch (err: any) {
    console.error("[seller.products.create]", err);
    return NextResponse.json({ ok: false, error: "Failed to create product" }, { status: 500 });
  }
}
