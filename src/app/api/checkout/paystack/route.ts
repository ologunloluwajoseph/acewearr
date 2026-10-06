import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { initializeTransaction, generateReference, toPaystackAmount, PAYSTACK_CONFIG } from "@/lib/paystack";

// ============================================================================
//  POST /api/checkout/paystack
//  Body: { userId, items: [{ productId, variantId, quantity }] }
//
//  Initializes a real Paystack transaction:
//    1. Validates items + computes totals
//    2. Calls Paystack initialize API → returns authorization_url
//    3. Frontend redirects user to Paystack hosted page
//    4. After payment, Paystack redirects to callback_url (/api/checkout/verify)
//    5. Verify endpoint creates the order + credits surcharge
//
//  In demo mode (no real API key): skips Paystack, creates order directly.
// ============================================================================
export async function POST(req: NextRequest) {
  try {
    const { userId, items } = await req.json();

    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: false, error: "userId and items array are required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // Validate items + compute totals
    let subtotalCents = 0;
    let totalSurchargeCents = 0;
    const orderItems: any[] = [];
    const itemMetadata: any[] = [];

    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        include: { images: { where: { angle: "FRONT" }, take: 1 }, variants: { where: { isActive: true } } },
      });
      if (!product) return NextResponse.json({ ok: false, error: `Product ${item.productId} not found` }, { status: 404 });
      const variant = item.variantId ? product.variants.find((v) => v.id === item.variantId) : product.variants.find((v) => v.stockCount > 0);
      if (!variant) return NextResponse.json({ ok: false, error: `No available variant for ${product.title}` }, { status: 422 });
      if (variant.stockCount < (item.quantity || 1)) return NextResponse.json({ ok: false, error: `Insufficient stock for ${product.title} (${variant.size})` }, { status: 422 });

      const qty = item.quantity || 1;
      const priceCents = variant.priceOverrideCents ?? product.basePriceCents;
      subtotalCents += priceCents * qty;
      const surchargePercent = (product as any).creditSurchargePercent ?? 3.0;
      const itemSurcharge = Math.round((priceCents * surchargePercent / 100)) * qty;
      totalSurchargeCents += itemSurcharge;

      orderItems.push({
        productId: product.id, variantId: variant.id, titleSnapshot: product.title,
        priceCents, quantity: qty, sizeSnapshot: variant.size, reviewEligible: true,
      });
      itemMetadata.push({ productId: product.id, title: product.title, size: variant.size, qty, priceCents });

      // Decrement stock
      await db.productVariant.update({ where: { id: variant.id }, data: { stockCount: { decrement: qty } } });
    }

    const shippingCents = subtotalCents >= 7500 ? 0 : 500;
    const totalCents = subtotalCents + shippingCents;
    const reference = generateReference("AW");

    // ---- Check if we have real Paystack keys ----
    const hasRealKeys = PAYSTACK_CONFIG.secretKey !== "sk_test_demo" && PAYSTACK_CONFIG.secretKey.startsWith("sk_");

    if (hasRealKeys) {
      // === REAL PAYSTACK FLOW ===
      // Convert to NGN kobo for Paystack (Paystack accepts NGN and USD)
      const paystackAmount = toPaystackAmount(totalCents / 100, "USD");
      const currency = "USD";

      const result = await initializeTransaction({
        email: user.email,
        amount: paystackAmount,
        reference,
        currency,
        metadata: {
          userId,
          items: itemMetadata,
          subtotalCents,
          shippingCents,
          totalCents,
          totalSurchargeCents,
          custom_fields: [
            { display_name: "Order Items", variable_name: "order_items", value: `${itemMetadata.length} item(s)` },
            { display_name: "Customer", variable_name: "customer_name", value: user.name || user.email },
          ],
        },
      });

      // Store a pending order (will be confirmed by the verify webhook)
      await db.order.create({
        data: {
          userId,
          status: "PENDING",
          subtotalCents, shippingCents, discountCents: 0, totalCents,
          currency,
          trackingNumber: reference,
          placedAt: new Date(),
          items: { create: orderItems },
        },
      });

      return NextResponse.json({
        ok: true,
        data: {
          authorizationUrl: result.authorizationUrl,
          reference,
          totalCents,
          creditEarnedCents: totalSurchargeCents,
        },
      });
    } else {
      // === DEMO MODE: simulate successful payment ===
      const order = await db.order.create({
        data: {
          userId, status: "PAID", subtotalCents, shippingCents, discountCents: 0, totalCents,
          currency: "USD", trackingNumber: reference, placedAt: new Date(),
          items: { create: orderItems },
        },
        include: { items: { include: { product: { select: { title: true } } } } },
      });

      // Credit surcharge to user
      if (totalSurchargeCents > 0) {
        const newBalance = user.creditBalanceCents + totalSurchargeCents;
        const newLimit = user.creditLimitCents + totalSurchargeCents;
        await db.user.update({ where: { id: userId }, data: { creditBalanceCents: newBalance, creditLimitCents: newLimit } });
        for (const item of orderItems) {
          const p = await db.product.findUnique({ where: { id: item.productId }, select: { title: true, creditSurchargePercent: true, basePriceCents: true } });
          if (p) {
            const percent = (p as any).creditSurchargePercent ?? 3.0;
            const surcharge = Math.round(item.priceCents * percent / 100) * item.quantity;
            if (surcharge > 0) {
              await db.creditTransaction.create({
                data: {
                  userId, productId: item.productId, type: "EARNED",
                  amountCents: surcharge, balanceAfterCents: newBalance,
                  description: `Credit earned from purchase of ${p.title}`, orderId: order.id,
                },
              });
            }
          }
        }
      }

      return NextResponse.json({
        ok: true,
        data: {
          orderId: order.id, reference, status: "PAID", totalCents,
          creditEarnedCents: totalSurchargeCents,
          message: totalSurchargeCents > 0 ? `Payment successful! ₦${totalSurchargeCents} credit earned from this purchase.` : "Payment successful!",
        },
      });
    }
  } catch (err: any) {
    console.error("[checkout.paystack]", err);
    return NextResponse.json({ ok: false, error: "Checkout failed", detail: String(err.message) }, { status: 500 });
  }
}
