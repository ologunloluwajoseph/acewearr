import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================================
//  GET /api/orders/purchase-history?userId=...
//  Returns the user's complete purchase history:
//    - Total items bought (lifetime)
//    - Total spent (lifetime)
//    - Order list with items, dates, statuses
//    - Credit earned from purchases
// ============================================================================
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ ok: false, error: "userId is required" }, { status: 400 });
  }

  const orders = await db.order.findMany({
    where: {
      userId,
      status: { in: ["PAID", "PAID_ON_CREDIT", "FULFILLED", "DELIVERED"] },
    },
    orderBy: { placedAt: "desc" },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true, title: true, slug: true,
              images: { where: { angle: "FRONT" }, take: 1 },
            },
          },
        },
      },
    },
  });

  // Compute aggregate stats
  let totalItemsBought = 0;
  let totalSpentCents = 0;
  let totalCreditEarnedCents = 0;

  for (const order of orders) {
    totalSpentCents += order.totalCents;
    for (const item of order.items) {
      totalItemsBought += item.quantity;
    }
  }

  // Get credit earned from transactions
  const creditTransactions = await db.creditTransaction.findMany({
    where: { userId, type: "EARNED" },
    select: { amountCents: true },
  });
  totalCreditEarnedCents = creditTransactions.reduce((sum, t) => sum + t.amountCents, 0);

  // Format orders for the frontend
  const formattedOrders = orders.map((order) => ({
    id: order.id,
    reference: order.trackingNumber,
    status: order.status,
    totalCents: order.totalCents,
    currency: order.currency,
    placedAt: order.placedAt.toISOString(),
    deliveredAt: order.deliveredAt?.toISOString() || null,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.product.id,
      title: item.product.title,
      slug: item.product.slug,
      image: item.product.images[0]?.url || null,
      size: item.sizeSnapshot,
      quantity: item.quantity,
      priceCents: item.priceCents,
    })),
  }));

  return NextResponse.json({
    ok: true,
    data: {
      stats: {
        totalOrders: orders.length,
        totalItemsBought,
        totalSpentCents,
        totalCreditEarnedCents,
        currency: "USD",
      },
      orders: formattedOrders,
    },
  });
}
