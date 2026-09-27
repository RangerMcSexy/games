// The sticker book. Every game gives out stickers as its collection grows
// (see stickers.ts for which and when). The home page reads each game's own
// save, so the games don't need to know about the book. A sticker that's
// been earned waits on the book's tile until it's opened; then it's tapped
// and stuck in, and it stays in the book even if a game is started again.
import { PAGES } from './stickers.js';

// Spoken lines, in the same form as the games' src/voice.ts, so
// scripts/voice/lines.mjs picks them up. Sticker names and page titles come
// from stickers.ts.
const LINES = [
  { id: 'open', text: 'Your sticker book!' },
  { id: 'new', text: 'A new sticker! Tap it!' },
  { id: 'newMore', text: 'Another new sticker!' },
  { id: 'notYet', text: 'Keep playing to find this one!' },
  { id: 'all', text: 'You found every sticker!' },
];
const line = (id) => LINES.find((l) => l.id === id).text;

const KEY = 'sticker-book.v1';
const ALL = PAGES.flatMap((p, page) => p.stickers.map((s) => ({ ...s, page })));

function loadStuck() {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || 'null');
    return new Set(Array.isArray(p?.stuck) ? p.stuck.filter((id) => ALL.some((s) => s.id === id)) : []);
  } catch {
    return new Set();
  }
}
let stuck = loadStuck();
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ stuck: [...stuck] }));
  } catch {
    // Private mode: the stickers still get stuck in for this visit.
  }
}

/** How many things a game has collected, read from its save. */
function collected(page) {
  try {
    const v = JSON.parse(localStorage.getItem(page.key) || 'null')?.[page.count];
    if (Array.isArray(v)) return v.length;
    if (v && typeof v === 'object') return Object.keys(v).length;
  } catch {
    // An unreadable save counts as nothing yet.
  }
  return 0;
}

/** Stickers earned but not stuck in yet, in book order. */
export function waiting() {
  stuck = loadStuck();
  const counts = PAGES.map(collected);
  return ALL.filter((s) => !stuck.has(s.id) && counts[s.page] >= s.at);
}

export const stuckCount = () => loadStuck().size;
export const total = ALL.length;

// ---------------------------------------------------------------------------
// Sound: little tones made on the spot, and the games' voice clips.

let audio;
export function ctx() {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') void audio.resume();
    return audio;
  } catch {
    return null;
  }
}

function tone(freq, to, dur, { type = 'sine', vol = 0.3, at = 0 } = {}) {
  const c = ctx();
  if (!c) return;
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export const sfx = {
  pop: () => tone(520, 1020, 0.14, { vol: 0.4 }),
  soft: () => tone(330, 260, 0.12, { type: 'triangle', vol: 0.25 }),
  swish: () => tone(900, 300, 0.18, { type: 'triangle', vol: 0.12 }),
  boing: () => tone(300, 620, 0.22, { type: 'triangle', vol: 0.3 }),
  // A thump and a happy three-note chime.
  stick: () => {
    tone(180, 70, 0.16, { vol: 0.5 });
    [784, 988, 1319].forEach((f, i) => tone(f, 0, 0.35, { type: 'triangle', vol: 0.18, at: 0.08 + i * 0.09 }));
  },
  fanfare: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0, 0.4, { type: 'triangle', vol: 0.2, at: i * 0.12 })),
};

// A grown-up's recording (made in any game's settings) comes first, then the
// voice clips made for the games, then the device's own voice.
let clips;
const loadClips = () =>
  (clips ??= fetch('voice/manifest.json')
    .then((r) => (r.ok ? r.json() : {}))
    .then((m) => m.clips ?? {})
    .catch(() => ({})));

function recording(text) {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open('games-voice', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('clips');
      req.onerror = () => resolve(null);
      req.onsuccess = () => {
        try {
          const get = req.result.transaction('clips', 'readonly').objectStore('clips').get(text);
          get.onsuccess = () => resolve(get.result ?? null);
          get.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      };
    } catch {
      resolve(null);
    }
  });
}

const decode = (c, data) => new Promise((ok) => c.decodeAudioData(data, ok, () => ok(null)));
let playing = null;
let saying = 0;

export function hush() {
  saying++;
  try {
    playing?.stop();
  } catch {
    // Already finished.
  }
  playing = null;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

export async function say(text) {
  hush();
  const me = saying;
  const c = ctx();
  if (!c || document.hidden) return;
  let buf = null;
  try {
    const blob = await recording(text);
    if (blob) buf = await decode(c, await blob.arrayBuffer());
    if (!buf) {
      const file = (await loadClips())[text];
      if (file) buf = await decode(c, await (await fetch(`voice/${file}`)).arrayBuffer());
    }
  } catch {
    buf = null;
  }
  if (me !== saying) return;
  if (buf) {
    const src = c.createBufferSource();
    const g = c.createGain();
    g.gain.value = 1.4;
    src.buffer = buf;
    src.connect(g).connect(c.destination);
    src.start();
    playing = src;
  } else if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.92;
    u.pitch = 1.2;
    speechSynthesis.speak(u);
  }
}

