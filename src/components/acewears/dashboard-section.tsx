"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Crown, ShoppingBag, Heart, Package, Wand2, Recycle,
  Star, TrendingUp, Loader2, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useGlobalSettings, useCurrency, useLanguage } from "@/lib/stores/settings-store";
import { getLanguageByCode, getCurrencyFlag, CURRENCY_SYMBOLS, CURRENCIES } from "@/lib/currency";
import { useWishlistCount } from "@/lib/stores/wishlist-store";
import { useCartCount } from "@/lib/stores/cart-store";
import { toast } from "sonner";
import { formatMoney } from "@/lib/utils";

export function DashboardSection({ onNavigate }: { onNavigate: (s: string) => void }) {
  const user = useAuthStore((s) => s.user);
  // Live currency + language from global store (updates instantly when changed in Settings)
  const currency = useCurrency();
  const language = useLanguage();
  const wishlistCount = useWishlistCount();
  const cartCount = useCartCount();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      fetch(`/api/wishlist?userId=${user.id}`).then(r => r.json()),
      fetch(`/api/me/try-on-results?userId=${user.id}`).then(r => r.json()),
      fetch(`/api/trade-in?userId=${user.id}`).then(r => r.json()),
    ]).then(([wl, tr, ti]) => {
      if (cancelled) return;
      setStats({
        wishlistCount: wl.ok ? wl.data.length : 0,
        tryOnCount: tr.ok ? tr.data.length : 0,
        tradeInCount: ti.ok ? ti.data.length : 0,
        tradeInCreditCents: ti.ok ? ti.data.reduce((s: number, i: any) => s + (i.claimedCreditCents || 0), 0) : 0,
      });
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  if (!user) {
    setLoading(false);
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <LayoutDashboard className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h2 className="text-xl font-bold text-navy">Sign in to view your dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">Track orders, wishlist, try-ons, and trade-ins.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-navy">
          <LayoutDashboard className="h-6 w-6 text-amber" /> Dashboard
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Welcome back, {user.name}</span>
          <span className="text-border">·</span>
          {/* Language + flag — reads from global store, updates instantly */}
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-medium text-navy dark:text-white dark:bg-navy-700">
            {getLanguageByCode(language).flag} {getLanguageByCode(language).name}
          </span>
          {/* Currency + flag — reads from global store, updates instantly */}
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-medium text-navy dark:text-white dark:bg-navy-700">
            {getCurrencyFlag(currency)} {currency} {CURRENCY_SYMBOLS[currency] || "$"}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Top stats row */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={<ShoppingBag className="h-5 w-5" />} label="In cart" value={String(cartCount)} accent="navy" />
            <StatCard icon={<Heart className="h-5 w-5" />} label="Wishlist" value={String(stats?.wishlistCount || 0)} accent="amber" />
            <StatCard icon={<Wand2 className="h-5 w-5" />} label="AI Try-ons" value={String(stats?.tryOnCount || 0)} accent="teal" />
            <StatCard icon={<Recycle className="h-5 w-5" />} label="Trade-ins" value={String(stats?.tradeInCount || 0)} accent="navy" />
          </div>

          {/* Premium banner */}
          {!user.isPremium ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-amber to-amber-400 p-5 text-navy"
            >
              <div className="flex items-center gap-3">
                <Crown className="h-8 w-8" />
                <div className="flex-1">
                  <h3 className="text-base font-bold">Upgrade to AceWears Premium</h3>
                  <p className="text-xs text-navy/80">Unlimited AI Try-Ons · Priority support · Exclusive drops</p>
                </div>
                <Button onClick={() => onNavigate("studio")} className="bg-navy text-white hover:bg-navy-700">
                  Upgrade
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-center gap-3 rounded-xl border border-amber/30 bg-amber/5 p-4"
            >
              <Crown className="h-6 w-6 text-amber" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-navy">Premium active</p>
                <p className="text-xs text-muted-foreground">Unlimited AI Try-Ons · Priority support</p>
              </div>
            </motion.div>
          )}

          {/* Two-column dashboard */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Trade-in credit card */}
            <div className="rounded-xl border border-border bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
                  <Recycle className="h-4 w-4 text-teal" /> Trade-In Credit
                </h3>
                <Button variant="ghost" size="sm" onClick={() => onNavigate("tradein")}>View</Button>
              </div>
              <p className="text-3xl font-bold text-amber">{formatMoney(stats?.tradeInCreditCents || 0, "USD")}</p>
              <p className="mt-1 text-xs text-muted-foreground">From {stats?.tradeInCount || 0} submitted item{(stats?.tradeInCount || 0) === 1 ? "" : "s"}</p>
            </div>

            {/* Quick actions */}
            <div className="rounded-xl border border-border bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-navy">Quick actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <QuickAction icon={<Heart className="h-4 w-4" />} label="Wishlist" onClick={() => onNavigate("wishlist")} />
                <QuickAction icon={<Wand2 className="h-4 w-4" />} label="AI Studio" onClick={() => onNavigate("studio")} />
                <QuickAction icon={<Package className="h-4 w-4" />} label="Orders" onClick={() => onNavigate("account")} />
                <QuickAction icon={<Eye className="h-4 w-4" />} label="Discover" onClick={() => onNavigate("discover")} />
              </div>
            </div>

            {/* Recent activity (wishlist preview) */}
            <div className="rounded-xl border border-border bg-white p-4 lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
                  <TrendingUp className="h-4 w-4 text-amber" /> Recent activity
                </h3>
                <Button variant="ghost" size="sm" onClick={() => onNavigate("wishlist")}>View all</Button>
              </div>
              <p className="py-6 text-center text-xs text-muted-foreground">
                Your recent orders, try-on renders, and wishlist adds will appear here.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: "navy" | "amber" | "teal" }) {
  const accentMap = {
    navy: "bg-navy/10 text-navy",
    amber: "bg-amber/15 text-amber",
    teal: "bg-teal/10 text-teal",
  };
  return (
    <div className="rounded-xl border border-border bg-white p-3 text-center">
      <div className={`mx-auto mb-1.5 flex h-9 w-9 items-center justify-center rounded-full ${accentMap[accent]}`}>{icon}</div>
      <p className="text-2xl font-bold text-navy">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-left text-sm font-medium text-navy transition hover:bg-muted"
    >
      <span className="text-amber">{icon}</span>
      {label}
    </button>
  );
}
