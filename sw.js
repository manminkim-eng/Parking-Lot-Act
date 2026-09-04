/* ═══════════════════════════════════════════════════
   부설주차장 법정대수 산정기  MANMIN Ver-5.0
   Service Worker — 오프라인 캐시 + 버전 업데이트  ·  ARCHITECT KIM MANMIN
   v5.0.0 (2026-09-04) — §11-3 navigate Network-first · §17-1 PREFIX · §18-7 ORPHAN · allSettled · R19 폴백
═══════════════════════════════════════════════════ */
const PREFIX = 'parking-';
const CACHE  = 'parking-v5.0.0';
const ORPHAN = ['parking-law-v1'];
const ASSETS = [
  './', './index.html', './manifest.json',
  './icons/icon-192x192.png', './icons/icon-512x512.png', './icons/apple-touch-icon.png',
  './assets/fonts/manmin-fonts.css', './assets/fonts/NotoSansKR-var.woff2',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@100;300;400;500;700;900&family=DM+Mono:wght@400;500&family=Orbitron:wght@700;900&family=JetBrains+Mono:wght@400;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(ASSETS.map(u => c.add(u).catch(err => console.warn('[SW] precache skip:', u, err))))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k !== CACHE && (k.indexOf(PREFIX) === 0 || ORPHAN.indexOf(k) !== -1)).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith('http')) return;
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith(fetch(e.request).then(res => { if (res && res.status === 200) { const c = res.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return res; })
      .catch(() => caches.match(e.request).then(c => c || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(e.request).then(cached => {
    if (cached) { fetch(e.request).then(res => { if (res && res.status === 200) caches.open(CACHE).then(c => c.put(e.request, res.clone())); }).catch(() => {}); return cached; }
    return fetch(e.request).then(res => { if (!res || res.status !== 200 || res.type === 'opaque') return res; const c = res.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return res; }).catch(() => Response.error());   /* R19: 정적 자원 폴백에 index.html 금지 */
  }));
});
self.addEventListener('message', e => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });
console.log('[SW] loaded:', CACHE);
