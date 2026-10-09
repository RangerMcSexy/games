// The play timer: a grown-up picks how long a play session lasts (in any
// game's grown-up settings). The time counts across all the games, only while
// one is on screen. Two minutes before the end the voice says it's nearly
// time for a rest, and a little sun in the top bar sets as the time runs
// down, so the end doesn't come as a surprise. When the time's up the game
// finishes what it's doing (up to a minute more), then says goodnight, and
// every game stays asleep until a grown-up holds the button to wake it.
//
// It brings its own look, so the games home page can use it too.
import type { Line } from './voice';

/** Spoken by the games (each game adds these to its own lines). */
export const TIMER_LINES: Line[] = [
  { id: 'restSoon', text: 'Nearly time for a rest!', when: 'Play timer: two minutes left' },
  { id: 'restNow', text: 'All done for now! Time for a rest. Bye bye!', when: 'Play timer: time is up' },
];

/** The choices in the grown-up settings, in minutes (0 is no timer). */
export const LIMITS = [0, 10, 15, 20, 30, 45, 60];

const KEY = 'games.play-timer.v1';
const WARN_MS = 2 * 60_000;
/** How long to wait for the game to reach a natural stop before saying goodnight anyway. */
const GRACE_MS = 60_000;
/** A session that hasn't been played for this long starts afresh next time. */
const NEW_SESSION_MS = 60 * 60_000;
const HOLD_MS = 3000;

interface State {
  /** The session's length in minutes; 0 for no timer. */
  minutes: number;
  /** Time played this session, in milliseconds. */
  used: number;
  /** When it was last counted (to start a fresh session after a long break). */
  last: number;
  warned: boolean;
  asleep: boolean;
}

export function readTimer(): State {
  const fresh: State = { minutes: 0, used: 0, last: 0, warned: false, asleep: false };
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!s || typeof s !== 'object') return fresh;
    return {
      minutes: LIMITS.includes(s.minutes) ? s.minutes : 0,
      // (Below 0 when a grown-up has given more time than the session's length.)
      used: Number.isFinite(s.used) ? s.used : 0,
      last: Number.isFinite(s.last) ? s.last : 0,
      warned: s.warned === true,
      asleep: s.asleep === true,
    };
  } catch {
    return fresh;
  }
}

function write(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage full or blocked: the timer only lasts this page */
  }
}

/** Sets the session length, starting a fresh session. */
export function setLimit(minutes: number) {
  write({ minutes, used: 0, last: Date.now(), warned: false, asleep: false });
}

/** Starts a fresh session with the same length. */
export function freshSession() {
  setLimit(readTimer().minutes);
}

/** Minutes left this session (rounded up), or null with no timer. */
export function minutesLeft(): number | null {
  const s = readTimer();
  if (!s.minutes) return null;
  return Math.max(0, Math.ceil((s.minutes * 60_000 - s.used) / 60_000));
}

export interface TimerHooks {
  /** The top bar, for the little sun, placed before `before`. */
  bar?: HTMLElement;
  before?: Element | null;
  say?(id: string): void;
  /** The game goes quiet and still behind the rest screen (saying goodnight first if it's only just time)... */
  sleep?(sayGoodnight: boolean): void;
  /** ...and starts again from its title when woken. */
  wake?(): void;
}

/**
 * Starts counting on this page. Call `atBreak()` whenever the game reaches a
 * natural stop (a new screen) so a finished session ends there.
 */
