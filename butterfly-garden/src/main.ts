import './style.css';
import { ICONS } from './art';
import { sound } from './audio';
import { initBackdrop } from './backdrop';
import { journey } from './journey';
import { gardenScreen, titleScreen } from './screens';
import { Aborted, Scene, el, initFx } from './ui';

const app = document.getElementById('app')!;
initBackdrop(app);
const stage = el('div', 'stage', app);
initFx();

// ---------------------------------------------------------------------------
// Toddler-proofing: no zooming, scrolling, selecting or long-press menus.

document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
// Audio can only start after a user gesture.
document.addEventListener('pointerdown', () => sound.unlock(), { capture: true });

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
  sound.toggleSound();
  paintToggles();
  sound.pop();
});

// ---------------------------------------------------------------------------
// Flow

let current: Scene | null = null;
let goHome = false;
const host = {
  stage,
  setScene(s: Scene) {
    current = s;
    homeBtn.classList.toggle('hidden', s.root.classList.contains('title-scene'));
  },
};

homeBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  sound.tapSoft();
  goHome = true;
  current?.destroy();
});

function tryFullscreen(e?: PointerEvent) {
  // On touch devices go fullscreen so little fingers can't reach browser UI.
  if (e && e.pointerType !== 'touch') return;
  const d = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
  try {
    if (!document.fullscreenElement) (d.requestFullscreen?.() ?? d.webkitRequestFullscreen?.())?.catch?.(() => {});
  } catch {
    /* not supported */
  }
}
document.addEventListener('pointerdown', tryFullscreen, { once: true, capture: true });

type Route = 'title' | 'play' | 'garden';

async function run() {
  let route: Route = 'title';
  for (;;) {
    goHome = false;
    try {
      if (route === 'title') {
        route = await titleScreen(host);
        if (route === 'play') sound.speak("Let's grow a butterfly!");
      } else if (route === 'play') {
        const end = await journey(host);
        route = end === 'garden' ? 'garden' : 'play';
      } else {
        route = (await gardenScreen(host)) === 'play' ? 'play' : 'title';
      }
    } catch (err) {
      if (!(err instanceof Aborted)) console.error(err);
      current?.destroy();
      route = 'title';
      if (goHome && 'speechSynthesis' in window) speechSynthesis.cancel();
    }
  }
}

void run();
