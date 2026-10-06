"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText, ChevronDown, Shield, CreditCard, Truck, Recycle, Crown,
  Lock, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const SECTIONS = [
  {
    id: "terms",
    title: "Terms of Service",
    icon: FileText,
    body: [
      { h: "1. Acceptance of Terms", p: "By accessing or using AceWears (the \"Service\"), you agree to be bound by these Terms of Service. If you do not agree, please discontinue use of the Service immediately. These terms constitute a legally binding agreement between you and AceWears Inc." },
      { h: "2. Account Registration", p: "You must provide accurate, complete, and current information at registration. You are responsible for safeguarding your password and for any activity conducted under your account. Notify us immediately of any unauthorized use." },
      { h: "3. Premium Membership", p: "Premium members ($14.99/month) unlock AI Virtual Try-On, unlimited size recommendations, and priority support. Premium subscriptions auto-renew until cancelled. Cancel anytime in Settings. Refunds for partial months are not issued." },
      { h: "4. Orders & Payment", p: "All orders are subject to availability and acceptance. We reserve the right to refuse or cancel any order. Prices are listed in USD unless otherwise specified. Payment is processed at checkout via your saved payment method." },
      { h: "5. Returns & Exchanges", p: "Unworn items with tags attached may be returned within 30 days of delivery for a full refund. Final-sale items, swimwear, and earrings cannot be returned. Use the Returns Center in your Account to generate a prepaid label." },
      { h: "6. AI Try-On", p: "AI Virtual Try-On renders are illustrative approximations based on your body profile and the product image. They are not photographic guarantees of fit or appearance. AceWears is not liable for purchase decisions based on try-on renders." },
      { h: "7. Trade-In Program", p: "Trade-in credit is issued after physical inspection of the registered item. We reserve the right to adjust the claimed credit based on actual condition. Credit is non-transferable and has no cash value." },
      { h: "8. Prohibited Conduct", p: "You may not use the Service to: (a) upload others' photos without consent, (b) attempt to reverse-engineer the AI models, (c) resell try-on renders, (d) abuse the trade-in program with counterfeit items, or (e) scrape product data." },
      { h: "9. Limitation of Liability", p: "AceWears is provided \"as is\" without warranties of any kind. We are not liable for indirect, incidental, or consequential damages arising from use of the Service. Our total liability shall not exceed the amount you paid in the preceding 12 months." },
      { h: "10. Changes to Terms", p: "We may update these Terms at any time. Material changes will be notified via email 30 days before taking effect. Continued use after the effective date constitutes acceptance." },
    ],
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    icon: Shield,
    body: [
      { h: "1. Information We Collect", p: "We collect: (a) account info (name, email, phone), (b) body profile data (skin tone, hair, measurements, face photo) for premium AI try-on, (c) order history, (d) wishlist and cart contents, (e) browsing data via cookies." },
      { h: "2. How We Use Your Data", p: "Your data is used to: process orders, render AI try-ons (only for you, never shared), personalize recommendations, send order updates, and prevent fraud. We never sell your personal data." },
      { h: "3. Body Profile & Photos", p: "Your face/body photos are stored encrypted and used solely to render try-on visualizations for your account. You can delete your body profile at any time in AI Studio, which permanently removes all photos and extracted attributes." },
      { h: "4. Public Wishlists", p: "All AceWears wishlists are public by default. Your name and profile photo (if set) are visible on the Discover page. You can make your wishlist private in Settings, but it will no longer appear in Discover." },
      { h: "5. Cookies & Tracking", p: "We use essential cookies for cart/auth state, analytics cookies for product improvement, and marketing cookies (with consent) for retargeting. Manage preferences in Settings → Privacy." },
      { h: "6. Data Retention", p: "Account data is retained while your account is active. Body profile photos are deleted 90 days after your last try-on render unless you save a new one. Inactive accounts (24 months) are deleted." },
      { h: "7. Your Rights (GDPR/CCPA)", p: "You have the right to: access your data, export it (Account → Export), delete it (Account → Delete account), object to processing, and lodge a complaint with your local data authority." },
      { h: "8. Security", p: "We use TLS 1.3 in transit, AES-256 at rest, and PCI-DSS compliant payment processors. Body profile photos are stored in an isolated encrypted bucket with per-user keys." },
    ],
  },
  {
    id: "returns",
    title: "Return Policy",
    icon: Truck,
    body: [
      { h: "1. 30-Day Return Window", p: "Unworn items with original tags may be returned within 30 days of delivery for a full refund. The 30-day clock starts on the delivery date shown in your order tracking." },
      { h: "2. Non-Returnable Items", p: "The following cannot be returned for hygiene or customization reasons: earrings and other pierced jewelry, swimwear bottoms, final-sale items (marked with a red tag), monogrammed or altered items, and digital gift cards." },
      { h: "3. How to Return", p: "Go to Account → Orders, select the item, and click \"Start Return\". We'll email a prepaid shipping label (deducted from your refund). Drop the package at any carrier location." },
      { h: "4. Refund Processing", p: "Refunds are issued to the original payment method within 5-7 business days of us receiving the return. You'll get an email confirmation when the refund is processed." },
      { h: "5. Exchanges", p: "Free exchanges for size/color within 30 days. Start an exchange the same way as a return, but select \"Exchange\" and pick the new variant. We'll ship the new item when we receive the original." },
      { h: "6. Damaged or Wrong Items", p: "If your order arrives damaged or you received the wrong item, contact support within 7 days with photos. We'll send a replacement immediately and arrange free return of the incorrect item." },
    ],
  },
  {
    id: "tradein",
    title: "Trade-In Terms",
    icon: Recycle,
    body: [
      { h: "1. Eligible Items", p: "Only genuine AceWears items are eligible for trade-in. We verify authenticity via the care tag QR code (items shipped after Jan 2024) or manual inspection." },
      { h: "2. Condition Grading", p: "Items are graded on receipt: NEW (unworn, tags attached, 45% credit), LIKE_NEW (worn once, no flaws, 35%), GOOD (light wear, no stains/tears, 25%), WORN (visible wear, functional, 15%)." },
      { h: "3. Credit Issuance", p: "Trade-in credit is issued to your AceWears balance within 24 hours of inspection. Credit is non-transferable, has no cash value, and does not expire." },
      { h: "4. Rejection", p: "Items may be rejected if: counterfeit, heavily damaged beyond WORN grade, modified/altered, or not AceWears-branded. Rejected items are returned at our expense." },
      { h: "5. Carbon-Neutral Pickup", p: "All trade-in pickups are carbon-offset via our partnership with Climeworks. You'll receive a carbon-impact receipt with your credit." },
    ],
  },
];

