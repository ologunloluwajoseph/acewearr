"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Crown, Sparkles, Wand2, Heart, Check, Loader2, Zap, Star, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore, useIsPremium } from "@/lib/stores/auth-store";
import { toast } from "sonner";

const PACKAGES = [
  {
    id: "monthly",
    name: "Monthly",
    price: "$14.99",
    period: "/month",
    description: "Perfect for trying out premium features",
    features: [
      "Unlimited AI Virtual Try-Ons",
      "All product categories (clothes, shoes, jewelry, wigs)",
      "AI Size & Fit Assistant",
      "Priority customer support",
      "Cancel anytime",
    ],
    accent: "amber",
    popular: false,
  },
  {
    id: "quarterly",
    name: "Quarterly",
    price: "$39.99",
    period: "/3 months",
    originalPrice: "$44.97",
    description: "Save 11% — best for seasonal shoppers",
    features: [
      "Everything in Monthly",
      "11% savings vs monthly",
      "Exclusive seasonal drops preview",
      "Free express shipping",
      "Early access to AceReels",
    ],
    accent: "amber",
    popular: true,
  },
  {
    id: "annual",
    name: "Annual",
    price: "$139.99",
    period: "/year",
    originalPrice: "$179.88",
    description: "Save 22% — best value for loyal customers",
    features: [
      "Everything in Quarterly",
      "22% savings vs monthly",
      "Exclusive annual member gift",
      "Free trade-in pickup (carbon-neutral)",
      "VIP concierge styling session",
    ],
    accent: "amber",
    popular: false,
  },
];

