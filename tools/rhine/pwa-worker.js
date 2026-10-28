const VERSION = __CACHE_VERSION__;
const FILES = __PRECACHE_FILES__;
const PREFIX = 'sakura-rhine:';
const CACHE = PREFIX + VERSION;
const urls = FILES.map(file => new URL(file, self.registration.scope).href);
const allowed = new Set(urls);
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    let index = 0;
    const results = await Promise.allSettled(Array.from({ length: 4 }, async () => {
      while (index < urls.length) {
        const key = urls[index++];
        const response = await fetch(key.replace(/index\.html$/, ''), { cache: 'no-cache' });
        if (!response.ok) throw Error(`Offline download failed: ${response.status}`);
        await cache.put(key, response);
      }
    }));
    if (results.some(r => r.status === 'rejected')) { await caches.delete(CACHE); throw Error('Offline installation incomplete'); }
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'RHINE_APPLY_UPDATE') event.waitUntil(self.skipWaiting());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  url.search = ''; url.hash = '';
  if (event.request.mode === 'navigate' && url.pathname.endsWith('/')) url.pathname += 'index.html';
  const key = url.href;
  const contentRequest = /\/content\/[a-f0-9]{20}\.json$/.test(url.pathname);
  const onDemand = contentRequest || event.request.mode === 'navigate' || /\/assets\/search-[^/]+\.js$/.test(url.pathname);
  if (!allowed.has(key) && !onDemand) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(key);
    if (cached && event.request.mode === 'navigate') return new Response(cached.body, { status: cached.status, headers: cached.headers });
    if (cached) return cached;
    const response = await fetch(event.request);
    if (onDemand && response.ok) await cache.put(key, response.clone());
    return response;
  })());
});