export function startPlayTimer(hooks: TimerHooks = {}) {
  addStyle();
  const sun = document.createElement('div');
  sun.className = 'pt-sun hidden';
  sun.setAttribute('aria-hidden', 'true');
  sun.innerHTML = SUN;
  if (hooks.bar) hooks.bar.insertBefore(sun, hooks.before ?? null);

  let tick = Date.now();
  let dueSince = 0;
  let rest: HTMLElement | null = null;

  const paused = () => document.visibilityState !== 'visible' || !!document.querySelector('.settings-overlay') || !!rest;

  function update() {
    const now = Date.now();
    const step = Math.min(now - tick, 2000);
    tick = now;
    const s = readTimer();
    if (s.asleep) return goToSleep(false);
    if (!s.minutes) {
      sun.classList.add('hidden');
      dueSince = 0;
      return;
    }
    if (!paused()) {
      if (s.used !== 0 && now - s.last > NEW_SESSION_MS) {
        s.used = 0;
        s.warned = false;
      }
      s.used += step;
      s.last = now;
      const left = s.minutes * 60_000 - s.used;
      if (left <= WARN_MS && !s.warned) {
        s.warned = true;
        hooks.say?.('restSoon');
      }
      write(s);
      if (left <= 0) {
        dueSince ||= now;
        if (now - dueSince >= GRACE_MS) return goToSleep(true);
      }
    }
    paintSun(s);
  }

  function paintSun(s: State) {
    sun.classList.remove('hidden');
    const part = Math.min(1, Math.max(0, s.used / (s.minutes * 60_000)));
    sun.style.setProperty('--left', String(1 - part));
    sun.classList.toggle('low', part > 1 - WARN_MS / (s.minutes * 60_000));
  }

  function goToSleep(justNow: boolean) {
    if (rest) return;
    const s = readTimer();
    if (!s.asleep) write({ ...s, asleep: true });
    hooks.sleep?.(justNow);
    rest = showRest(() => {
      rest = null;
      dueSince = 0;
      tick = Date.now();
      update();
      hooks.wake?.();
    });
  }

  update();
  setInterval(update, 1000);
  document.addEventListener('visibilitychange', () => {
    tick = Date.now();
    update();
  });
  addEventListener('storage', (e) => e.key === KEY && update());

  return {
    /** The game has reached a natural stop: if the time's up, say goodnight now. */
    atBreak() {
      if (dueSince) goToSleep(true);
    },
  };
}

/** The goodnight screen, with the grown-up's button to wake the games. */
function showRest(onWake: () => void): HTMLElement {
  const over = document.createElement('div');
  over.className = 'pt-rest';
  over.innerHTML = `${NIGHT}<div class="pt-words">Time for a rest!</div>
    <div class="pt-grown">
      <button class="pt-hold"><span class="pt-ring"></span>Grown-ups: hold for 3 seconds</button>
      <div class="pt-choices" hidden>
        <button data-add="5">5 more minutes</button>
        <button data-add="15">15 more minutes</button>
        <button data-new>A new session</button>
        <button data-off>Turn the timer off</button>
      </div>
    </div>`;
  document.body.append(over);
  for (const t of ['pointerdown', 'pointerup', 'click', 'touchstart']) over.addEventListener(t, (e) => e.stopPropagation());
  requestAnimationFrame(() => over.classList.add('open'));

  const hold = over.querySelector<HTMLElement>('.pt-hold')!;
  const choices = over.querySelector<HTMLElement>('.pt-choices')!;
  let timer = 0;
  const cancel = () => {
    clearTimeout(timer);
    hold.classList.remove('holding');
  };
  hold.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    hold.classList.add('holding');
    timer = window.setTimeout(() => {
      hold.hidden = true;
      choices.hidden = false;
    }, HOLD_MS);
  });
  for (const t of ['pointerup', 'pointerleave', 'pointercancel']) hold.addEventListener(t, cancel);

  choices.addEventListener('click', (e) => {
    const b = (e.target as Element).closest('button');
    if (!b) return;
    const s = readTimer();
    if (b.dataset.add) write({ ...s, used: s.minutes * 60_000 - Number(b.dataset.add) * 60_000, last: Date.now(), warned: false, asleep: false });
    else if ('new' in b.dataset) freshSession();
    else setLimit(0);
    over.classList.remove('open');
    setTimeout(() => over.remove(), 400);
    onWake();
  });
  return over;
}

const SUN = `<svg viewBox="-30 -30 60 60">
  <g class="pt-rays" stroke="#ffb02e" stroke-width="5" stroke-linecap="round">
    <path d="M0,-27 V-21 M0,27 V21 M-27,0 H-21 M27,0 H21 M-19,-19 L-15,-15 M19,19 L15,15 M-19,19 L-15,15 M19,-19 L15,-15"/>
  </g>
  <circle r="16" fill="#fff3c4" stroke="#5a4272" stroke-width="3"/>
  <circle class="pt-left" r="8" fill="none" stroke="#ffc93c" stroke-width="16" pathLength="100" transform="rotate(-90)"/>
  <circle r="16" fill="none" stroke="#5a4272" stroke-width="3"/>
</svg>`;

