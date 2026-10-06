import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================================
//  GET /api/products/[id]/reviews
//  - Public: returns visible (non-hidden) verified reviews + aggregate.
// ============================================================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await db.product.findFirst({ where: { OR: [{ id }, { slug: id }] } });
    if (!product) {
      return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    }

    const reviews = await db.review.findMany({
      where: { productId: product.id, isHidden: false },
      orderBy: { createdAt: "desc" },
      include: {
        photos: { orderBy: { orderIdx: "asc" } },
        user: { select: { name: true } },
      },
    });

    // Aggregate rating breakdown
    const ratingBuckets: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let ratingSum = 0;
    for (const r of reviews) {
      ratingBuckets[r.rating] = (ratingBuckets[r.rating] || 0) + 1;
      ratingSum += r.rating;
    }
    const reviewCount = reviews.length;
    const avgRating = reviewCount > 0 ? ratingSum / reviewCount : 0;

    // Tag counts (CSV "fit_true_to_size,quality_high" -> aggregate)
    const tagCounts: Record<string, number> = {};
    for (const r of reviews) {
      for (const t of r.fitTags.split(",").map(s => s.trim()).filter(Boolean)) {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        productId: product.id,
        avg: Math.round(avgRating * 10) / 10,
        count: reviewCount,
        buckets: ratingBuckets,
        topTags: Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([tag, count]) => ({ tag, count })),
        reviews,
      },
    });
  } catch (err: any) {
    console.error("[reviews.list]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch reviews", detail: String(err.message) },
      { status: 500 }
    );
  }
}

// ============================================================================
//  POST /api/products/[id]/reviews
//  - AUTHENTICATED CUSTOMERS ONLY
//  - VERIFIED BUYER GUARD: The reviewer must own a DELIVERED order containing
//    this product. The orderItemId must be unique per review (1 review per line).
//
//  Body:
//    {
//      userId: string,
//      orderItemId: string,
//      rating: 1..5,
//      title?: string,
//      body: string,
//      fitTags?: string,        // CSV
//      photoUrls?: string[],
//    }
// ============================================================================
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const userId = body.userId || req.headers.get("x-acewears-user-id");
    const role = req.headers.get("x-acewears-role") || "CUSTOMER";
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized — must be signed in" },
        { status: 401 }
      );
    }
    if (role !== "CUSTOMER" && role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "Forbidden — invalid role for review submission" },
        { status: 403 }
      );
    }

    const { orderItemId, rating, title, body: reviewBody, fitTags = "", photoUrls = [] } = body;

    // ---- VALIDATION ----
    if (!orderItemId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { ok: false, error: "Invalid payload — orderItemId and rating (1-5) are required" },
        { status: 400 }
      );
    }
    if (!reviewBody || reviewBody.trim().length < 5) {
      return NextResponse.json(
        { ok: false, error: "Review body must be at least 5 characters" },
        { status: 400 }
      );
    }
    if (!Array.isArray(photoUrls) || photoUrls.length > 5) {
      return NextResponse.json(
        { ok: false, error: "Max 5 photo attachments per review" },
        { status: 400 }
      );
    }

    const product = await db.product.findFirst({ where: { OR: [{ id }, { slug: id }] } });
    if (!product) {
      return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    }

    // ================================================================
    //  VERIFIED BUYER AUTHORIZATION GUARD
    //  - Loads the OrderItem
    //  - Confirms it belongs to THIS user
    //  - Confirms it belongs to THIS product (or its variant)
    //  - Confirms the parent Order.status === "DELIVERED"
    //  - Confirms no existing review for this order item
    // ================================================================
    const orderItem = await db.orderItem.findUnique({
      where: { id: orderItemId },
      include: { order: true, review: true },
    });

    if (!orderItem) {
      return NextResponse.json(
        { ok: false, error: "Order item not found" },
        { status: 404 }
      );
    }
    if (orderItem.order.userId !== userId) {
      return NextResponse.json(
        { ok: false, error: "Forbidden — you can only review items you purchased" },
        { status: 403 }
      );
    }
    if (orderItem.productId !== product.id) {
      return NextResponse.json(
        { ok: false, error: "Mismatch — order item does not belong to this product" },
        { status: 400 }
      );
    }
    if (orderItem.order.status !== "DELIVERED") {
      return NextResponse.json(
        {
          ok: false,
          error: `Review blocked — order must be DELIVERED (current: ${orderItem.order.status})`,
        },
        { status: 403 }
      );
    }
    if (orderItem.review) {
      return NextResponse.json(
        { ok: false, error: "You have already reviewed this item" },
        { status: 409 }
      );
    }
    if (!orderItem.reviewEligible) {
      return NextResponse.json(
        { ok: false, error: "This order item is not review-eligible" },
        { status: 403 }
      );
    }

    // ---- CREATE REVIEW ----
    const review = await db.review.create({
      data: {
        userId,
        productId: product.id,
        orderItemId: orderItem.id,
        rating,
        title: title || null,
        body: reviewBody,
        fitTags,
        isVerified: true,
        isHidden: false,
        photos: {
          create: photoUrls.map((url: string, idx: number) => ({ url, orderIdx: idx })),
        },
      },
      include: { photos: true, user: { select: { name: true } } },
    });

    return NextResponse.json({ ok: true, data: review }, { status: 201 });
  } catch (err: any) {
    console.error("[reviews.create]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to create review", detail: String(err.message) },
      { status: 500 }
    );
  }
}
