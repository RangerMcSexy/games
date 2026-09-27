// "A sticker for your book!": shown in a game the moment it earns a sticker
// for the home page's sticker book. The sticker pops up big, then flies into
// a little book and waits there to be stuck in on the home page.
import { BOOK, BOOK_KEY } from './stickers';

export interface StickerHost {
  /** The game's scene: the moment ends early and clears up if the game moves on. */
  sc: {
    until(p: Promise<unknown>, maxMs?: number): Promise<void>;
    addCleanup(fn: () => void): void;
  };
  /** The game's pictures of its stickers (its src/stickers.ts). */
  art: Record<string, () => string>;
  /** A happy sound as the sticker appears. */
  chime(): void;
  /** Says "A sticker for your book!". */
  say(): Promise<unknown>;
}

interface BookSave {
  stuck: string[];
  /** Stickers already shown in their game. */
  told: string[];
}

function readJson(key: string): Record<string, unknown> {
  try {
    const v = JSON.parse(localStorage.getItem(key) || 'null');
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}

function readBook(): BookSave & Record<string, unknown> {
  const b = readJson(BOOK_KEY);
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  return { ...b, stuck: list(b.stuck), told: list(b.told) };
}

/** Stickers this game has earned that haven't been shown or stuck in yet. */
export function newStickers(game: string): string[] {
  const page = BOOK.find((p) => p.game === game);
  if (!page) return [];
  const v = readJson(page.key)[page.count];
  const n = Array.isArray(v) ? v.length : v && typeof v === 'object' ? Object.keys(v).length : 0;
  const book = readBook();
  return page.stickers.filter((s) => n >= s.at && !book.stuck.includes(s.id) && !book.told.includes(s.id)).map((s) => s.id);
}

const BOOK_SVG = `<svg viewBox="-50 -50 100 100" aria-hidden="true">
  <g stroke="#5a4272" stroke-width="3.5" stroke-linejoin="round">
    <path d="M-46,-26 Q-22,-38 0,-28 Q22,-38 46,-26 L46,36 Q22,26 0,36 Q-22,26 -46,36 Z" fill="#ff8fc4"/>
    <path d="M-41,-31 Q-20,-40 0,-30 L0,29 Q-20,20 -41,28 Z" fill="#fff"/>
    <path d="M41,-31 Q20,-40 0,-30 L0,29 Q20,20 41,28 Z" fill="#fff"/>
  </g>
  <path d="M-21,-24 L-17,-14 L-6,-13 L-14,-6 L-12,5 L-21,-1 L-30,5 L-28,-6 L-36,-13 L-25,-14 Z" fill="#ffd84a" stroke="#5a4272" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M21,4 C13,-2 9,-8 12,-13 C15,-18 20,-16 21,-12 C22,-16 27,-18 30,-13 C33,-8 29,-2 21,4 Z" fill="#ff6b81" stroke="#5a4272" stroke-width="2.2" stroke-linejoin="round"/>
</svg>`;

const CSS = `
.stk-layer { position: fixed; inset: 0; z-index: 1000; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7vmin;
  background: radial-gradient(circle at 50% 45%, rgba(255, 250, 225, 0.92), rgba(255, 236, 200, 0.55) 55%, rgba(90, 66, 114, 0.25));
  animation: stk-fade-in 0.3s ease-out; touch-action: none; }
.stk-layer.out { animation: stk-fade-out 0.3s ease-in forwards; }
.stk-row { display: flex; gap: 5vmin; }
.stk { position: relative; width: var(--size); aspect-ratio: 1; display: grid; place-items: center; animation: stk-pop 0.55s cubic-bezier(0.3, 1.6, 0.6, 1) backwards; }
.stk::before { content: ''; position: absolute; inset: -18%; border-radius: 50%; z-index: -1;
  background: repeating-conic-gradient(from 0deg, rgba(255, 216, 74, 0.55) 0 10deg, transparent 10deg 30deg);
  mask: radial-gradient(circle, #000 30%, transparent 70%); -webkit-mask: radial-gradient(circle, #000 30%, transparent 70%);
  animation: stk-spin 8s linear infinite; }
.stk-art { width: 100%; height: 100%; display: grid; place-items: center; rotate: var(--r); animation: stk-bob 1.6s ease-in-out 0.6s infinite;
  filter: drop-shadow(0.7vmin 0 0 #fff) drop-shadow(-0.7vmin 0 0 #fff) drop-shadow(0 0.7vmin 0 #fff) drop-shadow(0 -0.7vmin 0 #fff) drop-shadow(0 1vmin 1vmin rgba(90, 66, 114, 0.35)); }
.stk-art svg { width: 100%; height: 100%; overflow: visible; }
.stk-book { width: clamp(90px, 24vmin, 170px); aspect-ratio: 1; display: grid; place-items: center; border-radius: 26%; background: #ffe9c7;
  border: 0.6vmin solid #fff; box-shadow: 0 1vmin 0 #f0b870; animation: stk-pop 0.5s cubic-bezier(0.3, 1.6, 0.6, 1) 0.25s backwards; }
.stk-book svg { width: 78%; height: 78%; overflow: visible; }
.stk-book.gulp { animation: stk-gulp 0.45s ease-out; }
.stk-spark { position: fixed; z-index: 1001; pointer-events: none; font: 800 clamp(16px, 4vmin, 30px)/1 system-ui, sans-serif; translate: -50% -50%; animation: stk-spark 0.8s ease-out forwards; }
@keyframes stk-fade-in { from { opacity: 0; } }
@keyframes stk-fade-out { to { opacity: 0; } }
@keyframes stk-pop { from { transform: scale(0.2); opacity: 0; } }
@keyframes stk-spin { to { transform: rotate(360deg); } }
@keyframes stk-bob { 50% { transform: translateY(-2vmin) scale(1.04); } }
@keyframes stk-gulp { 30% { transform: scale(1.25, 0.85); } 60% { transform: scale(0.92, 1.1); } }
@keyframes stk-spark { from { transform: translate(0, 0) scale(0.4); opacity: 1; } to { transform: translate(var(--dx), var(--dy)) scale(1.1); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .stk::before, .stk-art { animation: none; } }
`;

function addStyle() {
  if (document.getElementById('stk-style')) return;
  const s = document.createElement('style');
  s.id = 'stk-style';
  s.textContent = CSS;
  document.head.append(s);
}

function div(cls: string, parent: HTMLElement, html = '') {
  const d = document.createElement('div');
  d.className = cls;
  d.innerHTML = html;
  parent.append(d);
  return d;
}

function sparkles(target: Element, n: number, spread: number) {
  const r = target.getBoundingClientRect();
  const colours = ['#ffd84a', '#ff8fc4', '#7fd3ff', '#9be07a', '#c9a8ff'];
  for (let i = 0; i < n; i++) {
    const s = div('stk-spark', document.body, i % 3 ? '★' : '●');
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
    const d = (50 + Math.random() * 60) * spread;
    s.style.left = `${r.left + r.width / 2}px`;
    s.style.top = `${r.top + r.height / 2}px`;
    s.style.color = colours[i % colours.length];
    s.style.setProperty('--dx', `${Math.cos(a) * d}px`);
    s.style.setProperty('--dy', `${Math.sin(a) * d}px`);
    s.addEventListener('animationend', () => s.remove());
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Shows any stickers the game has just earned, then puts them in the book.
 * Resolves straight away if there are none.
 */
export async function stickerMoment(game: string, host: StickerHost): Promise<void> {
  const ids = newStickers(game).filter((id) => host.art[id]);
  if (!ids.length) return;
  // Shown once, even if the game is left halfway through.
  const book = readBook();
  book.told = [...book.told, ...ids];
  try {
    localStorage.setItem(BOOK_KEY, JSON.stringify(book));
  } catch {
    // Private mode: it's still waiting in the book on the home page.
  }

  addStyle();
  const { sc } = host;
  const layer = div('stk-layer', document.body);
  layer.setAttribute('role', 'status');
  layer.setAttribute('aria-label', 'A sticker for your book!');
  sc.addCleanup(() => layer.remove());
  const row = div('stk-row', layer);
  row.style.setProperty('--size', ids.length > 1 ? 'min(30vmin, 36vw, 200px)' : 'min(50vmin, 320px)');
  const stickers = ids.map((id, i) => {
    const s = div('stk', row, `<div class="stk-art">${host.art[id]()}</div>`);
    s.style.setProperty('--r', `${i % 2 ? 5 : -5}deg`);
    s.style.animationDelay = `${i * 0.15}s`;
    return s;
  });
  const bookEl = div('stk-book', layer, BOOK_SVG);

  let skip: () => void = () => {};
  const tapped = new Promise<void>((r) => (skip = r));
  layer.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    skip();
  });

  host.chime();
  stickers.forEach((s) => sparkles(s, 14, 1.3));
  // Let it be seen and heard, or move on after a tap.
  await sc.until(Promise.race([Promise.all([host.say(), sleep(1600)]), tapped.then(() => sleep(300))]), 4500);

  // Into the book they go.
  const to = bookEl.getBoundingClientRect();
  await sc.until(
    Promise.all(
      stickers.map((s, i) => {
        const from = s.getBoundingClientRect();
        const dx = to.left + to.width / 2 - (from.left + from.width / 2);
        const dy = to.top + to.height / 2 - (from.top + from.height / 2);
        const k = (to.width * 0.5) / from.width;
        return s
          .animate(
            [
              { transform: 'none', opacity: 1 },
              { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 40}px) rotate(-8deg) scale(${0.7 + k * 0.3})`, opacity: 1, offset: 0.45 },
              { transform: `translate(${dx}px, ${dy}px) scale(${k})`, opacity: 0 },
            ],
            { duration: 650, delay: i * 120, easing: 'ease-in', fill: 'forwards' },
          )
          .finished.catch(() => {});
      }),
    ),
    2000,
  );
  bookEl.classList.add('gulp');
  host.chime();
  sparkles(bookEl, 12, 0.8);
  await sc.until(sleep(700), 1000);
  layer.classList.add('out');
  await sc.until(sleep(300), 600);
  layer.remove();
}
