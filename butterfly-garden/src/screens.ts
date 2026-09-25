// Title screen, butterfly garden and the collection book.
import {
  ICONS,
  ICONS_EXTRA,
  balloonSVG,
  birdSVG,
  birdbathSVG,
  bunnySVG,
  bushSVG,
  butterflySVG,
  caterpillarSVG,
  eggSVG,
  fairyhouseSVG,
  flowerSVG,
  frogSVG,
  mushroomSVG,
  pondSVG,
  rainbowSVG,
  stickerSVG,
  treeSVG,
} from './art';
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
  markUnlocksSeen,
  nameOf,
  playerName,
  save,
  slotKey,
  unlocked,
  unseenUnlocks,
  type Butterfly,
  type FoodId,
  type Pattern,
  type Shape,
  type UnlockId,
} from './data';
import { Flock } from './flock';
import { guide } from './guide';
import { Scene, burst, burstAt, center, el, rand, replay } from './ui';
import { say, sayText } from './voice';

export interface Host {
  stage: HTMLElement;
  setScene(s: Scene): void;
}

const DEMO: Butterfly[] = [
  { id: 'd1', shape: 'round', pattern: 'dots', foods: ['strawberry', 'orange', 'banana', 'melon', 'blueberry'], golden: false, created: 0 },
  { id: 'd2', shape: 'swallow', pattern: 'stripes', foods: ['blueberry', 'grape', 'pear', 'blueberry', 'banana'], golden: false, created: 0 },
  { id: 'd3', shape: 'frilly', pattern: 'hearts', foods: ['melon', 'strawberry', 'grape', 'melon', 'banana'], golden: false, created: 0 },
];

const LOGO_COLORS = ['#ff8595', '#ffae5c', '#f5c542', '#86d07a', '#6fb2f2', '#b38ff0', '#ff9fcc'];

function recent(n: number) {
  return save.butterflies.slice(-n);
}

// ---------------------------------------------------------------------------
// Title

export async function titleScreen(host: Host): Promise<'play' | 'garden'> {
  setTime('day');
  const sc = new Scene(host.stage, 'title-scene');
  host.setScene(sc);
  guide.show();

  const flyZone = el('div', 'fly-zone', sc.root);
  const mine = recent(6);
  const flock = new Flock(flyZone, mine.length >= 3 ? mine : [...mine, ...DEMO].slice(0, 3), {
    size: Math.min(innerWidth, innerHeight) * 0.18,
    area: { top: 0.02, bottom: 0.7 },
    onTap: () => sound.giggle(),
  }).start();
  sc.addCleanup(() => flock.stop());

  const logo = el('h1', 'logo', sc.root);
  const name = playerName();
  if (name) el('span', 'logo-name', logo, `${escapeHtml(name)}'s`);
  const words = el('span', 'logo-words', logo);
  let k = 0;
  for (const w of ['Butterfly', 'Garden']) {
    const word = el('span', 'logo-word', words);
    for (const ch of w) {
      const s = el('span', 'logo-letter', word, ch);
      s.style.color = LOGO_COLORS[k % LOGO_COLORS.length];
      s.style.animationDelay = `${k * 0.08}s`;
      k++;
    }
  }

  const walker = el('div', 'title-cat', sc.root, caterpillarSVG(['strawberry', 'orange', 'banana', 'pear', 'blueberry']));
  walker.addEventListener('pointerdown', () => {
    sound.giggle();
    replay(walker, 'hop');
  });

  const buttons = el('div', 'title-buttons', sc.root);
  const play = el('button', 'big-btn green play-btn', buttons, ICONS.play);
  play.setAttribute('aria-label', 'Play');
  const garden = el('button', 'big-btn purple', buttons, ICONS.garden);
  garden.setAttribute('aria-label', 'Garden');
  if (save.butterflies.length) el('span', 'count-badge', garden, String(save.butterflies.length));

  // Greet once audio is available (after the first tap anywhere).
  let greeted = false;
  sc.on(document, 'pointerdown', () => {
    if (greeted) return;
    greeted = true;
    setTimeout(() => sc.alive && void say('title'), 150);
  });

  const i = await sc.tapAny([play, garden], 8000);
  greeted = true;
  sound.pop();
  sc.destroy();
  return i === 0 ? 'play' : 'garden';
}

// ---------------------------------------------------------------------------
// Garden