const NIGHT = `<svg class="pt-night" viewBox="-120 -100 240 200" aria-hidden="true">
  <g fill="#fff6c9">
    <path class="pt-star" d="M-80,-60 l3,7 7,1 -5,5 1,7 -6,-3 -6,3 1,-7 -5,-5 7,-1 z"/>
    <path class="pt-star" style="animation-delay:.6s" d="M78,-70 l3,7 7,1 -5,5 1,7 -6,-3 -6,3 1,-7 -5,-5 7,-1 z"/>
    <path class="pt-star" style="animation-delay:1.2s" d="M92,20 l2,5 5,1 -4,3 1,5 -4,-2 -4,2 1,-5 -4,-3 5,-1 z"/>
    <path class="pt-star" style="animation-delay:1.8s" d="M-96,30 l2,5 5,1 -4,3 1,5 -4,-2 -4,2 1,-5 -4,-3 5,-1 z"/>
  </g>
  <defs><mask id="pt-cut"><rect x="-120" y="-100" width="240" height="200" fill="#fff"/><circle cx="34" cy="-18" r="50" fill="#000"/></mask><clipPath id="pt-in"><circle r="62"/></clipPath></defs>
  <g class="pt-moon">
    <g mask="url(#pt-cut)">
      <circle r="62" fill="#ffe27a"/>
      <circle r="62" fill="none" stroke="#5a4272" stroke-width="4"/>
      <circle cx="34" cy="-18" r="52" fill="none" stroke="#5a4272" stroke-width="4" clip-path="url(#pt-in)"/>
    </g>
    <path d="M-48,-4 q8,7 16,0" fill="none" stroke="#5a4272" stroke-width="4" stroke-linecap="round"/>
    <path d="M-36,26 q7,6 14,0" fill="none" stroke="#5a4272" stroke-width="4" stroke-linecap="round"/>
    <circle cx="-48" cy="14" r="6" fill="#ff9fb8" opacity=".6"/>
  </g>
  <g class="pt-z" fill="#fff" font-family="inherit" font-weight="800">
    <text x="40" y="-40" font-size="26">z</text>
    <text x="58" y="-62" font-size="20" style="animation-delay:.8s">z</text>
  </g>
</svg>`;

function addStyle() {
  if (document.getElementById('pt-style')) return;
  const st = document.createElement('style');
  st.id = 'pt-style';
  st.textContent = `
.pt-sun { width: clamp(40px, 7vmin, 54px); height: clamp(40px, 7vmin, 54px); align-self: center; pointer-events: none; transition: opacity .4s; }
.pt-sun.hidden { display: none; }
.pt-sun svg { width: 100%; height: 100%; }
.pt-sun .pt-left { stroke-dasharray: calc(var(--left, 1) * 100) 100; transition: stroke-dasharray 1s linear; }
.pt-sun.low .pt-rays { opacity: .25; }
.pt-sun.low { animation: pt-bob 1.6s ease-in-out infinite; }
.pt-rest { position: fixed; inset: 0; z-index: 10000; display: grid; place-items: center; align-content: center; gap: 2vh;
  background: radial-gradient(circle at 50% 35%, #4b3d8f, #241b4d 75%); color: #fff6c9; opacity: 0; transition: opacity .6s;
  font-family: 'Baloo 2', ui-rounded, system-ui, sans-serif; font-weight: 800; touch-action: none; user-select: none; -webkit-user-select: none; }
.pt-rest.open { opacity: 1; }
.pt-night { width: min(70vw, 52vh); height: auto; overflow: visible; }
.pt-moon { animation: pt-bob 4s ease-in-out infinite; }
.pt-star { animation: pt-twinkle 2.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
.pt-z text { animation: pt-z 3s ease-in-out infinite; }
.pt-words { font-size: clamp(30px, 7vmin, 60px); text-shadow: 0 4px 0 rgba(0,0,0,.25); }
.pt-grown { margin-top: 3vh; display: grid; justify-items: center; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; font-weight: 600; }
.pt-grown button { appearance: none; border: 0; font: inherit; cursor: pointer; touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
.pt-hold { position: relative; overflow: hidden; padding: 10px 18px; border-radius: 999px; background: rgba(255,255,255,.12); color: rgba(255,255,255,.75); font-size: 14px; }
.pt-ring { position: absolute; inset: 0; background: rgba(255,255,255,.25); transform: scaleX(0); transform-origin: left; }
.pt-hold.holding .pt-ring { transition: transform 3s linear; transform: scaleX(1); }
.pt-choices { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.pt-choices[hidden], .pt-hold[hidden] { display: none; }
.pt-choices button { padding: 12px 16px; border-radius: 14px; background: #fff6c9; color: #3a2d6b; font-size: 16px; }
@keyframes pt-bob { 50% { transform: translateY(-6px); } }
@keyframes pt-twinkle { 50% { opacity: .3; transform: scale(.7); } }
@keyframes pt-z { 0% { opacity: 0; transform: translate(0, 10px); } 40% { opacity: 1; } 100% { opacity: 0; transform: translate(10px, -14px); } }
`;
  document.head.append(st);
}
