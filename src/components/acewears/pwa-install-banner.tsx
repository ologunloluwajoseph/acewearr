"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Sparkles } from "lucide-react";
import { usePwaSuppressionStore } from "@/lib/stores/recent-views-store";

/**
 * PwaInstallBanner
 * ----------------------------------------------------------------------------
 * Behaviour per spec:
 *  - Non-intrusive bottom slide-up sheet.
 *  - Triggers every 15 seconds ONLY IF:
 *      (a) the PWA `beforeinstallprompt` event has fired (i.e. it's installable)
 *      (b) not already installed (standalone display mode)
 *      (c) not previously dismissed within the last 7 days (localStorage)
 *  - Saves dismissal state to localStorage via the zustand persisted store
 *    `acewears-pwa-suppression`. 7-day suppression timer prevents re-showing
 *    to preserve Web Vitals (no thrashy re-renders).
 *  - Triggers also re-fire on route change (only every 15s, debounced).
 */

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const TRIGGER_INTERVAL_MS = 15_000; // 15 seconds per spec

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const dismiss = usePwaSuppressionStore((s) => s.dismiss);
  const markInstalled = usePwaSuppressionStore((s) => s.markInstalled);
  const isSuppressed = usePwaSuppressionStore((s) => s.isSuppressed);

  // 1) Capture the beforeinstallprompt event
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect if already running as installed PWA (display-mode: standalone)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari fallback
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      markInstalled();
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault(); // block the default browser mini-infobar
      setDeferredPrompt(e as BIPEvent);
    };
    const installedHandler = () => {
      markInstalled();
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    // Listen for manual trigger (from AppOnlyGate install button)
    const triggerHandler = () => {
      if (deferredPrompt) {
        setVisible(true);
      } else {
        // If no beforeinstallprompt (e.g. iOS), show instructions
        alert("To install AceWears:\n\nOn iPhone/iPad: Tap the Share button → 'Add to Home Screen'\n\nOn Android: Tap the menu (⋮) → 'Install app'\n\nOn Desktop: Click the install icon in the address bar.");
      }
    };
    window.addEventListener("acewears:trigger-install", triggerHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
      window.removeEventListener("acewears:trigger-install", triggerHandler);
    };
  }, [markInstalled, deferredPrompt]);

  // 2) 15-second trigger timer — only fires when not suppressed and prompt is available
  useEffect(() => {
    if (!deferredPrompt) return;
    if (isSuppressed()) return;

    const tick = () => {
      if (!usePwaSuppressionStore.getState().isSuppressed()) {
        setVisible(true);
      }
    };

    // Initial fire after 15s, then re-check every 15s (per spec)
    const id = window.setInterval(tick, TRIGGER_INTERVAL_MS);
    // Also kick one off after the first 15s (in case the user lingers)
    const initial = window.setTimeout(tick, TRIGGER_INTERVAL_MS);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(initial);
    };
  }, [deferredPrompt, isSuppressed]);

  // 3) Handle the install click
  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      markInstalled();
      setVisible(false);
    } else {
      dismiss();
      setVisible(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt, dismiss, markInstalled]);

  // 4) Dismiss handler — sets 7-day suppression
  const handleDismiss = useCallback(() => {
    dismiss();
    setVisible(false);
  }, [dismiss]);

  return (
    <AnimatePresence>
      {visible && deferredPrompt && (
        <motion.div
          key="pwa-sheet"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Install AceWears app"
        >
          <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-amber/30 bg-navy text-white shadow-2xl">
            <div className="flex items-start gap-3 p-4">
              {/* Brand icon */}
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white">
                { }
                <img src="/acewears-icon.svg" alt="" className="h-full w-full" />
              </div>

              <div className="flex-1 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber" />
                  <p className="text-xs font-medium uppercase tracking-wider text-amber">
                    Install AceWears
                  </p>
                </div>
                <h3 className="mt-1 text-sm font-semibold text-balance">
                  Add to your home screen
                </h3>
                <p className="mt-0.5 text-xs text-white/70 text-balance">
                  Faster checkout, shoppable reels offline, and exclusive drop alerts.
                </p>
              </div>

              <button
                onClick={handleDismiss}
                aria-label="Dismiss install prompt"
                className="rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-2 border-t border-white/10 bg-navy-700 px-4 py-3">
              <button
                onClick={handleDismiss}
                className="flex-1 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/5"
              >
                Not now
              </button>
              <button
                onClick={handleInstall}
                className="flex flex-[1.5] items-center justify-center gap-1.5 rounded-lg bg-amber px-3 py-2 text-xs font-bold text-navy shadow-lg transition hover:bg-amber-400 active:scale-[0.98]"
              >
                <Download className="h-3.5 w-3.5" />
                Install app
              </button>
            </div>
            <p className="bg-navy-800 px-4 py-1.5 text-center text-[10px] text-white/40">
              You can dismiss this for 7 days ·{" "}
              <button onClick={handleDismiss} className="underline">
                don&apos;t show again
              </button>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
