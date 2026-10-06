"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type RecentView = {
  productId: string;
  slug: string;
  title: string;
  image?: string;
  priceCents: number;
  viewedAt: number;
};

type RecentViewState = {
  views: RecentView[];
  pushView: (view: Omit<RecentView, "viewedAt">) => void;
  clear: () => void;
};

const MAX_VIEWS = 12;

export const useRecentViewsStore = create<RecentViewState>()(
  persist(
    (set, get) => ({
      views: [],
      pushView: (view) => {
        const existing = get().views.filter((v) => v.productId !== view.productId);
        set({
          views: [{ ...view, viewedAt: Date.now() }, ...existing].slice(0, MAX_VIEWS),
        });
      },
      clear: () => set({ views: [] }),
    }),
    {
      name: "acewears-recent-views",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ---- PWA install suppression persistence (7-day timer) ----
type PwaSuppressionState = {
  dismissedAt: number | null;          // epoch ms when user dismissed
  installed: boolean;
  dismiss: () => void;
  markInstalled: () => void;
  reset: () => void;
  // 7 days in ms
  isSuppressed: () => boolean;
};

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export const usePwaSuppressionStore = create<PwaSuppressionState>()(
  persist(
    (set, get) => ({
      dismissedAt: null,
      installed: false,
      dismiss: () => set({ dismissedAt: Date.now() }),
      markInstalled: () => set({ installed: true, dismissedAt: null }),
      reset: () => set({ dismissedAt: null, installed: false }),
      isSuppressed: () => {
        const s = get();
        if (s.installed) return true;
        if (!s.dismissedAt) return false;
        return Date.now() - s.dismissedAt < SEVEN_DAYS;
      },
    }),
    {
      name: "acewears-pwa-suppression",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
