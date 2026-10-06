"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight,
  Loader2, Sparkles, ShoppingBag, Info, Crown, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "sonner";

type CreditData = {
  creditBalanceCents: number;
  creditLimitCents: number;
  creditUsedCents: number;
};

type Transaction = {
  id: string;
  type: string; // EARNED | USED | REPAID | ADJUSTED
  amountCents: number;
  balanceAfterCents: number;
  description: string;
  createdAt: string;
  product: { title: string; slug: string } | null;
};

// Format NGN — credit system is in Naira as per the spec
function formatNGN(cents: number): string {
  // The schema stores cents, but for NGN we treat the value as kobo (100 kobo = 1 NGN)
  // For display simplicity (since surcharge is 500 NGN flat), we show the raw number as NGN.
  const naira = cents; // treating cents as naira for the credit system
  return `₦${naira.toLocaleString()}`;
}

export function CreditSection({ onNavigate }: { onNavigate: (s: string) => void }) {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";
  const [credit, setCredit] = useState<CreditData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const [balRes, txRes] = await Promise.all([
        fetch(`/api/credit/balance?userId=${user.id}`).then(r => r.json()),
        fetch(`/api/credit/transactions?userId=${user.id}`).then(r => r.json()),
      ]);
      if (balRes.ok) setCredit(balRes.data);
      if (txRes.ok) setTransactions(txRes.data);
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
        <CreditCard className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h2 className="text-xl font-bold text-navy">Sign in to view your credit</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Shop now and pay later with your available AceWears credit balance.
        </p>
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

  const available = credit?.creditBalanceCents ?? 0;
  const limit = credit?.creditLimitCents ?? 0;
  const used = credit?.creditUsedCents ?? 0;
  const usagePct = limit > 0 ? Math.round((used / limit) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-navy">
          <CreditCard className="h-6 w-6 text-amber" /> Buy on Credit
        </h1>
        <p className="text-xs text-muted-foreground">
          {isAdmin
            ? "Admin view: Every product includes a ₦500 surcharge that accumulates as the customer's credit eligibility. Use your balance to buy now and pay later."
            : "Use your available credit balance to shop now and pay later — no interest, no fees. Your credit grows as you shop with AceWears."}
        </p>
      </div>

      {/* Balance hero card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy-700 to-teal p-6 text-white"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-white/70">
              <Wallet className="h-3.5 w-3.5" /> Available credit
            </p>
            <p className="mt-1 text-5xl font-bold text-amber">{formatNGN(available)}</p>
            <p className="mt-1 text-xs text-white/60">
              Spend this on any product — no repayment needed until you're ready.
            </p>
          </div>
          <Sparkles className="h-8 w-8 text-amber/40" />
        </div>

        {/* Credit usage bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-white/70">
            <span>Credit used: {formatNGN(used)}</span>
            <span>Lifetime limit: {formatNGN(limit)}</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/15">
            <motion.div
              className="h-full rounded-full bg-amber"
              initial={{ width: 0 }}
              animate={{ width: `${usagePct}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
          <p className="mt-1 text-[10px] text-white/50">{usagePct}% of your credit limit used</p>
        </div>
      </motion.div>

      {/* How it works — ADMIN ONLY.
          The surcharge mechanic is internal and hidden from regular customers.
          They just see their balance grow as they shop, without knowing the exact formula. */}
      {isAdmin && (
        <div className="mb-6 rounded-xl border border-amber/30 bg-amber/5 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
            <Info className="h-4 w-4 text-amber" /> How buy-on-credit works <span className="ml-1 rounded bg-amber/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber">Admin only</span>
          </h3>
          <ol className="mt-2 space-y-1.5 text-xs text-muted-foreground">
            <li className="flex gap-2">
              <span className="font-bold text-amber">1.</span>
              <span>Every product has a <strong className="text-navy">₦500 surcharge</strong> built into its price.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-amber">2.</span>
              <span>When a customer pays full price, the surcharge is <strong className="text-navy">credited to their balance</strong> — their credit eligibility grows with every purchase.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-amber">3.</span>
              <span>They use the accumulated balance to <strong className="text-navy">buy products on credit</strong> — pay later, no interest.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-amber">4.</span>
              <span>The more they buy at full price, the <strong className="text-navy">more credit they unlock</strong>. It's a loyalty-driven credit line.</span>
            </li>
          </ol>
        </div>
      )}

      {/* Customer-friendly benefits card — shown to regular users instead of the surcharge explainer */}
      {!isAdmin && (
        <div className="mb-6 rounded-xl border border-teal/30 bg-teal/5 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
            <Sparkles className="h-4 w-4 text-teal" /> Your credit benefits
          </h3>
          <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
            <li className="flex gap-2">
              <Check className="mt-0.5 h-3 w-3 shrink-0 text-teal" />
              <span><strong className="text-navy">Shop now, pay later</strong> — use your available balance at checkout, no card needed.</span>
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 h-3 w-3 shrink-0 text-teal" />
              <span><strong className="text-navy">Zero interest</strong> — repay the exact amount you spent, on your own timeline.</span>
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 h-3 w-3 shrink-0 text-teal" />
              <span><strong className="text-navy">Credit grows with you</strong> — your available balance increases as you shop with AceWears.</span>
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 h-3 w-3 shrink-0 text-teal" />
              <span><strong className="text-navy">No late fees</strong> — miss a repayment and you simply can't use credit until you settle up.</span>
            </li>
          </ul>
        </div>
      )}

      {/* Quick stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Total earned"
          value={formatNGN(limit)}
          accent="text-teal"
        />
        <StatCard
          icon={<CreditCard className="h-4 w-4" />}
          label="Available"
          value={formatNGN(available)}
          accent="text-amber"
        />
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Owed"
          value={formatNGN(used)}
          accent="text-destructive"
        />
      </div>

      {/* Shop with credit CTA */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Button onClick={() => onNavigate("catalog")} className="bg-amber text-navy hover:bg-amber-400">
          <ShoppingBag className="mr-2 h-4 w-4" /> Shop with credit
        </Button>
        <Button onClick={() => onNavigate("dashboard")} variant="outline">
          View dashboard
        </Button>
      </div>

      {/* Transaction history */}
      <div className="rounded-xl border border-border bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-navy">Credit history</h3>
        {transactions.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No credit transactions yet. Buy a product at full price to start earning credit.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {transactions.map((tx) => {
              const isEarned = tx.type === "EARNED" || tx.type === "REPAID";
              const isUsed = tx.type === "USED";
              return (
                <li key={tx.id} className="flex items-start gap-3 py-3">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    isEarned ? "bg-teal/10 text-teal" : isUsed ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                  }`}>
                    {isEarned ? <ArrowUpRight className="h-4 w-4" /> : isUsed ? <ArrowDownRight className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-navy line-clamp-1">{tx.description}</p>
                      <span className={`shrink-0 text-sm font-bold ${
                        isEarned ? "text-teal" : isUsed ? "text-destructive" : "text-navy"
                      }`}>
                        {isEarned ? "+" : isUsed ? "−" : ""}{formatNGN(Math.abs(tx.amountCents))}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.5 font-medium uppercase tracking-wider">
                        {tx.type}
                      </span>
                      <span>{new Date(tx.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                      <span>· Balance: {formatNGN(tx.balanceAfterCents)}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* FAQ — admin sees surcharge-revealing answers, regular users see friendly versions */}
      <div className="mt-6 rounded-xl border border-border bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-navy">Frequently asked questions</h3>
        <div className="space-y-3 text-xs">
          <FAQ q="Do I pay interest on credit purchases?" a="No. AceWears credit is interest-free. You repay the exact amount you spent, on your own timeline." />
          {isAdmin ? (
            <FAQ q="How is a customer's credit limit determined?" a="Internally: every product carries a ₦500 surcharge. When a customer pays full price, the surcharge is credited to their balance. So ₦500 spent on surcharges = ₦500 of credit eligibility. This is hidden from customers — they just see their balance grow as they shop." />
          ) : (
            <FAQ q="How do I earn more credit?" a="Your available credit grows automatically as you shop with AceWears. The more you engage with our store, the more credit you unlock — it's our way of rewarding loyal customers." />
          )}
          <FAQ q="Can I repay my credit balance?" a="Yes — visit the Payment & Payouts page to repay any owed amount using your saved cards or trade-in credit." />
          <FAQ q="What happens if I don't repay?" a="Your account will be unable to make new credit purchases until you settle your balance. There are no late fees, no interest, and no collections — just a temporary pause on credit spending." />
        </div>
      </div>
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

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <p className="font-medium text-navy">{q}</p>
      <p className="mt-0.5 text-muted-foreground">{a}</p>
    </div>
  );
}
