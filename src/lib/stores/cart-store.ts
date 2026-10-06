"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";

// ---------- Types ----------
export type CartLine = {
  id: string;            // line id (uuid)
  productId: string;
  slug: string;
  title: string;
  variantId?: string;
  sku?: string;
  size?: string;
  color?: string;
  priceCents: number;
  currency: string;
  image?: string;
  quantity: number;
  addedAt: number;
};

export type CartState = {
  lines: CartLine[];
  freeShippingThresholdCents: number;
  isOpen: boolean;
  // actions
  addItem: (line: Omit<CartLine, "id" | "addedAt" | "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

export const FREE_SHIPPING_THRESHOLD = 7500; // $75 USD

function uid() {
  return "xxxx-xxxx-xxxx".replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      freeShippingThresholdCents: FREE_SHIPPING_THRESHOLD,
      isOpen: false,
      addItem: ({ quantity = 1, ...partial }) => {
        const existing = get().lines.find(
          (l) => l.productId === partial.productId && l.variantId === partial.variantId
        );
        if (existing) {
          set({
            lines: get().lines.map((l) =>
              l.id === existing.id ? { ...l, quantity: l.quantity + quantity } : l
            ),
            isOpen: true,
          });
          return;
        }
        const line: CartLine = {
          id: uid(),
          addedAt: Date.now(),
          quantity,
          ...partial,
        };
        set({ lines: [...get().lines, line], isOpen: true });
      },
      removeItem: (id) => set({ lines: get().lines.filter((l) => l.id !== id) }),
      updateQuantity: (id, qty) =>
        set({
          lines: get()
            .lines.map((l) => (l.id === id ? { ...l, quantity: Math.max(1, qty) } : l))
            .filter((l) => l.quantity > 0),
        }),
      clear: () => set({ lines: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set({ isOpen: !get().isOpen }),
    }),
    {
      name: "acewears-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        lines: state.lines,
        freeShippingThresholdCents: state.freeShippingThresholdCents,
      } as CartState),
    }
  )
);

export const useCartCount = () =>
  useCartStore((s) => s.lines.reduce((n, l) => n + l.quantity, 0));

export const useCartSubtotalCents = () =>
  useCartStore((s) =>
    s.lines.reduce((sum, l) => sum + l.priceCents * l.quantity, 0)
  );

export const useFreeShippingProgress = () =>
  useCartStore(
    useShallow((s) => {
      const subtotal = s.lines.reduce((sum, l) => sum + l.priceCents * l.quantity, 0);
      const remaining = Math.max(0, s.freeShippingThresholdCents - subtotal);
      const pct = Math.min(100, Math.round((subtotal / s.freeShippingThresholdCents) * 100));
      return { subtotal, remaining, pct, threshold: s.freeShippingThresholdCents };
    })
  );
