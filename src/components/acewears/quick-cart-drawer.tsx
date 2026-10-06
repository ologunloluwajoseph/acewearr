"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Trash2, Truck, Check } from "lucide-react";
import { useCartStore, useFreeShippingProgress } from "@/lib/stores/cart-store";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";

export function QuickCartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const close = useCartStore((s) => s.close);
  const lines = useCartStore((s) => s.lines);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const { subtotal, remaining, pct, threshold } = useFreeShippingProgress();

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Cart drawer"
          >
            {/* Header */}
            <header className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-base font-semibold text-navy">Your cart</h2>
              <button
                onClick={close}
                aria-label="Close cart"
                className="rounded-full p-2 text-navy hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            {/* Free shipping progress */}
            <div className="border-b border-border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2 text-xs">
                {remaining > 0 ? (
                  <>
                    <Truck className="h-4 w-4 text-amber" />
                    <span className="text-navy">
                      Add <span className="font-bold text-amber">{formatMoney(remaining, "USD")}</span> more for free shipping
                    </span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 text-teal" />
                    <span className="font-medium text-teal">You unlocked free shipping</span>
                  </>
                )}
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber to-amber-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ type: "spring", stiffness: 200, damping: 30 }}
                />
              </div>
            </div>

            {/* Lines */}
            <div className="flex-1 overflow-y-auto p-4">
              {lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                  <div className="rounded-full bg-muted p-4">
                    <Truck className="h-6 w-6" />
                  </div>
                  <p className="text-sm">Your cart is empty</p>
                  <Button variant="outline" size="sm" onClick={close}>Continue shopping</Button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {lines.map((line) => (
                    <li key={line.id} className="flex gap-3 rounded-lg border border-border p-2">
                      {line.image && (
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                          { }
                          <img src={line.image} alt={line.title} className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-2 text-sm font-medium text-navy">{line.title}</p>
                          <button
                            onClick={() => removeItem(line.id)}
                            aria-label="Remove item"
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {[line.size && `Size ${line.size}`, line.color].filter(Boolean).join(" · ")}
                        </p>
                        <div className="mt-1 flex items-center justify-between">
                          <div className="flex items-center rounded-md border border-border">
                            <button
                              onClick={() => updateQuantity(line.id, line.quantity - 1)}
                              aria-label="Decrease quantity"
                              className="px-2 py-1 text-navy hover:bg-muted"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="min-w-6 text-center text-sm font-medium">{line.quantity}</span>
                            <button
                              onClick={() => updateQuantity(line.id, line.quantity + 1)}
                              aria-label="Increase quantity"
                              className="px-2 py-1 text-navy hover:bg-muted"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="text-sm font-bold text-navy">
                            {formatMoney(line.priceCents * line.quantity, line.currency)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {lines.length > 0 && (
              <footer className="border-t border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-lg font-bold text-navy">{formatMoney(subtotal, "USD")}</span>
                </div>
                <Button
                  onClick={() => {
                    close();
                    // Dispatch event to open checkout modal
                    window.dispatchEvent(new CustomEvent("acewears:open-checkout"));
                  }}
                  className="w-full bg-amber text-navy hover:bg-amber-400" size="lg"
                >
                  Checkout with Paystack
                </Button>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  Secure payment via Paystack · Free returns within 30 days
                </p>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
