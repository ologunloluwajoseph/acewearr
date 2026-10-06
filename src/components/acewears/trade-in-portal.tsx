"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Recycle, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "sonner";
import { formatMoney } from "@/lib/utils";

type TradeableProduct = {
  id: string;
  slug: string;
  title: string;
  basePriceCents: number;
};

type TradeInItem = {
  id: string;
  status: string;
  claimedCreditCents: number;
  condition: string;
  createdAt: string;
  product: { title: string; slug: string };
};

const CONDITIONS = [
  { value: "NEW",      label: "New / unworn",         multiplier: 0.45 },
  { value: "LIKE_NEW", label: "Like new",             multiplier: 0.35 },
  { value: "GOOD",     label: "Good — minor wear",    multiplier: 0.25 },
  { value: "WORN",     label: "Worn — needs refresh", multiplier: 0.15 },
];

export function TradeInPortal({
  products,
  existingItems,
  onSubmitted,
}: {
  products: TradeableProduct[];
  existingItems: TradeInItem[];
  onSubmitted?: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const [productId, setProductId] = useState("");
  const [condition, setCondition] = useState("LIKE_NEW");
  const [ageMonths, setAgeMonths] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Live credit estimate
  const selectedProduct = products.find(p => p.id === productId);
  const conditionObj = CONDITIONS.find(c => c.value === condition)!;
  const estimatedCreditCents = selectedProduct
    ? Math.round(selectedProduct.basePriceCents * conditionObj.multiplier)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Sign in to submit a trade-in"); return; }
    if (!productId) { toast.error("Select an item"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/trade-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          productId,
          condition,
          ageMonths: ageMonths ? Number(ageMonths) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
      toast.success(`Trade-in submitted — ${formatMoney(json.data.claimedCreditCents, "USD")} store credit pending inspection`);
      setProductId(""); setAgeMonths("");
      onSubmitted?.();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl bg-gradient-to-br from-teal via-teal-600 to-navy p-6 text-white"
      >
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-white/15 p-3">
            <Recycle className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">Re-Commerce Trade-In Portal</h2>
            <p className="mt-1 text-sm text-white/80">
              Give your pre-owned AceWears pieces a second life. Register items for trade-in
              and receive store credit after inspection. We resell, recycle, or upcycle every garment.
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs">
              <span className="rounded-full bg-white/15 px-2.5 py-1 font-medium">Up to 45% store credit</span>
              <span className="rounded-full bg-white/15 px-2.5 py-1 font-medium">Carbon-neutral pickup</span>
              <span className="rounded-full bg-white/15 px-2.5 py-1 font-medium">Same-day inspection</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-white p-4">
          <h3 className="text-base font-semibold text-navy">Register a trade-in</h3>

          <div className="space-y-1.5">
            <Label className="text-xs">Item</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger><SelectValue placeholder="Select your AceWears item..." /></SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title} · {formatMoney(p.basePriceCents, "USD")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Condition</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONDITIONS.map(c => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label} · {Math.round(c.multiplier * 100)}% credit
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Age (months)</Label>
            <Input type="number" min="0" max="120" value={ageMonths}
              onChange={(e) => setAgeMonths(e.target.value)}
              placeholder="e.g. 8" />
          </div>

          {/* Live estimate */}
          {selectedProduct && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-lg bg-amber/10 p-3 text-navy"
            >
              <p className="text-xs text-muted-foreground">Estimated store credit</p>
              <p className="text-2xl font-bold text-amber">
                {formatMoney(estimatedCreditCents, "USD")}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Final credit confirmed after inspection. Credit issued as store balance.
              </p>
            </motion.div>
          )}

          <Button type="submit" disabled={submitting} className="w-full bg-teal text-white hover:bg-teal-600">
            {submitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
            ) : (
              <>Submit for trade-in</>
            )}
          </Button>
        </form>

        {/* Existing trade-ins */}
        <div className="space-y-3 rounded-xl border border-border bg-white p-4">
          <h3 className="text-base font-semibold text-navy">Your trade-ins</h3>
          {existingItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <Recycle className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No trade-ins yet.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {existingItems.map(item => (
                <li key={item.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-navy">{item.product.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.condition} · {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      item.status === "APPROVED" || item.status === "CREDITED"
                        ? "bg-teal/10 text-teal"
                        : item.status === "REJECTED"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-amber/10 text-amber-700"
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-amber">
                    {formatMoney(item.claimedCreditCents, "USD")} credit
                  </p>
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-lg bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-xs text-navy">
              <AlertCircle className="h-3.5 w-3.5 text-amber" />
              <span>How the circular credit system works</span>
            </div>
            <ol className="mt-2 space-y-1 text-[11px] text-muted-foreground">
              <li><span className="font-bold text-navy">1.</span> Register your item above.</li>
              <li><span className="font-bold text-navy">2.</span> We schedule carbon-neutral pickup.</li>
              <li><span className="font-bold text-navy">3.</span> Inspection within 24h of arrival.</li>
              <li><span className="font-bold text-navy">4.</span> Credit issued to your AceWears balance.</li>
              <li><span className="font-bold text-navy">5.</span> Item is resold, recycled, or upcycled.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
