// What every game does around its screens: toddler-proofing, keeping the
// screen awake, the top bar (home, music, sound and the grown-up gear),
// going full screen, the home-screen icon, and moving from screen to screen.
// Each game's src/main.ts passes in its own pieces and its screens.
import { askName } from './ask-name';
import { startPlayTimer } from './play-timer';
import { Aborted, Scene, el, initFx } from './ui';

export interface GameSetup {
  /** The game's folder, e.g. 'ducky-bath': the games home page serves it at …/ducky-bath/. */
  game: string;
  icons: { home: string; games: string; musicOn: string; musicOff: string; soundOn: string; soundOff: string };
  sound: {
    readonly musicOn: boolean;
    readonly soundOn: boolean;
    unlock(): void;
    sleep(on: boolean): void;
    pauseMusic(on: boolean): void;
    toggleMusic(): boolean;
    toggleSound(): boolean;
    pop(): void;
    tapSoft(): void;
  };
  voice: { loadRecordings(): Promise<void>; stopSpeaking(): void; say(id: string): Promise<void> };
  /** Asking who's playing, the first time on this device. */
  name: { needed(): boolean; set(name: string): void };
  /** Adds the grown-up gear to the bar, before `before`. */
  initSettings(bar: HTMLElement, before: Element, onChange: () => void): void;
  /** Adds things behind the stage, like a backdrop. */
  beforeStage?(app: HTMLElement): void;
  /** Adds things over the stage but under the top bar, like a guide. */
  afterStage?(app: HTMLElement): void;
  /** Each time a screen starts. */
  onScene?(onTitle: boolean): void;
}

/** What the screens are given: where to draw, and a way to say they've started. */
export interface Host {
  stage: HTMLElement;
  setScene(s: Scene): void;
}

