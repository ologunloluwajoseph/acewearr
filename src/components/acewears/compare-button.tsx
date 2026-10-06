"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitCompare, X, Check } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart-store";

type CompareItem = {
  id: string;
  title: string;
  image?: string;
  basePriceCents: number;
  fit?: string | null;
  material?: string | null;
  variants: { size: string; stockCount: number }[];
};

const MAX_COMPARE = 3;

export function CompareButton({ product, onCompare }: { product: any; onCompare: (items: CompareItem[]) => void }) {
  const [compareList, setCompareList] = useState<CompareItem[]>([]);
  const [showBar, setShowBar] = useState(false);

  const addToCompare = () => {
    if (compareList.length >= MAX_COMPARE) {
      return;
    }
    if (compareList.some(i => i.id === product.id)) {
      setCompareList(compareList.filter(i => i.id !== product.id));
      setShowBar(compareList.length > 1);
      return;
    }
    const item: CompareItem = {
      id: product.id,
      title: product.title,
      image: product.images?.[0]?.url,
      basePriceCents: product.basePriceCents,
      fit: product.fit,
      material: product.material,
      variants: product.variants?.map((v: any) => ({ size: v.size, stockCount: v.stockCount })) || [],
    };
    const newList = [...compareList, item];
    setCompareList(newList);
    setShowBar(newList.length >= 1);
  };

  const isInCompare = compareList.some(i => i.id === product.id);

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); addToCompare(); }}
        className={`absolute bottom-2 left-2 z-10 rounded-full p-2 shadow-md transition ${
          isInCompare ? "bg-teal text-white" : "bg-navy/70 text-white backdrop-blur hover:bg-navy"
        }`}
        aria-label="Compare"
      >
        <GitCompare className="h-3.5 w-3.5" />
      </button>

      <AnimatePresence>
        {showBar && compareList.length >= 1 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-16 left-1/2 z-40 -translate-x-1/2 rounded-2xl border border-border bg-white p-3 shadow-2xl lg:bottom-6"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-navy">Compare ({compareList.length}/{MAX_COMPARE})</span>
              {compareList.map(item => (
                <div key={item.id} className="flex items-center gap-1">
                  {item.image && (
                    <div className="h-8 w-8 overflow-hidden rounded bg-muted">
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <button
                    onClick={() => setCompareList(compareList.filter(i => i.id !== item.id))}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {compareList.length >= 2 && (
                <button
                  onClick={() => { onCompare(compareList); setShowBar(false); }}
                  className="rounded-lg bg-amber px-3 py-1.5 text-xs font-bold text-navy hover:bg-amber-400"
                >
                  Compare now
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
