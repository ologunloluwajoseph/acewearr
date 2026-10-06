"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Truck, RotateCcw, Shield, Loader2, Wand2, Crown, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/lib/stores/cart-store";
import { useAuthStore, useIsPremium } from "@/lib/stores/auth-store";
import { useWishlistStore, useIsInWishlist } from "@/lib/stores/wishlist-store";
import { AiSizeAssistant } from "@/components/acewears/ai-size-assistant";
import { VerifiedReviewsPdp } from "@/components/acewears/verified-reviews-pdp";
import { CompleteTheLook } from "@/components/acewears/complete-the-look";
import { ScarcityBadge, CountdownTimer } from "@/components/acewears/scarcity-badges";
import { VirtualTryOn } from "@/components/acewears/virtual-try-on";
import { toast } from "sonner";
import { formatMoney } from "@/lib/utils";

type ProductDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  basePriceCents: number;
  currency: string;
  material?: string | null;
  fit?: string | null;
  care?: string | null;
  tags: string;
  images: { id: string; angle: string; url: string; altText?: string | null }[];
  variants: { id: string; size: string; color?: string | null; stockCount: number }[];
  sizeChart: { id: string; size: string; chestCm: number; waistCm: number }[];
  promoTags: { id: string; label: string; kind: string; payload?: string; endsAt?: string | null }[];
  ratingSummary?: { avg: number; count: number; buckets: Record<number, number> };
};