export function startGame(setup: GameSetup) {
  const { icons, sound, voice } = setup;
  const app = document.getElementById('app')!;
  setup.beforeStage?.(app);
  const stage = el('div', 'stage', app);
  initFx();
  void voice.loadRecordings();
  setup.afterStage?.(app);

  // -------------------------------------------------------------------------
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
  // Audio can only start after a user gesture. On phones and tablets a finger
  // going down doesn't count, only it coming up again (or the tap's click),
  // so try on all of them: whichever the browser accepts switches it on.
  const unlock = (e: Event) => {
    sound.unlock();
    // (Speaking on a finger going down is refused, and would use up the try.)
    if (e.type !== 'pointerdown') primeSpeech();
  };
  for (const type of ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'])
    document.addEventListener(type, unlock, { capture: true, passive: true });
  // iPhones and iPads: play even with the silent switch on (it's a game with
  // its own sound switch, like a video), where the browser supports asking.
  try {
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession) nav.audioSession.type = 'playback';
  } catch {
    /* not supported */
  }

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
    if (hidden) voice.stopSpeaking();
    else wakeLock = null;
    sound.sleep(hidden);
  });

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

  // -------------------------------------------------------------------------
  // Top bar

  const bar = el('div', 'top-bar', app);
  const homeBtn = el('button', 'round-btn home-btn', bar, icons.home);
  homeBtn.setAttribute('aria-label', 'Home');
  el('div', 'spacer', bar);
  const musicBtn = el('button', 'round-btn', bar);
  const soundBtn = el('button', 'round-btn', bar);
  musicBtn.setAttribute('aria-label', 'Music on or off');
  soundBtn.setAttribute('aria-label', 'Sound on or off');
  const paintToggles = () => {
    musicBtn.innerHTML = sound.musicOn ? icons.musicOn : icons.musicOff;
    soundBtn.innerHTML = sound.soundOn ? icons.soundOn : icons.soundOff;
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
    if (!sound.toggleSound()) voice.stopSpeaking();
    paintToggles();
    sound.pop();
  });

  // -------------------------------------------------------------------------
  // Screens

  let current: Scene | null = null;
  let onTitle = true;

  // Opened from the games home page (served at …/<game>/): on the title
  // screen the home button leads back there instead of hiding.
  const fromGames = location.protocol.startsWith('http') && new RegExp(`/${setup.game}/(index\\.html)?$`).test(location.pathname);
  // Opened straight from a link to this game: also save the games for offline.
  if (fromGames && 'serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js', { scope: '../' }).catch(() => {});
  function showHomeBtn() {
    homeBtn.classList.toggle('hidden', onTitle && !fromGames);
    homeBtn.innerHTML = onTitle ? icons.games : icons.home;
    homeBtn.setAttribute('aria-label', onTitle ? 'All games' : 'Home');
  }
  const host: Host = {
    stage,
    setScene(s: Scene) {
      current = s;
      onTitle = s.root.classList.contains('title-scene');
      showHomeBtn();
      setup.onScene?.(onTitle);
      playTimer.atBreak();
    },
  };

  const goHome = () => {
    voice.stopSpeaking();
    current?.destroy();
  };

  homeBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    sound.tapSoft();
    if (onTitle) {
      voice.stopSpeaking();
      location.href = '../';
    } else goHome();
  });

  // Settings changed (name, reset): restart from the title so everything updates.
  // The gear sits just left of the music toggle, away from the home button.
  setup.initSettings(bar, musicBtn, goHome);

  // The grown-up's play timer: when the time's up the game stops and waits,
  // behind the goodnight screen, until a grown-up wakes it.
  let resting: Promise<void> | null = null;
  let wakeUp = () => {};
  const stillResting = () => resting !== null;
  const playTimer = startPlayTimer({
    bar,
    before: bar.querySelector('.spacer')?.nextElementSibling ?? null,
    say: (id) => void voice.say(id),
    async sleep(sayGoodnight) {
      resting = new Promise((ok) => (wakeUp = ok));
      voice.stopSpeaking();
      sound.pauseMusic(true);
      current?.destroy();
      if (sayGoodnight) await voice.say('restNow');
      // (Unless a grown-up woke it while it was saying goodnight.)
      if (stillResting()) sound.sleep(true);
    },
    wake() {
      sound.sleep(false);
      sound.pauseMusic(false);
      resting = null;
      wakeUp();
    },
  });

  /**
   * Plays the game: asks who's playing the first time, then goes from screen
   * to screen. `next` shows a screen and says which comes after it. Going home
   * (or anything going wrong) starts again from `first`.
   */
  async function play<Route>(first: Route, next: (route: Route) => Promise<Route>) {
    // First time on this device: ask who's playing before the title says hello.
    if (setup.name.needed()) setup.name.set(await askName());
    let route = first;
    for (;;) {
      try {
        if (resting) {
          await resting;
          route = first;
        }
        route = await next(route);
      } catch (err) {
        if (!(err instanceof Aborted)) console.error(err);
        current?.destroy();
        route = first;
      }
    }
  }

  return { host, play };
}

/**
 * iPhones and iPads only let a page talk with the device's own voice once it
 * has spoken during a tap: say nothing, quietly, the first time.
 */
let speechPrimed = false;
function primeSpeech() {
  if (speechPrimed || !('speechSynthesis' in window)) return;
  speechPrimed = true;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  } catch {
    /* no device voice */
  }
}

/** Loads a picture drawn in code, `width` × `height` big, for drawing on a canvas. */
function loadSVG(svg: string, width: number, height = width) {
  // Read it the forgiving way the page does (the art sometimes repeats an
  // attribute, which the page ignores), then write it out as a strict SVG
  // file, which is what an image needs.
  const art = new DOMParser().parseFromString(svg, 'text/html').querySelector('svg')!;
  art.setAttribute('width', String(width));
  art.setAttribute('height', String(height));
  const file = new XMLSerializer().serializeToString(art);
  return new Promise<HTMLImageElement>((ok, fail) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = fail;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(file)}`;
  });
}

/**
 * The home-screen icon (iOS reads apple-touch-icon when "Add to Home Screen"
 * is used): `draw` paints it on a 180 × 180 canvas.
 */
export function appIcon(draw: (g: CanvasRenderingContext2D, load: typeof loadSVG) => Promise<void>) {
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 180;
    draw(c.getContext('2d')!, loadSVG).then(() => {
      const link = document.createElement('link');
      link.rel = 'apple-touch-icon';
      link.href = c.toDataURL('image/png');
      document.head.append(link);
    }, () => {});
  } catch {
    /* cosmetic only */
  }
}
