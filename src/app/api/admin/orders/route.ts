import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail, shippingUpdateEmail } from "@/lib/email";

// ============================================================================
//  GET /api/admin/orders?status=...&limit=...
//  Returns all orders for admin management.
//
//  PUT /api/admin/orders
//  Body: { orderId, status, trackingNumber? }
//  Updates order status + sends shipping notification email.
// ============================================================================

export async function GET(req: NextRequest) {
  const role = req.headers.get("x-acewears-role") || "CUSTOMER";
  if (role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const limit = Math.min(Number(searchParams.get("limit") || 50), 100);

  const orders = await db.order.findMany({
    where: status ? { status: status as any } : {},
    orderBy: { placedAt: "desc" },
    take: limit,
    include: {
      items: {
        include: {
          product: { select: { id: true, title: true, slug: true } },
        },
      },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    data: orders.map((o) => ({
      id: o.id,
      reference: o.trackingNumber,
      status: o.status,
      totalCents: o.totalCents,
      currency: o.currency,
      placedAt: o.placedAt.toISOString(),
      deliveredAt: o.deliveredAt?.toISOString() || null,
      customer: o.user,
      itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
      items: o.items.map((i) => ({
        title: i.product.title,
        size: i.sizeSnapshot,
        qty: i.quantity,
        priceCents: i.priceCents,
      })),
    })),
  });
}

export async function PUT(req: NextRequest) {
  const role = req.headers.get("x-acewears-role") || "CUSTOMER";
  if (role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const { orderId, status, trackingNumber } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json({ ok: false, error: "orderId and status are required" }, { status: 400 });
    }

    const validStatuses = ["PENDING", "PAID", "PAID_ON_CREDIT", "FULFILLED", "DELIVERED", "CANCELLED", "RETURNED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ ok: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
    }

    const updateData: any = { status };
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (status === "DELIVERED") updateData.deliveredAt = new Date();

    const order = await db.order.update({
      where: { id: orderId },
      data: updateData,
      include: { user: { select: { name: true, email: true } } },
    });

    // Send shipping notification email
    if (status === "FULFILLED" || status === "DELIVERED") {
      const emailTemplate = shippingUpdateEmail({
        userName: order.user.name || order.user.email,
        orderReference: order.trackingNumber,
        status,
        trackingNumber: trackingNumber || order.trackingNumber,
        trackingUrl: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}?section=purchases`,
      });
      emailTemplate.to = order.user.email;
      await sendEmail(emailTemplate);
    }

    return NextResponse.json({ ok: true, data: { orderId: order.id, status: order.status, trackingNumber: order.trackingNumber } });
  } catch (err: any) {
    console.error("[admin.orders.update]", err);
    return NextResponse.json({ ok: false, error: "Failed to update order", detail: String(err.message) }, { status: 500 });
  }
}
