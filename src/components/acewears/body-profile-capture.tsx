"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, User, Sparkles, Loader2, Check, Upload, X,
  RefreshCw, Shield, AlertCircle, Crown, Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "sonner";

type Profile = {
  id?: string;
  userId: string;
  skinTone?: string | null;
  hairStyle?: string | null;
  hairColor?: string | null;
  eyeColor?: string | null;
  bodyType?: string | null;
  bustChestCm?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;
  inseamCm?: number | null;
  shoulderCm?: number | null;
  faceImageUrl?: string | null;
  bodyImageUrl?: string | null;
  vlmExtractedAttrs?: string | null;
  consentToRender?: boolean;
};

const SKIN_TONES = [
  { value: "porcelain", label: "Porcelain", hex: "#F8D9C6" },
  { value: "fair",      label: "Fair",      hex: "#F0C8A8" },
  { value: "light",     label: "Light",     hex: "#E2B58A" },
  { value: "medium",    label: "Medium",    hex: "#C99878" },
  { value: "olive",     label: "Olive",     hex: "#B5895A" },
  { value: "tan",       label: "Tan",       hex: "#9C7050" },
  { value: "deep",      label: "Deep",      hex: "#724F35" },
  { value: "rich",      label: "Rich",      hex: "#4A2D1A" },
];

const HAIR_STYLES = [
  { value: "buzz",         label: "Buzz cut" },
  { value: "fade",         label: "Fade / Taper" },
  { value: "short",        label: "Short" },
  { value: "mid-length",   label: "Mid-length" },
  { value: "long-straight",label: "Long straight" },
  { value: "curly-mid",    label: "Curly mid" },
  { value: "afro",         label: "Afro" },
  { value: "locs",         label: "Locs" },
  { value: "bob",          label: "Bob" },
  { value: "pixie",        label: "Pixie" },
  { value: "ponytail",     label: "Ponytail" },
  { value: "bun",          label: "Bun" },
  { value: "bald",         label: "Bald / Shaved" },
];

const HAIR_COLORS = [
  { value: "black",       label: "Black" },
  { value: "dark-brown", label: "Dark brown" },
  { value: "brown",       label: "Brown" },
  { value: "auburn",     label: "Auburn" },
  { value: "red",         label: "Red" },
  { value: "blonde",     label: "Blonde" },
  { value: "gray",        label: "Gray / Silver" },
  { value: "white",       label: "White" },
];

const EYE_COLORS = [
  { value: "brown", label: "Brown" },
  { value: "hazel", label: "Hazel" },
  { value: "amber", label: "Amber" },
  { value: "green", label: "Green" },
  { value: "blue",  label: "Blue" },
  { value: "gray",  label: "Gray" },
  { value: "black", label: "Black" },
];

const BODY_TYPES = [
  { value: "ECTOMORPH", label: "Ectomorph — slim, lean" },
  { value: "MESOMORPH", label: "Mesomorph — athletic" },
  { value: "ENDOMORPH", label: "Endomorph — fuller/curvier" },
];