let gardenNight = false;

const FLOWER_COLORS = ['#ffa3d2', '#ff8595', '#ffffff', '#bb97f2', '#ffae5c', '#7cb9f7', '#ffdb6e'];

export async function gardenScreen(host: Host): Promise<'play' | 'home'> {
  setTime(gardenNight ? 'night' : 'day');
  const sc = new Scene(host.stage, `garden-scene${gardenNight ? ' night' : ''}`);
  host.setScene(sc);
  guide.show();

  // Surprises unlocked by growing more butterflies.
  const items = el('div', 'garden-items', sc.root);
  const fresh = new Set(unseenUnlocks());
  const itemEls = new Map<UnlockId, HTMLElement>();
  for (const id of unlocked()) {
    const e = buildItem(sc, id, items);
    itemEls.set(id, e);
    if (fresh.has(id)) e.classList.add('fresh');
  }
  markUnlocksSeen();

  // Fireflies come out at night.
  const flies = el('div', 'fireflies', sc.root);
  for (let i = 0; i < 14; i++) {
    const f = el('button', 'firefly', flies);
    f.setAttribute('aria-label', 'firefly');
    f.style.left = `${rand(4, 94)}%`;
    f.style.top = `${rand(18, 72)}%`;
    f.style.setProperty('--dx', `${rand(-12, 12)}vmin`);
    f.style.setProperty('--dy', `${rand(-10, 10)}vmin`);
    f.style.animationDuration = `${rand(5, 9)}s, ${rand(1.4, 2.6)}s`;
    f.style.animationDelay = `${rand(-8, 0)}s, ${rand(-2, 0)}s`;
    sc.on(f, 'pointerdown', (e) => {
      e.preventDefault();
      sound.bloop(i);
      burstAt(f, { kind: 'sparkle', count: 6, colors: ['#fff6a8', '#e0ffb0'], spread: 0.5 });
      replay(f, 'blink');
    });
  }

  // Flowers: tap to play a note, drag one to call the butterflies for nectar.
  const flyZone = el('div', 'fly-zone', sc.root);
  const bed = el('div', 'flower-bed', sc.root);
  const nFlowers = Math.max(5, Math.min(Math.round(innerWidth / 95), 4 + save.butterflies.length));
  const list = recent(24);
  const size = Math.min(innerWidth, innerHeight) * (list.length > 12 ? 0.15 : 0.19);
  let lastNectarLine = 0;
  const flock = new Flock(flyZone, list, {
    size,
    area: { top: 0.12, bottom: 0.72 },
    onTap: (b, e) => {
      sound.giggle();
      burstAt(e, { kind: 'heart', count: 5 });
      void sayText(nameOf(b));
    },
    onFeed: (_b, e) => {
      sound.slurp();
      burstAt(e, { kind: 'heart', count: 6, colors: ['#ff8595', '#ffa3d2', '#ffdb6e'] });
      if (performance.now() - lastNectarLine > 6000) {
        lastNectarLine = performance.now();
        void say('nectar');
      }
    },
  }).start();
  sc.addCleanup(() => flock.stop());

  const flowers: HTMLElement[] = [];
  for (let i = 0; i < nFlowers; i++) {
    const color = FLOWER_COLORS[i % FLOWER_COLORS.length];
    const f = el('button', 'garden-flower', bed, flowerSVG(color, i % 2 ? '#ffdb6e' : '#ffae5c'));
    f.setAttribute('aria-label', 'flower');
    f.style.setProperty('--h', `${rand(0.85, 1.15)}`);
    f.style.animationDelay = `${rand(-3, 0)}s`;
    flowers.push(f);
    sc.on(f, 'pointerdown', (e) => startFlowerDrag(sc, e as PointerEvent, f, color, i, flock));
  }

  // Controls along the top.
  const actions = el('div', 'garden-actions', sc.root);
  const book = el('button', 'big-btn blue small', actions, ICONS.book);
  book.setAttribute('aria-label', 'Butterfly book');
  el('span', 'count-badge', book, `${discovered().size}`);
  const dayNight = el('button', 'big-btn night-toggle small', actions);
  dayNight.setAttribute('aria-label', 'Day or night');
  const paintToggle = () => (dayNight.innerHTML = gardenNight ? ICONS_EXTRA.sun : ICONS_EXTRA.moon);
  paintToggle();
  const play = el('button', 'big-btn green small', actions, ICONS.play);
  play.setAttribute('aria-label', 'Play');

  sc.on(dayNight, 'pointerdown', (e) => {
    e.preventDefault();
    gardenNight = !gardenNight;
    setTime(gardenNight ? 'night' : 'day');
    sc.root.classList.toggle('night', gardenNight);
    paintToggle();
    sound.chime();
    void say(gardenNight ? 'nightGarden' : 'dayGarden');
  });

  if (!list.length) {
    const empty = el('div', 'garden-empty', sc.root, caterpillarSVG([]));
    empty.addEventListener('pointerdown', () => {
      sound.giggle();
      replay(empty, 'hop');
    });
    void say('gardenEmpty');
    play.classList.add('nudge');
  } else {
    void introGarden(sc, fresh, itemEls, flowers[Math.floor(flowers.length / 2)]);
  }

  for (;;) {
    const i = await sc.tapAny([book, play], 0);
    sound.pop();
    if (i === 1) break;
    await openBook(sc);
  }
  sc.destroy();
  return 'play';
}

