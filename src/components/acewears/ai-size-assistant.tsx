"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Ruler, Sparkles, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "sonner";

type Result = {
  recommendedSize?: string;
  confidence?: number;
  measurements?: { estimatedChest: number; estimatedWaist: number; bmi: number };
  selectedSize?: { size: string; chestCm: number; waistCm: number } | null;
  reasoning?: string;
};

export function AiSizeAssistant({ productId }: { productId: string }) {
  const user = useAuthStore((s) => s.user);
  const [heightCm, setHeightCm] = useState(user?.heightCm?.toString() || "180");
  const [weightKg, setWeightKg] = useState(user?.weightKg?.toString() || "78");
  const [fitPref, setFitPref] = useState(user?.fitPreference || "REGULAR");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/fit-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          heightCm: Number(heightCm),
          weightKg: Number(weightKg),
          fitPreference: fitPref,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
      setResult(json.data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-gradient-to-br from-navy to-navy-700 p-4 text-white">
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-amber/20 p-2">
          <Ruler className="h-4 w-4 text-amber" />
        </div>
        <div>
          <h3 className="text-sm font-bold">AI Size & Fit Assistant</h3>
          <p className="text-[11px] text-white/70">Reduce your return rate by 40%+</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Height (cm)">
            <Input
              type="number" min="120" max="230" required value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className="border-white/20 bg-white/10 text-white placeholder:text-white/40"
            />
          </Field>
          <Field label="Weight (kg)">
            <Input
              type="number" min="35" max="200" required value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="border-white/20 bg-white/10 text-white placeholder:text-white/40"
            />
          </Field>
        </div>
        <Field label="Fit preference">
          <Select value={fitPref} onValueChange={(v: any) => setFitPref(v)}>
            <SelectTrigger className="border-white/20 bg-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SLIM">Slim</SelectItem>
              <SelectItem value="REGULAR">Regular</SelectItem>
              <SelectItem value="RELAXED">Relaxed</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-amber text-navy hover:bg-amber-400"
        >
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
          ) : (
            <><Sparkles className="mr-2 h-4 w-4" /> Get my size</>
          )}
        </Button>
      </form>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-lg bg-white/10 p-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-white/70">Recommended size</span>
            <span className="rounded-full bg-amber px-2 py-0.5 text-[10px] font-bold text-navy">
              {Math.round((result.confidence || 0) * 100)}% match
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber">{result.recommendedSize}</span>
            <span className="text-xs text-white/70">
              Chest: {result.selectedSize?.chestCm}cm · Waist: {result.selectedSize?.waistCm}cm
            </span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-white/70">{result.reasoning}</p>
        </motion.div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] font-medium uppercase tracking-wider text-white/70">{label}</Label>
      {children}
    </div>
  );
}