export function ProductDetailModal({
  productId,
  onClose,
}: {
  productId: string | null;
  onClose: () => void;
}) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeAngle, setActiveAngle] = useState<string>("FRONT");
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [tryOnOpen, setTryOnOpen] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const user = useAuthStore((s) => s.user);
  const isPremium = useIsPremium();

  useEffect(() => {
    if (!productId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
     
    setProduct(null);
    let cancelled = false;
    fetch(`/api/products/${productId}`)
      .then(r => r.json())
      .then(j => {
        if (cancelled) return;
        if (j.ok) {
          setProduct(j.data);
          const firstAvailable = j.data.variants.find((v: any) => v.stockCount > 0);
          if (firstAvailable) setSelectedVariant(firstAvailable.id);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productId]);

  // Lock body scroll
  useEffect(() => {
    if (productId) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [productId]);

  const activeImage = product?.images.find(i => i.angle === activeAngle) || product?.images[0];
  const scarcity = product?.promoTags.find(p => p.kind === "SCARCITY");
  const countdown = product?.promoTags.find(p => p.kind === "COUNTDOWN" && p.endsAt);

  // Wishlist state
  const addWishlist = useWishlistStore((s) => s.add);
  const removeWishlist = useWishlistStore((s) => s.remove);
  const isInWishlist = useIsInWishlist(product?.id || "");

  const handleToggleWishlist = async () => {
    if (!product) return;
    if (!user) { toast.error("Sign in to save to your wishlist"); return; }
    if (isInWishlist) {
      removeWishlist(product.id);
      try {
        await fetch(`/api/wishlist?userId=${user.id}&productId=${product.id}`, { method: "DELETE" });
      } catch {}
      toast.success("Removed from wishlist");
    } else {
      addWishlist({
        productId: product.id,
        slug: product.slug,
        title: product.title,
        priceCents: product.basePriceCents,
        currency: product.currency,
        image: activeImage?.url,
        fit: product.fit,
      });
      try {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, productId: product.id }),
        });
      } catch {}
      toast.success("Added to wishlist");
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    const variant = product.variants.find(v => v.id === selectedVariant);
    if (!variant) { toast.error("Select a size"); return; }
    if (variant.stockCount === 0) { toast.error("Out of stock"); return; }
    addItem({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      variantId: variant.id,
      sku: variant.id,
      size: variant.size,
      color: variant.color || undefined,
      priceCents: product.basePriceCents,
      currency: product.currency,
      image: activeImage?.url,
    });
    toast.success("Added to cart");
  };

  return (
    <AnimatePresence>
      {productId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-navy/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            className="fixed inset-x-0 bottom-0 top-0 z-50 mx-auto flex max-w-5xl flex-col bg-white sm:bottom-0 sm:top-auto sm:max-h-[92vh] sm:rounded-t-2xl"
            role="dialog"
            aria-modal="true"
          >
            <header className="flex items-center justify-between border-b border-border p-3">
              <h2 className="line-clamp-1 text-sm font-semibold text-navy">
                {product?.title || "Loading..."}
              </h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-2 text-navy hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : product ? (
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  {/* Left: 3-angle image gallery */}
                  <div className="lg:sticky lg:top-0 lg:self-start">
                    <div className="relative aspect-[3/4] bg-muted">
                      {activeImage && (
                         
                        <img src={activeImage.url} alt={activeImage.altText || product.title}
                          className="h-full w-full object-cover" />
                      )}
                      {/* Scarcity overlay */}
                      {scarcity && (
                        <div className="absolute left-3 top-3">
                          <ScarcityBadge label={scarcity.label} kind={scarcity.kind} />
                        </div>
                      )}
                    </div>
                    {/* 3-angle thumbnails */}
                    <div className="grid grid-cols-3 gap-1 p-2">
                      {["FRONT", "BACK", "SIDE_DETAIL"].map(angle => {
                        const img = product.images.find(i => i.angle === angle);
                        return (
                          <button
                            key={angle}
                            onClick={() => img && setActiveAngle(angle)}
                            disabled={!img}
                            className={`relative aspect-square overflow-hidden rounded-md border-2 transition ${
                              activeAngle === angle ? "border-amber" : "border-transparent"
                            } ${!img ? "opacity-30" : ""}`}
                            aria-label={`${angle} view`}
                          >
                            {img ? (
                               
                              <img src={img.url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center bg-muted text-[10px] text-muted-foreground">
                                No {angle.replace("_", " ").toLowerCase()}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: details + actions */}
                  <div className="p-4 lg:p-6">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {product.fit && (
                        <Badge variant="secondary" className="bg-teal/10 text-teal">
                          {product.fit.toLowerCase()} fit
                        </Badge>
                      )}
                      {product.ratingSummary && product.ratingSummary.count > 0 && (
                        <span className="flex items-center gap-1 text-xs">
                          <Star className="h-3 w-3 fill-amber text-amber" />
                          {product.ratingSummary.avg.toFixed(1)} ({product.ratingSummary.count})
                        </span>
                      )}
                    </div>

                    <h1 className="text-xl font-bold text-navy sm:text-2xl">{product.title}</h1>
                    <p className="mt-1 text-2xl font-bold text-amber">
                      {formatMoney(product.basePriceCents, product.currency)}
                    </p>

                    {/* Countdown */}
                    {countdown?.endsAt && (
                      <div className="mt-3">
                        <CountdownTimer endsAt={countdown.endsAt} />
                      </div>
                    )}

                    {/* Size selector */}
                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-navy">Select size</span>
                        <button className="text-xs text-amber underline">Size guide</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {product.variants.map(v => (
                          <button
                            key={v.id}
                            onClick={() => setSelectedVariant(v.id)}
                            disabled={v.stockCount === 0}
                            className={`min-w-12 rounded-lg border-2 px-3 py-2 text-sm font-medium transition ${
                              selectedVariant === v.id
                                ? "border-amber bg-amber/10 text-navy"
                                : v.stockCount === 0
                                ? "border-border bg-muted/30 text-muted-foreground line-through"
                                : "border-border text-navy hover:border-amber/50"
                            }`}
                          >
                            {v.size}
                            {v.stockCount > 0 && v.stockCount <= 3 && (
                              <span className="ml-1 text-[10px] text-amber">· {v.stockCount} left</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2">
                      <Button
                        onClick={handleAddToCart}
                        className="bg-navy text-white hover:bg-navy-700"
                        size="lg"
                      >
                        Add to cart
                      </Button>
                      <Button
                        onClick={handleToggleWishlist}
                        variant="outline"
                        className={isInWishlist ? "border-amber bg-amber/10 text-amber" : ""}
                        size="lg"
                        aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                      >
                        <Heart className={`h-4 w-4 ${isInWishlist ? "fill-amber text-amber" : ""}`} />
                      </Button>
                      <Button
                        onClick={() => setTryOnOpen(true)}
                        className={
                          isPremium
                            ? "bg-amber text-navy hover:bg-amber-400"
                            : "bg-gradient-to-r from-amber to-amber-400 text-navy hover:brightness-105"
                        }
                        size="lg"
                        aria-label="Try on with AI"
                      >
                        <Wand2 className="h-4 w-4" />
                        <span className="ml-1 hidden sm:inline">Try On</span>
                        {!isPremium && (
                          <span className="ml-1 hidden items-center gap-0.5 rounded-full bg-navy/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider sm:inline-flex">
                            <Crown className="h-2.5 w-2.5" /> Premium
                          </span>
                        )}
                      </Button>
                    </div>
                    {!isPremium && (
                      <p className="mt-2 text-center text-[11px] text-muted-foreground">
                        AI Virtual Try-On renders how this garment looks on <span className="font-medium text-navy">your</span> body.
                      </p>
                    )}

                    {/* Trust strip */}
                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div className="flex flex-col items-center gap-1 text-center">
                        <Truck className="h-4 w-4 text-teal" />
                        <span>Free over $75</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 text-center">
                        <RotateCcw className="h-4 w-4 text-teal" />
                        <span>30-day returns</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 text-center">
                        <Shield className="h-4 w-4 text-teal" />
                        <span>Verified buyer</span>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mt-6 space-y-3 border-t border-border pt-4">
                      <h3 className="text-sm font-semibold text-navy">Description</h3>
                      <p className="text-sm text-navy/80 leading-relaxed">{product.description}</p>
                      {product.material && (
                        <p className="text-xs"><span className="font-medium text-navy">Material:</span> {product.material}</p>
                      )}
                      {product.care && (
                        <p className="text-xs"><span className="font-medium text-navy">Care:</span> {product.care}</p>
                      )}
                    </div>

                    {/* AI Size Assistant */}
                    <div className="mt-6">
                      <AiSizeAssistant productId={product.id} />
                    </div>

                    {/* Complete the look */}
                    <div className="mt-6">
                      <CompleteTheLook productId={product.id} />
                    </div>

                    {/* Reviews */}
                    <div className="mt-6 border-t border-border pt-4">
                      <VerifiedReviewsPdp productId={product.id} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">Failed to load product.</div>
              )}
            </div>
          </motion.div>
        </>
      )}

      {/* AI Virtual Try-On modal (premium-gated inside) */}
      <AnimatePresence>
        {tryOnOpen && productId && product && (
          <VirtualTryOn
            product={{
              id: product.id,
              title: product.title,
              images: product.images.map((i) => ({ url: i.url })),
            }}
            onClose={() => setTryOnOpen(false)}
            onUpgradeRequest={() => {
              setTryOnOpen(false);
              onClose();
              // Surface the account section so the user can complete their body profile
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("acewears:navigate", { detail: "studio" }));
              }
            }}
          />
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
