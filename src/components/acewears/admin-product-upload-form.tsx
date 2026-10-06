"use client";

import { useState, useCallback, useRef, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Check, Loader2, ImageIcon, AlertCircle, Plus, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Angle = "FRONT" | "BACK" | "SIDE_DETAIL";

type Slot = {
  angle: Angle;
  file: File | null;
  previewUrl: string | null;
  compressedBlobUrl: string | null;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
};

const initialSlots: Slot[] = [
  { angle: "FRONT",       file: null, previewUrl: null, compressedBlobUrl: null, width: 0, height: 0, originalSize: 0, compressedSize: 0 },
  { angle: "BACK",        file: null, previewUrl: null, compressedBlobUrl: null, width: 0, height: 0, originalSize: 0, compressedSize: 0 },
  { angle: "SIDE_DETAIL", file: null, previewUrl: null, compressedBlobUrl: null, width: 0, height: 0, originalSize: 0, compressedSize: 0 },
];

type Category = { id: string; slug: string; name: string };

/**
 * AdminProductUploadForm
 * ----------------------------------------------------------------------------
 * Multi-Angle Product Uploader with:
 *  - 3 dedicated drag-and-drop slots (FRONT / BACK / SIDE_DETAIL)
 *  - Client-side image compression via Canvas + JPEG/WebP encode at quality 0.82,
 *    downscaled to max 1600px on the longest side.
 *  - Interactive thumbnail preview with original vs. compressed size diff.
 *  - Submit creates the product via /api/products POST with admin role header.
 */
export function AdminProductUploadForm({
  categories,
  adminRole = "ADMIN",
}: {
  categories: Category[];
  adminRole?: string;
}) {
  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [dragging, setDragging] = useState<Angle | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");   // dollars
  const [material, setMaterial] = useState("");
  const [fit, setFit] = useState<"SLIM" | "REGULAR" | "RELAXED" | "OVERSIZED">("REGULAR");
  const [care, setCare] = useState("");
  const [tags, setTags] = useState("");
  const [categoryId, setCategoryId] = useState("");
  // Variants
  const [variants, setVariants] = useState<{ sku: string; size: string; color: string; stockCount: number }[]>([
    { sku: "", size: "M", color: "Navy", stockCount: 5 },
  ]);

  const fileInputRefs = useRef<Record<Angle, HTMLInputElement | null>>({
    FRONT: null, BACK: null, SIDE_DETAIL: null,
  });

  // ---------- Image compression ----------
  const compressImage = useCallback(async (file: File): Promise<{
    blobUrl: string;
    width: number;
    height: number;
    compressedSize: number;
  }> => {
    const bitmap = await createImageBitmap(file);
    const maxDim = 1600;
    let { width, height } = bitmap;
    if (width > maxDim || height > maxDim) {
      const scale = Math.min(maxDim / width, maxDim / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob: Blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b as Blob), "image/jpeg", 0.82)
    );
    const blobUrl = URL.createObjectURL(blob);
    return { blobUrl, width, height, compressedSize: blob.size };
  }, []);

  const handleFile = useCallback(async (angle: Angle, file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please drop an image file");
      return;
    }
    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    setSlots((prev) => prev.map((s) => (s.angle === angle ? {
      ...s, file, previewUrl, originalSize: file.size,
      compressedBlobUrl: null, compressedSize: 0,
    } : s)));

    // Compress
    try {
      const { blobUrl, width, height, compressedSize } = await compressImage(file);
      setSlots((prev) => prev.map((s) => (s.angle === angle ? {
        ...s, compressedBlobUrl: blobUrl, width, height, compressedSize,
      } : s)));
    } catch (e) {
      console.error(e);
      toast.error("Image compression failed");
    }
  }, [compressImage]);

  const handleDrop = useCallback((angle: Angle, e: React.DragEvent) => {
    e.preventDefault();
    setDragging(null);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(angle, file);
  }, [handleFile]);

  const removeSlot = (angle: Angle) => {
    setSlots((prev) => prev.map((s) => (s.angle === angle ? {
      ...initialSlots.find((i) => i.angle === angle)!,
    } : s)));
  };

  // ---------- Variants ----------
  const addVariant = () =>
    setVariants((v) => [...v, { sku: "", size: "L", color: "Navy", stockCount: 5 }]);
  const updateVariant = (i: number, patch: Partial<typeof variants[number]>) =>
    setVariants((v) => v.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const removeVariant = (i: number) => setVariants((v) => v.filter((_, idx) => idx !== i));

  // ---------- Submit ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !description || !basePrice || !categoryId) {
      toast.error("Please complete all required fields");
      return;
    }
    // Require at least FRONT image
    if (!slots[0].file) {
      toast.error("Front view image is required");
      return;
    }

    startTransition(async () => {
      try {
        // Upload images via FormData to /api/admin/upload, get back URLs
        const formData = new FormData();
        const angles: string[] = [];
        for (const s of slots) {
          if (s.file) {
            formData.append("files", s.file, s.file.name);
            angles.push(s.angle);
          }
        }
        formData.append("angles", JSON.stringify(angles));

        const uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
          headers: { "x-acewears-role": adminRole },
        });
        if (!uploadRes.ok) throw new Error("Image upload failed");
        const uploaded: { urls: { angle: Angle; url: string }[] } = await uploadRes.json();

        // Create the product
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-acewears-role": adminRole },
          body: JSON.stringify({
            title, slug, description,
            basePriceCents: Math.round(Number(basePrice) * 100),
            currency: "USD",
            material, fit, care, tags, categoryId,
            images: uploaded.urls.map((u) => ({ angle: u.angle, url: u.url, altText: `${title} ${u.angle}` })),
            variants: variants.filter(v => v.sku && v.size).map(v => ({
              sku: v.sku, size: v.size, color: v.color || null,
              stockCount: Number(v.stockCount) || 0,
            })),
            sizeChart: [],
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error || "Create failed");

        toast.success("Product created successfully");

        // Reset
        setTitle(""); setSlug(""); setDescription(""); setBasePrice("");
        setMaterial(""); setFit("REGULAR"); setCare(""); setTags("");
        setCategoryId(""); setVariants([{ sku: "", size: "M", color: "Navy", stockCount: 5 }]);
        setSlots(initialSlots.map((s) => ({ ...s })));
      } catch (e: any) {
        toast.error("Failed to create product: " + e.message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-navy">Add new product</h3>
          <p className="text-sm text-muted-foreground">
            Upload 3 angles (front, back, side/detail). Front view is required.
          </p>
        </div>
        <Badge className="bg-amber/15 text-amber-600 border-amber/30">
          ADMIN
        </Badge>
      </div>

      {/* ---------- 3-Angle Dropzone ---------- */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {slots.map((slot) => (
          <DropzoneSlot
            key={slot.angle}
            slot={slot}
            dragging={dragging === slot.angle}
            onDragOver={(e) => { e.preventDefault(); setDragging(slot.angle); }}
            onDragLeave={() => setDragging(null)}
            onDrop={(e) => handleDrop(slot.angle, e)}
            onFileChange={(f) => handleFile(slot.angle, f)}
            onRemove={() => removeSlot(slot.angle)}
            inputRef={(el) => { fileInputRefs.current[slot.angle] = el; }}
          />
        ))}
      </div>

      {/* ---------- Core fields ---------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Title" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="AceWears Tailored Navy Blazer" />
        </Field>
        <Field label="Slug" required>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)}
            placeholder="tailored-navy-blazer" />
        </Field>
        <Field label="Base price (USD)" required>
          <Input type="number" min="0" step="0.01" value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)} placeholder="289.00" />
        </Field>
        <Field label="Category" required>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Material">
          <Input value={material} onChange={(e) => setMaterial(e.target.value)}
            placeholder="Italian Wool (98%) / Elastane (2%)" />
        </Field>
        <Field label="Fit">
          <Select value={fit} onValueChange={(v: any) => setFit(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="SLIM">Slim</SelectItem>
              <SelectItem value="REGULAR">Regular</SelectItem>
              <SelectItem value="RELAXED">Relaxed</SelectItem>
              <SelectItem value="OVERSIZED">Oversized</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Description" required>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
          rows={4} placeholder="Italian-milled wool blazer with peak lapels..." />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Care instructions">
          <Input value={care} onChange={(e) => setCare(e.target.value)}
            placeholder="Dry clean only" />
        </Field>
        <Field label="Tags (comma separated)">
          <Input value={tags} onChange={(e) => setTags(e.target.value)}
            placeholder="blazer, formal, wool, navy" />
        </Field>
      </div>

      {/* ---------- Variants ---------- */}
      <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-navy">Variants (size + stock)</h4>
          <Button type="button" size="sm" variant="outline" onClick={addVariant}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add variant
          </Button>
        </div>
        <div className="space-y-2">
          {variants.map((v, i) => (
            <div key={i} className="grid grid-cols-12 items-end gap-2">
              <div className="col-span-12 sm:col-span-4">
                <Label className="text-xs text-muted-foreground">SKU</Label>
                <Input value={v.sku} onChange={(e) => updateVariant(i, { sku: e.target.value })}
                  placeholder="AW-BLAZER-NV-M" />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Size</Label>
                <Input value={v.size} onChange={(e) => updateVariant(i, { size: e.target.value })}
                  placeholder="M" />
              </div>
              <div className="col-span-4 sm:col-span-3">
                <Label className="text-xs text-muted-foreground">Color</Label>
                <Input value={v.color} onChange={(e) => updateVariant(i, { color: e.target.value })}
                  placeholder="Navy" />
              </div>
              <div className="col-span-3 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Stock</Label>
                <Input type="number" min="0" value={v.stockCount}
                  onChange={(e) => updateVariant(i, { stockCount: Number(e.target.value) })} />
              </div>
              <div className="col-span-1 flex justify-end">
                <Button type="button" size="icon" variant="ghost"
                  onClick={() => removeVariant(i)} aria-label="Remove variant">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setSlots(initialSlots.map(s => ({ ...s })))}>
          Reset images
        </Button>
        <Button type="submit" disabled={isPending}
          className="bg-navy text-white hover:bg-navy-700">
          {isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
          ) : (
            <><Check className="mr-2 h-4 w-4" /> Create product</>
          )}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-navy">
        {label}{required && <span className="text-amber"> *</span>}
      </Label>
      {children}
    </div>
  );
}

function DropzoneSlot({
  slot, dragging, onDragOver, onDragLeave, onDrop, onFileChange, onRemove, inputRef,
}: {
  slot: Slot;
  dragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileChange: (f: File | null) => void;
  onRemove: () => void;
  inputRef: (el: HTMLInputElement | null) => void;
}) {
  const angleLabel: Record<Angle, string> = {
    FRONT: "Front View",
    BACK: "Back View",
    SIDE_DETAIL: "Side / Detail",
  };

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`relative flex aspect-[3/4] flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
        dragging ? "border-amber bg-amber/5" : "border-border bg-muted/30"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => onFileChange(e.target.files?.[0] || null)}
      />

      {/* Header chip */}
      <div className="absolute left-2 top-2 z-10">
        <span className="inline-flex items-center gap-1 rounded-full bg-navy px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
          <Shirt className="h-3 w-3" />
          {angleLabel[slot.angle]}
        </span>
      </div>

      {/* Preview or empty state */}
      <AnimatePresence mode="wait">
        {slot.previewUrl ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            { }
            <img
              src={slot.compressedBlobUrl || slot.previewUrl}
              alt={angleLabel[slot.angle]}
              className="h-full w-full object-cover"
            />
            {/* Remove button */}
            <button
              type="button"
              onClick={onRemove}
              className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-1 text-white backdrop-blur hover:bg-black/80"
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Compression stats */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/90 to-transparent p-2 text-white">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-mono">{slot.width}×{slot.height}</span>
                {slot.compressedSize > 0 && (
                  <span className="flex items-center gap-1">
                    <Check className="h-3 w-3 text-amber" />
                    {formatBytes(slot.originalSize)} → {formatBytes(slot.compressedSize)}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="empty"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center gap-1 p-4 text-center"
          >
            <div className="rounded-full bg-amber/10 p-2">
              <ImageIcon className="h-5 w-5 text-amber" />
            </div>
            <span className="mt-1 text-xs font-medium text-navy">
              Drop or click to upload
            </span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Upload className="h-3 w-3" />
              JPEG · PNG · WebP
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {dragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-amber/10 text-xs font-bold text-amber-600">
          Drop to upload
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + "B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "KB";
  return (bytes / 1024 / 1024).toFixed(2) + "MB";
}