export function BodyProfileCapture({ onSaved }: { onSaved?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Form state
  const [skinTone, setSkinTone] = useState("");
  const [hairStyle, setHairStyle] = useState("");
  const [hairColor, setHairColor] = useState("");
  const [eyeColor, setEyeColor] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [bustChestCm, setBustChestCm] = useState("");
  const [waistCm, setWaistCm] = useState("");
  const [hipCm, setHipCm] = useState("");
  const [inseamCm, setInseamCm] = useState("");
  const [shoulderCm, setShoulderCm] = useState("");
  const [faceImageUrl, setFaceImageUrl] = useState<string | null>(null);
  const [bodyImageUrl, setBodyImageUrl] = useState<string | null>(null);
  const [vlmAttrs, setVlmAttrs] = useState<Record<string, any> | null>(null);
  const [consent, setConsent] = useState(false);

  // Drag state
  const [draggingFace, setDraggingFace] = useState(false);
  const [draggingBody, setDraggingBody] = useState(false);
  const [uploadingFace, setUploadingFace] = useState(false);
  const [uploadingBody, setUploadingBody] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/me/body-profile?userId=${user.id}`);
      const j = await res.json();
      if (j.ok && j.data) {
        const p: Profile = j.data;
        setProfile(p);
        setSkinTone(p.skinTone || "");
        setHairStyle(p.hairStyle || "");
        setHairColor(p.hairColor || "");
        setEyeColor(p.eyeColor || "");
        setBodyType(p.bodyType || "");
        setBustChestCm(p.bustChestCm?.toString() || "");
        setWaistCm(p.waistCm?.toString() || "");
        setHipCm(p.hipCm?.toString() || "");
        setInseamCm(p.inseamCm?.toString() || "");
        setShoulderCm(p.shoulderCm?.toString() || "");
        setFaceImageUrl(p.faceImageUrl || null);
        setBodyImageUrl(p.bodyImageUrl || null);
        setConsent(!!p.consentToRender);
        try { setVlmAttrs(p.vlmExtractedAttrs ? JSON.parse(p.vlmExtractedAttrs) : null); } catch {}
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Wait for Zustand persist hydration before loading.
  // Zustand persist hydration is async — we trigger load on hydration OR
  // when user becomes available, whichever fires first.
  useEffect(() => {
    if (user) {
      load();
    } else if (hydrated) {
      // hydration completed but no user — stop loading
      setLoading(false);
    }
  }, [hydrated, user, load]);

  const uploadPhoto = useCallback(async (file: File, kind: "face" | "body") => {
    if (!user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    const setUploading = kind === "face" ? setUploadingFace : setUploadingBody;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("userId", user.id);
      const res = await fetch("/api/admin/upload-body-photo", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Upload failed");
      if (kind === "face") setFaceImageUrl(j.url);
      else setBodyImageUrl(j.url);
      toast.success(`${kind === "face" ? "Face" : "Body"} photo uploaded`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  }, [user]);

  const extractAttrs = useCallback(async () => {
    if (!user) return;
    if (!faceImageUrl) {
      toast.error("Upload a face photo first");
      return;
    }
    setExtracting(true);
    try {
      const res = await fetch("/api/me/extract-attrs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: faceImageUrl, userId: user.id }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Extraction failed");
      setVlmAttrs(j.data);
      toast.success("AI extracted your physical attributes");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setExtracting(false);
    }
  }, [user, faceImageUrl]);

  const handleSave = async () => {
    if (!user) return;
    if (!consent) {
      toast.error("Please grant render consent to enable Virtual Try-On");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/me/body-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          skinTone, hairStyle, hairColor, eyeColor, bodyType,
          bustChestCm: bustChestCm ? Number(bustChestCm) : null,
          waistCm: waistCm ? Number(waistCm) : null,
          hipCm: hipCm ? Number(hipCm) : null,
          inseamCm: inseamCm ? Number(inseamCm) : null,
          shoulderCm: shoulderCm ? Number(shoulderCm) : null,
          faceImageUrl, bodyImageUrl,
          vlmExtractedAttrs: vlmAttrs ? JSON.stringify(vlmAttrs) : null,
          consentToRender: consent,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Save failed");
      toast.success("Body profile saved — Try-On unlocked");
      onSaved?.();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <User className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Sign in to manage your body profile.</p>
      </div>
    );
  }

  if (!user.isPremium) {
    return (
      <div className="rounded-xl border border-amber/30 bg-amber/5 p-6 text-center">
        <Crown className="mx-auto mb-2 h-6 w-6 text-amber" />
        <h3 className="text-base font-semibold text-navy">Premium feature</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          AI Body Profile &amp; Virtual Try-On is available to AceWears Premium members.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 rounded-xl bg-gradient-to-br from-navy to-navy-700 p-4 text-white">
        <div className="rounded-xl bg-amber/20 p-2.5">
          <Camera className="h-5 w-5 text-amber" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold">AI Body Profile</h3>
            <span className="rounded-full bg-amber/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber">
              Premium
            </span>
          </div>
          <p className="mt-0.5 text-xs text-white/70">
            Upload a photo, select your natural details, and let our VLM extract
            structured attributes. We use this to render how clothes will look on you.
          </p>
        </div>
      </div>

      {/* Photo upload */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PhotoDropzone
          label="Face photo"
          imageUrl={faceImageUrl}
          dragging={draggingFace}
          uploading={uploadingFace}
          onDragOver={(e) => { e.preventDefault(); setDraggingFace(true); }}
          onDragLeave={() => setDraggingFace(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDraggingFace(false);
            const file = e.dataTransfer.files?.[0];
            if (file) uploadPhoto(file, "face");
          }}
          onFileChange={(f) => f && uploadPhoto(f, "face")}
          onClear={() => setFaceImageUrl(null)}
        />
        <PhotoDropzone
          label="Full-body photo (optional, recommended)"
          imageUrl={bodyImageUrl}
          dragging={draggingBody}
          uploading={uploadingBody}
          onDragOver={(e) => { e.preventDefault(); setDraggingBody(true); }}
          onDragLeave={() => setDraggingBody(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDraggingBody(false);
            const file = e.dataTransfer.files?.[0];
            if (file) uploadPhoto(file, "body");
          }}
          onFileChange={(f) => f && uploadPhoto(f, "body")}
          onClear={() => setBodyImageUrl(null)}
        />
      </div>

      {/* VLM extract button */}
      <div className="rounded-xl border border-border bg-muted/30 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-navy">AI attribute extraction</p>
            <p className="text-xs text-muted-foreground">
              Let our vision model analyze your photo and extract face shape, jawline, eye shape, hair texture, etc.
            </p>
          </div>
          <Button
            onClick={extractAttrs}
            disabled={!faceImageUrl || extracting}
            size="sm"
            className="bg-teal text-white hover:bg-teal-600"
          >
            {extracting ? (
              <><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> Analyzing...</>
            ) : (
              <><Sparkles className="mr-1 h-3.5 w-3.5" /> Extract attributes</>
            )}
          </Button>
        </div>

        <AnimatePresence>
          {vlmAttrs && Object.keys(vlmAttrs).length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden"
            >
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Extracted attributes
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(vlmAttrs).filter(([_, v]) => v).map(([k, v]) => (
                  <span key={k} className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-navy shadow-sm">
                    <Check className="h-2.5 w-2.5 text-teal" />
                    <span className="capitalize">{k.replace(/([A-Z])/g, " $1").trim()}:</span>
                    <span className="font-bold">{String(v).replace(/-/g, " ")}</span>
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Manual attributes */}
      <div className="space-y-3 rounded-xl border border-border bg-white p-4">
        <h4 className="text-sm font-semibold text-navy">Natural details</h4>

        <div className="space-y-1.5">
          <Label className="text-xs">Skin tone</Label>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {SKIN_TONES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setSkinTone(skinTone === t.value ? "" : t.value)}
                className={`flex flex-col items-center gap-1 rounded-lg p-1.5 transition ${
                  skinTone === t.value ? "ring-2 ring-amber bg-amber/5" : "hover:bg-muted"
                }`}
                title={t.label}
              >
                <span className="block h-6 w-6 rounded-full border border-black/10" style={{ background: t.hex }} />
                <span className="text-[9px] text-muted-foreground">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Hair style">
            <Select value={hairStyle} onValueChange={(v) => setHairStyle(hairStyle === v ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {HAIR_STYLES.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Hair color">
            <Select value={hairColor} onValueChange={(v) => setHairColor(hairColor === v ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {HAIR_COLORS.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Eye color">
            <Select value={eyeColor} onValueChange={(v) => setEyeColor(eyeColor === v ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {EYE_COLORS.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Body type">
            <Select value={bodyType} onValueChange={(v) => setBodyType(bodyType === v ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {BODY_TYPES.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>

      {/* Measurements */}
      <div className="space-y-3 rounded-xl border border-border bg-white p-4">
        <h4 className="text-sm font-semibold text-navy">Body measurements (cm)</h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Chest">
            <Input type="number" min="60" max="160" value={bustChestCm}
              onChange={(e) => setBustChestCm(e.target.value)} placeholder="102" />
          </Field>
          <Field label="Waist">
            <Input type="number" min="50" max="160" value={waistCm}
              onChange={(e) => setWaistCm(e.target.value)} placeholder="84" />
          </Field>
          <Field label="Hip">
            <Input type="number" min="60" max="170" value={hipCm}
              onChange={(e) => setHipCm(e.target.value)} placeholder="100" />
          </Field>
          <Field label="Inseam">
            <Input type="number" min="60" max="100" value={inseamCm}
              onChange={(e) => setInseamCm(e.target.value)} placeholder="82" />
          </Field>
          <Field label="Shoulder">
            <Input type="number" min="35" max="65" value={shoulderCm}
              onChange={(e) => setShoulderCm(e.target.value)} placeholder="47" />
          </Field>
        </div>
      </div>

      {/* Consent */}
      <div className={`rounded-xl border p-3 ${consent ? "border-teal/30 bg-teal/5" : "border-amber/30 bg-amber/5"}`}>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-4 w-4 accent-teal"
          />
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <Shield className={`h-3.5 w-3.5 ${consent ? "text-teal" : "text-amber"}`} />
              <span className="text-sm font-medium text-navy">Render consent</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              I consent to AceWears using my body profile and photo to generate AI-rendered
              try-on visualizations. My profile is private and only used to render try-ons for me.
              I can delete my profile at any time.
            </p>
          </div>
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={load}>Reset</Button>
        <Button onClick={handleSave} disabled={saving || !consent}
          className="bg-navy text-white hover:bg-navy-700">
          {saving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            <><Check className="mr-2 h-4 w-4" /> Save profile</>
          )}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-navy">{label}</Label>
      {children}
    </div>
  );
}

function PhotoDropzone({
  label, imageUrl, dragging, uploading,
  onDragOver, onDragLeave, onDrop, onFileChange, onClear,
}: {
  label: string;
  imageUrl: string | null;
  dragging: boolean;
  uploading: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileChange: (file: File | null) => void;
  onClear: () => void;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`relative flex aspect-[4/5] flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition ${
        dragging ? "border-amber bg-amber/5" : "border-border bg-muted/30"
      }`}
    >
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        id={`photo-${label.replace(/\s+/g, "-").toLowerCase()}`}
        onChange={(e) => onFileChange(e.target.files?.[0] || null)}
      />
      <span className="absolute left-2 top-2 z-10 rounded-full bg-navy px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
        {label}
      </span>
      {imageUrl ? (
        <>
          { }
          <img src={imageUrl} alt={label} className="absolute inset-0 h-full w-full object-cover" />
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-1.5 text-white backdrop-blur hover:bg-black/80"
            aria-label="Remove photo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => document.getElementById(`photo-${label.replace(/\s+/g, "-").toLowerCase()}`)?.click()}
          className="flex flex-col items-center gap-2 p-4 text-center"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-amber" />
          ) : (
            <div className="rounded-full bg-amber/10 p-3">
              <Upload className="h-5 w-5 text-amber" />
            </div>
          )}
          <span className="text-xs font-medium text-navy">
            {uploading ? "Uploading..." : "Drop or click to upload"}
          </span>
          <span className="text-[10px] text-muted-foreground">JPEG · PNG · WebP</span>
        </button>
      )}
    </div>
  );
}
