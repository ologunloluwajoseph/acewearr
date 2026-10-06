"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Package, ShoppingCart, TrendingUp, Users, DollarSign,
  Search, Plus, Edit, Trash2, Eye, Loader2, Crown, Sparkles,
  ArrowUpRight, ArrowDownRight, AlertCircle, CheckCircle2, XCircle,
  Image as ImageIcon, Settings, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useGlobalSettings } from "@/lib/stores/settings-store";
import { toast } from "sonner";

export function ShopifyAdminSection({ onNavigate }: { onNavigate: (s: string) => void }) {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [tab, setTab] = useState<"overview" | "products" | "orders" | "customers">("overview");
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      const [prodRes, orderRes] = await Promise.all([
        fetch("/api/products?limit=50").then(r => r.json()),
        fetch("/api/orders/purchase-history?userId=acewears-buyer-demo-id").then(r => r.json()).catch(() => ({ ok: false })),
      ]);
      if (prodRes.ok) setProducts(prodRes.data);
      if (orderRes.ok && orderRes.data?.orders) setOrders(orderRes.data.orders);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Product management handlers
  const handleEdit = (productId: string) => {
    // Navigate to upload-product page which doubles as edit page
    onNavigate("upload-product");
    toast.info("Edit mode — modify the product details and re-submit");
  };

  const handleDelete = async (productId: string, title: string) => {
    if (!confirm(`Delete "${title}"? This will set it as inactive (soft delete).`)) return;
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        headers: { "x-acewears-role": "ADMIN" },
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error);
      toast.success(`"${title}" deleted (set to inactive)`);
      load(); // refresh
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleToggleActive = async (productId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-acewears-role": "ADMIN" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error);
      toast.success(`Product ${!currentActive ? "activated" : "deactivated"}`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <Crown className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h2 className="text-xl font-bold text-navy">Admin access required</h2>
        <p className="mt-1 text-sm text-muted-foreground">Sign in as an admin to access the Shopify-style dashboard.</p>
      </div>
    );
  }

  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter((p: any) => p.isActive).length,
    lowStock: products.reduce((n: number, p: any) => n + (p.variants?.some((v: any) => v.stockCount <= 3 && v.stockCount > 0) ? 1 : 0), 0),
    outOfStock: products.reduce((n: number, p: any) => n + (p.variants?.every((v: any) => v.stockCount === 0) ? 1 : 0), 0),
    totalOrders: orders.length,
    revenue: orders.reduce((s: number, o: any) => s + (o.totalCents || 0), 0),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-navy">
            <LayoutDashboard className="h-5 w-5 text-amber" /> AceWears Admin
          </h1>
          <p className="text-xs text-muted-foreground">Shopify-style dashboard · {user.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-full p-2 text-navy hover:bg-muted" aria-label="Search">
            <Search className="h-4 w-4" />
          </button>
          <button className="relative rounded-full p-2 text-navy hover:bg-muted" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            {stats.lowStock > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                {stats.lowStock}
              </span>
            )}
          </button>
          <button onClick={signOut} className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-navy hover:bg-muted/70">
            Sign out
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Package className="h-4 w-4" />} label="Products" value={stats.totalProducts} sub={`${stats.activeProducts} active`} accent="text-navy" />
        <StatCard icon={<ShoppingCart className="h-4 w-4" />} label="Orders" value={stats.totalOrders} sub="all time" accent="text-amber" />
        <StatCard icon={<DollarSign className="h-4 w-4" />} label="Revenue" value={`$${(stats.revenue / 100).toFixed(2)}`} sub="total" accent="text-teal" />
        <StatCard icon={<AlertCircle className="h-4 w-4" />} label="Low stock" value={stats.lowStock} sub={`${stats.outOfStock} out of stock`} accent="text-destructive" />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-border">
        {([
          { id: "overview", label: "Overview", icon: LayoutDashboard },
          { id: "products", label: "Products", icon: Package },
          { id: "orders", label: "Orders", icon: ShoppingCart },
          { id: "customers", label: "Customers", icon: Users },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition ${
              tab === t.id ? "border-amber text-navy" : "border-transparent text-muted-foreground hover:text-navy"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Overview tab */}
          {tab === "overview" && (
            <div className="space-y-4">
              {/* Revenue chart placeholder */}
              <div className="rounded-xl border border-border bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-navy">Revenue overview</h3>
                <div className="flex items-end gap-2" style={{ height: 120 }}>
                  {[40, 65, 35, 80, 55, 90, 70, 95, 60, 85, 75, 100].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-amber/30 to-amber" style={{ height: `${h}%` }} title={`Month ${i + 1}`} />
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => <span key={m}>{m}</span>)}
                </div>
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <QuickAction icon={<Plus className="h-4 w-4" />} label="Add product" onClick={() => onNavigate("admin")} />
                <QuickAction icon={<Package className="h-4 w-4" />} label="Inventory" onClick={() => onNavigate("admin")} />
                <QuickAction icon={<TrendingUp className="h-4 w-4" />} label="Analytics" onClick={() => toast.info("Analytics coming soon")} />
                <QuickAction icon={<Settings className="h-4 w-4" />} label="Settings" onClick={() => onNavigate("settings")} />
              </div>

              {/* Recent orders */}
              <div className="rounded-xl border border-border bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-navy">Recent orders</h3>
                {orders.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">No orders yet.</p>
                ) : (
                  <div className="space-y-2">
                    {orders.slice(0, 5).map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between rounded-lg border border-border p-2 text-xs">
                        <div>
                          <p className="font-medium text-navy">{order.reference}</p>
                          <p className="text-muted-foreground">{new Date(order.placedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={order.status === "DELIVERED" ? "bg-teal/10 text-teal" : "bg-amber/10 text-amber"}>
                            {order.status}
                          </Badge>
                          <span className="font-bold text-navy">${(order.totalCents / 100).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Products tab */}
          {tab === "products" && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
                <Button onClick={() => onNavigate("admin")} size="sm" className="bg-amber text-navy hover:bg-amber-400">
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add product
                </Button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-navy text-white">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Product</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Category</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Price</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Stock</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Status</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products
                      .filter((p: any) => p.title.toLowerCase().includes(search.toLowerCase()))
                      .map((p: any) => {
                        const totalStock = p.variants?.reduce((s: number, v: any) => s + v.stockCount, 0) || 0;
                        const isLow = totalStock <= 5 && totalStock > 0;
                        const isOut = totalStock === 0;
                        return (
                          <tr key={p.id} className="border-b border-border hover:bg-muted/30">
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                {p.images?.[0]?.url && (
                                  <div className="h-8 w-8 overflow-hidden rounded bg-muted">
                                    <img src={p.images[0].url} alt={p.title} className="h-full w-full object-cover" />
                                  </div>
                                )}
                                <span className="font-medium text-navy line-clamp-1">{p.title}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">{p.category?.name || "—"}</td>
                            <td className="px-3 py-2 font-bold text-amber">${(p.basePriceCents / 100).toFixed(2)}</td>
                            <td className="px-3 py-2">
                              <span className={isOut ? "text-destructive font-bold" : isLow ? "text-amber font-bold" : "text-navy"}>
                                {totalStock}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              {p.isActive ? (
                                <span className="inline-flex items-center gap-1 text-xs text-teal"><CheckCircle2 className="h-3 w-3" /> Active</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><XCircle className="h-3 w-3" /> Inactive</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button onClick={() => handleEdit(p.id)} className="rounded p-1 text-muted-foreground hover:text-amber" aria-label="Edit">
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => handleDelete(p.id, p.title)} className="rounded p-1 text-muted-foreground hover:text-destructive" aria-label="Delete">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => handleToggleActive(p.id, p.isActive)} className="rounded p-1 text-muted-foreground hover:text-teal" aria-label="Toggle active">
                                {p.isActive ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Orders tab */}
          {tab === "orders" && (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-navy text-white">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold">Order</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold">Items</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold">Total</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order: any) => (
                    <tr key={order.id} className="border-b border-border hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium text-navy">{order.reference}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(order.placedAt).toLocaleDateString()}</td>
                      <td className="px-3 py-2 text-xs">{order.items?.length || 0} item(s)</td>
                      <td className="px-3 py-2 font-bold text-amber">${(order.totalCents / 100).toFixed(2)}</td>
                      <td className="px-3 py-2">
                        <Badge className={order.status === "DELIVERED" ? "bg-teal/10 text-teal" : "bg-amber/10 text-amber"}>
                          {order.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Customers tab */}
          {tab === "customers" && (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
              Customer management dashboard coming soon. View individual customer orders via the Orders tab.
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string | number; sub: string; accent: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-3">
      <div className="flex items-center justify-between">
        <div className={`flex h-7 w-7 items-center justify-center rounded-full bg-muted ${accent}`}>{icon}</div>
        <span className="text-[10px] text-muted-foreground">{sub}</span>
      </div>
      <p className="mt-1 text-xl font-bold text-navy">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm font-medium text-navy transition hover:bg-muted">
      <span className="text-amber">{icon}</span>
      {label}
    </button>
  );
}
