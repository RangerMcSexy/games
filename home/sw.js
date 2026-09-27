// Keeps the games playable offline: after the first visit everything is
// saved on the device, so they work in the car, on a plane, anywhere.
//
// The build stamps a new version below whenever a game changes. The browser
// then fetches the new copies in the background and uses them next time.
const VERSION = '__VERSION__';
const CACHE = `games-${VERSION}`;
const FILES = ['./', 'ask-name.js', 'book.js', 'book.css', 'stickers.js', 'butterfly-garden/', 'bakery/', 'colour-splash/', 'fishing-pond/', 'leapy-pond/', 'unicorn-dash/', 'ducky-bath/', 'postie-pip/', 'fonts/baloo-2-latin-800-normal.woff2'];
// The voice clips, filled in by the build.
const VOICE = [];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll([...FILES, ...VOICE].map((f) => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('games-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  // ".../bakery/index.html" and ".../bakery/" are the same page.
  const key = url.pathname.endsWith('/index.html') ? url.pathname.slice(0, -'index.html'.length) : url.pathname;
  e.respondWith(caches.match(key, { ignoreSearch: true }).then((hit) => hit ?? fetch(e.request)));
});
