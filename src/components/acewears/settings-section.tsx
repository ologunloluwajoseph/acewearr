"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon, Bell, Lock, Globe, Moon, Sun,
  Loader2, Check, Crown, Sparkles, Heart, ShoppingBag, Eye,
  DollarSign, Languages, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useGlobalSettings, useCurrency, useLanguage, useTheme, useIsDark } from "@/lib/stores/settings-store";
import { CURRENCIES, LANGUAGES } from "@/lib/currency";
import { useWishlistCount } from "@/lib/stores/wishlist-store";
import { useCartCount } from "@/lib/stores/cart-store";
import { toast } from "sonner";

export function SettingsSection() {
  const user = useAuthStore((s) => s.user);
  const wishlistCount = useWishlistCount();
  const cartCount = useCartCount();

  // Global settings — these drive the ENTIRE site
  const currency = useCurrency();
  const language = useLanguage();
  const isDark = useIsDark();
  const setCurrency = useGlobalSettings((s) => s.setCurrency);
  const setLanguage = useGlobalSettings((s) => s.setLanguage);
  const setTheme = useGlobalSettings((s) => s.setTheme);
  const toggleTheme = useGlobalSettings((s) => s.toggleTheme);

  // Notification toggles (local state — not global)
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [publicWishlist, setPublicWishlist] = useState(true);
  const [publicProfile, setPublicProfile] = useState(false);

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <SettingsIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h2 className="text-xl font-bold text-navy">Sign in to manage settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Customize notifications, privacy, and preferences.</p>
      </div>
    );
  }

  // Handlers that take IMMEDIATE effect across the whole site
  const handleCurrencyChange = (c: typeof currency) => {
    setCurrency(c);
    const info = CURRENCIES.find(cur => cur.code === c);
    toast.success(`Currency set to ${info?.flag} ${c} — all prices updated instantly`);
  };

  const handleLanguageChange = (l: typeof language) => {
    setLanguage(l);
    const info = LANGUAGES.find(lg => lg.code === l);
    toast.success(`Language set to ${info?.flag} ${info?.native || l} — site updated instantly`);
  };

  const handleThemeToggle = (dark: boolean) => {
    setTheme(dark ? "dark" : "light");
    toast.success(`${dark ? "Dark" : "Light"} mode activated`);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-navy dark:text-white">
          <SettingsIcon className="h-6 w-6 text-amber" /> Settings
        </h1>
        <p className="text-xs text-muted-foreground">Manage notifications, privacy, and preferences</p>
      </div>

      {/* Quick stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard icon={<ShoppingBag className="h-4 w-4" />} label="Cart" value={cartCount} />
        <StatCard icon={<Heart className="h-4 w-4" />} label="Wishlist" value={wishlistCount} />
        <StatCard icon={<Crown className="h-4 w-4" />} label="Plan" value={user.isPremium ? "Premium" : "Free"} />
      </div>

      {/* ===== Currency & Language — GLOBAL, TAKES EFFECT INSTANTLY ===== */}
      <SettingsCard icon={<Globe className="h-4 w-4 text-amber" />} title="Currency & Language" subtitle="Changes apply instantly across the entire site">
        {/* Currency selector */}
        <div className="space-y-1.5 px-4 py-3">
          <Label className="flex items-center gap-1.5 text-xs text-navy dark:text-white">
            <DollarSign className="h-3 w-3" /> Payment currency <span className="text-[10px] text-muted-foreground">(currently: {CURRENCIES.find(c => c.code === currency)?.flag} {currency})</span>
          </Label>
          <div className="flex flex-wrap gap-2">
            {CURRENCIES.map(c => (
              <button
                key={c.code}
                onClick={() => handleCurrencyChange(c.code as any)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                  currency === c.code
                    ? "border-amber bg-amber/10 text-navy dark:text-amber ring-2 ring-amber/30"
                    : "border-border text-muted-foreground hover:bg-muted dark:text-white/60"
                }`}
              >
                <span className="text-base">{c.flag}</span>
                <span>{c.code}</span>
                <span className="text-muted-foreground">{c.symbol}</span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">All prices on product cards, PDP, cart, and checkout will update to this currency.</p>
        </div>

        {/* Language selector */}
        <div className="space-y-1.5 border-t border-border px-4 py-3">
          <Label className="flex items-center gap-1.5 text-xs text-navy dark:text-white">
            <Languages className="h-3 w-3" /> Display language <span className="text-[10px] text-muted-foreground">(currently: {LANGUAGES.find(l => l.code === language)?.flag} {LANGUAGES.find(l => l.code === language)?.native})</span>
          </Label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => handleLanguageChange(l.code as any)}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                  language === l.code
                    ? "border-amber bg-amber/10 text-navy dark:text-amber ring-2 ring-amber/30"
                    : "border-border text-muted-foreground hover:bg-muted dark:text-white/60"
                }`}
              >
                <span className="text-sm">{l.flag}</span>
                <span>{l.native}</span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">Navigation labels, cart, buttons, and headings will update to this language.</p>
        </div>
      </SettingsCard>

      {/* ===== Dark mode toggle — takes effect instantly ===== */}
      <SettingsCard icon={isDark ? <Moon className="h-4 w-4 text-amber" /> : <Sun className="h-4 w-4 text-amber" />} title="Appearance">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-navy dark:text-white flex items-center gap-1.5">
              {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              Dark mode
            </p>
            <p className="text-xs text-muted-foreground">
              {isDark ? "Dark theme active — navy/black backgrounds throughout" : "Light theme active — white backgrounds throughout"}
            </p>
          </div>
          <Switch checked={isDark} onCheckedChange={(checked) => handleThemeToggle(checked)} />
        </div>
      </SettingsCard>

      {/* Notifications */}
      <SettingsCard icon={<Bell className="h-4 w-4 text-amber" />} title="Notifications">
        <ToggleRow label="Email notifications" desc="Order updates, shipping, delivery" checked={emailNotifs} onChange={setEmailNotifs} />
        <ToggleRow label="Push notifications" desc="Restock alerts, deal timers, trade-in status" checked={pushNotifs} onChange={setPushNotifs} />
        <ToggleRow label="SMS notifications" desc="Critical order updates only" checked={smsNotifs} onChange={setSmsNotifs} />
        <ToggleRow label="Marketing emails" desc="New drops, seasonal sales, styling tips" checked={marketingEmails} onChange={setMarketingEmails} />
      </SettingsCard>

      {/* Privacy */}
      <SettingsCard icon={<Lock className="h-4 w-4 text-amber" />} title="Privacy">
        <ToggleRow label="Public wishlist" desc="Anyone with the link can view your wishlist" checked={publicWishlist} onChange={setPublicWishlist} />
        <ToggleRow label="Public profile" desc="Show your name + photo on Discover wishlists" checked={publicProfile} onChange={setPublicProfile} />
      </SettingsCard>

      <div className="mt-6 flex justify-end">
        <Button onClick={() => toast.success("Notification + privacy settings saved")} className="bg-navy text-white hover:bg-navy-700 dark:bg-amber dark:text-navy">
          <Check className="mr-1.5 h-4 w-4" /> Save notification settings
        </Button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-white p-3 text-center dark:bg-navy-700 dark:border-navy-600">
      <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber/10 text-amber">{icon}</div>
      <p className="text-lg font-bold text-navy dark:text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function SettingsCard({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-border bg-white dark:bg-navy-800 dark:border-navy-600">
      <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2.5 dark:bg-navy-700/50">
        {icon}
        <div>
          <h3 className="text-sm font-semibold text-navy dark:text-white">{title}</h3>
          {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="divide-y divide-border dark:divide-navy-600">{children}</div>
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-navy dark:text-white">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