// ---------------------------------------------------------------------------
// The book

const el = (tag, cls, parent, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  parent?.append(e);
  return e;
};
const replay = (e, cls) => {
  e.classList.remove(cls);
  void e.offsetWidth;
  e.classList.add(cls);
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const ARROW = '<svg viewBox="-50 -50 100 100"><path d="M-12,-26 L16,0 L-12,26" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CLOSE = '<svg viewBox="-50 -50 100 100"><path d="M-28,-2 L0,-28 L28,-2 L28,28 L-28,28 Z" fill="#fff" stroke="#fff" stroke-width="8" stroke-linejoin="round"/><rect x="-8" y="8" width="16" height="22" rx="3" fill="#ff8fc4"/></svg>';
const PLAY = '<svg viewBox="-50 -50 100 100"><path d="M-14,-26 L28,0 L-14,26 Z" fill="#fff" stroke="#fff" stroke-width="10" stroke-linejoin="round"/></svg>';

// A little tilt for each sticker, the same every time.
const tilt = (id) => ((([...id].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) % 13) + 13) % 13) - 6;

function sparkles(x, y, n = 12, spread = 1) {
  const colours = ['#ffd84a', '#ff8fc4', '#7fd3ff', '#9be07a', '#c9a8ff', '#fff'];
  for (let i = 0; i < n; i++) {
    const s = el('span', 'b-spark', document.body, i % 3 ? '★' : '●');
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
    const d = (60 + Math.random() * 70) * spread;
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    s.style.color = colours[i % colours.length];
    s.style.setProperty('--dx', `${Math.cos(a) * d}px`);
    s.style.setProperty('--dy', `${Math.sin(a) * d}px`);
    s.addEventListener('animationend', () => s.remove());
  }
}

