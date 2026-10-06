"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Loader2, Wand2, RefreshCw, X, Crown, Lock,
  ImageOff, Download, AlertCircle, ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "sonner";

type Product = {
  id: string;
  title: string;
  images: { url: string }[];
};

type TryOnResponse = {
  resultUrl: string;
  promptUsed: string;
  cached: boolean;
  durationMs?: number;
  garmentAnalysis?: string;
};

export function VirtualTryOn({
  product,
  onClose,
  onUpgradeRequest,
}: {
  product: Product;
  onClose: () => void;
  onUpgradeRequest?: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const upgradeToPremium = useAuthStore((s) => s.upgradeToPremium);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TryOnResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"side-by-side" | "result-only">("side-by-side");

  const handleGenerate = async () => {
    if (!user) {
      toast.error("Sign in to use Virtual Try-On");
      return;
    }
    if (!user.isPremium) {
      toast.error("Upgrade to Premium to unlock Virtual Try-On");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, productId: product.id }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) {
        // If the user hasn't set up a body profile, surface a friendly message
        if (j.error?.includes("body profile")) {
          setError(j.error);
        } else {
          throw new Error(j.error || "Failed");
        }
        return;
      }
      setResult(j.data);
      if (j.data.cached) toast.info("Showing your previously generated try-on");
      else toast.success(`Try-on rendered in ${((j.data.durationMs || 0) / 1000).toFixed(1)}s`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeDemo = async () => {
    // Demo: instantly upgrade via the API + local store
    if (!user) return;
    try {
      const res = await fetch("/api/me/upgrade-premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const j = await res.json();
      if (j.ok) {
        upgradeToPremium();
        toast.success("Upgraded to Premium — Try-On unlocked");
      } else throw new Error(j.error || "Upgrade failed");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const frontImage = product.images[0]?.url;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-navy/60 backdrop-blur-sm p-3"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="AI Virtual Try-On"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border bg-gradient-to-r from-navy to-navy-700 px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-amber" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold">AI Virtual Try-On</h2>
                <span className="rounded-full bg-amber/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber">
                  Premium
                </span>
              </div>
              <p className="text-[11px] text-white/70">{product.title}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="max-h-[80vh] overflow-y-auto p-4 sm:p-6">
          {/* Not premium gate */}
          {user && !user.isPremium && (
            <div className="rounded-xl border border-amber/30 bg-amber/5 p-6 text-center">
              <Crown className="mx-auto mb-3 h-10 w-10 text-amber" />
              <h3 className="text-base font-bold text-navy">Unlock Virtual Try-On</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Generate photorealistic visualizations of how this garment will look on your body —
                using your uploaded photo, skin tone, hair, and natural details.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button onClick={handleUpgradeDemo} className="bg-amber text-navy hover:bg-amber-400">
                  <Crown className="mr-1.5 h-4 w-4" /> Upgrade to Premium — Free demo
                </Button>
                <Button variant="outline" onClick={onUpgradeRequest}>
                  Set up body profile
                </Button>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                $14.99/month · Cancel anytime · Premium includes try-on, AI size assistant, and priority support
              </p>
            </div>
          )}

          {/* Not signed in gate */}
          {!user && (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <Lock className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Sign in to use Virtual Try-On.</p>
            </div>
          )}

          {/* Premium user — try-on UI */}
          {user?.isPremium && (
            <div className="space-y-4">
              {/* Intro / Generate button */}
              {!result && !loading && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Product image preview */}
                    <div className="rounded-xl border border-border bg-muted/30 p-3">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Garment</p>
                      <div className="aspect-[3/4] overflow-hidden rounded-lg bg-white">
                        {frontImage ? (
                           
                          <img src={frontImage} alt={product.title} className="h-full w-full object-cover" />
                        ) : <ImageOff className="m-auto h-8 w-8 text-muted-foreground" />}
                      </div>
                      <p className="mt-2 text-xs font-medium text-navy line-clamp-1">{product.title}</p>
                    </div>
                    {/* Body profile / Try-on call to action */}
                    <div className="flex flex-col gap-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Try-on render</p>
                      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-amber/40 bg-amber/5 p-6 text-center">
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="rounded-full bg-amber/15 p-3"
                        >
                          <Sparkles className="h-6 w-6 text-amber" />
                        </motion.div>
                        <p className="mt-3 text-sm font-medium text-navy">
                          Generate your personalized try-on
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Our AI will compose a photorealistic visualization using your body profile and this garment.
                        </p>
                        <Button onClick={handleGenerate} className="mt-4 bg-amber text-navy hover:bg-amber-400">
                          <Wand2 className="mr-2 h-4 w-4" /> Generate try-on
                        </Button>
                        <p className="mt-2 text-[10px] text-muted-foreground">
                          ~ 15-30 seconds · Cached for instant re-view
                        </p>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber/30 bg-amber/5 p-3 text-sm text-navy">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
                      <div>
                        <p className="font-medium">{error}</p>
                        {error.toLowerCase().includes("body profile") && (
                          <Button variant="link" size="sm" className="h-auto p-0 text-amber" onClick={onUpgradeRequest}>
                            Set up your body profile →
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Loading state */}
              {loading && (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="rounded-full bg-amber/15 p-4"
                  >
                    <Sparkles className="h-8 w-8 text-amber" />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-navy">Rendering your try-on...</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      VLM analyzing garment · composing prompt · generating visualization
                    </p>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    {[1, 2, 3].map((i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0.3 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                        className="h-1.5 w-1.5 rounded-full bg-amber"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Result */}
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* View toggle */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      {result.cached ? (
                        <span className="rounded-full bg-teal/10 px-2 py-0.5 font-medium text-teal">Cached</span>
                      ) : (
                        <span className="rounded-full bg-amber/10 px-2 py-0.5 font-medium text-amber">
                          Fresh render · {((result.durationMs || 0) / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1 text-[11px]">
                      <button
                        onClick={() => setView("side-by-side")}
                        className={`rounded-md px-2 py-1 transition ${
                          view === "side-by-side" ? "bg-navy text-white" : "text-navy"
                        }`}
                      >
                        Compare
                      </button>
                      <button
                        onClick={() => setView("result-only")}
                        className={`rounded-md px-2 py-1 transition ${
                          view === "result-only" ? "bg-navy text-white" : "text-navy"
                        }`}
                      >
                        Result only
                      </button>
                    </div>
                  </div>

                  {/* Image area */}
                  {view === "side-by-side" ? (
                    <div className="grid grid-cols-2 gap-3">
                      <CompareCard label="Garment" imageUrl={frontImage} alt={product.title} />
                      <CompareCard label="On you (AI)" imageUrl={result.resultUrl} alt={`Try-on of ${product.title}`} badge />
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-border">
                      { }
                      <img src={result.resultUrl} alt={`Try-on of ${product.title}`} className="w-full" />
                    </div>
                  )}

                  {/* AI prompt transcript (collapsible) */}
                  <details className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
                    <summary className="cursor-pointer font-medium text-navy">
                      View AI prompt →
                    </summary>
                    <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{result.promptUsed}</p>
                    {result.garmentAnalysis && (
                      <>
                        <p className="mt-3 font-medium text-navy">VLM garment analysis:</p>
                        <p className="mt-1 text-muted-foreground">{result.garmentAnalysis}</p>
                      </>
                    )}
                  </details>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Button variant="outline" size="sm" onClick={() => setResult(null)}>
                      <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Back
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleGenerate}>
                        <RefreshCw className="mr-1 h-3.5 w-3.5" /> Regenerate
                      </Button>
                      <a
                        href={result.resultUrl}
                        download={`acewears-try-on-${product.id}.png`}
                        className="inline-flex h-8 items-center gap-1 rounded-md bg-amber px-3 text-xs font-bold text-navy hover:bg-amber-400"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function CompareCard({
  label, imageUrl, alt, badge,
}: {
  label: string;
  imageUrl?: string;
  alt: string;
  badge?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-muted/30">
      <span className="absolute left-2 top-2 z-10 rounded-full bg-navy px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
        {label}
      </span>
      {badge && (
        <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-0.5 rounded-full bg-amber px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy">
          <Sparkles className="h-2.5 w-2.5" /> AI
        </span>
      )}
      <div className="aspect-[3/4] overflow-hidden">
        {imageUrl ? (
           
          <img src={imageUrl} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageOff className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
