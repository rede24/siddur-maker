const CACHE = 'siddur-animations-v39';
const range = (start, end) => Array.from({length: end - start + 1}, (_, i) => start + i);
const NUMERIC_PAGES = [...range(6, 86), ...range(88, 94), ...range(96, 118)].map(page => `/pages/page-${String(page).padStart(3, '0')}.jpg`);
const HALLEL_PAGES = range(1,5).map(page => `/pages/page-hallel-${page}.jpg`);
const SPECIAL_PAGES = [...range(246,249),...range(257,265),...range(327,335),...range(341,343)].map(page => `/pages/page-extra-${page}.jpg`);
const SHELL = ['/', '/index.html', '/styles.css?v=39', '/vendor/page-flip.module.js?v=39', '/app.js?v=39', '/book-reader.js?v=39', '/calendar.js', '/prayer-blocks.js', '/block-engine.js', '/block-catalog.js', '/prayer-recipes.js', '/manifest.webmanifest', '/icons/icon-32.png', '/icons/icon-180.png', '/icons/icon-192.png', '/icons/icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(async cache => {
    await cache.addAll(SHELL);
    await Promise.all(NUMERIC_PAGES.concat(HALLEL_PAGES, SPECIAL_PAGES).map(async url => { try { await cache.add(url); } catch { /* retry on demand */ } }));
  }).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => { if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone())); return response; }).catch(() => event.request.mode === 'navigate' ? caches.match('/index.html') : Response.error())));
});


