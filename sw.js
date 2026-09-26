/* 离线缓存：地铁里、富士山区没信号时，手册和随身页照样打开。
   页面走网络优先（有网就拿最新），没网退回缓存；图片、样式、字体走缓存优先。
   Google 地图底图和 API 不缓存（跨域、有配额），离线时地图空白，导航按钮仍会跳 Google Maps app。
   改了预缓存清单或想强制所有人更新时，把 VERSION 加一。 */
const VERSION = 'v2';
const CACHE = 'tokyo-2026-' + VERSION;

const PRECACHE = [
  './', 'index.html', 'companion.html',
  'tabbar.css?v=4', 'tabbar.js?v=4', 'manifest.json',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png',
  'img/fuji_hero.jpg', 'img/asakusa.jpg', 'img/ueno.jpg', 'img/fuji_dawn.jpg',
  'img/kamakura.jpg', 'img/shibuya.jpg', 'img/tokyo_tower.jpg', 'img/yanaka.jpg',
  'img/fuji_hero-xs.jpg', 'img/asakusa-xs.jpg', 'img/ueno-xs.jpg', 'img/fuji_dawn-xs.jpg',
  'img/kamakura-xs.jpg', 'img/shibuya-xs.jpg', 'img/tokyo_tower-xs.jpg', 'img/yanaka-xs.jpg',
  'charts/index.html', 'charts/fuji-visibility.html', 'charts/haneda-options.html',
  'charts/pacing-curve.html', 'charts/budget-allocation.html'
];

// 可以长期缓存的跨域静态资源：字体、图表库
const CDN = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('tokyo-2026-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // 页面：网络优先，顺手更新缓存；离线时用缓存（忽略 #day-3 之类的 hash 和查询串）
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
    );
    return;
  }

  // 同源静态资源和白名单 CDN：缓存优先，没有再上网拿并存起来
  if (sameOrigin || CDN.includes(url.hostname)) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }))
    );
  }
  // 其他（Google 地图、OSRM 路网）不拦截
});
