import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================================
//  GET /api/admin/analytics?range=7d|30d|90d|1y
//  Returns analytics data for the admin dashboard:
//  - Revenue over time (daily/weekly/monthly)
//  - Order count + conversion rate
//  - Top products by sales
//  - Top categories
//  - Customer growth
// ============================================================================
export async function GET(req: NextRequest) {
  const role = req.headers.get("x-acewears-role") || "CUSTOMER";
  if (role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const range = new URL(req.url).searchParams.get("range") || "30d";
  const daysMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
  const days = daysMap[range] || 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Get all paid orders in range
  const orders = await db.order.findMany({
    where: {
      placedAt: { gte: since },
      status: { in: ["PAID", "PAID_ON_CREDIT", "FULFILLED", "DELIVERED"] },
    },
    include: { items: { include: { product: { select: { title: true, categoryId: true, category: { select: { name: true } } } } } } },
    orderBy: { placedAt: "desc" },
  });

  // Revenue by day
  const revenueByDay: { date: string; revenue: number; orders: number }[] = [];
  const dayMap = new Map<string, { revenue: number; orders: number }>();
  for (const order of orders) {
    const dateKey = order.placedAt.toISOString().split("T")[0];
    const existing = dayMap.get(dateKey) || { revenue: 0, orders: 0 };
    existing.revenue += order.totalCents;
    existing.orders += 1;
    dayMap.set(dateKey, existing);
  }
  for (const [date, data] of dayMap) {
    revenueByDay.push({ date, ...data });
  }
  revenueByDay.sort((a, b) => a.date.localeCompare(b.date));

  // Top products by sales
  const productSales = new Map<string, { title: string; count: number; revenue: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const key = item.productId;
      const existing = productSales.get(key) || { title: item.product.title, count: 0, revenue: 0 };
      existing.count += item.quantity;
      existing.revenue += item.priceCents * item.quantity;
      productSales.set(key, existing);
    }
  }
  const topProducts = Array.from(productSales.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Top categories
  const categorySales = new Map<string, { name: string; count: number; revenue: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const catName = item.product.category?.name || "Unknown";
      const existing = categorySales.get(catName) || { name: catName, count: 0, revenue: 0 };
      existing.count += item.quantity;
      existing.revenue += item.priceCents * item.quantity;
      categorySales.set(catName, existing);
    }
  }
  const topCategories = Array.from(categorySales.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Summary
  const totalRevenue = orders.reduce((s, o) => s + o.totalCents, 0);
  const totalOrders = orders.length;
  const totalItems = orders.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity, 0), 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Customer count (unique users who ordered)
  const uniqueCustomers = new Set(orders.map(o => o.userId)).size;

  return NextResponse.json({
    ok: true,
    data: {
      summary: {
        totalRevenueCents: totalRevenue,
        totalOrders,
        totalItems,
        avgOrderValueCents: avgOrderValue,
        uniqueCustomers,
        conversionRate: totalOrders > 0 ? ((uniqueCustomers / Math.max(totalOrders, 1)) * 100).toFixed(1) + "%" : "0%",
      },
      revenueByDay,
      topProducts,
      topCategories,
    },
  });
}
