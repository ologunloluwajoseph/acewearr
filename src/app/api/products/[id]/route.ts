import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================================
//  GET /api/products/[id]
//  - Fetch a single product with full relations (images, variants, sizeChart,
//    promoTags, reviews incl. photos + author).
// ============================================================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // allow lookup by slug OR id
    const product = await db.product.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        images: { orderBy: { orderIdx: "asc" } },
        variants: { where: { isActive: true }, orderBy: { size: "asc" } },
        sizeChart: { orderBy: { size: "asc" } },
        promoTags: { where: { isActive: true } },
        category: true,
        reviews: {
          where: { isHidden: false },
          orderBy: { createdAt: "desc" },
          include: { photos: true, user: { select: { name: true } } },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { ok: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Compute aggregate rating breakdown
    const ratingBuckets: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let ratingSum = 0;
    for (const r of product.reviews) {
      ratingBuckets[r.rating] = (ratingBuckets[r.rating] || 0) + 1;
      ratingSum += r.rating;
    }
    const reviewCount = product.reviews.length;
    const avgRating = reviewCount > 0 ? ratingSum / reviewCount : 0;

    return NextResponse.json({
      ok: true,
      data: {
        ...product,
        ratingSummary: {
          avg: Math.round(avgRating * 10) / 10,
          count: reviewCount,
          buckets: ratingBuckets,
        },
      },
    });
  } catch (err: any) {
    console.error("[products.get]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch product", detail: String(err.message) },
      { status: 500 }
    );
  }
}

// ============================================================================
//  PUT /api/products/[id]
//  - ADMIN-ONLY: Updates an existing product (incl. price overrides & promo tags)
// ============================================================================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = req.headers.get("x-acewears-role") || "CUSTOMER";
    if (role !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      title, description, basePriceCents, material, fit, care, tags,
      isActive, categoryId,
      // Optional inline updates for stock overrides
      variantStockOverrides = [],
      promoTags = [],
    } = body;

    const updated = await db.product.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(basePriceCents !== undefined ? { basePriceCents: Number(basePriceCents) } : {}),
        ...(material !== undefined ? { material } : {}),
        ...(fit !== undefined ? { fit } : {}),
        ...(care !== undefined ? { care } : {}),
        ...(tags !== undefined ? { tags } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(categoryId !== undefined ? { categoryId } : {}),
      },
    });

    // Apply per-variant stock overrides (price overrides + count)
    for (const v of variantStockOverrides) {
      if (v.id) {
        await db.productVariant.update({
          where: { id: v.id },
          data: {
            ...(v.stockCount !== undefined ? { stockCount: Number(v.stockCount) } : {}),
            ...(v.priceOverrideCents !== undefined ? { priceOverrideCents: v.priceOverrideCents === null ? null : Number(v.priceOverrideCents) } : {}),
            ...(v.isActive !== undefined ? { isActive: Boolean(v.isActive) } : {}),
          },
        });
      }
    }

    // Replace promo tags (delete + recreate)
    if (Array.isArray(promoTags)) {
      await db.promoTag.deleteMany({ where: { productId: id } });
      if (promoTags.length > 0) {
        await db.promoTag.createMany({
          data: promoTags.map((p: any) => ({
            productId: id,
            label: p.label,
            kind: p.kind,
            isActive: p.isActive ?? true,
            payload: JSON.stringify(p.payload || {}),
            endsAt: p.endsAt ? new Date(p.endsAt) : null,
          })),
        });
      }
    }

    return NextResponse.json({ ok: true, data: updated });
  } catch (err: any) {
    console.error("[products.update]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to update product", detail: String(err.message) },
      { status: 500 }
    );
  }
}

// ============================================================================
//  DELETE /api/products/[id]
//  - ADMIN-ONLY: Soft-deletes a product (sets isActive = false)
// ============================================================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = req.headers.get("x-acewears-role") || "CUSTOMER";
    if (role !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await db.product.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true, deleted: id });
  } catch (err: any) {
    console.error("[products.delete]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to delete product", detail: String(err.message) },
      { status: 500 }
    );
  }
}
