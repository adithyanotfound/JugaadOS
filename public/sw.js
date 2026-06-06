/**
 * VidyaSetu — Custom Service Worker
 *
 * Strategy:
 *  • API GET requests  → NetworkFirst  (try network, serve cache if offline)
 *  • Next.js bundles   → CacheFirst    (hashed filenames, never stale)
 *  • Google Fonts      → CacheFirst    (long-lived)
 *  • HTML pages        → NetworkFirst  (always try fresh, fall back to shell)
 *  • Images / icons    → CacheFirst
 */

const CACHE_VERSION = "vs-v1";
const SHELL_CACHE   = `shell-${CACHE_VERSION}`;
const API_CACHE     = `api-${CACHE_VERSION}`;
const STATIC_CACHE  = `static-${CACHE_VERSION}`;

// Pages to pre-cache on install so the app loads immediately offline
const PRECACHE_URLS = [
  "/auth/login",
  "/auth/signup",
  "/dashboard/teacher",
  "/dashboard/student",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

// ─── Install ────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // addAll fails silently if a URL is unreachable during install
      Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)))
    )
  );
  // Take control immediately — don't wait for old SW to die
  self.skipWaiting();
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== API_CACHE && k !== STATIC_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  // Claim all open clients so the SW is active immediately
  self.clients.claim();
});

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET, chrome-extension, etc.
  if (request.method !== "GET") return;
  if (!["http:", "https:"].includes(url.protocol)) return;

  // ── Next.js static chunks (hashed → CacheFirst) ──────────────────────────
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ── Google Fonts (CacheFirst) ─────────────────────────────────────────────
  if (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ── Images & icons (CacheFirst) ───────────────────────────────────────────
  if (
    request.destination === "image" ||
    /\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/i.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ── API GET requests (NetworkFirst, 5-second timeout) ────────────────────
  if (url.origin === self.location.origin && url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, API_CACHE, 5000));
    return;
  }

  // ── HTML navigation (NetworkFirst) ────────────────────────────────────────
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirst(request, SHELL_CACHE, 4000));
    return;
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Try network first with a timeout. On failure, serve from cache.
 * On success, write the fresh response into the cache.
 */
async function networkFirst(request, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName);
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), timeoutMs);
    const networkResponse = await fetch(request, { signal: controller.signal });
    clearTimeout(tid);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Last resort for API: return a JSON offline error so the UI can handle it
    if (request.url.includes("/api/")) {
      return new Response(
        JSON.stringify({ error: "You are offline. Showing cached data." }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }
    // For pages: return the login shell so something renders
    const fallback = await cache.match("/auth/login");
    return fallback || Response.error();
  }
}

/**
 * Serve from cache if available. On miss, fetch from network and cache it.
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return Response.error();
  }
}
