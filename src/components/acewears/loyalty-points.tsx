"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Gift, Star, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "sonner";

// ============================================================================
//  Loyalty Points System
//  Users earn points for: purchases (10 pts per $1), reviews (50 pts),
//  referrals (200 pts), social shares (25 pts).
//  Points can be redeemed for: $5 off (500 pts), $10 off (1000 pts),
//  free shipping (200 pts), premium month (2000 pts).
// ============================================================================
export function LoyaltyPointsCard() {
  const user = useAuthStore((s) => s.user);
  const [points] = useState(0); // In production: fetched from DB
  const [redeeming, setRedeeming] = useState(false);

  const rewards = [
    { id: "shipping", label: "Free shipping", cost: 200, icon: "🚚" },
    { id: "5off", label: "$5 off next order", cost: 500, icon: "💵" },
    { id: "10off", label: "$10 off next order", cost: 1000, icon: "💰" },
    { id: "premium", label: "1 month Premium", cost: 2000, icon: "👑" },
  ];

  const handleRedeem = (reward: typeof rewards[0]) => {
    if (points < reward.cost) {
      toast.error(`You need ${reward.cost - points} more points`);
      return;
    }
    setRedeeming(true);
    setTimeout(() => {
      toast.success(`Redeemed: ${reward.label}!`);
      setRedeeming(false);
    }, 1000);
  };

  const tiers = [
    { name: "Bronze", min: 0, color: "#CD7F32", perks: ["Basic support"] },
    { name: "Silver", min: 500, color: "#C0C0C0", perks: ["Priority support", "5% off"] },
    { name: "Gold", min: 1500, color: "#FFD700", perks: ["VIP support", "10% off", "Early access"] },
    { name: "Platinum", min: 3000, color: "#E5E4E2", perks: ["Concierge", "15% off", "Exclusive drops"] },
  ];

  const currentTier = tiers.filter(t => points >= t.min).pop() || tiers[0];
  const nextTier = tiers.find(t => t.min > points);

  if (!user) return null;

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
          <Award className="h-4 w-4 text-amber" /> Loyalty Points
        </h3>
        <span className="text-2xl font-bold text-amber">{points.toLocaleString()}</span>
      </div>

      {/* Tier progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: currentTier.color }} className="font-bold">{currentTier.name}</span>
          {nextTier && <span className="text-muted-foreground">{nextTier.name} at {nextTier.min}</span>}
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full"
            style={{ background: currentTier.color }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (points / (nextTier?.min || points)) * 100)}%` }}
          />
        </div>
      </div>

      {/* Perks */}
      <div className="mb-3 flex flex-wrap gap-1">
        {currentTier.perks.map(perk => (
          <span key={perk} className="rounded-full bg-amber/10 px-2 py-0.5 text-[10px] font-medium text-amber">
            <Star className="mr-0.5 inline h-2 w-2" />{perk}
          </span>
        ))}
      </div>

      {/* Rewards */}
      <div className="grid grid-cols-2 gap-2">
        {rewards.map(reward => (
          <button
            key={reward.id}
            onClick={() => handleRedeem(reward)}
            disabled={points < reward.cost || redeeming}
            className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition ${
              points >= reward.cost ? "border-amber bg-amber/5 hover:bg-amber/10" : "border-border opacity-50"
            }`}
          >
            <span className="text-base">{reward.icon}</span>
            <div>
              <p className="font-medium text-navy">{reward.label}</p>
              <p className="text-[10px] text-muted-foreground">{reward.cost} pts</p>
            </div>
          </button>
        ))}
      </div>

      <p className="mt-3 text-[10px] text-center text-muted-foreground">
        Earn 10 pts per $1 spent · 50 pts per review · 25 pts per social share
      </p>
    </div>
  );
}
