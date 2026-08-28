// Hand-written Service Worker (no Workbox/vite-plugin-pwa per project stack
// choice). Vite's build output uses content-hashed filenames the SW cannot
// know in advance, and the supplied dataset lives under a version-namespaced
// folder path.js resolves at runtime — so this SW deliberately uses
// runtime, request-pattern-based caching rather than a static precache list
// of exact filenames (section 23.2).
const SCOPE = self.registration.scope;

// Cache name must contain both the app version and the dataset manifest
// version (section 23.2) so an app release or a dataset update each get
// their own runtime-cache namespace instead of silently reusing stale
// entries. This is a hand-written, non-bundled classic script, so it can't
// `import` src/config/appConfig.js or src/generated/datasetPath.js directly
// — instead it fetches public/sw-cache-version.json, a small file written by
// scripts/resolve-dataset-version.mjs (already run before both `npm run dev`
// and `npm run build`) from package.json's version and the resolved
// data/iphone/<version>/manifest.json's version field.
const FALLBACK_CACHE_NAME = "inspectra-cache-unknown";

async function resolveCacheName() {
  try {
    const response = await fetch(`${SCOPE}sw-cache-version.json`, { cache: "no-store" });
    if (!response.ok) return FALLBACK_CACHE_NAME;
    const { appVersion, datasetVersion } = await response.json();
    return `inspectra-cache-app${appVersion ?? "unknown"}-data${datasetVersion ?? "unknown"}`;
  } catch {
    return FALLBACK_CACHE_NAME;
  }
}

// Resolved once per SW lifetime (install/activate/fetch all share it) rather
// than re-fetched per cache access.
const cacheNamePromise = resolveCacheName();

const APP_SHELL = [SCOPE, `${SCOPE}manifest.webmanifest`, `${SCOPE}icons/icon.svg`];

self.addEventListener("install", (event) => {
  event.waitUntil(
    cacheNamePromise
      .then((cacheName) => caches.open(cacheName))
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {}),
  );
  // Deliberately does NOT call self.skipWaiting() here — the new worker
  // stays "waiting" until the user taps "Update now" (section 23.3), so an
  // active unsaved inspection is never force-reloaded out from under them.
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    cacheNamePromise
      .then((cacheName) =>
        caches
          .keys()
          .then((keys) => Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key)))),
      )
      .then(() => self.clients.claim()),
  );
});

function isBuildAsset(url) {
  return url.pathname.startsWith(`${new URL(SCOPE).pathname}assets/`) || url.pathname.endsWith(".svg");
}

function isDatasetRequest(url) {
  return url.pathname.includes("/data/iphone/");
}

async function cacheFirst(request) {
  const cache = await caches.open(await cacheNamePromise);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(await cacheNamePromise);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached ?? network;
}

async function networkFirst(request) {
  const cache = await caches.open(await cacheNamePromise);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Offline navigation fallback: serve the cached app shell so the
    // hash-router can still boot against whatever data is already cached.
    if (request.mode === "navigate") {
      const shell = await cache.match(SCOPE);
      if (shell) return shell;
    }
    throw new Error("Offline and no cached response available.");
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  if (isDatasetRequest(url)) {
    event.respondWith(staleWhileRevalidate(request));
  } else if (isBuildAsset(url)) {
    event.respondWith(cacheFirst(request));
  } else if (request.mode === "navigate" || url.pathname.endsWith(".html")) {
    event.respondWith(networkFirst(request));
  }
});
