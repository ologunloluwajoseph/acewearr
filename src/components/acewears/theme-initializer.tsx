"use client";

import { useEffect } from "react";
import { useGlobalSettings } from "@/lib/stores/settings-store";

/**
 * ThemeInitializer — mounts once at the root layout level.
 * Applies the dark class to <html> on mount AND whenever the theme changes.
 * This ensures dark mode works immediately on page load (before React renders)
 * and responds to toggles in real-time.
 */
export function ThemeInitializer() {
  const theme = useGlobalSettings((s) => s.theme);
  const hydrated = useGlobalSettings((s) => s.hydrated);

  // Apply theme class whenever it changes
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Inline script to set the class BEFORE React hydrates (prevents flash)
  // This runs once on mount
  useEffect(() => {
    // Already handled by the onRehydrateStorage callback, but double-ensure
    if (hydrated) {
      const root = document.documentElement;
      if (theme === "dark") root.classList.add("dark");
      else root.classList.remove("dark");
    }
  }, [hydrated, theme]);

  return null;
}
