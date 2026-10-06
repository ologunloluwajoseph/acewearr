"use client";

import { motion } from "framer-motion";
import { Plus, Flame, Heart, Sparkles } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart-store";
import { useRecentViewsStore } from "@/lib/stores/recent-views-store";
import { useWishlistStore, useIsInWishlist } from "@/lib/stores/wishlist-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useGlobalSettings, useCurrency } from "@/lib/stores/settings-store";
import { EXCHANGE_RATES, CURRENCY_SYMBOLS, CURRENCIES } from "@/lib/currency";
import { toast } from "sonner";

export type ProductCardProps = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  basePriceCents: number;
  currency: string;
  creditSurchargePercent?: number;
  fit?: string | null;
  material?: string | null;
  images: { url: string; altText?: string | null; angle: string }[];
  variants: { id: string; size: string; stockCount: number; color?: string | null }[];
  promoTags?: { label: string; kind: string }[];
  category?: { slug: string; name: string };
  onOpen?: (id: string) => void;
};

export function ProductCard({ product, onOpen }: { product: ProductCardProps; onOpen?: (id: string) => void }) {
  const addItem = useCartStore((s) => s.addItem);
  const pushRecent = useRecentViewsStore((s) => s.pushView);
  const addWishlist = useWishlistStore((s) => s.add);
  const removeWishlist = useWishlistStore((s) => s.remove);
  const isInWishlist = useIsInWishlist(product.id);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";
  // Live currency from global store — updates instantly when changed in Settings
  const currency = useCurrency();

  const frontImage = product.images.find((i) => i.angle === "FRONT") || product.images[0];
  const scarcity = product.promoTags?.find((p) => p.kind === "SCARCITY");
  const firstAvailable = product.variants.find((v) => v.stockCount > 0);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firstAvailable) {
      toast.error("Out of stock");
      return;
    }
    addItem({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      variantId: firstAvailable.id,
      size: firstAvailable.size,
      color: firstAvailable.color || undefined,
      priceCents: product.basePriceCents,
      currency: product.currency,
      image: frontImage?.url,
    });
    toast.success("Added to cart");
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Sign in to save to your wishlist");
      return;
    }
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
        image: frontImage?.url,
        category: product.category?.slug,
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

  const handleOpen = () => {
    pushRecent({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      image: frontImage?.url,
      priceCents: product.basePriceCents,
    });
    onOpen?.(product.id);
  };

  return (
    <motion.article
      whileHover={{ y: -4 }}
      onClick={handleOpen}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-white transition-shadow hover:shadow-lg"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {frontImage ? (
          <img
            src={frontImage.url}
            alt={frontImage.altText || product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : null}

        {/* Scarcity badge */}
        {scarcity && (
          <div className="absolute left-2 top-2 z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy">
              <Flame className="h-3 w-3" />
              {scarcity.label}
            </span>
          </div>
        )}

        {/* Wishlist heart toggle — top right */}
        <button
          onClick={handleToggleWishlist}
          aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isInWishlist}
          className={`absolute right-2 top-2 z-10 rounded-full p-2 backdrop-blur transition ${
            isInWishlist
              ? "bg-amber text-navy shadow-md"
              : "bg-black/40 text-white hover:bg-black/60"
          }`}
        >
          <Heart className={`h-4 w-4 ${isInWishlist ? "fill-current" : ""}`} />
        </button>

        {/* Quick-add button — appears on hover */}
        <button
          onClick={handleQuickAdd}
          disabled={!firstAvailable}
          aria-label="Quick add to cart"
          className="absolute bottom-2 right-2 z-10 rounded-full bg-navy p-2.5 text-white shadow-md transition hover:bg-navy-700 disabled:cursor-not-allowed disabled:bg-muted-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>

        {/* Out-of-stock overlay */}
        {!firstAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="rounded bg-navy px-3 py-1 text-xs font-bold uppercase text-white">
              Sold out
            </span>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="line-clamp-1 text-sm font-semibold text-navy dark:text-white">{product.title}</h3>
          <div className="shrink-0 text-right">
            {/* Primary price in user's selected currency */}
            <span className="block text-sm font-bold text-amber">
              {(() => {
                const rate = EXCHANGE_RATES[currency] || 1;
                const amount = (product.basePriceCents / 100) * rate;
                const sym = CURRENCY_SYMBOLS[currency] || "$";
                return currency === "NGN" ? `${sym}${Math.round(amount).toLocaleString()}` : `${sym}${amount.toFixed(2)}`;
              })()}
            </span>
            {/* Secondary: always show USD below */}
            {currency !== "USD" && (
              <span className="block text-[10px] text-muted-foreground">
                ${(product.basePriceCents / 100).toFixed(2)} USD
              </span>
            )}
          </div>
        </div>
        {product.material && (
          <p className="line-clamp-1 text-xs text-muted-foreground">{product.material}</p>
        )}
        {/* Credit surcharge badge — ADMIN ONLY */}
        {isAdmin && product.creditSurchargePercent ? (
          <p className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-teal">
            <Sparkles className="h-2.5 w-2.5" />
            +{product.creditSurchargePercent}% surcharge → credit eligibility
          </p>
        ) : null}
        <div className="mt-1 flex flex-wrap gap-1">
          {product.fit && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-navy">
              {product.fit.toLowerCase()} fit
            </span>
          )}
          {product.variants.slice(0, 4).map((v) => (
            <span
              key={v.id}
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                v.stockCount > 0 ? "bg-muted text-navy" : "bg-muted/50 text-muted-foreground line-through"
              }`}
            >
              {v.size}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}
