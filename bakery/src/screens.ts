// The title screen and the bakery shop window (the collection).
import {
  ICONS,
  animalSVG,
  awningSVG,
  balloonsSVG,
  bellSVG,
  buntingSVG,
  doorSVG,
  flowerBoxSVG,
  lightsSVG,
  shopCatSVG,
  signSVG,
  standSVG,
  treatSVG,
  type TreatLook,
} from './art';
import { BELL_TUNE, sound } from './audio';
import { setTime } from './backdrop';
import {
  markUnlocksSeen,
  playerName,
  save,
  unlocked,
  unseenUnlocks,
  visitors,
  type AnimalId,
  type Treat,
  type UnlockId,
} from './data';
import { guide } from './guide';
import { Scene, burstAt, el, pick, rand, replay } from './ui';
import { say, sayAll } from './voice';

export interface Host {
  stage: HTMLElement;
  setScene(s: Scene): void;
}

const LOGO_COLORS = ['#ff8595', '#ffae5c', '#f5c542', '#86d07a', '#6fb2f2', '#b38ff0', '#ff9fcc'];

const DEMO: TreatLook[] = [
  { kind: 'cupcake', shape: 'heart', batter: 'yellow', icing: 'pink', sprinkles: 3, topper: 'cherry', seed: 'demo1' },
  { kind: 'cake', shape: 'round', batter: 'choc', icing: 'blue', sprinkles: 2, topper: 'candles', candles: 3, lit: true, seed: 'demo2' },
  { kind: 'cookie', shape: 'star', batter: 'yellow', icing: 'purple', sprinkles: 3, topper: 'strawberry', seed: 'demo3' },
];

const lookOf = (t: Treat): TreatLook => ({ ...t, seed: t.id, candles: t.topper === 'candles' ? 3 : 0, lit: false });

const namesOf = (t: Pick<TreatLook, 'kind' | 'shape' | 'icing' | 'batter'>) => [t.icing ?? t.batter, t.shape, t.kind];

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

// ---------------------------------------------------------------------------
// Title

export async function titleScreen(host: Host): Promise<'play' | 'shop'> {
  setTime('day');
  const sc = new Scene(host.stage, 'title-scene');
  host.setScene(sc);
  guide.show();

  const logo = el('h1', 'logo', sc.root);
  const name = playerName();
  if (name) el('span', 'logo-name', logo, `${escapeHtml(name)}'s`);
  const words = el('span', 'logo-words', logo);
  let k = 0;
  for (const w of ['Little', 'Bakery']) {
    const word = el('span', 'logo-word', words);
    for (const ch of w) {
      const s = el('span', 'logo-letter', word, ch);
      s.style.color = LOGO_COLORS[k % LOGO_COLORS.length];
      s.style.animationDelay = `${k * 0.08}s`;
      k++;
    }
  }

  // Three treats on the counter: the newest bakes, or some to get started.
  const mine = save.treats.slice(-3).map(lookOf);
  const shown = [...mine, ...DEMO].slice(0, 3);
  const row = el('div', 'title-treats', sc.root);
  shown.forEach((t, i) => {
    const b = el('div', 'title-treat', row, treatSVG(t, { plate: true }));
    b.style.setProperty('--d', `${i * 0.35}s`);
    b.addEventListener('pointerdown', () => {
      sound.pop(1 + i * 0.15);
      replay(b, 'wiggle');
      burstAt(b, { kind: 'sparkle', count: 6, spread: 0.5 });
      void sayAll(namesOf(t));
    });
  });

  const buttons = el('div', 'title-buttons', sc.root);
  const play = el('button', 'big-btn green play-btn', buttons, ICONS.play);
  play.setAttribute('aria-label', 'Bake');
  const shop = el('button', 'big-btn orange', buttons, ICONS.shop);
  shop.setAttribute('aria-label', 'Shop window');
  if (save.treats.length) el('span', 'count-badge', shop, String(save.treats.length));

  // Greet once audio is available (after the first tap anywhere).
  let greeted = false;
  sc.on(document, 'pointerdown', () => {
    if (greeted) return;
    greeted = true;
    setTimeout(() => sc.alive && void say('title'), 150);
  });

  const i = await sc.tapAny([play, shop], 8000);
  greeted = true;
  sound.pop();
  sc.destroy();
  return i === 0 ? 'play' : 'shop';
}