async function introGarden(sc: Scene, fresh: Set<UnlockId>, itemEls: Map<UnlockId, HTMLElement>, flower?: HTMLElement) {
  try {
    await sc.until(say('garden'), 3500);
    for (const id of fresh) {
      const e = itemEls.get(id);
      if (!e) continue;
      sound.chime();
      burstAt(e, { kind: 'sparkle', count: 18, spread: 1.2 });
      guide.pointAt(e);
      await sc.until(say('gardenNew'), 3500);
      await sc.wait(1200);
    }
    guide.goHome();
    // A gentle tip about feeding, until she's tried it.
    if (flower && !fedEver) {
      await sc.wait(4000);
      if (fedEver) return;
      guide.pointAt(flower);
      await sc.until(say('dragFlower'), 4000);
      await sc.wait(2500);
      guide.goHome();
    }
  } catch {
    /* scene ended */
  }
}

let fedEver = false;

function startFlowerDrag(sc: Scene, e: PointerEvent, f: HTMLElement, color: string, i: number, flock: Flock) {
  e.preventDefault();
  const sx = e.clientX;
  const sy = e.clientY;
  const pid = e.pointerId;
  let drag: HTMLElement | null = null;

  const move = (ev: PointerEvent) => {
    if (ev.pointerId !== pid) return;
    if (!drag && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 14) {
      drag = el('div', 'drag-bloom', sc.root, flowerSVG(color));
      f.classList.add('picked');
      sound.pop(0.8);
      fedEver = true;
    }
    if (drag) {
      drag.style.transform = `translate(${ev.clientX}px, ${ev.clientY}px)`;
      flock.setAttractor({ x: ev.clientX, y: ev.clientY - drag.offsetHeight * 0.3 });
    }
  };
  const up = (ev: PointerEvent) => {
    if (ev.pointerId !== pid) return;
    removeEventListener('pointermove', move);
    removeEventListener('pointerup', up);
    removeEventListener('pointercancel', up);
    flock.setAttractor(null);
    f.classList.remove('picked');
    if (drag) {
      const d = drag;
      d.classList.add('drop');
      setTimeout(() => d.remove(), 300);
      replay(f, 'boing');
    } else {
      // A plain tap: the flowers are a little xylophone.
      sound.bloop(i);
      replay(f, 'boing');
      burstAt(f.querySelector('.bloom') ?? f, { kind: 'sparkle', count: 5, spread: 0.5, colors: [color, '#fff6a8'] });
    }
  };
  addEventListener('pointermove', move);
  addEventListener('pointerup', up);
  addEventListener('pointercancel', up);
  sc.addCleanup(() => {
    removeEventListener('pointermove', move);
    removeEventListener('pointerup', up);
    removeEventListener('pointercancel', up);
  });
}

