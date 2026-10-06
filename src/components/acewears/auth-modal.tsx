"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Mail, Lock, User, Eye, EyeOff, Loader2, Sparkles,
  Facebook, Chrome, ArrowRight, Check, Crown, ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useGlobalSettings } from "@/lib/stores/settings-store";
import { CURRENCIES, LANGUAGES } from "@/lib/currency";
import { toast } from "sonner";

type Mode = "login" | "signup";

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setStoreCurrency = useGlobalSettings((s) => s.setCurrency);
  const setStoreLanguage = useGlobalSettings((s) => s.setLanguage);
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [preferredCurrency, setPreferredCurrency] = useState("NGN");
  const [preferredLanguage, setPreferredLanguage] = useState("en");

  const handleSignup = async () => {
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, preferredCurrency, preferredLanguage }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Signup failed");
      setUser(j.data.user, j.data.token);
      setStoreCurrency(j.data.user.preferredCurrency);
      setStoreLanguage(j.data.user.preferredLanguage);
      toast.success(`Welcome to AceWears, ${name}!`);
      onClose();
      // Reset form
      setName(""); setEmail(""); setPassword("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Login failed");
      setUser(j.data.user, j.data.token);
      setStoreCurrency(j.data.user.preferredCurrency);
      setStoreLanguage(j.data.user.preferredLanguage);
      toast.success(`Welcome back, ${j.data.user.name}!`);
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: "ADMIN" | "CUSTOMER") => {
    const signInAsDemo = useAuthStore.getState().signInAsDemo;
    signInAsDemo(role);
    toast.success(`Signed in as ${role === "ADMIN" ? "Admin" : "Verified Buyer"}`);
    onClose();
  };

  const handleSocialLogin = async (provider: "facebook" | "google") => {
    setSocialLoading(provider);
    try {
      // In production: redirect to OAuth provider → callback → verify token
      // Demo: simulate OAuth flow
      const fakeEmail = provider === "facebook" ? "user@facebook.com" : "user@gmail.com";
      const fakeName = provider === "facebook" ? "Facebook User" : "Google User";
      const fakeProviderId = `${provider}_${Date.now()}`;

      const res = await fetch("/api/auth/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          name: fakeName,
          email: fakeEmail,
          providerId: fakeProviderId,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "OAuth failed");
      setUser(j.data.user, j.data.token);
      toast.success(`Logged in with ${provider === "facebook" ? "Facebook" : "Google"}`);
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSocialLoading(null);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[90] flex items-center justify-center bg-navy/60 backdrop-blur-sm p-3"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-navy via-navy-700 to-teal p-6 text-center text-white">
            <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 rounded-full p-1.5 hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber/20">
              <ShoppingBag className="h-7 w-7 text-amber" />
            </div>
            <h2 className="text-xl font-bold">
              {mode === "login" ? "Welcome back" : "Join AceWears"}
            </h2>
            <p className="text-xs text-white/70">
              {mode === "login" ? "Sign in to your account to continue shopping" : "Create your account in seconds"}
            </p>
          </div>

          <div className="p-5">
            {/* Social login buttons */}
            <div className="space-y-2">
              <button
                onClick={() => handleSocialLogin("facebook")}
                disabled={!!socialLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1877F2] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {socialLoading === "facebook" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Facebook className="h-4 w-4" />
                )}
                Continue with Facebook
              </button>
              <button
                onClick={() => handleSocialLogin("google")}
                disabled={!!socialLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-muted disabled:opacity-50"
              >
                {socialLoading === "google" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Chrome className="h-4 w-4" />
                )}
                Continue with Google
              </button>
            </div>

            {/* Divider */}
            <div className="my-4 flex items-center gap-3">
              <div className="flex-1 border-t border-border" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">or</span>
              <div className="flex-1 border-t border-border" />
            </div>

            {/* Email/password form */}
            <div className="space-y-3">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="pl-10" />
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-10" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    onKeyDown={(e) => e.key === "Enter" && (mode === "login" ? handleLogin() : handleSignup())}
                  />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-navy">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Signup: currency + language selection */}
              {mode === "signup" && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Currency</Label>
                    <select value={preferredCurrency} onChange={(e) => setPreferredCurrency(e.target.value)} className="h-8 w-full rounded-md border border-border bg-white px-2 text-xs">
                      {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Language</Label>
                    <select value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value)} className="h-8 w-full rounded-md border border-border bg-white px-2 text-xs">
                      {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.native}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Submit button */}
            <Button
              onClick={mode === "login" ? handleLogin : handleSignup}
              disabled={loading}
              className="mt-4 w-full bg-amber text-navy hover:bg-amber-400"
              size="lg"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <>{mode === "login" ? "Sign in" : "Create account"} <ArrowRight className="ml-1 h-4 w-4" /></>
              )}
            </Button>

            {/* Toggle login/signup */}
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="font-semibold text-amber underline"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>

            {/* Demo login */}
            <div className="mt-4 border-t border-border pt-3">
              <p className="mb-2 text-center text-[10px] uppercase tracking-wider text-muted-foreground">Quick demo access</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDemoLogin("CUSTOMER")}
                  className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs font-medium text-navy transition hover:bg-muted"
                >
                  Demo Buyer
                </button>
                <button
                  onClick={() => handleDemoLogin("ADMIN")}
                  className="flex-1 rounded-lg border border-amber/40 bg-amber/5 px-3 py-2 text-xs font-medium text-amber transition hover:bg-amber/10"
                >
                  <Crown className="mr-1 inline h-3 w-3" /> Demo Admin
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
