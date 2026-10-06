import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyTransaction } from "@/lib/paystack";

// ============================================================================
//  GET /api/checkout/verify?reference=...&userId=...
//
//  Paystack callback handler — called when user returns from Paystack payment.
//  1. Verifies the transaction with Paystack's API
//  2. If success: marks the PENDING order as PAID, credits surcharge
//  3. If failure: cancels the order
// ============================================================================
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");
  const status = searchParams.get("status"); // Paystack sends ?status=success or ?status=cancelled

  if (!reference) {
    return NextResponse.json({ ok: false, error: "reference is required" }, { status: 400 });
  }

  // Find the pending order
  const order = await db.order.findFirst({
    where: { trackingNumber: reference },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  }

  // Already verified?
  if (order.status === "PAID" || order.status === "DELIVERED") {
    return NextResponse.json({
      ok: true,
      data: { orderId: order.id, reference, status: order.status, alreadyVerified: true },
    });
  }

  // If Paystack cancelled
  if (status === "cancelled") {
    await db.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    // Restore stock
    for (const item of order.items) {
      if (item.variantId) {
        await db.productVariant.update({
          where: { id: item.variantId },
          data: { stockCount: { increment: item.quantity } },
        });
      }
    }
    return NextResponse.json({ ok: false, error: "Payment was cancelled" }, { status: 402 });
  }

  // ---- Check if we have real Paystack keys ----
  const hasRealKeys = process.env.PAYSTACK_SECRET_KEY && process.env.PAYSTACK_SECRET_KEY.startsWith("sk_");

  if (hasRealKeys) {
    // === REAL VERIFICATION ===
    const verification = await verifyTransaction(reference);
    
    if (!verification.verified) {
      await db.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
      return NextResponse.json({ ok: false, error: verification.error || "Payment verification failed" }, { status: 402 });
    }

    // Mark as paid
    await db.order.update({ where: { id: order.id }, data: { status: "PAID" } });
  } else {
    // === DEMO MODE: assume success ===
    await db.order.update({ where: { id: order.id }, data: { status: "PAID" } });
  }

  // Credit surcharge to user
  const user = await db.user.findUnique({ where: { id: order.userId } });
  if (user) {
    let totalSurcharge = 0;
    for (const item of order.items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        select: { title: true, creditSurchargePercent: true },
      });
      if (product) {
        const percent = (product as any).creditSurchargePercent ?? 3.0;
        totalSurcharge += Math.round(item.priceCents * percent / 100) * item.quantity;
      }
    }

    if (totalSurcharge > 0) {
      const newBalance = user.creditBalanceCents + totalSurcharge;
      const newLimit = user.creditLimitCents + totalSurcharge;
      await db.user.update({
        where: { id: user.id },
        data: { creditBalanceCents: newBalance, creditLimitCents: newLimit },
      });
      await db.creditTransaction.create({
        data: {
          userId: user.id, type: "EARNED",
          amountCents: totalSurcharge, balanceAfterCents: newBalance,
          description: `Credit earned from order ${reference}`, orderId: order.id,
        },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    data: { orderId: order.id, reference, status: "PAID", verified: true },
  });
}
