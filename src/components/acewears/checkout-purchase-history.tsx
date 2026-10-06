"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ShoppingBag, Loader2, Check, CreditCard, Truck, Shield, Crown,
  Package, TrendingUp, Wallet, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore, useFreeShippingProgress } from "@/lib/stores/cart-store";
import { useAuthStore, useIsPremium } from "@/lib/stores/auth-store";
import { toast } from "sonner";
import { formatMoney } from "@/lib/utils";

export function CheckoutModal({ onClose }: { onClose: () => void }) {
  const lines = useCartStore((s) => s.lines);
  const clear = useCartStore((s) => s.clear);
  const { subtotal } = useFreeShippingProgress();
  const user = useAuthStore((s) => s.user);
  const isPremium = useIsPremium();
  const [step, setStep] = useState<"review" | "payment" | "success">("review");
  const [processing, setProcessing] = useState(false);
  const [useCredit, setUseCredit] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);
  const [result, setResult] = useState<any>(null);

  const shippingCents = subtotal >= 7500 ? 0 : 500;
  const totalCents = subtotal + shippingCents;

  // Fetch credit balance
  useEffect(() => {
    if (user) {
      fetch(`/api/credit/balance?userId=${user.id}`)
        .then(r => r.json())
        .then(j => { if (j.ok) setCreditBalance(j.data.creditBalanceCents); });
    }
  }, [user]);

  const handlePaystackCheckout = async () => {
    if (!user) {
      toast.error("Sign in to checkout");
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch("/api/checkout/paystack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          items: lines.map(l => ({
            productId: l.productId,
            variantId: l.variantId,
            quantity: l.quantity,
          })),
        }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Payment failed");
      setResult(j.data);
      setStep("success");
      clear();
      toast.success(j.data.message || "Payment successful!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[80] flex items-center justify-center bg-navy/60 backdrop-blur-sm p-3"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        >
          {/* Header */}
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-gradient-to-r from-navy to-navy-700 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-amber" />
              <h2 className="text-sm font-bold">Checkout</h2>
            </div>
            <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="p-4">
            {step === "review" && (
              <>
                {/* Order summary */}
                <h3 className="mb-3 text-sm font-semibold text-navy">Order summary</h3>
                <div className="space-y-2">
                  {lines.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">Your cart is empty</p>
                  ) : lines.map((line) => (
                    <div key={line.id} className="flex items-center gap-3 rounded-lg border border-border p-2">
                      {line.image && (
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                          <img src={line.image} alt={line.title} className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-navy line-clamp-1">{line.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {[line.size && `Size ${line.size}`, line.color, `Qty ${line.quantity}`].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-navy">{formatMoney(line.priceCents * line.quantity, line.currency)}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-4 space-y-1 rounded-lg bg-muted/30 p-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatMoney(subtotal, "USD")}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>{shippingCents === 0 ? "FREE" : formatMoney(shippingCents, "USD")}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1 text-base font-bold text-navy">
                    <span>Total</span>
                    <span>{formatMoney(totalCents, "USD")}</span>
                  </div>
                </div>

                {creditBalance > 0 && (
                  <label className="mt-3 flex items-center gap-2 rounded-lg border border-teal/30 bg-teal/5 p-3 cursor-pointer">
                    <input type="checkbox" checked={useCredit} onChange={(e) => setUseCredit(e.target.checked)} className="accent-teal" />
                    <div className="flex-1 text-xs">
                      <p className="font-medium text-navy">Use credit balance (₦{creditBalance.toLocaleString()})</p>
                      <p className="text-muted-foreground">Apply your accumulated credit to this order</p>
                    </div>
                  </label>
                )}

                <Button onClick={() => setStep("payment")} disabled={lines.length === 0} className="mt-4 w-full bg-navy text-white hover:bg-navy-700" size="lg">
                  Continue to payment
                </Button>
              </>
            )}

            {step === "payment" && (
              <>
                <h3 className="mb-3 text-sm font-semibold text-navy">Payment method</h3>
                {/* Paystack option */}
                <div className="space-y-2">
                  <button
                    onClick={handlePaystackCheckout}
                    disabled={processing}
                    className="flex w-full items-center gap-3 rounded-xl border-2 border-amber bg-amber/5 p-4 text-left transition hover:bg-amber/10"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber text-navy">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-navy">Pay with Paystack</p>
                      <p className="text-xs text-muted-foreground">Visa · Mastercard · Verve · Bank transfer</p>
                    </div>
                    {processing ? <Loader2 className="h-5 w-5 animate-spin text-amber" /> : <Shield className="h-4 w-4 text-teal" />}
                  </button>

                  {creditBalance > 0 && (
                    <div className="rounded-xl border border-border p-4 opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal/10 text-teal">
                          <Wallet className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-navy">Buy on Credit</p>
                          <p className="text-xs text-muted-foreground">Available: ₦{creditBalance.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Trust badges */}
                <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Secure payment</span>
                  <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Free over $75</span>
                  <span className="flex items-center gap-1"><Check className="h-3 w-3" /> 30-day returns</span>
                </div>

                <Button onClick={() => setStep("review")} variant="outline" className="mt-4 w-full">
                  Back to review
                </Button>
              </>
            )}

            {step === "success" && result && (
              <div className="py-6 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-teal/15"
                >
                  <Check className="h-8 w-8 text-teal" />
                </motion.div>
                <h3 className="text-lg font-bold text-navy">Order Confirmed!</h3>
                <p className="text-sm text-muted-foreground">Reference: {result.reference}</p>
                {result.creditEarnedCents > 0 && (
                  <p className="mt-2 inline-block rounded-full bg-amber/10 px-3 py-1 text-xs font-medium text-amber">
                    +₦{result.creditEarnedCents} credit earned from this purchase
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Your items will be shipped within 2-3 business days.
                </p>
                <Button onClick={onClose} className="mt-4 bg-navy text-white hover:bg-navy-700">
                  Continue shopping
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================================
//  Purchase History Section
// ============================================================================
export function PurchaseHistorySection() {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/orders/purchase-history?userId=${user.id}`);
      const j = await res.json();
      if (j.ok) setData(j.data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) load();
    else setLoading(false);
  }, [user, load]);

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h2 className="text-xl font-bold text-navy">Sign in to view your purchase history</h2>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = data?.stats;
  const orders = data?.orders || [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-navy">
          <Package className="h-6 w-6 text-amber" /> Purchase History
        </h1>
        <p className="text-xs text-muted-foreground">Your orders, items bought, and spending stats</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={<Package className="h-4 w-4" />} label="Orders" value={String(stats.totalOrders)} accent="text-navy" />
          <StatCard icon={<ShoppingBag className="h-4 w-4" />} label="Items bought" value={String(stats.totalItemsBought)} accent="text-amber" />
          <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Total spent" value={formatMoney(stats.totalSpentCents, stats.currency)} accent="text-navy" />
          <StatCard icon={<Wallet className="h-4 w-4" />} label="Credit earned" value={`₦${stats.totalCreditEarnedCents.toLocaleString()}`} accent="text-teal" />
        </div>
      )}

      {/* Orders */}
      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No purchases yet. Start shopping to build your history!
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => (
            <div key={order.id} className="rounded-xl border border-border bg-white p-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div>
                  <p className="text-sm font-semibold text-navy">{order.reference}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.placedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    order.status === "DELIVERED" ? "bg-teal/10 text-teal" :
                    order.status === "PAID" ? "bg-amber/10 text-amber" :
                    "bg-muted text-muted-foreground"
                  }`}>{order.status}</span>
                  <span className="text-sm font-bold text-navy">{formatMoney(order.totalCents, order.currency)}</span>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-2 rounded-lg bg-muted/30 p-1.5">
                    {item.image && (
                      <div className="h-8 w-8 overflow-hidden rounded bg-white">
                        <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="text-xs">
                      <p className="font-medium text-navy line-clamp-1">{item.title}</p>
                      <p className="text-muted-foreground">{item.size} · Qty {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-3 text-center">
      <div className={`mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-muted ${accent}`}>{icon}</div>
      <p className="text-lg font-bold text-navy">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
