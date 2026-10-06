"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ============================================================================
//  Global UI Settings Store
//  — Currency: drives ALL price displays across the site
//  — Language: drives ALL text labels via the i18n dictionary
//  — Dark mode: toggles `dark` class on <html>
//  All persisted to localStorage so choices survive reloads.
// ============================================================================

export type CurrencyCode = "USD" | "NGN" | "EUR" | "GBP";
export type LanguageCode = "en" | "fr" | "es" | "de" | "zh" | "yo" | "ha" | "ig" | "pt" | "ar" | "sw";
export type ThemeMode = "light" | "dark";

type GlobalSettingsState = {
  currency: CurrencyCode;
  language: LanguageCode;
  theme: ThemeMode;
  hydrated: boolean;
  // actions
  setCurrency: (c: CurrencyCode) => void;
  setLanguage: (l: LanguageCode) => void;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;
};

export const useGlobalSettings = create<GlobalSettingsState>()(
  persist(
    (set, get) => ({
      currency: "NGN",
      language: "en",
      theme: "light",
      hydrated: false,
      setCurrency: (currency) => set({ currency }),
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => {
        set({ theme });
        // Apply dark class immediately
        if (typeof document !== "undefined") {
          if (theme === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      },
      toggleTheme: () => {
        const newTheme = get().theme === "dark" ? "light" : "dark";
        get().setTheme(newTheme);
      },
    }),
    {
      name: "acewears-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ currency: s.currency, language: s.language, theme: s.theme } as GlobalSettingsState),
      onRehydrateStorage: () => (state) => {
        // Apply theme on hydration
        if (state) {
          if (typeof document !== "undefined") {
            if (state.theme === "dark") {
              document.documentElement.classList.add("dark");
            } else {
              document.documentElement.classList.remove("dark");
            }
          }
          // Mark as hydrated on next tick so React re-renders
          setTimeout(() => useGlobalSettings.setState({ hydrated: true }), 0);
        }
      },
    }
  )
);

// Selectors
export const useCurrency = () => useGlobalSettings((s) => s.currency);
export const useLanguage = () => useGlobalSettings((s) => s.language);
export const useTheme = () => useGlobalSettings((s) => s.theme);
export const useIsDark = () => useGlobalSettings((s) => s.theme === "dark");
