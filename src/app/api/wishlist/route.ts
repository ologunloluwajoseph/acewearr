import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================================
//  GET /api/wishlist?userId=...
//  Returns the user's wishlist items (with product details).
// ============================================================================
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ ok: false, error: "userId is required" }, { status: 400 });
  }
  const items = await db.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true, slug: true, title: true, basePriceCents: true, currency: true,
          fit: true, material: true, tags: true,
          images: { where: { angle: "FRONT" }, take: 1 },
          category: { select: { slug: true, name: true } },
          variants: { where: { isActive: true } },
        },
      },
    },
  });
  return NextResponse.json({ ok: true, data: items });
}

// ============================================================================
//  POST /api/wishlist
//  Body: { userId, productId, note? }
//  Adds an item to the user's wishlist. Idempotent on (userId, productId).
// ============================================================================
export async function POST(req: NextRequest) {
  try {
    const { userId, productId, note } = await req.json();
    if (!userId || !productId) {
      return NextResponse.json(
        { ok: false, error: "userId and productId are required" },
        { status: 400 }
      );
    }
    const item = await db.wishlistItem.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId, note: note || null },
      update: { note: note || undefined },
      include: {
        product: {
          select: {
            id: true, slug: true, title: true, basePriceCents: true, currency: true,
            fit: true, material: true, tags: true,
            images: { where: { angle: "FRONT" }, take: 1 },
            category: { select: { slug: true, name: true } },
            variants: { where: { isActive: true } },
          },
        },
      },
    });
    return NextResponse.json({ ok: true, data: item }, { status: 201 });
  } catch (err: any) {
    console.error("[wishlist.add]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to add to wishlist", detail: String(err.message) },
      { status: 500 }
    );
  }
}

// ============================================================================
//  DELETE /api/wishlist?userId=...&productId=...
// ============================================================================
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const productId = searchParams.get("productId");
  if (!userId || !productId) {
    return NextResponse.json(
      { ok: false, error: "userId and productId are required" },
      { status: 400 }
    );
  }
  await db.wishlistItem.deleteMany({ where: { userId, productId } });
  return NextResponse.json({ ok: true });
}

// ============================================================================
//  PATCH /api/wishlist
//  Body: { userId, productId, note }
//  Updates the user's "words of suggestion" note on a wishlist item.
// ============================================================================
export async function PATCH(req: NextRequest) {
  try {
    const { userId, productId, note } = await req.json();
    if (!userId || !productId) {
      return NextResponse.json(
        { ok: false, error: "userId and productId are required" },
        { status: 400 }
      );
    }
    const updated = await db.wishlistItem.update({
      where: { userId_productId: { userId, productId } },
      data: { note },
    });
    return NextResponse.json({ ok: true, data: updated });
  } catch (err: any) {
    console.error("[wishlist.update]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to update wishlist item", detail: String(err.message) },
      { status: 500 }
    );
  }
}
