"use client";

import { useEffect } from "react";

/**
 * Registers the custom service worker (/public/sw.js).
 * Runs once on mount — safe to include in the root layout.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("[SW] Registered, scope:", reg.scope);

        // Trigger an update check whenever the user navigates back to the page
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // A new version is ready — SW will skip-wait automatically
              console.log("[SW] New version available and cached.");
            }
          });
        });
      })
      .catch((err) => {
        console.warn("[SW] Registration failed:", err);
      });
  }, []);

  return null;
}
