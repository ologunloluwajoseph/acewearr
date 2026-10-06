"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, Plus, Pause, Play, Volume2, VolumeX, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/lib/stores/cart-store";
import { toast } from "sonner";

export type Reel = {
  id: string;
  videoUrl: string;
  posterUrl?: string | null;
  title: string;
  caption?: string | null;
  product: {
    id: string;
    slug: string;
    title: string;
    basePriceCents: number;
    currency: string;
    fit?: string | null;
    images: { url: string }[];
    variants: { id: string; size: string; color?: string | null; stockCount: number }[];
  };
};

/**
 * AceReels - Shoppable short-video feed
 * ----------------------------------------------------------------------------
 * Vertical TikTok/Reels-style carousel:
 *  - Snap scrolling between reels
 *  - Auto-play when in view, pause when scrolled out
 *  - Right-side action rail (like, comment, share)
 *  - Bottom-left product overlay with 1-tap "Add to Cart"
 *  - Mute toggle, progress bar
 */
export function AceReels({ reels }: { reels: Reel[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [muted, setMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Pause off-screen videos, play active
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === activeIndex) {
        v.play().catch(() => {/* user gesture required on some browsers */});
      } else {
        v.pause();
        v.currentTime = 0;
      }
    });
  }, [activeIndex]);

  const handleScroll = useCallback(() => {
    const c = containerRef.current;
    if (!c) return;
    const idx = Math.round(c.scrollTop / c.clientHeight);
    if (idx !== activeIndex) setActiveIndex(idx);
  }, [activeIndex]);

  const togglePlay = (i: number) => {
    const v = videoRefs.current[i];
    if (!v) return;
    if (v.paused) v.play(); else v.pause();
  };

  if (reels.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No reels available
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="no-scrollbar h-[70vh] snap-y snap-mandatory overflow-y-scroll rounded-2xl bg-navy-900 lg:h-[80vh]"
      style={{ scrollSnapType: "y mandatory" }}
    >
      {reels.map((reel, i) => (
        <ReelCard
          key={reel.id}
          reel={reel}
          index={i}
          isActive={i === activeIndex}
          muted={muted}
          onMuteToggle={() => setMuted((m) => !m)}
          liked={!!liked[reel.id]}
          onLike={() => setLiked((p) => ({ ...p, [reel.id]: !p[reel.id] }))}
          videoRef={(el) => { videoRefs.current[i] = el; }}
          onTogglePlay={() => togglePlay(i)}
        />
      ))}
    </div>
  );
}

function ReelCard({
  reel, index, isActive, muted, onMuteToggle, liked, onLike, videoRef, onTogglePlay,
}: {
  reel: Reel;
  index: number;
  isActive: boolean;
  muted: boolean;
  onMuteToggle: () => void;
  liked: boolean;
  onLike: () => void;
  videoRef: (el: HTMLVideoElement | null) => void;
  onTogglePlay: () => void;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const product = reel.product;
  const firstVariant = product.variants[0];
  const [paused, setPaused] = useState(false);

  const handleAddToCart = () => {
    if (!firstVariant) {
      toast.error("This product has no available variants");
      return;
    }
    addItem({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      variantId: firstVariant.id,
      sku: firstVariant.id,
      size: firstVariant.size,
      color: firstVariant.color || undefined,
      priceCents: product.basePriceCents,
      currency: product.currency,
      image: product.images[0]?.url,
    });
    toast.success("Added to cart");
  };

  return (
    <section
      className="relative h-[70vh] snap-start overflow-hidden lg:h-[80vh]"
      aria-label={`Reel ${index + 1}: ${reel.title}`}
    >
      {/* Video layer */}
      <video
        ref={videoRef}
        src={reel.videoUrl}
        poster={reel.posterUrl || undefined}
        loop
        muted={muted}
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover"
        onClick={() => { onTogglePlay(); setPaused((p) => !p); }}
      />

      {/* Gradient overlays */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-navy/30 via-transparent to-navy/80" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy/40 via-transparent to-transparent" />

      {/* Pause indicator */}
      <AnimatePresence>
        {paused && isActive && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="rounded-full bg-black/50 p-4 backdrop-blur">
              <Play className="h-8 w-8 text-white" fill="currentColor" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top mute toggle */}
      <button
        onClick={onMuteToggle}
        aria-label={muted ? "Unmute" : "Mute"}
        className="absolute right-3 top-3 z-20 rounded-full bg-black/40 p-2 text-white backdrop-blur hover:bg-black/60"
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>

      {/* Right action rail */}
      <div className="absolute bottom-32 right-3 z-20 flex flex-col items-center gap-4">
        <ReelAction
          icon={<Heart className={`h-6 w-6 ${liked ? "fill-amber text-amber" : "text-white"}`} />}
          label={liked ? "1.2K" : "1.1K"}
          onClick={onLike}
        />
        <ReelAction
          icon={<MessageCircle className="h-6 w-6 text-white" />}
          label="48"
          onClick={() => toast.info("Comments coming soon")}
        />
        <ReelAction
          icon={<Share2 className="h-6 w-6 text-white" />}
          label="Share"
          onClick={() => toast.success("Share link copied")}
        />
        {/* Brand chip */}
        <div className="mt-2 h-10 w-10 overflow-hidden rounded-full border-2 border-amber">
          { }
          <img src="/acewears-icon.svg" alt="" className="h-full w-full" />
        </div>
      </div>

      {/* Bottom-left product overlay */}
      <div className="absolute bottom-6 left-3 right-20 z-20">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-dark rounded-xl p-3 text-white shadow-lg"
        >
          {/* Title + caption */}
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber">
            AceReels · {reel.title}
          </p>
          {reel.caption && (
            <p className="mt-0.5 text-xs text-white/80 text-balance">{reel.caption}</p>
          )}

          {/* Product card */}
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-black/30 p-2">
            {product.images[0]?.url && (
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-white/10">
                { }
                <img src={product.images[0].url} alt={product.title} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{product.title}</p>
              <p className="text-xs text-white/70">
                ${(product.basePriceCents / 100).toFixed(2)}
                {product.fit && ` · ${product.fit.toLowerCase()} fit`}
              </p>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {product.variants.slice(0, 4).map((v) => (
                  <span key={v.id} className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">
                    {v.size}{v.stockCount <= 3 && v.stockCount > 0 ? ` · ${v.stockCount} left` : ""}
                  </span>
                ))}
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleAddToCart}
              className="bg-amber text-navy hover:bg-amber-400"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Reel number indicator */}
      <div className="absolute left-3 top-3 z-20">
        <Badge className="bg-amber text-navy">
          <ShoppingBag className="mr-1 h-3 w-3" />
          {index + 1} / {Math.max(1, Math.ceil(index / 1) + 1)}
        </Badge>
      </div>
    </section>
  );
}

function ReelAction({
  icon, label, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 text-white transition hover:scale-110"
    >
      <span className="rounded-full bg-black/30 p-2 backdrop-blur">{icon}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
