/* HBStats — Copyright (C) 2026 Antonio Bueno Antón. SPDX-License-Identifier: AGPL-3.0-or-later */
/* HBStats service worker: the app keeps working without a connection (sports halls often have none).
 * - The app page itself: network first, so a new version arrives as soon as there is coverage; cached copy otherwise.
 *   Other pages under the same folder (the demo) are left to the network so they never replace the app's copy.
 * - Icons and manifest: cache first.
 * - Third-party files (Google Fonts, PDF and Supabase libraries): cache first; the libraries are fetched at install
 *   time so reports and sign-in work offline from the first visit.
 * - Supabase itself (accounts, teams, matches) is never cached here: the app keeps its own device copies.
 * tools/build_site.py stamps BUILD (a hash of the page, so every release replaces the old shell cache) and
 * SUPABASE_JS (the library URL the page loads).
 */
const BUILD = '0351cc4ea5ee';
const SHELL_PREFIX = 'hbstats-app-shell-';
const SHELL_CACHE = `${SHELL_PREFIX}${BUILD}`;
const RUNTIME_CACHE = 'hbstats-app-cdn-v1';

const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

// Must match, character for character, the URLs the page requests.
const PRECACHED_THIRD_PARTY = [
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js'
];
const THIRD_PARTY_HOSTS = ['cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

const APP_PAGES = ['./', './index.html'].map((path) => new URL(path, self.registration.scope).pathname);
const cacheable = (response) => Boolean(response) && (response.ok || response.type === 'opaque') && !response.redirected;

async function putIfCacheable(cacheName, request, response) {
  if (!cacheable(response)) return;
  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
}

async function precacheThirdParty() {
  await Promise.all(PRECACHED_THIRD_PARTY.map(async (url) => {
    try {
      await putIfCacheable(RUNTIME_CACHE, url, await fetch(url, { mode: 'cors' }));
    } catch (err) {
      console.warn(`Offline copy not stored for ${url}`, err);
    }
  }));
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const shell = await caches.open(SHELL_CACHE);
    await shell.addAll(SHELL_ASSETS);
    await precacheThirdParty();
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.startsWith(SHELL_PREFIX) && n !== SHELL_CACHE).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    await putIfCacheable(SHELL_CACHE, './index.html', response);
    return response;
  } catch (err) {
    const cached = await caches.match('./index.html');
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  await putIfCacheable(cacheName, request, response);
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (request.mode === 'navigate') {
    if (APP_PAGES.includes(url.pathname)) event.respondWith(networkFirst(request));
    return;
  }
  if (url.origin === self.location.origin) { event.respondWith(cacheFirst(request, SHELL_CACHE)); return; }
  if (THIRD_PARTY_HOSTS.includes(url.hostname)) event.respondWith(cacheFirst(request, RUNTIME_CACHE));
});
