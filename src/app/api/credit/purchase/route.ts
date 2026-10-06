import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================================
//  POST /api/credit/purchase
//  Body: { userId, productId, variantId? }
//
//  Buys a product ON CREDIT using the user's accumulated credit balance.
//  - Checks the user has enough credit balance (creditBalanceCents >= product base price)
//  - Deducts from creditBalanceCents, adds to creditUsedCents
//  - Creates a CreditTransaction of type "USED"
//  - Creates an Order with status "PAID_ON_CREDIT" (so it's fulfilled but owed)
//  - Does NOT earn new surcharge credit (surcharge only earns credit on full-price payment)
// ============================================================================
export async function POST(req: NextRequest) {
  try {
    const { userId, productId, variantId } = await req.json();
    if (!userId || !productId) {
      return NextResponse.json(
        { ok: false, error: "userId and productId are required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        images: { where: { angle: "FRONT" }, take: 1 },
        variants: { where: { isActive: true } },
      },
    });
    if (!product) {
      return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    }

    const variant = variantId
      ? product.variants.find((v) => v.id === variantId)
      : product.variants.find((v) => v.stockCount > 0);
    if (!variant) {
      return NextResponse.json({ ok: false, error: "No available variant" }, { status: 422 });
    }

    // Check credit balance
    const priceCents = product.basePriceCents;
    if (user.creditBalanceCents < priceCents) {
      return NextResponse.json(
        {
          ok: false,
          error: `Insufficient credit. You need ₦${priceCents} but have ₦${user.creditBalanceCents}.`,
        },
        { status: 402 }
      );
    }

    // Deduct credit, increase used
    const newBalance = user.creditBalanceCents - priceCents;
    const newUsed = user.creditUsedCents + priceCents;

    const [updatedUser, order, transaction] = await db.$transaction([
      db.user.update({
        where: { id: userId },
        data: {
          creditBalanceCents: newBalance,
          creditUsedCents: newUsed,
        },
      }),
      db.order.create({
        data: {
          userId,
          status: "PAID_ON_CREDIT",
          subtotalCents: priceCents,
          shippingCents: 0,
          discountCents: 0,
          totalCents: priceCents,
          currency: product.currency,
          placedAt: new Date(),
          items: {
            create: [{
              productId: product.id,
              variantId: variant.id,
              titleSnapshot: product.title,
              priceCents: priceCents,
              quantity: 1,
              sizeSnapshot: variant.size,
              reviewEligible: false, // credit purchases don't earn review eligibility until repaid
            }],
          },
        },
      }),
      db.creditTransaction.create({
        data: {
          userId,
          productId: product.id,
          type: "USED",
          amountCents: -priceCents,
          balanceAfterCents: newBalance,
          description: `Credit purchase of ${product.title}`,
          orderId: "", // will be linked below
        },
      }),
    ]);

    // Link the transaction to the order
    await db.creditTransaction.update({
      where: { id: transaction.id },
      data: { orderId: order.id },
    });

    // Decrement stock
    await db.productVariant.update({
      where: { id: variant.id },
      data: { stockCount: { decrement: 1 } },
    });

    return NextResponse.json({
      ok: true,
      data: {
        orderId: order.id,
        newBalance,
        newUsed,
        transactionId: transaction.id,
      },
    });
  } catch (err: any) {
    console.error("[credit.purchase]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to process credit purchase", detail: String(err.message) },
      { status: 500 }
    );
  }
}
