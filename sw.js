const CACHE_NAME = 'orent-spel-levels-v5';
const APP_SHELL = [
  '/',
  '/index.html',
  '/styles.css',
  '/animations/game-animations.css',
  '/config/game-config.json',
  '/config/levels.json',
  '/config/runtime-settings.json',
  '/js/main.js',
  '/js/audio/SoundManager.js',
  '/js/logic/GameController.js',
  '/js/logic/GameState.js',
  '/js/logic/ItemFactory.js',
  '/js/logic/LevelManager.js',
  '/js/logic/SortRules.js',
  '/js/logic/SettingsStore.js',
  '/js/logic/StatisticsStore.js',
  '/js/ui/Renderer.js',
  '/Resources/scene_school.png',
  '/Resources/scene_park.png',
  '/Resources/scene_beach.png',
  '/Resources/scene_football_field.png',
  '/Resources/cup.png',
  '/Resources/chips.png',
  '/Resources/can.png',
  '/Resources/alu_food_container.png',
  '/Resources/candy.png',
  '/Resources/Chocolate.png',
  '/Resources/news_paper.png',
  '/Resources/glass_bottle.png',
  '/Resources/coloured_glass_bottle.png',
  '/Resources/banana_peel_2.png',
  '/Resources/eaten_apple.png',
  '/Resources/battery.png',
  '/Resources/vape.png',
  '/Resources/burger_wrapper.png',
  '/Resources/diaper.png',
  '/Resources/plastforpackningar_rgb.png',
  '/Resources/metallforpackningar_rgb.png',
  '/Resources/tidningar_rgb.png',
  '/Resources/ofargade_glasforpackningar_rgb.png',
  '/Resources/fargade_glasforpackningar_rgb.png',
  '/Resources/matavfall_rgb.png',
  '/Resources/batterier_rgb.png',
  '/Resources/restavfall_rgb.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(url.pathname === '/api/settings' ? networkFirst(event.request) : cacheFirst(event.request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(CACHE_NAME)).put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) (await caches.open(CACHE_NAME)).put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ difficulty: 'normal', soundEnabled: true, trashScale: 130, binScale: 100 }), { headers: { 'Content-Type': 'application/json' } });
  }
}
