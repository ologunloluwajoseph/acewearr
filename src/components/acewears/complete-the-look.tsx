"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/stores/cart-store";
import { toast } from "sonner";
import { formatMoney } from "@/lib/utils";

type Recommendation = {
  id: string;
  slug: string;
  title: string;
  image?: string;
  priceCents: number;
  currency: string;
  category: string;
  fit?: string | null;
};

const CATEGORY_LABEL: Record<string, string> = {
  tops: "Top", bottoms: "Bottom", shoes: "Shoes",
  accessories: "Accessory", outerwear: "Outerwear",
};

export function CompleteTheLook({ productId }: { productId: string }) {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    fetch(`/api/complete-the-look?productId=${productId}`)
      .then(r => r.json())
      .then(j => { if (j.ok) setItems(j.data); })
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (items.length === 0) return null;

  const handleAdd = (item: Recommendation) => {
    addItem({
      productId: item.id,
      slug: item.slug,
      title: item.title,
      priceCents: item.priceCents,
      currency: item.currency,
      image: item.image,
    });
    toast.success(`${item.title} added to cart`);
  };

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber" />
        <h3 className="text-sm font-bold text-navy">Complete the Look</h3>
        <span className="text-xs text-muted-foreground">· AI cross-sell</span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative flex gap-2 rounded-lg border border-border bg-white p-2"
          >
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
              {item.image ? (
                 
                <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber">
                {CATEGORY_LABEL[item.category] || item.category}
              </span>
              <p className="line-clamp-2 text-xs font-medium text-navy">{item.title}</p>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-sm font-bold text-navy">{formatMoney(item.priceCents, item.currency)}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-navy hover:bg-amber hover:text-navy"
                  onClick={() => handleAdd(item)}
                  aria-label={`Add ${item.title}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
