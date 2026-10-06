"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Phone, Lock, Ruler, Crown, Loader2, Check, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/stores/auth-store";
import { CURRENCIES, LANGUAGES } from "@/lib/currency";
import { toast } from "sonner";

export function AccountDetailsSection() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [saving, setSaving] = useState(false);

  // Editable form state (seeded from auth store)
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [heightCm, setHeightCm] = useState(user?.heightCm?.toString() || "");
  const [weightKg, setWeightKg] = useState(user?.weightKg?.toString() || "");
  const [fitPreference, setFitPreference] = useState(user?.fitPreference || "REGULAR");
  const [preferredCurrency, setPreferredCurrency] = useState(user?.preferredCurrency || "USD");
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferredLanguage || "en");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <User className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h2 className="text-xl font-bold text-navy">Sign in to manage your account</h2>
        <p className="mt-1 text-sm text-muted-foreground">Update profile, password, and body metrics.</p>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      // In production this would call /api/me/update
      setUser({
        ...user,
        name,
        email,
        heightCm: heightCm ? Number(heightCm) : undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
        fitPreference: fitPreference as any,
        preferredCurrency,
        preferredLanguage,
      });
      await new Promise((r) => setTimeout(r, 500));
      toast.success("Account details saved");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword) {
      toast.error("Enter current and new password");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    toast.success("Password updated");
    setCurrentPassword("");
    setNewPassword("");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-navy">
          <User className="h-6 w-6 text-amber" /> Account Details
        </h1>
        <p className="text-xs text-muted-foreground">Manage your profile, password, and body metrics</p>
      </div>

      {/* Profile card */}
      <div className="mb-4 rounded-xl border border-border bg-white p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="rounded-full bg-navy p-3 text-white">
            <User className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-navy">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          {user.isPremium && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber">
              <Crown className="h-2.5 w-2.5" /> Premium
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Full name" icon={<User className="h-3.5 w-3.5" />}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </Field>
          <Field label="Email" icon={<Mail className="h-3.5 w-3.5" />}>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </Field>
          <Field label="Phone" icon={<Phone className="h-3.5 w-3.5" />}>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" />
          </Field>
          <Field label="Fit preference">
            <select
              value={fitPreference}
              onChange={(e) => setFitPreference(e.target.value as any)}
              className="h-9 w-full rounded-md border border-border bg-white px-2 text-sm"
            >
              <option value="SLIM">Slim</option>
              <option value="REGULAR">Regular</option>
              <option value="RELAXED">Relaxed</option>
            </select>
          </Field>
        </div>

        {/* Currency + Language — chosen at signup, editable here */}
        <div className="mt-3 grid grid-cols-1 gap-3 border-t border-border pt-3 sm:grid-cols-2">
          <Field label="Preferred currency">
            <select
              value={preferredCurrency}
              onChange={(e) => setPreferredCurrency(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-white px-2 text-sm"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Preferred language">
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-white px-2 text-sm"
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.flag} {l.native} ({l.name})</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* Body metrics */}
      <div className="mb-4 rounded-xl border border-border bg-white p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy">
          <Ruler className="h-4 w-4 text-amber" /> Body metrics
        </h3>
        <p className="mb-3 text-xs text-muted-foreground">Used by the AI Size Assistant for fit recommendations.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Height (cm)">
            <Input type="number" min="120" max="230" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="180" />
          </Field>
          <Field label="Weight (kg)">
            <Input type="number" min="35" max="200" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="78" />
          </Field>
        </div>
      </div>

      {/* Password */}
      <div className="mb-4 rounded-xl border border-border bg-white p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy">
          <Lock className="h-4 w-4 text-amber" /> Change password
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Current password">
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
          </Field>
          <Field label="New password">
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" />
          </Field>
        </div>
        <Button variant="outline" size="sm" className="mt-3" onClick={handleChangePassword}>
          Update password
        </Button>
      </div>

      {/* Security */}
      <div className="mb-6 rounded-xl border border-border bg-white p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy">
          <Shield className="h-4 w-4 text-amber" /> Security
        </h3>
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Two-factor authentication</span>
            <Button variant="ghost" size="sm" onClick={() => toast.info("2FA setup coming soon")}>Enable</Button>
          </div>
          <div className="flex items-center justify-between">
            <span>Active sessions</span>
            <Button variant="ghost" size="sm" onClick={() => toast.info("1 active session")}>View</Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-navy text-white hover:bg-navy-700">
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Check className="mr-2 h-4 w-4" /> Save changes</>}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1 text-xs text-navy">
        {icon}
        {label}
      </Label>
      {children}
    </div>
  );
}