export function PremiumActivationSection() {
  const user = useAuthStore((s) => s.user);
  const isPremium = useIsPremium();
  const upgradeToPremium = useAuthStore((s) => s.upgradeToPremium);
  const [activating, setActivating] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string>("quarterly");

  const handleActivate = async (packageId: string) => {
    if (!user) {
      toast.error("Sign in to activate premium");
      return;
    }
    setActivating(packageId);
    try {
      // Paystack premium subscription checkout
      const res = await fetch("/api/checkout/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, package: packageId }),
      });
      const j = await res.json();
      if (j.ok) {
        // In production: j.data.authorizationUrl would redirect to Paystack
        // In demo: j.data.activated = true (instant)
        if (j.data.authorizationUrl) {
          window.location.href = j.data.authorizationUrl;
        } else {
          upgradeToPremium();
          toast.success(j.data.message || "Premium activated!");
        }
      } else throw new Error(j.error || "Activation failed");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActivating(null);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <Crown className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h2 className="text-xl font-bold text-navy">Sign in to activate premium</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Unlock AI Virtual Try-On, priority support, and exclusive drops.
        </p>
      </div>
    );
  }

  if (isPremium) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-amber/15"
          >
            <Crown className="h-10 w-10 text-amber" />
          </motion.div>
          <h1 className="text-2xl font-bold text-navy">Premium Active</h1>
          <p className="text-sm text-muted-foreground">You're enjoying all premium benefits</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { icon: Wand2, title: "AI Virtual Try-On", desc: "Unlimited renders for all product types" },
            { icon: Sparkles, title: "AI Size Assistant", desc: "Personalized fit recommendations" },
            { icon: Heart, title: "Premium Wishlist Try-On", desc: "Render items directly from your wishlist" },
            { icon: Zap, title: "Priority Support", desc: "24h response time on all inquiries" },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 rounded-xl border border-border bg-white p-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber/10 text-amber">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-navy">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
              <Check className="ml-auto h-4 w-4 text-teal" />
            </motion.div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Button onClick={() => toast.info("Manage your subscription in Settings")} variant="outline">
            Manage subscription
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy-700 to-teal p-6 text-center text-white sm:p-8"
      >
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-amber/20">
          <Crown className="h-8 w-8 text-amber" />
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">Activate AceWears Premium</h1>
        <p className="mt-2 text-sm text-white/80">
          See how every garment looks on <strong>you</strong>. Unlimited AI Virtual Try-Ons,
          priority support, and exclusive member benefits.
        </p>
      </motion.div>

      {/* Package selector */}
      <div className="mb-6 flex justify-center gap-2">
        {PACKAGES.map((pkg) => (
          <button
            key={pkg.id}
            onClick={() => setSelectedPackage(pkg.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              selectedPackage === pkg.id
                ? "bg-navy text-white"
                : "bg-muted text-navy hover:bg-muted/70"
            }`}
          >
            {pkg.name}
          </button>
        ))}
      </div>

      {/* Selected package detail */}
      {PACKAGES.filter(p => p.id === selectedPackage).map((pkg) => (
        <motion.div
          key={pkg.id}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 overflow-hidden rounded-2xl border-2 border-amber bg-white shadow-lg"
        >
          {pkg.popular && (
            <div className="bg-amber py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-navy">
              Most Popular
            </div>
          )}
          <div className="p-6">
            <div className="flex items-baseline justify-between">
              <div>
                <h3 className="text-lg font-bold text-navy">{pkg.name}</h3>
                <p className="text-xs text-muted-foreground">{pkg.description}</p>
              </div>
              <div className="text-right">
                {pkg.originalPrice && (
                  <p className="text-xs text-muted-foreground line-through">{pkg.originalPrice}</p>
                )}
                <p className="text-2xl font-bold text-amber">{pkg.price}</p>
                <p className="text-[10px] text-muted-foreground">{pkg.period}</p>
              </div>
            </div>

            <ul className="mt-4 space-y-2">
              {pkg.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-navy">
                  <Check className="h-4 w-4 shrink-0 text-teal" />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              onClick={() => handleActivate(pkg.id)}
              disabled={activating === pkg.id}
              className="mt-4 w-full bg-amber text-navy hover:bg-amber-400"
              size="lg"
            >
              {activating === pkg.id ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Activating...</>
              ) : (
                <><Crown className="mr-2 h-4 w-4" /> Activate {pkg.name} — {pkg.price}</>
              )}
            </Button>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              Demo mode: instant activation. Production: Paystack payment → premium unlock.
            </p>
          </div>
        </motion.div>
      ))}

      {/* Feature comparison */}
      <div className="rounded-xl border border-border bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-navy">What you get with Premium</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { icon: Wand2, title: "AI Virtual Try-On", desc: "Photorealistic renders of clothes, shoes, jewelry, and wigs on your body using VLM + image generation. Category-adaptive framing for each product type." },
            { icon: Sparkles, title: "AI Size & Fit", desc: "BMI-based anthropometric estimate + size-chart deviation scoring. Reduce return rate by 40%+." },
            { icon: Heart, title: "Wishlist Try-On", desc: "Render any wishlist item directly from the wishlist page — no need to open the PDP first." },
            { icon: Shield, title: "Priority Support", desc: "24-hour response time on all inquiries. Dedicated support channel for premium members." },
            { icon: Zap, title: "Early Access", desc: "Preview seasonal drops 48 hours before public launch. Reserve limited-stock items." },
            { icon: Star, title: "Exclusive Content", desc: "Behind-the-scenes AceReels, styling guides, and member-only lookbooks." },
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber/10 text-amber">
                <f.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-navy">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-4 rounded-xl border border-border bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-navy">Frequently asked questions</h3>
        <div className="space-y-3 text-xs">
          <div>
            <p className="font-medium text-navy">Can I cancel anytime?</p>
            <p className="mt-0.5 text-muted-foreground">Yes. Cancel from Settings → Subscription. You keep premium until the end of your billing period.</p>
          </div>
          <div>
            <p className="font-medium text-navy">How does AI Try-On work?</p>
            <p className="mt-0.5 text-muted-foreground">Upload a face photo, set your skin tone, hair, and body metrics. Our VLM analyzes your photo, then image-gen renders how each product looks on you.</p>
          </div>
          <div>
            <p className="font-medium text-navy">Do I need premium to buy on credit?</p>
            <p className="mt-0.5 text-muted-foreground">No. Buy on Credit is available to all users. Premium only gates the AI Try-On feature.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
