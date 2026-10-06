import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================================
//  GET /api/wishlists/[userId]
//  Public endpoint — returns the full wishlist for a specific user.
// ============================================================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true,
      bodyProfile: { select: { faceImageUrl: true, skinTone: true, hairStyle: true } },
      _count: { select: { wishlistItems: true } },
    },
  });
  if (!user) {
    return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
  }

  const items = await db.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true, slug: true, title: true,
          basePriceCents: true, currency: true, fit: true,
          material: true, tags: true,
          images: { where: { angle: "FRONT" }, take: 1 },
          category: { select: { slug: true, name: true } },
          variants: { where: { isActive: true } },
        },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        photo: user.bodyProfile?.faceImageUrl || null,
        skinTone: user.bodyProfile?.skinTone || null,
        hairStyle: user.bodyProfile?.hairStyle || null,
        itemCount: user._count.wishlistItems,
      },
      items: items.map((i) => ({
        id: i.id,
        productId: i.product.id,
        slug: i.product.slug,
        title: i.product.title,
        priceCents: i.product.basePriceCents,
        currency: i.product.currency,
        fit: i.product.fit,
        material: i.product.material,
        tags: i.product.tags,
        image: i.product.images[0]?.url || null,
        category: i.product.category?.slug || null,
        categoryName: i.product.category?.name || null,
        note: i.note,
        addedAt: i.createdAt,
      })),
    },
  });
}
