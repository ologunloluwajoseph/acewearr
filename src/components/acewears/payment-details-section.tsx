"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, Plus, Lock, Trash2, Check, MapPin, Recycle, Crown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "sonner";
import { formatMoney } from "@/lib/utils";

// Demo saved cards (in production these would be tokens from Stripe)
const DEMO_CARDS = [
  { id: "1", brand: "Visa", last4: "4242", expMonth: 12, expYear: 2028, isDefault: true },
  { id: "2", brand: "Mastercard", last4: "5555", expMonth: 3, expYear: 2027, isDefault: false },
];

export function PaymentDetailsSection() {
  const user = useAuthStore((s) => s.user);
  const [cards, setCards] = useState(DEMO_CARDS);
  const [showAddCard, setShowAddCard] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tradeInBalanceCents, setTradeInBalanceCents] = useState(4900); // demo balance

  // Billing address form
  const [line1, setLine1] = useState("123 Madison Ave");
  const [city, setCity] = useState("New York");
  const [stateVal, setStateVal] = useState("NY");
  const [postal, setPostal] = useState("10016");
  const [country, setCountry] = useState("United States");

  // New card form
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newCardName, setNewCardName] = useState("");
  const [newCardExp, setNewCardExp] = useState("");
  const [newCardCvc, setNewCardCvc] = useState("");

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <CreditCard className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h2 className="text-xl font-bold text-navy">Sign in to manage payment</h2>
        <p className="mt-1 text-sm text-muted-foreground">Saved cards, billing address, and trade-in credit.</p>
      </div>
    );
  }

  const handleAddCard = () => {
    if (!newCardNumber || !newCardName || !newCardExp || !newCardCvc) {
      toast.error("Please complete all card fields");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      const last4 = newCardNumber.replace(/\s/g, "").slice(-4);
      setCards([...cards, {
        id: Date.now().toString(),
        brand: "Visa",
        last4,
        expMonth: 12,
        expYear: 2029,
        isDefault: cards.length === 0,
      }]);
      setNewCardNumber(""); setNewCardName(""); setNewCardExp(""); setNewCardCvc("");
      setShowAddCard(false);
      setSaving(false);
      toast.success("Card added successfully");
    }, 600);
  };

  const handleRemoveCard = (id: string) => {
    setCards(cards.filter(c => c.id !== id));
    toast.success("Card removed");
  };

  const handleSetDefault = (id: string) => {
    setCards(cards.map(c => ({ ...c, isDefault: c.id === id })));
    toast.success("Default card updated");
  };

  const handleSaveBilling = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); toast.success("Billing address saved"); }, 500);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-navy">
          <CreditCard className="h-6 w-6 text-amber" /> Payment & Payouts
        </h1>
        <p className="text-xs text-muted-foreground">Saved cards, billing address, and trade-in credit balance</p>
      </div>

      {/* Trade-in credit balance */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy-700 to-teal p-5 text-white"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-white/70">
              <Recycle className="h-3.5 w-3.5" /> Trade-in credit balance
            </p>
            <p className="mt-1 text-4xl font-bold text-amber">{formatMoney(tradeInBalanceCents, "USD")}</p>
            <p className="mt-1 text-xs text-white/60">Applies automatically at checkout · No expiry · Non-transferable</p>
          </div>
          <Crown className="h-8 w-8 text-amber/40" />
        </div>
      </motion.div>

      {/* Saved cards */}
      <div className="mb-4 rounded-xl border border-border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
            <CreditCard className="h-4 w-4 text-amber" /> Saved cards
          </h3>
          <Button size="sm" variant="outline" onClick={() => setShowAddCard(!showAddCard)}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add card
          </Button>
        </div>

        {/* Add card form */}
        {showAddCard && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-3 overflow-hidden rounded-lg border border-border bg-muted/30 p-3"
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs">Card number</Label>
                <Input value={newCardNumber} onChange={(e) => setNewCardNumber(e.target.value)} placeholder="4242 4242 4242 4242" />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs">Name on card</Label>
                <Input value={newCardName} onChange={(e) => setNewCardName(e.target.value)} placeholder="JANE DOE" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Expiry (MM/YY)</Label>
                <Input value={newCardExp} onChange={(e) => setNewCardExp(e.target.value)} placeholder="12/28" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">CVC</Label>
                <Input type="password" value={newCardCvc} onChange={(e) => setNewCardCvc(e.target.value)} placeholder="123" maxLength={4} />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowAddCard(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAddCard} disabled={saving} className="bg-navy text-white hover:bg-navy-700">
                {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
                Save card
              </Button>
            </div>
            <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
              <Lock className="h-2.5 w-2.5" /> Encrypted with bank-grade AES-256 · We never store CVC.
            </p>
          </motion.div>
        )}

        {/* Cards list */}
        <ul className="space-y-2">
          {cards.length === 0 ? (
            <li className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              No saved cards. Add one to checkout faster.
            </li>
          ) : cards.map((card) => (
            <li key={card.id} className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-3">
              <div className="flex h-8 w-12 items-center justify-center rounded bg-navy text-[9px] font-bold uppercase text-white">
                {card.brand.slice(0, 4)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-navy">•••• •••• •••• {card.last4}</p>
                <p className="text-xs text-muted-foreground">Expires {String(card.expMonth).padStart(2, "0")}/{String(card.expYear).slice(-2)}</p>
              </div>
              {card.isDefault && (
                <span className="rounded-full bg-amber/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber">
                  Default
                </span>
              )}
              {!card.isDefault && (
                <Button size="sm" variant="ghost" onClick={() => handleSetDefault(card.id)} className="h-7 text-[10px]">
                  Set default
                </Button>
              )}
              <Button size="icon" variant="ghost" onClick={() => handleRemoveCard(card.id)} className="h-7 w-7 text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      </div>

      {/* Billing address */}
      <div className="mb-4 rounded-xl border border-border bg-white p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy">
          <MapPin className="h-4 w-4 text-amber" /> Billing address
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1">
            <Label className="text-xs">Address line 1</Label>
            <Input value={line1} onChange={(e) => setLine1(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">City</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">State / Province</Label>
            <Input value={stateVal} onChange={(e) => setStateVal(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Postal code</Label>
            <Input value={postal} onChange={(e) => setPostal(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Country</Label>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button size="sm" onClick={handleSaveBilling} disabled={saving} className="bg-navy text-white hover:bg-navy-700">
            {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
            Save address
          </Button>
        </div>
      </div>

      {/* Payout method (for trade-in credit, if user is also a seller/trader) */}
      <div className="rounded-xl border border-border bg-white p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy">
          <Recycle className="h-4 w-4 text-amber" /> Payout method
        </h3>
        <p className="mb-3 text-xs text-muted-foreground">Where trade-in credit is deposited (in addition to your AceWears balance).</p>
        <div className="space-y-2">
          <label className="flex items-center gap-3 rounded-lg border border-amber/30 bg-amber/5 p-3">
            <input type="radio" name="payout" defaultChecked className="accent-amber" />
            <div className="flex-1">
              <p className="text-sm font-medium text-navy">AceWears store credit</p>
              <p className="text-xs text-muted-foreground">Instant · No fees · Use at checkout</p>
            </div>
            <span className="rounded-full bg-amber px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-navy">Recommended</span>
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-border p-3">
            <input type="radio" name="payout" className="accent-amber" />
            <div className="flex-1">
              <p className="text-sm font-medium text-navy">Bank transfer (ACH)</p>
              <p className="text-xs text-muted-foreground">3-5 business days · Min payout $25</p>
            </div>
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-border p-3">
            <input type="radio" name="payout" className="accent-amber" />
            <div className="flex-1">
              <p className="text-sm font-medium text-navy">PayPal</p>
              <p className="text-xs text-muted-foreground">Instant · 2.9% + $0.30 fee</p>
            </div>
          </label>
        </div>
      </div>

      <p className="mt-4 flex items-center justify-center gap-1 text-center text-[10px] text-muted-foreground">
        <Lock className="h-2.5 w-2.5" /> All payment data is PCI-DSS compliant and encrypted at rest.
      </p>
    </div>
  );
}
