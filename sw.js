/* ═══════════════════════════════════════════════════
   S3-0 회차 2026-09-04 — R27 html2canvas 클론 정화 동반 캐시명 v5.0.2
   R25 회차 2026-09-04 — 자기 접두어 캐시 조회 · cors 프리캐시 · opaque 가드 · 캐시명 v5.0.1 (S10)
   부설주차장 법정대수 산정기  MANMIN Ver-5.0
   Service Worker — 오프라인 캐시 + 버전 업데이트  ·  ARCHITECT KIM MANMIN
   v5.0.0 (2026-09-04) — §11-3 navigate Network-first · §17-1 PREFIX · §18-7 ORPHAN · allSettled · R19 폴백
═══════════════════════════════════════════════════ */
const PREFIX = 'parking-';
/* ═ R25 (2026-09-04) — SW 캐시 origin 오염 차단 (S10 · 지시서 §21-1 R25)
   전역 caches 의 match 는 origin 전체를 검색한다. manminkim-eng.github.io 는 34종이 한 origin 이라
   다른 도구 캐시의 opaque 응답이 <script crossorigin>(cors) 요청에 돌아가 스크립트가 폐기됐다
   (30 #root 빈 화면 · 40 html2canvas undefined). 자기 접두어 캐시만 조회하고, cross-origin
   프리캐시는 cors 로 받으며, opaque↔cors 불일치 시 캐시를 쓰지 않는다. */
const MM_EXCLUDE = [];   /* 내 접두어로 시작하지만 남의 캐시인 이름 (§17-1 충돌) */
const mmOwn   = (k) => k.indexOf(PREFIX) === 0 && !MM_EXCLUDE.some((x) => k.indexOf(x) === 0);
const mmReq   = (u) => (typeof u === 'string' && u.indexOf('http') === 0) ? new Request(u, { mode: 'cors' }) : u;
const mmMatch = (req, opt) => caches.keys()
  .then((ks) => ks.filter(mmOwn))
  .then((ks) => ks.reduce((p, k) => p.then((r) => r || caches.open(k).then((c) => c.match(req, opt))), Promise.resolve(undefined)))
  .then((r) => (r && r.type === 'opaque' && req && req.mode === 'cors') ? undefined : r);

const CACHE  = 'parking-v5.0.2';
const ORPHAN = ['parking-law-v1'];
const ASSETS = [
  './', './index.html', './manifest.json',
  './icons/icon-192x192.png', './icons/icon-512x512.png', './icons/apple-touch-icon.png',
  './assets/fonts/manmin-fonts.css', './assets/fonts/NotoSansKR-var.woff2',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@100;300;400;500;700;900&family=DM+Mono:wght@400;500&family=Orbitron:wght@700;900&family=JetBrains+Mono:wght@400;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(ASSETS.map(u => c.add(mmReq(u)).catch(err => console.warn('[SW] precache skip:', u, err))))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k !== CACHE && (mmOwn(k) || ORPHAN.indexOf(k) !== -1)).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith('http')) return;
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith(fetch(e.request).then(res => { if (res && res.status === 200) { const c = res.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return res; })
      .catch(() => mmMatch(e.request).then(c => c || mmMatch('./index.html'))));
    return;
  }
  e.respondWith(mmMatch(e.request).then(cached => {
    if (cached) { fetch(e.request).then(res => { if (res && res.status === 200) caches.open(CACHE).then(c => c.put(e.request, res.clone())); }).catch(() => {}); return cached; }
    return fetch(e.request).then(res => { if (!res || res.status !== 200 || res.type === 'opaque') return res; const c = res.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return res; }).catch(() => Response.error());   /* R19: 정적 자원 폴백에 index.html 금지 */
  }));
});
self.addEventListener('message', e => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });
console.log('[SW] loaded:', CACHE);