// ---------------------------------------------------------------------------
// Shop window

let shopNight = false;

export async function shopScreen(host: Host): Promise<'play' | 'home'> {
  setTime(shopNight ? 'night' : 'day');
  const sc = new Scene(host.stage, `shop-scene${shopNight ? ' night' : ''}`);
  host.setScene(sc);
  guide.hide();

  const have = new Set<UnlockId>(unlocked());
  const fresh = new Set<UnlockId>(unseenUnlocks());
  const cls = (id: UnlockId) => `unlock u-${id}${fresh.has(id) ? ' new' : ''}`;

  el('div', 'street-sky', sc.root, '<i class="s-moon"></i><i class="s-sun"></i>');
  const stars = el('div', 'street-stars', sc.root);
  for (let i = 0; i < 24; i++) {
    const s = el('i', '', stars);
    s.style.left = `${rand(0, 100)}%`;
    s.style.top = `${rand(0, 100)}%`;
    s.style.animationDelay = `${rand(-3, 0)}s`;
  }

  const facade = el('div', 'facade', sc.root);
  const signText = playerName() ? `${escapeHtml(playerName())}'s Bakery` : 'Bakery';
  el('div', `sign${have.has('sign') ? ' golden' : ''}${fresh.has('sign') ? ' new' : ''}`, facade, signSVG(signText, have.has('sign')));
  el('div', `awning${have.has('stripes') ? ' striped' : ''}${fresh.has('stripes') ? ' new' : ''}`, facade, awningSVG(have.has('stripes')));
  if (have.has('bunting')) el('div', cls('bunting'), facade, buntingSVG());

  const win = el('div', 'shop-window', facade);
  el('div', 'glass', win);
  const shelves = el('div', 'shelves', win);
  if (have.has('lights')) el('div', cls('lights'), win, lightsSVG());
  el('div', 'glass-shine', win);

  const doorBox = el('div', 'shop-door', facade, doorSVG());
  const bell = el('button', 'shop-bell', facade, bellSVG());
  bell.setAttribute('aria-label', 'Bell');
  if (have.has('flowers')) el('div', cls('flowers'), facade, flowerBoxSVG());
  if (have.has('balloons')) el('div', cls('balloons'), facade, balloonsSVG());

  el('div', 'pavement', sc.root);
  const strollZone = el('div', 'stroll-zone', sc.root);

  let cat: HTMLElement | null = null;
  if (have.has('cat')) {
    cat = el('div', cls('cat'), sc.root, shopCatSVG());
    cat.addEventListener('pointerdown', () => {
      sound.animal('cat');
      replay(cat!, 'wiggle');
    });
  }
  if (have.has('stand') && save.treats.length) {
    const latest = save.treats[save.treats.length - 1];
    const stand = el('div', cls('stand'), sc.root, `<div class="stand-treat">${treatSVG(lookOf(latest))}</div>${standSVG()}`);
    stand.addEventListener('pointerdown', () => {
      replay(stand, 'wiggle');
      sound.pop();
      void sayAll(namesOf(latest));
    });
  }

  // --- The shelves ---------------------------------------------------------
  // Short windows get two roomy shelves; tall ones get three.
  const SHELVES = win.clientHeight && win.clientHeight < innerHeight * 0.42 ? 2 : 3;
  shelves.style.gridTemplateRows = `repeat(${SHELVES}, 1fr)`;
  const rows = Array.from({ length: SHELVES }, () => {
    const r = el('div', 'shelf', shelves);
    const items = el('div', 'shelf-items', r);
    el('div', 'shelf-board', r);
    return items;
  });
  const fill = () => {
    rows.forEach((r) => (r.innerHTML = ''));
    const h = rows[0].clientHeight || 80;
    const w = rows[0].clientWidth || 300;
    const perRow = Math.max(3, Math.floor(w / (h * 1.3)));
    // Treats stand a little taller than the shelf gap, but always fit the width.
    const size = Math.min(h * 1.28, (w / perRow) * 1.02);
    const list = save.treats.slice(-perRow * SHELVES).reverse();
    list.forEach((t, i) => {
      const b = el('button', `shelf-treat${i === 0 && justBaked ? ' newest' : ''}`, rows[Math.floor(i / perRow)], treatSVG(lookOf(t)));
      b.style.height = `${size}px`;
      b.style.setProperty('--d', `${(i % perRow) * 0.05}s`);
      b.setAttribute('aria-label', 'Treat');
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        sound.pop(1 + (i % 5) * 0.1);
        replay(b, 'wiggle');
        void sayAll(namesOf(t));
      });
    });
  };
  const justBaked = save.treats.length > 0 && Date.now() - save.treats[save.treats.length - 1].created < 60_000;
  requestAnimationFrame(fill);
  let resizeT = 0;
  sc.on(window, 'resize', () => {
    clearTimeout(resizeT);
    resizeT = window.setTimeout(fill, 150);
  });

  // --- Things to play with ---------------------------------------------------
  let note = 0;
  bell.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    sound.bell(BELL_TUNE[note++ % BELL_TUNE.length]);
    replay(bell, 'ring');
  });
  doorBox.addEventListener('pointerdown', () => {
    sound.doorBell();
    replay(bell, 'ring');
  });

  const controls = el('div', 'shop-buttons', sc.root);
  const nightBtn = el('button', 'round-btn night-btn', controls, shopNight ? ICONS.sun : ICONS.moon);
  nightBtn.setAttribute('aria-label', 'Day or night');
  const play = el('button', `big-btn green${save.treats.length ? '' : ' nudge'}`, controls, ICONS.play);
  play.setAttribute('aria-label', 'Bake');
  nightBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    shopNight = !shopNight;
    sc.root.classList.toggle('night', shopNight);
    setTime(shopNight ? 'night' : 'day');
    nightBtn.innerHTML = shopNight ? ICONS.sun : ICONS.moon;
    sound.chime();
    void say(shopNight ? 'nightShop' : 'dayShop');
  });

  // Animals who have visited stroll past and wave.
  const who = visitors();
  let strolling = 0;
  const stroll = () => {
    if (!sc.alive || !who.length || strolling >= 2) return;
    const a: AnimalId = pick(who);
    strolling++;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const w = el('div', `stroller${dir < 0 ? ' left' : ''}`, strollZone, `<div class="stroller-inner">${animalSVG(a)}</div>`);
    const dur = rand(9000, 12000);
    const span = innerWidth + 300;
    const anim = w.animate(
      [{ transform: `translateX(${dir > 0 ? -200 : innerWidth + 100}px)` }, { transform: `translateX(${dir > 0 ? span - 200 : -200}px)` }],
      { duration: dur, easing: 'linear', fill: 'forwards' },
    );
    w.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      sound.animal(a);
      replay(w.firstElementChild!, 'hop');
      void say(a);
    });
    anim.finished.then(
      () => {
        w.remove();
        strolling--;
      },
      () => {},
    );
    sc.addCleanup(() => anim.cancel());
  };
  const strollTimer = window.setInterval(stroll, 6500);
  sc.addCleanup(() => clearInterval(strollTimer));
  window.setTimeout(stroll, 1500);

  // --- Greeting and new surprises -------------------------------------------
  await sc.wait(400);
  if (!save.treats.length) {
    await sc.until(say('shopEmpty'), 4000);
  } else if (fresh.size) {
    await sc.wait(600);
    sound.fanfare();
    sc.root.querySelectorAll('.new').forEach((n) => {
      n.classList.add('show-new');
      burstAt(n, { kind: 'sparkle', count: 14 });
    });
    await sc.until(say('shopNew'), 3500);
    markUnlocksSeen();
  } else {
    void say('shop');
  }

  await sc.tap(play, 0);
  sound.pop();
  sc.destroy();
  return 'play';
}
