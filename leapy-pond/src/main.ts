import './font.css';
import './style.css';
import { askName } from '../../shared/ask-name';
import { ICONS, frogSVG, padSVG } from './art';
import { sound } from './audio';
import { needsName, setName } from './data';
import { leapScreen } from './leap';
import { pondScreen, titleScreen } from './screens';
import { initSettings } from './settings';
import { Aborted, Scene, el, initFx } from '../../shared/ui';
import { loadRecordings, say, stopSpeaking } from './voice';

const app = document.getElementById('app')!;
const stage = el('div', 'stage', app);
initFx();
void loadRecordings();

// ---------------------------------------------------------------------------
// Toddler-proofing: no zooming, scrolling, selecting or long-press menus.

document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());
document.addEventListener(
  'touchmove',
  (e) => {
    // The grown-up settings list is the only thing allowed to scroll.
    if (!(e.target as Element).closest?.('.settings-scroll')) e.preventDefault();
  },
  { passive: false },
);
// Audio can only start after a user gesture.
document.addEventListener('pointerdown', () => sound.unlock(), { capture: true });

// Keep the screen awake while playing.
let wakeLock: { release(): Promise<void> } | null = null;
async function keepAwake() {
  try {
    const nav = navigator as Navigator & { wakeLock?: { request(t: 'screen'): Promise<{ release(): Promise<void> }> } };
    if (!wakeLock && nav.wakeLock) wakeLock = await nav.wakeLock.request('screen');
  } catch {
    /* not supported or not allowed */
  }
}
document.addEventListener('pointerdown', () => void keepAwake(), { capture: true });
document.addEventListener('visibilitychange', () => {
  const hidden = document.visibilityState === 'hidden';
  if (hidden) stopSpeaking();
  else wakeLock = null;
  sound.sleep(hidden);
});

// ---------------------------------------------------------------------------
// Top bar

const bar = el('div', 'top-bar', app);
const homeBtn = el('button', 'round-btn home-btn', bar, ICONS.home);
homeBtn.setAttribute('aria-label', 'Home');
el('div', 'spacer', bar);
const musicBtn = el('button', 'round-btn', bar);
const soundBtn = el('button', 'round-btn', bar);
musicBtn.setAttribute('aria-label', 'Music on or off');
soundBtn.setAttribute('aria-label', 'Sound on or off');
const paintToggles = () => {
  musicBtn.innerHTML = sound.musicOn ? ICONS.musicOn : ICONS.musicOff;
  soundBtn.innerHTML = sound.soundOn ? ICONS.soundOn : ICONS.soundOff;
  musicBtn.classList.toggle('off', !sound.musicOn);
  soundBtn.classList.toggle('off', !sound.soundOn);
};
paintToggles();
musicBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  sound.toggleMusic();
  paintToggles();
});
soundBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (!sound.toggleSound()) stopSpeaking();
  paintToggles();
  sound.pop();
});

// ---------------------------------------------------------------------------
// Flow

let current: Scene | null = null;
let onTitle = true;

// Opened from the games home page (served at …/leapy-pond/): on the title screen
// the home button leads back there instead of hiding.
const fromGames = location.protocol.startsWith('http') && /\/leapy-pond\/(index\.html)?$/.test(location.pathname);
// Opened straight from a link to this game: also save the games for offline.
if (fromGames && 'serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js', { scope: '../' }).catch(() => {});
function showHomeBtn() {
  homeBtn.classList.toggle('hidden', onTitle && !fromGames);
  homeBtn.innerHTML = onTitle ? ICONS.games : ICONS.home;
  homeBtn.setAttribute('aria-label', onTitle ? 'All games' : 'Home');
}
const host = {
  stage,
  setScene(s: Scene) {
    current = s;
    onTitle = s.root.classList.contains('title-scene');
    showHomeBtn();
  },
};

const goHome = () => {
  stopSpeaking();
  current?.destroy();
};

homeBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  sound.tapSoft();
  if (onTitle) {
    stopSpeaking();
    location.href = '../';
  } else goHome();
});

// Settings changed (name, reset): restart from the title so everything updates.
// The gear sits just left of the music toggle, away from the home button.
initSettings(bar, musicBtn, goHome);

function tryFullscreen(e: PointerEvent) {
  // On touch devices go fullscreen so little fingers can't reach browser UI.
  if (e.pointerType !== 'touch') return;
  const d = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
  try {
    if (document.fullscreenElement) return;
    if (d.requestFullscreen) void d.requestFullscreen().catch(() => {});
    else d.webkitRequestFullscreen?.();
  } catch {
    /* not supported */
  }
}
document.addEventListener('pointerdown', tryFullscreen, { once: true, capture: true });

// A home-screen icon (iOS reads apple-touch-icon when "Add to Home Screen" is used).
function makeAppIcon() {
  try {
    const svg = (art: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(art.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" '))}`;
    const load = (src: string) =>
      new Promise<HTMLImageElement>((ok, fail) => {
        const img = new Image();
        img.onload = () => ok(img);
        img.onerror = fail;
        img.src = src;
      });
    void Promise.all([load(svg(padSVG(0, 160, true))), load(svg(frogSVG()))]).then(([pad, frog]) => {
      const c = document.createElement('canvas');
      c.width = c.height = 180;
      const g = c.getContext('2d')!;
      g.fillStyle = '#5cc4f0';
      g.fillRect(0, 0, 180, 180);
      g.drawImage(pad, 14, 14, 152, 152);
      g.drawImage(frog, 36, 30, 108, 108);
      const link = document.createElement('link');
      link.rel = 'apple-touch-icon';
      link.href = c.toDataURL('image/png');
      document.head.append(link);
    }, () => {});
  } catch {
    /* cosmetic only */
  }
}
makeAppIcon();

type Route = 'title' | 'leap' | 'pond';

async function run() {
  // First time on this device: ask who's playing before the title says hello.
  if (needsName()) setName(await askName());
  let route: Route = 'title';
  for (;;) {
    try {
      if (route === 'title') {
        route = (await titleScreen(host)) === 'play' ? 'leap' : 'pond';
        if (route === 'leap') void say('letsHop');
      } else if (route === 'leap') {
        route = (await leapScreen(host)) === 'again' ? 'leap' : 'pond';
      } else {
        await pondScreen(host);
        route = 'leap';
        void say('letsHop');
      }
    } catch (err) {
      if (!(err instanceof Aborted)) console.error(err);
      current?.destroy();
      route = 'title';
    }
  }
}

void run();
