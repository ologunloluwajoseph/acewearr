import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================================
//  GET /api/products
//  - Public listing with pagination, category filter, attribute filters
// ============================================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const fit = searchParams.get("fit") || undefined;
    const material = searchParams.get("material") || undefined;
    const minPrice = Number(searchParams.get("minPrice") || 0);
    const maxPrice = Number(searchParams.get("maxPrice") || 100000);
    const q = searchParams.get("q") || undefined;
    const limit = Math.min(Number(searchParams.get("limit") || 20), 60);
    const page = Math.max(Number(searchParams.get("page") || 1), 1);

    const [total, products] = await Promise.all([
      db.product.count({
        where: {
          isActive: true,
          ...(category ? { category: { slug: category } } : {}),
          ...(fit ? { fit: fit as any } : {}),
          ...(material ? { material: { contains: material } } : {}),
          ...(q ? { OR: [
            { title: { contains: q } },
            { tags: { contains: q } },
          ] } : {}),
          basePriceCents: { gte: minPrice, lte: maxPrice },
        },
      }),
      db.product.findMany({
        where: {
          isActive: true,
          ...(category ? { category: { slug: category } } : {}),
          ...(fit ? { fit: fit as any } : {}),
          ...(material ? { material: { contains: material } } : {}),
          ...(q ? { OR: [
            { title: { contains: q } },
            { tags: { contains: q } },
          ] } : {}),
          basePriceCents: { gte: minPrice, lte: maxPrice },
        },
        include: {
          images: { orderBy: { orderIdx: "asc" }, take: 1 },
          variants: { where: { isActive: true } },
          promoTags: { where: { isActive: true } },
          category: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      ok: true,
      data: products,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    console.error("[products.list]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to list products", detail: String(err.message) },
      { status: 500 }
    );
  }
}

// ============================================================================
//  POST /api/products
//  - ADMIN-ONLY: Creates a product with images (3-angle slots) + variants + size chart
// ============================================================================
export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get("x-acewears-role") || "CUSTOMER";
    if (role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "Forbidden — admin role required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title, slug, description, basePriceCents,
      currency = "USD", material, fit, care, tags = "",
      categoryId, images = [], variants = [], sizeChart = [],
    } = body;

    if (!title || !slug || !description || !basePriceCents || !categoryId) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: title, slug, description, basePriceCents, categoryId" },
        { status: 400 }
      );
    }
    if (basePriceCents < 0) {
      return NextResponse.json({ ok: false, error: "basePriceCents must be >= 0" }, { status: 400 });
    }
    const validAngles = new Set(["FRONT", "BACK", "SIDE_DETAIL"]);
    for (const img of images) {
      if (!validAngles.has(img.angle)) {
        return NextResponse.json(
          { ok: false, error: `Invalid image angle "${img.angle}" (must be FRONT|BACK|SIDE_DETAIL)` },
          { status: 400 }
        );
      }
    }

    const created = await db.product.create({
      data: {
        title,
        slug,
        description,
        basePriceCents: Number(basePriceCents),
        currency,
        material: material || null,
        fit: fit || null,
        care: care || null,
        tags,
        categoryId,
        images: { create: images.map((i: any, idx: number) => ({
          angle: i.angle, url: i.url, altText: i.altText || null, orderIdx: idx,
        })) },
        variants: { create: variants.map((v: any) => ({
          sku: v.sku, size: v.size, color: v.color || null,
          stockCount: Number(v.stockCount) || 0,
          priceOverrideCents: v.priceOverrideCents ? Number(v.priceOverrideCents) : null,
        })) },
        sizeChart: { create: sizeChart.map((s: any) => ({
          size: s.size, chestCm: Number(s.chestCm), waistCm: Number(s.waistCm),
          hipCm: s.hipCm ? Number(s.hipCm) : null,
          lengthCm: s.lengthCm ? Number(s.lengthCm) : null,
        })) },
      },
      include: { images: true, variants: true, sizeChart: true },
    });

    return NextResponse.json({ ok: true, data: created }, { status: 201 });
  } catch (err: any) {
    console.error("[products.create]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to create product", detail: String(err.message) },
      { status: 500 }
    );
  }
}
