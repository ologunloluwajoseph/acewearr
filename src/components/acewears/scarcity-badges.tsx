"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Clock, Sparkles } from "lucide-react";
import { formatMoney } from "@/lib/utils";

/**
 * Scarcity + Countdown components
 */

export function ScarcityBadge({ label, kind = "SCARCITY" }: { label: string; kind?: string }) {
  if (kind === "COUNTDOWN") return null;
  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-flex items-center gap-1 rounded-full bg-amber/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700"
    >
      <Flame className="h-3 w-3" />
      {label}
    </motion.span>
  );
}

export function CountdownTimer({ endsAt, label = "Deal ends in" }: { endsAt: string | number | Date; label?: string }) {
  const target = new Date(endsAt).getTime();
  const [remaining, setRemaining] = useState(target - Date.now());

  useEffect(() => {
    const id = setInterval(() => setRemaining(target - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (remaining <= 0) return null;

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-2 rounded-lg border border-amber/30 bg-amber/5 px-3 py-1.5"
    >
      <Clock className="h-3.5 w-3.5 text-amber" />
      <span className="text-xs font-medium text-navy">{label}</span>
      <span className="font-mono text-sm font-bold text-navy tabular-nums">
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    </motion.div>
  );
}

/** Slide-out quick cart drawer trigger with free shipping progress */
export function FreeShippingBar({ subtotalCents, thresholdCents }: { subtotalCents: number; thresholdCents: number }) {
  const remaining = Math.max(0, thresholdCents - subtotalCents);
  const pct = Math.min(100, (subtotalCents / thresholdCents) * 100);

  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
      {remaining > 0 ? (
        <p className="text-xs text-navy">
          Add <span className="font-bold text-amber">{formatMoney(remaining, "USD")}</span> for free shipping
        </p>
      ) : (
        <p className="flex items-center gap-1 text-xs font-medium text-teal">
          <Sparkles className="h-3 w-3" /> Free shipping unlocked!
        </p>
      )}
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-amber to-amber-400"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
