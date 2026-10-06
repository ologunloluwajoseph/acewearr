"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellRing, X, Heart, TrendingDown, Package } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useWishlistStore } from "@/lib/stores/wishlist-store";
import { toast } from "sonner";

// ============================================================================
//  Wishlist Notifications — alerts users when wishlisted items go on sale
//  or come back in stock. Shown as a slide-down toast banner.
// ============================================================================
export function WishlistAlerts() {
  const user = useAuthStore((s) => s.user);
  const items = useWishlistStore((s) => s.items);
  const [alerts, setAlerts] = useState<{ type: "restock" | "price_drop"; productId: string; title: string; message: string }[]>([]);

  // Check for restock/price drop alerts (simulated)
  useEffect(() => {
    if (!user || items.length === 0) return;
    // In production: this would poll /api/wishlist/alerts or use websockets
    // For demo: show a sample alert after 10 seconds
    const timer = setTimeout(() => {
      const sampleAlert = {
        type: "restock" as const,
        productId: items[0].productId,
        title: items[0].title,
        message: `"${items[0].title}" is back in stock! Tap to shop now.`,
      };
      setAlerts([sampleAlert]);
    }, 10000);
    return () => clearTimeout(timer);
  }, [user, items]);

  const dismiss = (index: number) => {
    setAlerts(alerts.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed top-16 right-4 z-40 flex flex-col gap-2">
      <AnimatePresence>
        {alerts.map((alert, i) => (
          <motion.div
            key={`${alert.productId}-${i}`}
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="flex items-start gap-3 rounded-xl border border-amber/30 bg-white p-3 shadow-lg"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber/15">
              {alert.type === "restock" ? <Package className="h-4 w-4 text-amber" /> : <TrendingDown className="h-4 w-4 text-amber" />}
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-navy">{alert.type === "restock" ? "Back in stock!" : "Price drop!"}</p>
              <p className="text-[11px] text-muted-foreground">{alert.message}</p>
            </div>
            <button onClick={() => dismiss(i)} className="text-muted-foreground hover:text-navy">
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
