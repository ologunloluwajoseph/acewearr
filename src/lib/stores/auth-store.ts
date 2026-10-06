"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type UserRole = "CUSTOMER" | "ADMIN" | "STAFF";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isPremium: boolean;
  preferredCurrency: string;
  preferredLanguage: string;
  heightCm?: number;
  weightKg?: number;
  fitPreference?: "SLIM" | "REGULAR" | "RELAXED";
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  hydrated: boolean;
  // actions
  setUser: (user: AuthUser | null, token?: string | null) => void;
  upgradeToPremium: () => void;
  setCurrency: (currency: string) => void;
  setLanguage: (language: string) => void;
  signOut: () => void;
  signInAsDemo: (role: "ADMIN" | "CUSTOMER") => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      hydrated: false,
      setUser: (user, token = null) => set({ user, token }),
      upgradeToPremium: () =>
        set((s) => (s.user ? { user: { ...s.user, isPremium: true } } : s)),
      setCurrency: (currency: string) =>
        set((s) => (s.user ? { user: { ...s.user, preferredCurrency: currency } } : s)),
      setLanguage: (language: string) =>
        set((s) => (s.user ? { user: { ...s.user, preferredLanguage: language } } : s)),
      signOut: () => set({ user: null, token: null }),
      signInAsDemo: (role) => {
        const demoUser: AuthUser =
          role === "ADMIN"
            ? {
                id: "acewears-admin-demo-id",
                email: "admin@acewears.com",
                name: "AceWears Admin",
                role: "ADMIN",
                isPremium: true,
                preferredCurrency: "NGN",
                preferredLanguage: "en",
                heightCm: 178,
                weightKg: 75,
                fitPreference: "REGULAR",
              }
            : {
                id: "acewears-buyer-demo-id",
                email: "buyer@acewears.com",
                name: "Verified Buyer",
                role: "CUSTOMER",
                isPremium: false,
                preferredCurrency: "NGN",
                preferredLanguage: "en",
                heightCm: 180,
                weightKg: 78,
                fitPreference: "SLIM",
              };
        set({ user: demoUser, token: "demo-token-" + Date.now() });
      },
    }),
    {
      name: "acewears-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user, token: s.token } as AuthState),
      onRehydrateStorage: () => (state) => {
        // Use set to trigger re-render once hydration completes
        setTimeout(() => {
          useAuthStore.setState({ hydrated: true });
          if (state) state.hydrated = true;
        }, 0);
      },
    }
  )
);

export const useIsAdmin = () =>
  useAuthStore((s) => s.user?.role === "ADMIN");

export const useIsAuthenticated = () =>
  useAuthStore((s) => !!s.user);

export const useIsPremium = () =>
  useAuthStore((s) => !!s.user?.isPremium);