export function TermsSection() {
  const [openId, setOpenId] = useState<string>("terms");

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-navy">
          <FileText className="h-6 w-6 text-amber" /> Terms & Privacy
        </h1>
        <p className="text-xs text-muted-foreground">Legal agreements and policies for AceWears</p>
      </div>

      {/* Quick nav chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const active = openId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setOpenId(s.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                active ? "bg-navy text-white" : "bg-muted text-navy hover:bg-muted/70"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {s.title}
            </button>
          );
        })}
      </div>

      {/* Active section */}
      {SECTIONS.filter(s => s.id === openId).map((section) => {
        const Icon = section.icon;
        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-white p-5"
          >
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-navy">
              <Icon className="h-5 w-5 text-amber" />
              {section.title}
            </h2>
            <div className="space-y-4">
              {section.body.map((item, i) => (
                <div key={i}>
                  <h3 className="text-sm font-semibold text-navy">{item.h}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.p}</p>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}

      {/* Contact info */}
      <div className="mt-4 rounded-xl border border-amber/30 bg-amber/5 p-4 text-sm">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
          <div>
            <p className="font-medium text-navy">Questions about these terms?</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Email <a href="mailto:legal@acewears.com" className="text-amber underline">legal@acewears.com</a> and we'll respond within 2 business days. For privacy requests (GDPR/CCPA), email <a href="mailto:privacy@acewears.com" className="text-amber underline">privacy@acewears.com</a>.
            </p>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Last updated: September 2026 · AceWears Inc. · 123 Madison Ave, NY 10016
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
