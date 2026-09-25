// Title screen, butterfly garden and the collection book.
import { ICONS, butterflySVG, caterpillarSVG, eggSVG, flowerSVG, stickerSVG } from './art';
import { sound } from './audio';
import { setTime } from './backdrop';
import {
  PATTERNS,
  PATTERN_NAMES,
  SHAPES,
  SHAPE_NAMES,
  discovered,
  goldenSlots,
  latestFor,
  nameOf,
  resetCollection,
  save,
  slotKey,
  type Butterfly,
  type FoodId,
  type Pattern,
  type Shape,
} from './data';
import { Flock } from './flock';
import { Scene, burstAt, el, rand, replay } from './ui';

export interface Host {
  stage: HTMLElement;
  setScene(s: Scene): void;
}

const DEMO: Butterfly[] = [
  { id: 'd1', shape: 'round', pattern: 'dots', foods: ['strawberry', 'orange', 'banana', 'melon', 'blueberry'], golden: false, created: 0 },
  { id: 'd2', shape: 'swallow', pattern: 'stripes', foods: ['blueberry', 'grape', 'pear', 'blueberry', 'banana'], golden: false, created: 0 },
  { id: 'd3', shape: 'heart', pattern: 'hearts', foods: ['melon', 'strawberry', 'grape', 'melon', 'banana'], golden: false, created: 0 },
];

function recent(n: number) {
  return save.butterflies.slice(-n);
}

// ---------------------------------------------------------------------------
// Title

export async function titleScreen(host: Host): Promise<'play' | 'garden'> {
  setTime('day');
  const sc = new Scene(host.stage, 'title-scene');
  host.setScene(sc);

  const flyZone = el('div', 'fly-zone', sc.root);
  const mine = recent(6);
  const flock = new Flock(flyZone, mine.length >= 3 ? mine : [...mine, ...DEMO].slice(0, 3), {
    size: Math.min(innerWidth, innerHeight) * 0.18,
    area: { top: 0.02, bottom: 0.7 },
    onTap: () => sound.squeak(),
  }).start();
  sc.addCleanup(() => flock.stop());

  const logo = el('h1', 'logo', sc.root);
  const words = ['Butterfly', 'Garden'];
  const palette = ['#ff5d73', '#ff9f1c', '#ffc93c', '#7fd35b', '#4ea8ff', '#a86cf0', '#ff8fcf'];
  let k = 0;
  for (const w of words) {
    const word = el('span', 'logo-word', logo);
    for (const ch of w) {
      const s = el('span', 'logo-letter', word, ch);
      s.style.color = palette[k % palette.length];
      s.style.animationDelay = `${k * 0.08}s`;
      k++;
    }
  }

  const walker = el('div', 'title-cat', sc.root, caterpillarSVG(['strawberry', 'orange', 'banana', 'pear', 'blueberry']));
  walker.addEventListener('pointerdown', () => {
    sound.squeak();
    replay(walker, 'hop');
  });

  const buttons = el('div', 'title-buttons', sc.root);
  const play = el('button', 'big-btn green play-btn', buttons, ICONS.play);
  play.setAttribute('aria-label', 'Play');
  const garden = el('button', 'big-btn purple', buttons, ICONS.garden);
  garden.setAttribute('aria-label', 'Garden');
  if (save.butterflies.length) el('span', 'count-badge', garden, String(save.butterflies.length));

  const i = await sc.tapAny([play, garden], 8000);
  sound.pop();
  sc.destroy();
  return i === 0 ? 'play' : 'garden';
}

// ---------------------------------------------------------------------------
// Garden

export async function gardenScreen(host: Host): Promise<'play' | 'home'> {
  setTime('day');
  const sc = new Scene(host.stage, 'garden-scene');
  host.setScene(sc);

  const bed = el('div', 'flower-bed', sc.root);
  const flowerColors = ['#ff8fcf', '#ff5d73', '#ffffff', '#a86cf0', '#ff9f1c', '#4ea8ff', '#ffd23f'];
  const nFlowers = Math.max(5, Math.min(9, Math.round(innerWidth / 130)));
  for (let i = 0; i < nFlowers; i++) {
    const f = el('button', 'garden-flower', bed, flowerSVG(flowerColors[i % flowerColors.length], i % 2 ? '#ffd23f' : '#ff9f1c'));
    f.setAttribute('aria-label', 'flower');
    f.style.setProperty('--h', `${rand(0.8, 1.15)}`);
    f.style.animationDelay = `${rand(-3, 0)}s`;
    f.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      sound.bloop(i);
      replay(f, 'boing');
      burstAt(f.querySelector('.bloom') ?? f, { kind: 'sparkle', count: 5, spread: 0.5, colors: [flowerColors[i % flowerColors.length], '#fff6a8'] });
    });
  }

  const flyZone = el('div', 'fly-zone', sc.root);
  const list = recent(24);
  const size = Math.min(innerWidth, innerHeight) * (list.length > 12 ? 0.15 : 0.19);
  const flock = new Flock(flyZone, list, {
    size,
    area: { top: 0.1, bottom: 0.78 },
    onTap: (b, e) => {
      sound.squeak();
      burstAt(e, { kind: 'heart', count: 5 });
      sound.speak(nameOf(b));
    },
  }).start();
  sc.addCleanup(() => flock.stop());

  const actions = el('div', 'corner-actions', sc.root);
  const book = el('button', 'big-btn blue', actions, ICONS.book);
  book.setAttribute('aria-label', 'Butterfly book');
  el('span', 'count-badge', book, `${discovered().size}`);
  const play = el('button', 'big-btn green', actions, ICONS.play);
  play.setAttribute('aria-label', 'Play');

  if (!list.length) {
    const empty = el('div', 'garden-empty', sc.root, caterpillarSVG([]));
    empty.addEventListener('pointerdown', () => {
      sound.squeak();
      replay(empty, 'hop');
    });
    sound.speak("Your garden is empty. Let's grow a butterfly!");
    replay(play, 'nudge');
  } else {
    const n = save.butterflies.length;
    sound.speak(n === 1 ? 'Your butterfly garden! Tap your butterfly!' : `Your butterfly garden! You have ${n} butterflies!`);
  }

  for (;;) {
    const i = await sc.tapAny([book, play], list.length ? 0 : 6000);
    sound.pop();
    if (i === 1) break;
    const reset = await openBook(sc);
    if (reset) {
      sc.destroy();
      return 'home';
    }
  }
  sc.destroy();
  return 'play';
}

