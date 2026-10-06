"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Store, Package, DollarSign, TrendingUp, Loader2, Crown,
  Plus, Eye, Edit, Trash2, Check, X, ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "sonner";

export function SellerDashboardSection({ onNavigate }: { onNavigate: (s: string) => void }) {
  const user = useAuthStore((s) => s.user);
  const [isSeller, setIsSeller] = useState(user?.role === "SELLER" || false);
  const [storeName, setStoreName] = useState("");
  const [registering, setRegistering] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/seller/dashboard?userId=${user.id}`);
      const j = await res.json();
      if (j.ok) { setData(j.data); setIsSeller(true); }
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { if (isSeller) load(); else setLoading(false); }, [isSeller, load]);

  const handleRegister = async () => {
    if (!user) { toast.error("Sign in first"); return; }
    if (!storeName) { toast.error("Enter a store name"); return; }
    setRegistering(true);
    try {
      const res = await fetch("/api/seller/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, storeName }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error);
      setIsSeller(true);
      toast.success(`Welcome, ${storeName}! You're now a seller.`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setRegistering(false); }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <Store className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h2 className="text-xl font-bold text-navy">Sign in to become a seller</h2>
      </div>
    );
  }

  if (loading) {
    return <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  // Not a seller yet — show registration
  if (!isSeller) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-amber/15">
            <Store className="h-8 w-8 text-amber" />
          </div>
          <h1 className="text-2xl font-bold text-navy">Become a Seller</h1>
          <p className="text-sm text-muted-foreground">Start selling your fashion on AceWears marketplace</p>
        </div>

        <div className="rounded-xl border border-border bg-white p-5">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Store name</Label>
              <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="e.g. Urban Threads Co." />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-semibold text-navy">Seller benefits</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex gap-2"><Check className="h-3 w-3 shrink-0 text-teal" /> List unlimited products</li>
              <li className="flex gap-2"><Check className="h-3 w-3 shrink-0 text-teal" /> 90% revenue share (10% commission)</li>
              <li className="flex gap-2"><Check className="h-3 w-3 shrink-0 text-teal" /> Seller dashboard with analytics</li>
              <li className="flex gap-2"><Check className="h-3 w-3 shrink-0 text-teal" /> Weekly payouts to your bank or Paystack</li>
              <li className="flex gap-2"><Check className="h-3 w-3 shrink-0 text-teal" /> Access to AceWears customer base</li>
            </ul>
          </div>

          <Button onClick={handleRegister} disabled={registering} className="mt-4 w-full bg-amber text-navy hover:bg-amber-400" size="lg">
            {registering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Store className="mr-2 h-4 w-4" />}
            Register as Seller
          </Button>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">10% commission per sale · Weekly payouts · Cancel anytime</p>
        </div>
      </div>
    );
  }

  // Seller dashboard
  const stats = data?.stats;
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-navy">
            <Store className="h-6 w-6 text-amber" /> {data?.storeName || "My Store"}
          </h1>
          <p className="text-xs text-muted-foreground">Seller dashboard · {data?.commissionRate}% commission rate</p>
        </div>
        <Button onClick={() => onNavigate("upload-product")} className="bg-amber text-navy hover:bg-amber-400" size="sm">
          <Plus className="mr-1 h-3.5 w-3.5" /> Add Product
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Package className="h-4 w-4" />} label="Products" value={stats?.totalProducts || 0} sub={`${stats?.activeProducts || 0} active`} accent="text-navy" />
        <StatCard icon={<ShoppingBag className="h-4 w-4" />} label="Orders" value={stats?.totalOrders || 0} sub="all time" accent="text-amber" />
        <StatCard icon={<DollarSign className="h-4 w-4" />} label="Total Sales" value={`$${((stats?.totalSalesCents || 0) / 100).toFixed(2)}`} sub="gross" accent="text-teal" />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Net Earnings" value={`$${((stats?.netEarningsCents || 0) / 100).toFixed(2)}`} sub="after commission" accent="text-amber" />
      </div>

      {/* Products table */}
      <div className="rounded-xl border border-border bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-navy">Your Products</h3>
        {(!data?.products || data.products.length === 0) ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No products yet. Click "Add Product" to start selling!</p>
        ) : (
          <div className="space-y-2">
            {data.products.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-2 text-sm">
                <span className="font-medium text-navy line-clamp-1">{p.title}</span>
                <div className="flex items-center gap-3">
                  <span className="text-amber font-bold">${(p.basePriceCents / 100).toFixed(2)}</span>
                  {p.isActive ? <Check className="h-4 w-4 text-teal" /> : <X className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout balance */}
      <div className="mt-4 rounded-xl bg-gradient-to-br from-navy to-navy-700 p-5 text-white">
        <p className="text-xs uppercase tracking-wider text-white/60">Available for payout</p>
        <p className="mt-1 text-3xl font-bold text-amber">${((data?.sellerBalanceCents || 0) / 100).toFixed(2)}</p>
        <p className="mt-1 text-xs text-white/60">Payouts processed weekly · Minimum $25</p>
        <Button className="mt-3 bg-amber text-navy hover:bg-amber-400" size="sm">Request Payout</Button>
      </div>
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
