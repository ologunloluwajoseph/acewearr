"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, RefreshCw, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

// ============================================================================
//  AppUpdateChecker
//  - Checks /api/app/update-check on mount
//  - If update available: shows a slide-up banner with changelog
//  - If mustUpdate (below min required): shows a FULL SCREEN forced update
//  - Can be triggered manually by developers bumping APP_VERSIONS
// ============================================================================

const UPDATE_CHECK_KEY = "acewears-last-update-check";
const UPDATE_DISMISS_KEY = "acewears-update-dismissed";
const CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes

export function AppUpdateChecker() {
  const [updateData, setUpdateData] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const checkForUpdates = async () => {
      // Don't check too frequently
      const lastCheck = localStorage.getItem(UPDATE_CHECK_KEY);
      if (lastCheck && Date.now() - parseInt(lastCheck) < CHECK_INTERVAL) return;

      localStorage.setItem(UPDATE_CHECK_KEY, String(Date.now()));

      // Get current app version (stored in localStorage by the app shell)
      const clientVersion = localStorage.getItem("acewears-app-version") || "1.0.0";
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      const platform = isStandalone ? "pwa" : "web";

      try {
        const res = await fetch(`/api/app/update-check?clientVersion=${clientVersion}&platform=${platform}`);
        const j = await res.json();
        if (j.ok && j.data.hasUpdate) {
          // Check if user dismissed this version
          const dismissed = localStorage.getItem(UPDATE_DISMISS_KEY);
          if (dismissed === j.data.latestVersion && !j.data.mustUpdate) return;

          setUpdateData(j.data);
          setShowBanner(true);
        }
      } catch {
        // Silent fail — don't bother user with update errors
      }
    };

    // Check on mount + periodically
    checkForUpdates();
    const interval = setInterval(checkForUpdates, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const handleUpdate = () => {
    if (updateData?.mustUpdate) {
      // For PWA: unregister SW + reload to get latest
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(r => r.unregister());
      });
      caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
      setTimeout(() => window.location.reload(), 500);
    } else {
      // Normal update: just reload
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    if (updateData) {
      localStorage.setItem(UPDATE_DISMISS_KEY, updateData.latestVersion);
    }
    setShowBanner(false);
  };

  if (!showBanner || !updateData) return null;

  // === FORCED UPDATE (below minimum version) ===
  if (updateData.mustUpdate) {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-navy p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
        >
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber/15">
            <Shield className="h-7 w-7 text-amber" />
          </div>
          <h2 className="text-lg font-bold text-navy">Update Required</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Version {updateData.latestVersion} is required to continue. Your version ({updateData.currentVersion}) is no longer supported.
          </p>
          <Button onClick={handleUpdate} className="mt-4 w-full bg-amber text-navy hover:bg-amber-400" size="lg">
            <RefreshCw className="mr-2 h-4 w-4" /> Update Now
          </Button>
        </motion.div>
      </div>
    );
  }

  // === OPTIONAL UPDATE BANNER ===
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-3 lg:bottom-6"
      >
        <div className="overflow-hidden rounded-2xl border border-amber/30 bg-navy text-white shadow-2xl">
          <div className="flex items-start gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber/20">
              <Sparkles className="h-5 w-5 text-amber" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">Update Available — v{updateData.latestVersion}</p>
                <button onClick={handleDismiss} aria-label="Dismiss" className="rounded-full p-1 text-white/50 hover:bg-white/10">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-0.5 text-xs text-white/70">{updateData.title}</p>

              {/* Changelog (first 3 items) */}
              <ul className="mt-2 space-y-0.5">
                {updateData.changelog.slice(0, 3).map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-white/60">
                    <span className="mt-0.5 text-amber">·</span>
                    {item}
                  </li>
                ))}
                {updateData.changelog.length > 3 && (
                  <li className="text-[11px] text-white/40">+ {updateData.changelog.length - 3} more improvements</li>
                )}
              </ul>

              <div className="mt-3 flex gap-2">
                <Button onClick={handleUpdate} size="sm" className="bg-amber text-navy hover:bg-amber-400">
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Update ({updateData.size})
                </Button>
                <Button onClick={handleDismiss} size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  Later
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
