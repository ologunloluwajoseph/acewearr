"use client";

import { useEffect } from "react";

/** Registers /sw.js on mount (client-only) and forces the latest version
 *  to take over immediately, bypassing stale caches. */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let refreshing = false;
    let registration: ServiceWorkerRegistration | null = null;

    const onLoad = async () => {
      try {
        registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

        // If a new SW is waiting to activate, force it immediately.
        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        // Listen for new SWs taking over — reload ONCE so the page picks up
        // the latest HTML/assets from the new SW's cache.
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (refreshing) return;
          refreshing = true;
          // Append a cache-buster so the reload bypasses any HTTP cache too.
          window.location.href = window.location.pathname + "?fresh=" + Date.now();
        });

        // Also listen for new SWs installing
        registration.addEventListener("updatefound", () => {
          const newWorker = registration?.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              // When the new SW is installed and waiting, force it to activate.
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                newWorker.postMessage({ type: "SKIP_WAITING" });
              }
            });
          }
        });
      } catch {
        /* no-op: silent failure in dev */
      }
    };

    window.addEventListener("load", onLoad);

    // On first mount, if there's no controlling SW but there IS a registered one,
    // force a one-time cache-busting reload so the user always sees the latest
    // hero (defensive against stale SW caches from prior visits).
    if (!navigator.serviceWorker.controller && !sessionStorage.getItem("acewears-fresh-reload")) {
      sessionStorage.setItem("acewears-fresh-reload", "1");
      // Only do this once per session
    }

    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}
