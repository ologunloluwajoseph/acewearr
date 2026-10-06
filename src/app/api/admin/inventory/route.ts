import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================================
//  GET /api/admin/inventory
//  Returns all product variants with stock levels for inventory management.
//  Shows low-stock and out-of-stock items.
// ============================================================================
export async function GET(req: NextRequest) {
  const role = req.headers.get("x-acewears-role") || "CUSTOMER";
  if (role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const products = await db.product.findMany({
    where: { isActive: true },
    include: {
      variants: { orderBy: { size: "asc" } },
      images: { where: { angle: "FRONT" }, take: 1 },
    },
    orderBy: { title: "asc" },
  });

  const inventory = products.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    image: p.images[0]?.url || null,
    basePriceCents: p.basePriceCents,
    variants: p.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      color: v.color,
      stockCount: v.stockCount,
      status: v.stockCount === 0 ? "OUT_OF_STOCK" : v.stockCount <= 3 ? "LOW_STOCK" : "IN_STOCK",
    })),
    totalStock: p.variants.reduce((s, v) => s + v.stockCount, 0),
  }));

  const stats = {
    totalProducts: inventory.length,
    totalVariants: inventory.reduce((s, p) => s + p.variants.length, 0),
    lowStock: inventory.filter(p => p.variants.some(v => v.status === "LOW_STOCK")).length,
    outOfStock: inventory.filter(p => p.variants.every(v => v.status === "OUT_OF_STOCK")).length,
  };

  return NextResponse.json({ ok: true, data: { inventory, stats } });
}

// ============================================================================
//  PUT /api/admin/inventory
//  Body: { variantId, stockCount }
//  Restocks a specific variant.
// ============================================================================
export async function PUT(req: NextRequest) {
  const role = req.headers.get("x-acewears-role") || "CUSTOMER";
  if (role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const { variantId, stockCount } = await req.json();
    if (!variantId || stockCount === undefined) {
      return NextResponse.json({ ok: false, error: "variantId and stockCount are required" }, { status: 400 });
    }

    const variant = await db.productVariant.update({
      where: { id: variantId },
      data: { stockCount: Math.max(0, Number(stockCount)) },
    });

    return NextResponse.json({ ok: true, data: variant });
  } catch (err: any) {
    console.error("[admin.inventory.update]", err);
    return NextResponse.json({ ok: false, error: "Failed to update inventory" }, { status: 500 });
  }
}
