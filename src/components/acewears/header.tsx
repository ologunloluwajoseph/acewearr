"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Search, Heart, User, Sparkles, Menu, X, Home, Grid3x3, Play,
  Wand2, Crown, FileText, CreditCard, Settings as SettingsIcon,
  LayoutDashboard, ChevronRight, Truck, Recycle, Wallet, Package, Plus, Store,
} from "lucide-react";
import { useCartStore, useCartCount } from "@/lib/stores/cart-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useWishlistCount } from "@/lib/stores/wishlist-store";

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "shop" | "account" | "legal";
};

const NAV_ITEMS: NavItem[] = [
  { id: "home",       label: "Home",            icon: Home,            group: "shop" },
  { id: "catalog",    label: "Shop All",        icon: Grid3x3,         group: "shop" },
  { id: "studio",     label: "AI Studio",       icon: Wand2,           group: "shop" },
  { id: "reels",      label: "AceReels",        icon: Play,            group: "shop" },
  { id: "wishlist",   label: "My Wishlist",     icon: Heart,           group: "shop" },
  { id: "discover",   label: "Discover",        icon: Search,          group: "shop" },
  { id: "tradein",    label: "Trade-In Portal", icon: Recycle,         group: "shop" },
  { id: "premium",     label: "Activate Premium", icon: Crown,        group: "shop" },
  { id: "admin",       label: "Admin",            icon: LayoutDashboard, group: "shop" },
  { id: "upload-product", label: "Upload Product", icon: Plus,           group: "shop" },
  { id: "seller",      label: "Seller Dashboard",  icon: Store,          group: "shop" },
  { id: "dashboard",       label: "Dashboard",         icon: LayoutDashboard, group: "account" },
  { id: "credit",           label: "Buy on Credit",     icon: Wallet,          group: "account" },
  { id: "account-details", label: "Account Details",   icon: User,            group: "account" },
  { id: "purchases",       label: "Purchase History",  icon: Package,         group: "account" },
  { id: "payment",         label: "Payment & Payouts", icon: CreditCard,      group: "account" },
  { id: "settings",        label: "Settings",          icon: SettingsIcon,    group: "account" },
  { id: "terms",           label: "Terms & Privacy",   icon: FileText,        group: "legal" },
];

const GROUP_LABELS: Record<string, string> = {
  shop: "Shop",
  account: "Account",
  legal: "Legal",
};

