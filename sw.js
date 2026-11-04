const CACHE = 'mystic-tarot-v2';
const CORE = [
  './', './index.html', './cards.html', './symbols.js', './tts.js',
  './manifest.json', './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isHtml = e.request.mode === 'navigate' ||
    url.pathname.endsWith('.html') || url.pathname.endsWith('/') ||
    url.pathname.endsWith('.js') || url.pathname.endsWith('.json');

  if (isHtml) {
    // HTML·JS·JSON: 네트워크 우선 → 새 배포가 즉시 반영, 오프라인일 때만 캐시
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request))
    );
  } else {
    // 이미지·폰트: 캐시 우선 (바뀔 일 없고 속도 중요)
    e.respondWith(
      caches.match(e.request).then(hit => hit ||
        fetch(e.request).then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return res;
        })
      )
    );
  }
});
