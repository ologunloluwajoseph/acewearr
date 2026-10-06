import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/seller/dashboard?userId=...
// Returns the seller's dashboard stats: revenue, commission, orders, products
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ ok: false, error: "userId is required" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user?.isSeller) {
    return NextResponse.json({ ok: false, error: "Not a seller" }, { status: 403 });
  }

  // Get seller's products
  const products = await db.product.findMany({
    where: { sellerId: userId },
    select: { id: true, title: true, basePriceCents: true, isActive: true },
  });
  const productIds = products.map(p => p.id);

  // Get orders containing seller's products
  const orders = await db.order.findMany({
    where: {
      status: { in: ["PAID", "PAID_ON_CREDIT", "FULFILLED", "DELIVERED"] },
      items: { some: { productId: { in: productIds } } },
    },
    include: { items: { where: { productId: { in: productIds } } } },
  });

  const totalSalesCents = orders.reduce((sum, o) =>
    sum + o.items.reduce((s, i) => s + i.priceCents * i.quantity, 0), 0);

  const commissionCents = Math.round(totalSalesCents * (user.commissionRate || 10) / 100);
  const netEarningsCents = totalSalesCents - commissionCents;

  return NextResponse.json({
    ok: true,
    data: {
      storeName: user.storeName,
      storeSlug: user.storeSlug,
      commissionRate: user.commissionRate,
      sellerBalanceCents: user.sellerBalanceCents,
      stats: {
        totalProducts: products.length,
        activeProducts: products.filter(p => p.isActive).length,
        totalOrders: orders.length,
        totalSalesCents,
        commissionCents,
        netEarningsCents,
      },
      products: products,
    },
  });
}