function buildItem(sc: Scene, id: UnlockId, parent: HTMLElement): HTMLElement {
  const wrap = el('div', `gi gi-${id}`, parent);
  const tap = (target: HTMLElement, fn: () => void) =>
    sc.on(target, 'pointerdown', (e) => {
      e.preventDefault();
      fn();
    });
  switch (id) {
    case 'mushroom': {
      const m = el('button', 'gi-art', wrap, mushroomSVG());
      tap(m, () => {
        sound.boing();
        replay(m, 'squish');
        burstAt(m, { kind: 'sparkle', count: 6, spread: 0.6 });
      });
      break;
    }
    case 'pond': {
      const p = el('button', 'gi-art', wrap, pondSVG());
      const frog = el('button', 'frog', wrap, frogSVG());
      const hop = () => {
        sound.ribbit();
        replay(frog, 'frog-hop');
        setTimeout(() => burstAt(p, { kind: 'bits', count: 8, colors: ['#b9e2fa', '#ffffff'], spread: 0.5, size: 0.6 }), 500);
      };
      tap(frog, hop);
      tap(p, hop);
      break;
    }
    case 'rainbow': {
      const r = el('button', 'gi-art', wrap, rainbowSVG());
      tap(r, () => {
        sound.chime();
        const c = center(r);
        burst(c.x, c.y, { kind: 'sparkle', count: 14, spread: 1.4, colors: ['#ff8a9a', '#ffe07a', '#8cc4f7', '#c2a3f2'] });
      });
      break;
    }
    case 'bunny': {
      const bunny = el('button', 'bunny', wrap, bunnySVG());
      const bush = el('button', 'gi-art bush', wrap, bushSVG());
      const pop = () => {
        sound.hop();
        replay(bunny, 'peek');
      };
      tap(bush, pop);
      tap(bunny, pop);
      break;
    }
    case 'tree': {
      const t = el('button', 'gi-art', wrap, treeSVG());
      tap(t, () => {
        sound.swoosh();
        sound.giggle();
        replay(t, 'swinging');
      });
      break;
    }
    case 'birdbath': {
      const b = el('button', 'gi-art', wrap, birdbathSVG());
      const bird = el('button', 'bird', wrap, birdSVG());
      const tweet = () => {
        sound.tweet();
        replay(bird, 'bird-hop');
        setTimeout(() => burstAt(b, { kind: 'bits', count: 6, colors: ['#b9e2fa', '#ffffff'], spread: 0.4, size: 0.5 }), 300);
      };
      tap(b, tweet);
      tap(bird, tweet);
      break;
    }
    case 'balloon': {
      const b = el('button', 'gi-art', wrap, balloonSVG());
      tap(b, () => {
        sound.pop(0.7);
        replay(b, 'lift');
        burstAt(b, { kind: 'confetti', count: 14, spread: 0.8 });
      });
      break;
    }
    case 'fairyhouse': {
      const h = el('button', 'gi-art', wrap, fairyhouseSVG());
      tap(h, () => {
        sound.chime();
        replay(h, 'twinkle');
        burstAt(h, { kind: 'sparkle', count: 12, colors: ['#fff4c2', '#c2a3f2', '#ffffff'] });
      });
      break;
    }
  }
  return wrap;
}

// ---------------------------------------------------------------------------
// Collection book: rows are eggs (wing shape), columns are stickers (pattern).

const SILHOUETTE_FOODS: FoodId[] = ['pear', 'pear', 'pear', 'pear', 'pear'];

async function openBook(sc: Scene): Promise<void> {
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
          sound.giggle();
          replay(cell, 'spin');
          void sayText(nameOf(have));
        });
      } else {
        cell.innerHTML = butterflySVG({ shape: s, pattern: p, foods: SILHOUETTE_FOODS, golden: false }, { silhouette: true });
        el('span', 'q-mark', cell, '?');
        cell.setAttribute('aria-label', 'not found yet');
        cell.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          sound.tapSoft();
          replay(cell, 'shake');
          void sayText(`Pick the ${SHAPE_NAMES[s]} egg and the ${PATTERN_NAMES[p].toLowerCase()} sticker!`);
        });
      }
    });
  });

  if (found.size === total) el('div', 'book-crown', book, '👑');

  const close = el('button', 'round-btn close-btn', book, ICONS.close);
  close.setAttribute('aria-label', 'Close');

  requestAnimationFrame(() => overlay.classList.add('open'));
  void say('book');

  // Tapping the dim backdrop also closes the book.
  const backdropTap = new Promise<void>((resolve) =>
    overlay.addEventListener('pointerdown', (e) => {
      if (e.target === overlay) resolve();
    }),
  );
  await Promise.race([sc.tap(close, 0), backdropTap]);
  sound.tapSoft();
  overlay.classList.remove('open');
  setTimeout(() => overlay.remove(), 350);
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
