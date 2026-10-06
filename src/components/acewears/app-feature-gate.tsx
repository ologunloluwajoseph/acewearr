"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, Lock, Download, Sparkles, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

// ============================================================================
//  useIsApp — detects if running as installed PWA (standalone mode)
//  Premium/app-only features are gated behind this check.
//  On web: these features show an "Install App" prompt instead.
// ============================================================================

export function useIsApp() {
  const [isApp, setIsApp] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const standalone = window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsApp(standalone);
    };
    checkStandalone();
    window.addEventListener("appinstalled", checkStandalone);
    return () => window.removeEventListener("appinstalled", checkStandalone);
  }, []);

  return isApp;
}

// List of features that are app-only (not available on web)
export const APP_ONLY_FEATURES = [
  "ai_virtual_try_on",
  "premium_activation",
  "ace_reels",
  "trade_in_portal",
  "seller_dashboard",
  "loyalty_points",
  "push_notifications",
  "offline_browsing",
  "live_chat",
];

// Features available on both web and app
export const WEB_FEATURES = [
  "browse_products",
  "search_products",
  "add_to_cart",
  "checkout_paystack",
  "buy_on_credit",
  "wishlist",
  "account_management",
  "order_tracking",
  "purchase_history",
];

// ============================================================================
//  AppOnlyGate — wraps app-only features. On web, shows install prompt.
// ============================================================================

export function AppOnlyGate({
  feature,
  featureLabel,
  children,
  onInstall,
}: {
  feature: string;
  featureLabel: string;
  children: React.ReactNode;
  onInstall?: () => void;
}) {
  const isApp = useIsApp();

  if (isApp) {
    // Running in app — show the feature
    return <>{children}</>;
  }

  // Running on web — show install prompt
  return (
    <div className="mx-auto max-w-md px-4 py-12 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber to-amber-400"
      >
        <Smartphone className="h-10 w-10 text-navy" />
      </motion.div>
      <h2 className="text-xl font-bold text-navy">{featureLabel} — App Only</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        This feature is available exclusively in the AceWears mobile app. Install the app to unlock:
      </p>

      <div className="mx-auto mt-4 max-w-xs space-y-1.5 text-left">
        {APP_ONLY_FEATURES.map(f => (
          <div key={f} className="flex items-center gap-2 text-xs text-navy">
            <Crown className="h-3 w-3 text-amber" />
            <span className="capitalize">{f.replace(/_/g, " ")}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        <Button
          onClick={() => {
            // Trigger PWA install prompt
            window.dispatchEvent(new CustomEvent("acewears:trigger-install"));
            onInstall?.();
          }}
          className="bg-amber text-navy hover:bg-amber-400"
          size="lg"
        >
          <Download className="mr-2 h-4 w-4" /> Install AceWears App
        </Button>
        <p className="text-[10px] text-muted-foreground">
          Free · No app store needed · Works offline · ~1.5MB
        </p>
      </div>
    </div>
  );
}

// ============================================================================
//  FeatureBadge — shows "App Only" or "Web + App" badge on nav items
// ============================================================================

export function FeatureBadge({ featureId }: { featureId: string }) {
  const isAppOnly = APP_ONLY_FEATURES.includes(featureId);

  if (!isAppOnly) return null;

  return (
    <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-amber/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber">
      <Crown className="h-2.5 w-2.5" /> App
    </span>
  );
}
