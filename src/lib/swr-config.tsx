/**
 * src/lib/swr-config.tsx
 *
 * Global SWR configuration with a localStorage cache provider.
 * - Data persists across page refreshes (offline-first reads)
 * - Stale data shows instantly; fresh data loads silently in background
 * - Automatically skips cache entries older than MAX_AGE_MS
 */

"use client";

import { SWRConfig, Cache } from "swr";
import { ReactNode, useRef } from "react";

const CACHE_KEY = "vidyasetu_swr_cache";
const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

interface CacheEntry {
  data: unknown;
  ts: number;
}

function localStorageProvider(): Cache {
  // Hydrate from localStorage on startup
  let map: Map<string, CacheEntry>;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const parsed: Record<string, CacheEntry> = raw ? JSON.parse(raw) : {};
    // Prune expired entries on load
    const now = Date.now();
    const pruned = Object.entries(parsed).filter(
      ([, v]) => now - v.ts < MAX_AGE_MS
    );
    map = new Map(pruned.map(([k, v]) => [k, v]));
  } catch {
    map = new Map();
  }

  // Persist to localStorage whenever the cache changes
  const persist = () => {
    try {
      const obj: Record<string, CacheEntry> = {};
      map.forEach((value, key) => {
        obj[key] = value;
      });
      localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
    } catch {
      // localStorage might be full — silently ignore
    }
  };

  // SWR Cache interface — wraps the map and syncs to localStorage
  return {
    get(key: string) {
      const entry = map.get(key);
      if (!entry) return undefined;
      // Return stale data even if expired — SWR will revalidate anyway
      return entry.data as ReturnType<Cache["get"]>;
    },
    set(key: string, value: unknown) {
      map.set(key, { data: value, ts: Date.now() });
      persist();
    },
    delete(key: string) {
      map.delete(key);
      persist();
    },
    keys() {
      return map.keys();
    },
  };
}

export function SWRProvider({ children }: { children: ReactNode }) {
  // Keep the same provider instance for the lifetime of the app
  const providerRef = useRef<Cache | null>(null);
  if (!providerRef.current) {
    providerRef.current = localStorageProvider();
  }

  return (
    <SWRConfig
      value={{
        provider: () => providerRef.current!,
        // Show stale data immediately, revalidate in background
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        // Don't retry on error (show cached data instead)
        shouldRetryOnError: false,
        // Deduplicate requests within 2 seconds
        dedupingInterval: 2000,
        // Keep previous data while revalidating (no flicker)
        keepPreviousData: true,
        fetcher: (url: string) =>
          fetch(url).then((r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
          }),
      }}
    >
      {children}
    </SWRConfig>
  );
}
