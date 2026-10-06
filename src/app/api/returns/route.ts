import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================================
//  POST /api/returns
//  Body: { userId, orderId, itemId, reason, type: "RETURN" | "EXCHANGE", exchangeSize? }
//  Creates a return/exchange request.
// ============================================================================
export async function POST(req: NextRequest) {
  try {
    const { userId, orderId, itemId, reason, type, exchangeSize } = await req.json();

    if (!userId || !orderId || !reason || !type) {
      return NextResponse.json({ ok: false, error: "userId, orderId, reason, and type are required" }, { status: 400 });
    }

    // Verify the order belongs to the user and is delivered
    const order = await db.order.findFirst({
      where: { id: orderId, userId, status: "DELIVERED" },
    });
    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found or not delivered yet" }, { status: 404 });
    }

    // Check 30-day return window
    if (order.deliveredAt) {
      const daysSinceDelivery = (Date.now() - order.deliveredAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDelivery > 30) {
        return NextResponse.json({ ok: false, error: "Return window has expired (30 days)" }, { status: 400 });
      }
    }

    // In production, you'd have a ReturnRequest model. For now, we'll use a notification.
    await db.notification.create({
      data: {
        userId,
        type: "ORDER_SHIPPED", // repurposing
        title: `Return/Exchange Request — ${type}`,
        body: `Order ${order.trackingNumber}: ${reason}${exchangeSize ? ` (Exchange to size ${exchangeSize})` : ""}`,
        data: JSON.stringify({ orderId, itemId, reason, type, exchangeSize, status: "SUBMITTED" }),
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        status: "SUBMITTED",
        message: "Your return/exchange request has been submitted. We'll review it within 24 hours.",
      },
    }, { status: 201 });
  } catch (err: any) {
    console.error("[returns.create]", err);
    return NextResponse.json({ ok: false, error: "Failed to submit return request" }, { status: 500 });
  }
}
