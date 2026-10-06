import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================================
//  GET /api/orders/track?reference=AW-xxx&userId=...
//  Returns the order tracking timeline (PENDING → PAID → FULFILLED → DELIVERED)
// ============================================================================
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");
  const userId = searchParams.get("userId");

  if (!reference) {
    return NextResponse.json({ ok: false, error: "Order reference is required" }, { status: 400 });
  }

  const where: any = { trackingNumber: reference };
  if (userId) where.userId = userId;

  const order = await db.order.findFirst({
    where,
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

  if (!order) {
    return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  }

  // Build the tracking timeline
  const steps = [
    { key: "PENDING", label: "Order Placed", completed: false, date: null as string | null },
    { key: "PAID", label: "Payment Confirmed", completed: false, date: null as string | null },
    { key: "FULFILLED", label: "Order Shipped", completed: false, date: null as string | null },
    { key: "DELIVERED", label: "Delivered", completed: false, date: null as string | null },
  ];

  const statusOrder = ["PENDING", "PAID", "PAID_ON_CREDIT", "FULFILLED", "DELIVERED"];
  const currentIdx = statusOrder.indexOf(order.status);
  
  steps.forEach((step, i) => {
    const stepIdx = statusOrder.indexOf(step.key);
    step.completed = stepIdx <= currentIdx;
  });

  if (order.placedAt) steps[0].date = order.placedAt.toISOString();
  if (order.status === "PAID" || order.status === "PAID_ON_CREDIT" || currentIdx >= 1) {
    steps[1].date = order.placedAt.toISOString();
  }
  if (order.status === "FULFILLED" || order.status === "DELIVERED") {
    steps[2].date = order.placedAt.toISOString();
  }
  if (order.deliveredAt) {
    steps[3].date = order.deliveredAt.toISOString();
  }

  return NextResponse.json({
    ok: true,
    data: {
      orderId: order.id,
      reference: order.trackingNumber,
      status: order.status,
      totalCents: order.totalCents,
      currency: order.currency,
      placedAt: order.placedAt.toISOString(),
      deliveredAt: order.deliveredAt?.toISOString() || null,
      trackingNumber: order.trackingNumber,
      items: order.items.map((item) => ({
        id: item.id,
        title: item.product.title,
        slug: item.product.slug,
        image: item.product.images[0]?.url || null,
        size: item.sizeSnapshot,
        quantity: item.quantity,
        priceCents: item.priceCents,
      })),
      timeline: steps,
    },
  });
}
