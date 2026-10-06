"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Share2, Wand2, X, Loader2, Sparkles, Trash2,
  Eye, Crown, ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore, useIsPremium } from "@/lib/stores/auth-store";
import { useWishlistStore } from "@/lib/stores/wishlist-store";
import { VirtualTryOn } from "@/components/acewears/virtual-try-on";
import { ShareWishlistDialog } from "@/components/acewears/share-wishlist-dialog";
import { toast } from "sonner";
import { formatMoney } from "@/lib/utils";

type WishlistItem = {
  id: string;
  productId: string;
  slug: string;
  title: string;
  priceCents: number;
  currency: string;
  fit?: string | null;
  material?: string | null;
  image?: string | null;
  category?: string | null;
  categoryName?: string | null;
  note?: string | null;
  addedAt: string;
};

type TryOnResult = {
  resultUrl: string;
  promptUsed: string;
  cached: boolean;
  durationMs?: number;
};

export function WishlistSection({ onOpenProduct }: { onOpenProduct: (id: string) => void }) {
  const user = useAuthStore((s) => s.user);
  const isPremium = useIsPremium();
  const hydrated = useAuthStore((s) => s.hydrated);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [tryOnProduct, setTryOnProduct] = useState<{ id: string; title: string; image?: string } | null>(null);

  // Local store mirror for instant heart-toggle feedback
  const addLocal = useWishlistStore((s) => s.add);
  const removeLocal = useWishlistStore((s) => s.remove);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/wishlist?userId=${user.id}`);
      const j = await res.json();
      if (j.ok) {
        setItems(j.data.map((row: any) => ({
          id: row.id,
          productId: row.product.id,
          slug: row.product.slug,
          title: row.product.title,
          priceCents: row.product.basePriceCents,
          currency: row.product.currency,
          fit: row.product.fit,
          material: row.product.material,
          image: row.product.images[0]?.url || null,
          category: row.product.category?.slug || null,
          categoryName: row.product.category?.name || null,
          note: row.note,
          addedAt: row.createdAt,
        })));
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (hydrated) load();
  }, [hydrated, load]);

  const handleRemove = async (productId: string) => {
    if (!user) return;
    removeLocal(productId);
    setItems((prev) => prev.filter((i) => i.productId !== productId));
    try {
      await fetch(`/api/wishlist?userId=${user.id}&productId=${productId}`, { method: "DELETE" });
      toast.success("Removed from wishlist");
    } catch {
      toast.error("Failed to remove");
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <Heart className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h2 className="text-xl font-bold text-navy">Sign in to view your wishlist</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Save items you love and share your wishlist with the world.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-navy">
            <Heart className="h-6 w-6 fill-amber text-amber" /> My Wishlist
          </h1>
          <p className="text-xs text-muted-foreground">
            {items.length} item{items.length === 1 ? "" : "s"} · Publicly viewable · Share anywhere
          </p>
        </div>
        {items.length > 0 && (
          <Button onClick={() => setShareOpen(true)} className="bg-amber text-navy hover:bg-amber-400">
            <Share2 className="mr-1.5 h-4 w-4" /> Share wishlist
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Heart className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="text-base font-semibold text-navy">Your wishlist is empty</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap the heart icon on any product to save it here.
          </p>
        </div>
      ) : (
        <>
          {/* Premium try-on hint */}
          {isPremium && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber/30 bg-amber/5 p-3 text-xs text-navy">
              <Sparkles className="h-4 w-4 text-amber" />
              <span>
                <strong>Premium active:</strong> tap the Wand2 icon on any wishlist item to render how it looks on you.
              </span>
            </div>
          )}

          {/* Wishlist grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <motion.div
                key={`wl-${item.id}`}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-white"
              >
                {/* Image */}
                <div
                  onClick={() => onOpenProduct(item.productId)}
                  className="relative aspect-[3/4] cursor-pointer overflow-hidden bg-muted"
                >
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover transition group-hover:scale-105" />
                  ) : null}
                  {/* Category chip */}
                  {item.categoryName && (
                    <span className="absolute left-2 top-2 rounded-full bg-navy/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur">
                      {item.categoryName}
                    </span>
                  )}
                </div>

                {/* Action bar overlay */}
                <div className="absolute right-2 top-2 flex flex-col gap-1.5">
                  {isPremium && (
                    <button
                      onClick={() => setTryOnProduct({ id: item.productId, title: item.title, image: item.image || undefined })}
                      aria-label={`Try on ${item.title}`}
                      className="rounded-full bg-amber p-2 text-navy shadow-md transition hover:bg-amber-400"
                      title="AI Try-On"
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleRemove(item.productId)}
                    aria-label={`Remove ${item.title}`}
                    className="rounded-full bg-white/90 p-2 text-destructive shadow-md backdrop-blur transition hover:bg-white"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Meta */}
                <div className="flex flex-1 flex-col gap-1 p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="line-clamp-1 text-sm font-semibold text-navy">{item.title}</h3>
                    <span className="shrink-0 text-sm font-bold text-amber">
                      {formatMoney(item.priceCents, item.currency)}
                    </span>
                  </div>
                  {item.material && (
                    <p className="line-clamp-1 text-xs text-muted-foreground">{item.material}</p>
                  )}
                  {item.note && (
                    <p className="mt-1 line-clamp-2 rounded bg-muted/40 px-2 py-1 text-[11px] italic text-muted-foreground">
                      &ldquo;{item.note}&rdquo;
                    </p>
                  )}
                  <div className="mt-2 flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenProduct(item.productId)}
                      className="h-7 flex-1 text-[11px]"
                    >
                      <Eye className="mr-1 h-3 w-3" /> View
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Share dialog */}
      <ShareWishlistDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        items={items.map((i) => ({
          productId: i.productId,
          title: i.title,
          image: i.image,
          priceCents: i.priceCents,
          currency: i.currency,
          note: i.note,
        }))}
        userPhoto={null /* could fetch from body profile, but keep simple */}
        userName={user.name}
      />

      {/* Try-on modal */}
      <AnimatePresence>
        {tryOnProduct && (
          <VirtualTryOn
            product={{
              id: tryOnProduct.id,
              title: tryOnProduct.title,
              images: tryOnProduct.image ? [{ url: tryOnProduct.image }] : [],
            }}
            onClose={() => setTryOnProduct(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
//  DiscoverWishlists — public browser for all users' wishlists
// ============================================================================
export function DiscoverWishlists({ onOpenProduct }: { onOpenProduct: (id: string) => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/wishlists?limit=20")
      .then((r) => r.json())
      .then((j) => { if (j.ok) setUsers(j.data); })
      .finally(() => setLoading(false));
  }, []);

  const loadUserWishlist = async (userId: string) => {
    const res = await fetch(`/api/wishlists/${userId}`);
    const j = await res.json();
    if (j.ok) setSelectedUser(j.data);
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-navy">
          <Eye className="h-6 w-6 text-amber" /> Discover Wishlists
        </h1>
        <p className="text-xs text-muted-foreground">
          Every AceWears wishlist is public · Browse what others are coveting
        </p>
      </div>

      {users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No public wishlists yet. Be the first to add items!
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => (
            <motion.div
              key={u.userId}
              whileHover={{ y: -2 }}
              className="cursor-pointer overflow-hidden rounded-xl border border-border bg-white"
              onClick={() => loadUserWishlist(u.userId)}
            >
              <div className="flex items-center gap-3 border-b border-border bg-muted/30 p-3">
                <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-amber bg-white">
                  {u.userPhoto ? (
                    <img src={u.userPhoto} alt={u.userName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-amber/20 text-amber">
                      <Heart className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-navy">{u.userName}</p>
                  <p className="text-xs text-muted-foreground">{u.itemCount} items</p>
                </div>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-4 gap-1 p-2">
                {u.previewItems.slice(0, 4).map((item: any, i: number) => (
                  <div key={i} className="aspect-square overflow-hidden rounded-md bg-muted">
                    {item.image && (
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                    )}
                  </div>
                ))}
                {u.previewItems.length === 0 && (
                  <div className="col-span-4 py-6 text-center text-[11px] text-muted-foreground">Empty wishlist</div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Selected user's wishlist detail modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedUser(null)}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-navy/60 backdrop-blur-sm p-3"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
              <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-gradient-to-r from-navy to-navy-700 px-4 py-3 text-white">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-amber">
                    {selectedUser.user.photo ? (
                      <img src={selectedUser.user.photo} alt={selectedUser.user.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-amber/20 text-amber">
                        <Heart className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold">{selectedUser.user.name}&apos;s Wishlist</h2>
                    <p className="text-[11px] text-white/70">{selectedUser.user.itemCount} items · Public</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} aria-label="Close" className="rounded-full p-1.5 hover:bg-white/10">
                  <X className="h-5 w-5" />
                </button>
              </header>
              <div className="p-4">
                {selectedUser.items.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">This wishlist is empty.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {selectedUser.items.map((item: any) => (
                      <div
                        key={item.id}
                        onClick={() => { onOpenProduct(item.productId); setSelectedUser(null); }}
                        className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-white hover:shadow-md"
                      >
                        <div className="aspect-[3/4] overflow-hidden bg-muted">
                          {item.image && (
                            <img src={item.image} alt={item.title} className="h-full w-full object-cover transition group-hover:scale-105" />
                          )}
                        </div>
                        <div className="p-2">
                          <p className="line-clamp-1 text-xs font-semibold text-navy">{item.title}</p>
                          <p className="text-xs font-bold text-amber">{formatMoney(item.priceCents, item.currency)}</p>
                          {item.note && (
                            <p className="mt-1 line-clamp-2 text-[10px] italic text-muted-foreground">&ldquo;{item.note}&rdquo;</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
