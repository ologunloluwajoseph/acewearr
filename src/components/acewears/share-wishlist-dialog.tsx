"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Share2, Copy, Check, Twitter, Facebook, MessageCircle,
  Heart, Sparkles, Image as ImageIcon, Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useWishlistStore } from "@/lib/stores/wishlist-store";
import { toast } from "sonner";

type WishlistedProduct = {
  productId: string;
  title: string;
  image?: string | null;
  priceCents: number;
  currency: string;
  note?: string | null;
};

const SUGGESTED_CAPTIONS = [
  "My AceWears wishlist — what I'm coveting this season ✨",
  "Wardrobe goals. Which piece should I get first? 👀",
  "Quiet luxury, electric amber. My current obsessions.",
  "Building my dream rotation. Tap to shop my picks.",
  "These are on my wishlist — would love your styling advice!",
  "From tailored blazers to statement jewelry. My wish list 💫",
];

export function ShareWishlistDialog({
  open,
  onClose,
  items,
  userPhoto,
  userName,
}: {
  open: boolean;
  onClose: () => void;
  items: WishlistedProduct[];
  userPhoto?: string | null;
  userName?: string | null;
}) {
  const [caption, setCaption] = useState(SUGGESTED_CAPTIONS[0]);
  const [copied, setCopied] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Default to first 4 products selected
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedProductIds(items.slice(0, 4).map((i) => i.productId));
       
      setCaption(SUGGESTED_CAPTIONS[0]);
    }
  }, [open, items]);

  const selectedProducts = items.filter((i) => selectedProductIds.includes(i.productId));
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/?section=wishlist`
    : "https://acewears.example/?section=wishlist";

  const handleToggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareUrl}\n\n${caption}`);
      setCopied(true);
      toast.success("Link + caption copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Web Share API for native share sheet (mobile + desktop Chromium)
  const handleNativeShare = async () => {
    const shareData = {
      title: `${userName || "My"} AceWears Wishlist`,
      text: caption,
      url: shareUrl,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("Shared!");
      } catch {
        // user cancelled — silent
      }
    } else {
      handleCopyLink();
    }
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(`${caption}\n\n${shareUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank", "noopener,noreferrer");
  };
  const shareFacebook = () => {
    const url = encodeURIComponent(shareUrl);
    const quote = encodeURIComponent(caption);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`, "_blank", "noopener,noreferrer");
  };
  const shareWhatsApp = () => {
    const text = encodeURIComponent(`${caption}\n\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  // Build a composite shareable image (user photo + selected products + caption)
  // using Canvas — downloadable as a single PNG for posting anywhere.
  const handleDownloadImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1080x1350 portrait (Instagram-friendly)
    canvas.width = 1080;
    canvas.height = 1350;

    // Background: deep navy gradient
    const grad = ctx.createLinearGradient(0, 0, 1080, 1350);
    grad.addColorStop(0, "#0A1128");
    grad.addColorStop(1, "#1F2A47");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1350);

    // Accent strip
    ctx.fillStyle = "#FF9F1C";
    ctx.fillRect(0, 0, 1080, 8);

    // User photo (circular) — top left
    const photoX = 90, photoY = 90, photoR = 70;
    ctx.save();
    ctx.beginPath();
    ctx.arc(photoX, photoY, photoR, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    if (userPhoto) {
      try {
        const img = await loadImage(userPhoto);
        ctx.drawImage(img, photoX - photoR, photoY - photoR, photoR * 2, photoR * 2);
      } catch {
        ctx.fillStyle = "#FF9F1C";
        ctx.fillRect(photoX - photoR, photoY - photoR, photoR * 2, photoR * 2);
      }
    } else {
      ctx.fillStyle = "#FF9F1C";
      ctx.fillRect(photoX - photoR, photoY - photoR, photoR * 2, photoR * 2);
    }
    ctx.restore();
    // Photo ring
    ctx.beginPath();
    ctx.arc(photoX, photoY, photoR + 3, 0, Math.PI * 2);
    ctx.strokeStyle = "#FF9F1C";
    ctx.lineWidth = 4;
    ctx.stroke();

    // User name
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 40px Helvetica, Arial, sans-serif";
    ctx.fillText(userName || "AceWears user", 190, 85);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "24px Helvetica, Arial, sans-serif";
    ctx.fillText(`${selectedProducts.length} items on my wishlist`, 190, 115);

    // Caption
    ctx.fillStyle = "#FF9F1C";
    ctx.font = "bold 28px Helvetica, Arial, sans-serif";
    ctx.fillText("MY WISHLIST", 90, 230);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "32px Helvetica, Arial, sans-serif";
    wrapText(ctx, caption, 90, 290, 900, 44);

    // Selected products grid (2x2 max)
    const gridStartY = 430;
    const cellW = 440, cellH = 540, gap = 30;
    const positions = [
      { x: 90, y: gridStartY },
      { x: 90 + cellW + gap, y: gridStartY },
      { x: 90, y: gridStartY + cellH + gap },
      { x: 90 + cellW + gap, y: gridStartY + cellH + gap },
    ];
    for (let i = 0; i < Math.min(selectedProducts.length, 4); i++) {
      const p = selectedProducts[i];
      const pos = positions[i];
      // Card background
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      roundRect(ctx, pos.x, pos.y, cellW, cellH, 16);
      ctx.fill();
      // Product image
      if (p.image) {
        try {
          const img = await loadImage(p.image);
          ctx.save();
          roundRect(ctx, pos.x + 12, pos.y + 12, cellW - 24, cellH - 120, 12);
          ctx.clip();
          ctx.drawImage(img, pos.x + 12, pos.y + 12, cellW - 24, cellH - 120);
          ctx.restore();
        } catch {}
      }
      // Title
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 24px Helvetica, Arial, sans-serif";
      const title = p.title.length > 32 ? p.title.slice(0, 30) + "…" : p.title;
      ctx.fillText(title, pos.x + 16, pos.y + cellH - 50);
      // Price
      ctx.fillStyle = "#FF9F1C";
      ctx.font = "bold 22px Helvetica, Arial, sans-serif";
      ctx.fillText(`$${(p.priceCents / 100).toFixed(2)}`, pos.x + 16, pos.y + cellH - 22);
    }

    // Footer
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "20px Helvetica, Arial, sans-serif";
    ctx.fillText("AceWears · Threads Reimagined", 90, 1290);

    // Download
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `acewears-wishlist-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    toast.success("Wishlist image downloaded — post it anywhere!");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-navy/60 backdrop-blur-sm p-3"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Share wishlist"
          >
            {/* Hidden canvas for image generation */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-gradient-to-r from-navy to-navy-700 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-amber" />
                <div>
                  <h2 className="text-sm font-bold">Share your wishlist</h2>
                  <p className="text-[11px] text-white/70">Pick items, write a caption, post anywhere</p>
                </div>
              </div>
              <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="space-y-4 p-4 sm:p-6">
              {/* User card preview */}
              <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
                <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-amber bg-white">
                  {userPhoto ? (
                    <img src={userPhoto} alt={userName || "User"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-amber/20 text-amber">
                      <Heart className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-navy">{userName || "AceWears user"}</p>
                  <p className="text-xs text-muted-foreground">{items.length} items on wishlist</p>
                </div>
              </div>

              {/* Caption input */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-navy">Your caption / words of suggestion</Label>
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  placeholder="Write something about your wishlist..."
                  className="resize-none"
                />
                <div className="flex flex-wrap gap-1">
                  {SUGGESTED_CAPTIONS.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCaption(s)}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition ${
                        caption === s
                          ? "bg-navy text-white"
                          : "bg-muted text-navy hover:bg-muted/70"
                      }`}
                    >
                      {s.slice(0, 32)}{s.length > 32 ? "…" : ""}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product picker */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-navy">Pick items to feature (max 4)</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {items.slice(0, 8).map((item) => {
                    const selected = selectedProductIds.includes(item.productId);
                    return (
                      <button
                        key={item.productId}
                        type="button"
                        onClick={() => handleToggleProduct(item.productId)}
                        className={`relative overflow-hidden rounded-lg border-2 transition ${
                          selected ? "border-amber ring-2 ring-amber/30" : "border-border opacity-70 hover:opacity-100"
                        }`}
                      >
                        <div className="aspect-square bg-muted">
                          {item.image && (
                            <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                          )}
                        </div>
                        {selected && (
                          <div className="absolute right-1 top-1 rounded-full bg-amber p-0.5">
                            <Check className="h-3 w-3 text-navy" />
                          </div>
                        )}
                        <p className="line-clamp-1 p-1 text-[10px] font-medium text-navy">{item.title}</p>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {selectedProductIds.length} selected — these will appear in the downloadable share image.
                </p>
              </div>

              {/* Share actions */}
              <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-xs font-semibold text-navy">Share to</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <ShareButton onClick={handleNativeShare} icon={<Share2 className="h-4 w-4" />} label="Native" color="bg-navy text-white" />
                  <ShareButton onClick={shareTwitter} icon={<Twitter className="h-4 w-4" />} label="X / Twitter" color="bg-black text-white" />
                  <ShareButton onClick={shareFacebook} icon={<Facebook className="h-4 w-4" />} label="Facebook" color="bg-[#1877F2] text-white" />
                  <ShareButton onClick={shareWhatsApp} icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp" color="bg-[#25D366] text-white" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <ShareButton
                    onClick={handleCopyLink}
                    icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    label={copied ? "Copied!" : "Copy link + caption"}
                    color="bg-white border border-border text-navy"
                  />
                  <ShareButton
                    onClick={handleDownloadImage}
                    icon={<ImageIcon className="h-4 w-4" />}
                    label="Download image"
                    color="bg-amber text-navy"
                  />
                </div>
              </div>

              {/* Shareable link */}
              <div className="flex items-center gap-2 rounded-lg border border-border bg-white p-2">
                <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-transparent text-xs text-muted-foreground outline-none"
                  onFocus={(e) => e.target.select()}
                />
                <button
                  onClick={handleCopyLink}
                  className="rounded-md bg-navy px-2 py-1 text-[10px] font-bold text-white hover:bg-navy-700"
                >
                  COPY
                </button>
              </div>

              <p className="text-center text-[11px] text-muted-foreground">
                Your wishlist is <strong className="text-navy">public</strong> — anyone with the link can view it.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ShareButton({
  onClick, icon, label, color,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition hover:brightness-110 ${color}`}
    >
      {icon}
      <span className="line-clamp-1">{label}</span>
    </button>
  );
}

// ---------- Canvas helpers ----------
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let curY = y;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, curY);
      line = word;
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x, curY);
}
