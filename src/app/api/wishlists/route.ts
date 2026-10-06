import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================================
//  GET /api/wishlists
//  Public endpoint — returns a list of all users who have at least one
//  wishlist item, with their profile info + item count + a few preview items.
//
//  Every AceWears user's wishlist is publicly viewable.
// ============================================================================
export async function GET(req: NextRequest) {
  const limit = Math.min(Number(new URL(req.url).searchParams.get("limit") || 20), 50);

  // Find all users who have at least one wishlist item
  const users = await db.user.findMany({
    where: { wishlistItems: { some: {} } },
    select: {
      id: true,
      name: true,
      // We use the body profile's face image as the "user photo" if available
      bodyProfile: { select: { faceImageUrl: true } },
      _count: { select: { wishlistItems: true } },
    },
    take: limit,
  });

  // For each user, fetch their top 4 most recent wishlist items (with product info)
  const enriched = await Promise.all(
    users.map(async (u) => {
      const items = await db.wishlistItem.findMany({
        where: { userId: u.id },
        orderBy: { createdAt: "desc" },
        take: 4,
        include: {
          product: {
            select: {
              id: true, slug: true, title: true,
              basePriceCents: true, currency: true,
              images: { where: { angle: "FRONT" }, take: 1 },
              category: { select: { slug: true, name: true } },
            },
          },
        },
      });
      return {
        userId: u.id,
        userName: u.name,
        userPhoto: u.bodyProfile?.faceImageUrl || null,
        itemCount: u._count.wishlistItems,
        previewItems: items.map((i) => ({
          productId: i.product.id,
          title: i.product.title,
          slug: i.product.slug,
          image: i.product.images[0]?.url || null,
          priceCents: i.product.basePriceCents,
          currency: i.product.currency,
          category: i.product.category?.slug || null,
          note: i.note,
        })),
      };
    })
  );

  return NextResponse.json({ ok: true, data: enriched });
}
