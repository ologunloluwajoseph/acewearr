"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type WishlistLine = {
  id: string;            // wishlist item id (from DB) or temp client id
  productId: string;
  slug: string;
  title: string;
  priceCents: number;
  currency: string;
  image?: string;
  category?: string;
  fit?: string | null;
  note?: string | null;
  addedAt: number;
};

type WishlistState = {
  items: WishlistLine[];
  hydrated: boolean;
  // actions
  setItems: (items: WishlistLine[]) => void;
  add: (item: Omit<WishlistLine, "id" | "addedAt">) => void;
  remove: (productId: string) => void;
  updateNote: (productId: string, note: string) => void;
  clear: () => void;
  has: (productId: string) => boolean;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,
      setItems: (items) => set({ items }),
      add: (item) => {
        // Avoid duplicates
        if (get().items.some((i) => i.productId === item.productId)) return;
        const line: WishlistLine = {
          id: `local-${item.productId}-${Date.now()}`,
          addedAt: Date.now(),
          ...item,
        };
        set({ items: [line, ...get().items] });
      },
      remove: (productId) =>
        set({ items: get().items.filter((i) => i.productId !== productId) }),
      updateNote: (productId, note) =>
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, note } : i
          ),
        }),
      clear: () => set({ items: [] }),
      has: (productId) => get().items.some((i) => i.productId === productId),
    }),
    {
      name: "acewears-wishlist",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items } as WishlistState),
      onRehydrateStorage: () => (state) => {
        setTimeout(() => {
          useWishlistStore.setState({ hydrated: true });
          if (state) state.hydrated = true;
        }, 0);
      },
    }
  )
);

export const useWishlistCount = () => useWishlistStore((s) => s.items.length);
export const useIsInWishlist = (productId: string) =>
  useWishlistStore((s) => s.items.some((i) => i.productId === productId));