export function Header({ onNavigate }: { onNavigate: (section: string) => void }) {
  const cartCount = useCartCount();
  const openCart = useCartStore((s) => s.open);
  const user = useAuthStore((s) => s.user);
  const wishlistCount = useWishlistCount();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleNavigate = (id: string) => {
    setMobileOpen(false);
    onNavigate(id);
  };

  return (
    <header className="sticky top-0 z-[60] border-b border-border bg-white shadow-sm">
      {/* Announcement strip */}
      <div className="bg-navy text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-1.5 text-center text-[11px] font-medium uppercase tracking-wider">
          <Sparkles className="h-3 w-3 text-amber" />
          Free shipping over $75 · Returns within 30 days
        </div>
      </div>

      {/* Top row: logo + search + actions */}
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link href="/" className="shrink-0">
          <img src="/acewears-logo.svg" alt="AceWears" className="h-8 w-auto" />
        </Link>

        {/* Search bar (sticky, desktop only) */}
        <div className="relative hidden flex-1 sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search blazers, sneakers, cashmere..."
            className="h-10 w-full rounded-full border border-border bg-muted/40 pl-10 pr-4 text-sm outline-none transition focus:border-amber focus:bg-white"
            aria-label="Search products"
          />
        </div>

        {/* Mobile spacer to push actions right */}
        <div className="flex-1 sm:hidden" />

        <div className="flex items-center gap-1">
          {/* Wishlist */}
          <button
            onClick={() => handleNavigate("wishlist")}
            className="relative rounded-full p-2 text-navy hover:bg-muted"
            aria-label="Wishlist"
          >
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber px-1 text-[10px] font-bold text-navy">
                {wishlistCount}
              </span>
            )}
          </button>
          {/* Account / Login — opens auth modal if not signed in, dashboard if signed in */}
          <button
            onClick={() => user ? handleNavigate("dashboard") : window.dispatchEvent(new CustomEvent("acewears:open-auth"))}
            className="rounded-full p-2 text-navy hover:bg-muted"
            aria-label={user ? "Dashboard" : "Sign in"}
          >
            <User className="h-5 w-5" />
          </button>
          {/* Cart */}
          <button
            onClick={openCart}
            className="relative rounded-full p-2 text-navy hover:bg-muted"
            aria-label="Cart"
          >
            <CartIcon />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber px-1 text-[10px] font-bold text-navy">
                {cartCount}
              </span>
            )}
          </button>
          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-full p-2 text-navy hover:bg-muted lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Desktop mega-menu (hidden on mobile) — left-aligned, horizontally scrollable */}
      <nav className="hidden border-t border-border bg-white lg:block">
        <div className="no-scrollbar mx-auto flex max-w-7xl items-center justify-start gap-4 overflow-x-auto px-4 py-2 text-sm font-medium text-navy lg:gap-5 xl:gap-6">
          {/* Shop group */}
          {NAV_ITEMS.filter(i => i.group === "shop").map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className="group relative flex shrink-0 items-center gap-1.5 py-1 transition hover:text-amber"
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
          <span className="shrink-0 text-border">|</span>
          {/* Account group */}
          {NAV_ITEMS.filter(i => i.group === "account").map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className="group relative flex shrink-0 items-center gap-1.5 py-1 transition hover:text-amber"
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
                {item.id === "settings" && (
                  <span className="ml-0.5 rounded bg-amber/15 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber">
                    New
                  </span>
                )}
              </button>
            );
          })}
          <span className="shrink-0 text-border">|</span>
          {/* Legal group */}
          {NAV_ITEMS.filter(i => i.group === "legal").map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className="group relative flex shrink-0 items-center gap-1.5 py-1 text-muted-foreground transition hover:text-amber"
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {user ? `Hi, ${user.name.split(" ")[0]}` : "Sign in"}
          </span>
        </div>
      </nav>

      {/* Mobile hamburger drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[70] bg-navy/70 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed right-0 top-0 z-[80] flex h-full w-[85vw] max-w-sm flex-col bg-white shadow-2xl lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Main menu"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-navy to-navy-700 px-4 py-3 text-white">
                <div className="flex items-center gap-2">
                  <img src="/acewears-icon.svg" alt="" className="h-7 w-7" />
                  <span className="text-sm font-bold">AceWears Menu</span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="rounded-full p-1.5 hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User chip (if signed in) */}
              {user && (
                <div className="border-b border-border bg-muted/30 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-navy p-2 text-white">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-navy">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    {user.isPremium && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber">
                        <Crown className="h-2.5 w-2.5" /> Premium
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Mobile search */}
              <div className="border-b border-border p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search products..."
                    className="h-9 w-full rounded-full border border-border bg-muted/40 pl-9 pr-3 text-sm outline-none focus:border-amber"
                  />
                </div>
              </div>

              {/* Nav groups */}
              <div className="flex-1 overflow-y-auto p-3">
                {(["shop", "account", "legal"] as const).map((group) => (
                  <div key={group} className="mb-4">
                    <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {GROUP_LABELS[group]}
                    </p>
                    <ul className="space-y-0.5">
                      {NAV_ITEMS.filter(i => i.group === group).map((item) => {
                        const Icon = item.icon;
                        return (
                          <li key={item.id}>
                            <button
                              onClick={() => handleNavigate(item.id)}
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-navy transition hover:bg-muted"
                            >
                              <Icon className="h-4 w-4 text-amber" />
                              <span className="flex-1">{item.label}</span>
                              {item.id === "settings" && (
                                <span className="rounded bg-amber/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber">
                                  New
                                </span>
                              )}
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Drawer footer */}
              <div className="border-t border-border p-3 text-center">
                <p className="text-[10px] text-muted-foreground">
                  AceWears · Threads Reimagined
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Free shipping over $75 · 30-day returns
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}