// ---------------------------------------------------------------------------
// Collection book: rows are eggs (wing shape), columns are stickers (pattern).

const SILHOUETTE_FOODS: FoodId[] = ['pear', 'pear', 'pear', 'pear', 'pear'];

async function openBook(sc: Scene): Promise<boolean> {
  const overlay = el('div', 'book-overlay', sc.root);
  const book = el('div', 'book', overlay);
  const found = discovered();
  const goldens = goldenSlots();
  const total = SHAPES.length * PATTERNS.length;

  const head = el('div', 'book-head', book);
  const prog = el('div', 'book-progress', head);
  for (let i = 0; i < total; i++) el('span', `bp-dot${i < found.size ? ' on' : ''}`, prog);
  el('div', 'book-count', head, `${found.size} / ${total}`);

  const grid = el('div', 'book-grid', book);
  el('div', 'bg-corner', grid);
  PATTERNS.forEach((p) => el('div', 'bg-col-head', grid, stickerSVG(p)));
  SHAPES.forEach((s: Shape) => {
    el('div', 'bg-row-head', grid, eggSVG(s));
    PATTERNS.forEach((p: Pattern) => {
      const key = slotKey(s, p);
      const have = latestFor(s, p);
      const cell = el('button', `bg-cell${have ? ' have' : ''}`, grid);
      if (have) {
        cell.innerHTML = butterflySVG(have, { flap: true, speed: 0.6 + Math.random() * 0.2 });
        if (goldens.has(key)) el('span', 'gold-star', cell, '★');
        cell.setAttribute('aria-label', nameOf(have));
        cell.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          sound.squeak();
          replay(cell, 'spin');
          sound.speak(nameOf(have));
        });
      } else {
        cell.innerHTML = butterflySVG({ shape: s, pattern: p, foods: SILHOUETTE_FOODS, golden: false }, { silhouette: true });
        el('span', 'q-mark', cell, '?');
        cell.setAttribute('aria-label', 'not found yet');
        cell.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          sound.tapSoft();
          replay(cell, 'shake');
          sound.speak(`Pick the ${SHAPE_NAMES[s]} egg and the ${PATTERN_NAMES[p].toLowerCase()} sticker!`);
        });
      }
    });
  });

  if (found.size === total) el('div', 'book-crown', book, '👑');

  const close = el('button', 'round-btn close-btn', book, ICONS.close);
  close.setAttribute('aria-label', 'Close');

  // Grown-ups only: hold the bin for three seconds to start a fresh book.
  const bin = el('button', 'reset-btn', book, `${ICONS.trash}<span class="ring"></span>`);
  bin.setAttribute('aria-label', 'Hold to reset collection');
  let holdTimer = 0;
  let didReset = false;
  const cancelHold = () => {
    clearTimeout(holdTimer);
    bin.classList.remove('holding');
  };
  const resetDone = new Promise<void>((resolve) => {
    bin.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      bin.classList.add('holding');
      holdTimer = window.setTimeout(() => {
        bin.classList.remove('holding');
        if (confirm('Start a brand new butterfly book? This clears every butterfly.')) {
          resetCollection();
          didReset = true;
          resolve();
        }
      }, 3000);
    });
  });
  bin.addEventListener('pointerup', cancelHold);
  bin.addEventListener('pointerleave', cancelHold);
  bin.addEventListener('pointercancel', cancelHold);

  requestAnimationFrame(() => overlay.classList.add('open'));
  sound.speak(found.size ? `You found ${found.size} kinds of butterflies!` : 'Your butterfly book! Let us fill it up!');

  // Tapping the dim backdrop also closes the book.
  const backdropTap = new Promise<void>((resolve) =>
    overlay.addEventListener('pointerdown', (e) => {
      if (e.target === overlay) resolve();
    }),
  );
  await Promise.race([sc.tap(close, 0), backdropTap, resetDone, new Promise<void>((r) => sc.addCleanup(r))]);
  cancelHold();
  sound.tapSoft();
  overlay.classList.remove('open');
  setTimeout(() => overlay.remove(), 350);
  return didReset;
}