const mid = (e) => {
  const r = e.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

/**
 * Opens the book. `icons` maps each game to its tile's picture on the home
 * page; `onClose` runs once it's shut.
 */
export function openBook({ icons, onClose }) {
  const root = el('div', 'book', document.body);
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Sticker book');
  const close = el('button', 'b-btn b-close', root, CLOSE);
  close.setAttribute('aria-label', 'Back to the games');
  const prev = el('button', 'b-btn b-arrow b-prev', root, ARROW);
  prev.setAttribute('aria-label', 'Page before');
  const next = el('button', 'b-btn b-arrow b-next', root, ARROW);
  next.setAttribute('aria-label', 'Next page');
  const dots = el('div', 'b-dots', root);
  PAGES.forEach(() => el('span', 'b-dot', dots));
  const holder = el('div', 'b-holder', root);

  const queue = waiting();
  let busy = false;
  let alive = true;
  let at = queue.length ? queue[0].page : 0;
  let spots = [];
  let turning = 0;

  function draw(dir = 0) {
    const p = PAGES[at];
    holder.querySelector('.b-page')?.remove();
    const page = el('div', `b-page${dir ? (dir > 0 ? ' in-next' : ' in-prev') : ''}`, holder);
    page.style.setProperty('--bg', icons[p.game]?.bg ?? '#fff');
    page.style.setProperty('--edge', icons[p.game]?.edge ?? '#ddd');
    const rings = el('div', 'b-rings', page);
    for (let i = 0; i < 8; i++) el('span', '', rings);
    const head = el('div', 'b-head', page);
    const go = el('a', 'b-go', head, `<span class="b-icon">${icons[p.game]?.svg ?? ''}</span><span class="b-play">${PLAY}</span>`);
    go.href = `${p.game}/`;
    go.setAttribute('aria-label', `Play ${p.title}`);
    el('span', 'b-title', head, p.title);
    const grid = el('div', 'b-spots', page);
    spots = p.stickers.map((s) => {
      const spot = el('button', 'b-spot', grid);
      spot.style.setProperty('--r', `${tilt(s.id)}deg`);
      spot.dataset.id = s.id;
      const art = el('span', 'b-art', spot, s.svg);
      if (stuck.has(s.id)) {
        spot.classList.add('got');
        spot.setAttribute('aria-label', s.name);
      } else {
        spot.setAttribute('aria-label', 'Not found yet');
      }
      if (!stuck.has(s.id) && queue.some((q) => q.id === s.id)) spot.classList.add('waiting');
      spot.addEventListener('click', () => {
        if (busy) return;
        if (spot.classList.contains('got')) {
          replay(art, 'wiggle');
          sfx.boing();
          const c = mid(spot);
          sparkles(c.x, c.y, 8, 0.6);
          void say(s.name);
        } else {
          replay(spot, 'shake');
          sfx.soft();
          void say(line('notYet'));
        }
      });
      return spot;
    });
    dots.querySelectorAll('.b-dot').forEach((d, i) => d.classList.toggle('on', i === at));
    prev.classList.toggle('off', at === 0);
    next.classList.toggle('off', at === PAGES.length - 1);
  }

  async function turn(to) {
    if (to < 0 || to >= PAGES.length || to === at) return;
    const dir = to > at ? 1 : -1;
    // Quick taps each count: the page number moves on straight away.
    at = to;
    const me = ++turning;
    holder.querySelector('.b-page')?.classList.add(dir > 0 ? 'out-next' : 'out-prev');
    sfx.swish();
    await wait(200);
    if (alive && me === turning) draw(dir);
  }

  prev.addEventListener('click', () => {
    if (busy || at === 0) return;
    void turn(at - 1).then(() => alive && void say(PAGES[at].hello));
  });
  next.addEventListener('click', () => {
    if (busy || at === PAGES.length - 1) return;
    void turn(at + 1).then(() => alive && void say(PAGES[at].hello));
  });
  dots.addEventListener('click', (e) => {
    const i = [...dots.children].indexOf(e.target);
    if (busy || i < 0) return;
    void turn(i).then(() => alive && void say(PAGES[at].hello));
  });

  // New stickers: each one waits big in the middle; a tap sticks it in.
  async function stickNew() {
    busy = true;
    root.classList.add('busy');
    await wait(450);
    for (let i = 0; i < queue.length && alive; i++) {
      const s = queue[i];
      if (s.page !== at) {
        await turn(s.page);
        await wait(300);
      }
      if (!alive) return;
      const shade = el('div', 'b-shade', root);
      const card = el('button', 'b-new', shade, `<span class="b-art">${s.svg}</span>`);
      card.setAttribute('aria-label', 'A new sticker. Tap it!');
      card.style.setProperty('--r', `${tilt(s.id)}deg`);
      sfx.fanfare();
      const c = mid(card);
      sparkles(c.x, c.y, 16, 1.4);
      void say(line(i ? 'newMore' : 'new'));
      await new Promise((resolve) => {
        card.addEventListener('click', resolve, { once: true });
        shade.addEventListener('click', resolve, { once: true });
        root.addEventListener('b-closed', resolve, { once: true });
      });
      if (!alive) return;
      hush();
      sfx.pop();
      // Fly into its place on the page.
      const spot = spots.find((sp) => sp.dataset.id === s.id);
      const from = card.getBoundingClientRect();
      const to = spot.querySelector('.b-art').getBoundingClientRect();
      shade.classList.add('fade');
      card.style.animation = 'none';
      const k = to.width / from.width;
      const fly = card.animate(
        [
          { transform: `rotate(${tilt(s.id)}deg) scale(1)` },
          { transform: `translate(${(to.left + to.width / 2 - (from.left + from.width / 2)) * 0.5}px, ${(to.top + to.height / 2 - (from.top + from.height / 2)) * 0.5 - 60}px) rotate(${tilt(s.id) * 3}deg) scale(${(1 + k) / 2 + 0.1})`, offset: 0.5 },
          { transform: `translate(${to.left + to.width / 2 - (from.left + from.width / 2)}px, ${to.top + to.height / 2 - (from.top + from.height / 2)}px) rotate(${tilt(s.id)}deg) scale(${k})` },
        ],
        { duration: 650, easing: 'ease-in-out', fill: 'forwards' },
      );
      await fly.finished.catch(() => {});
      shade.remove();
      if (!alive) return;
      stuck.add(s.id);
      persist();
      spot.classList.remove('waiting');
      spot.classList.add('got');
      spot.setAttribute('aria-label', s.name);
      replay(spot, 'stuck');
      sfx.stick();
      const m = mid(spot);
      sparkles(m.x, m.y, 14, 0.9);
      await wait(250);
      void say(s.name);
      await wait(1500);
    }
    if (!alive) return;
    busy = false;
    root.classList.remove('busy');
    if (stuck.size === ALL.length && queue.length) {
      sfx.fanfare();
      void say(line('all'));
    }
  }

  function shut() {
    if (!alive) return;
    alive = false;
    hush();
    root.dispatchEvent(new Event('b-closed'));
    root.classList.add('closing');
    setTimeout(() => root.remove(), 250);
    onClose?.();
  }
  close.addEventListener('click', () => {
    sfx.pop();
    shut();
  });

  draw();
  if (queue.length) void stickNew();
  else void say(line('open'));
  return shut;
}
