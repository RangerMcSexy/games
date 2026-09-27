// The life cycle: egg -> caterpillar (eating) -> chrysalis -> night -> butterfly.
//
// What the player does shapes the butterfly:
//   * the egg they pick      -> wing shape
//   * the foods they feed    -> wing colours (and a rare golden leaf -> golden shimmer)
//   * the sticker they pick  -> wing pattern
import {
  ICONS,
  butterflySVG,
  caterpillarSVG,
  chrysalisSVG,
  eggSVG,
  foodSVG,
  leafSVG,
  snailSVG,
  starSVG,
  stickerSVG,
} from './art';
import { TWINKLE, sound } from './audio';
import { setTime } from './backdrop';
import {
  EVERYDAY_FOODS,
  FOODS,
  MEALS,
  PATTERNS,
  SHAPES,
  addButterfly,
  discovered,
  nameOf,
  save,
  uid,
  unlocked,
  type Butterfly,
  type FoodId,
  type Pattern,
  type Shape,
} from './data';
import { guide } from './guide';
import { Aborted, Scene, burst, burstAt, center, el, flip, flyClone, rand, replay, shuffle } from './ui';
import { hasRecording, say, sayText } from './voice';
import { stickerMoment } from '../../shared/sticker-moment';
import { STICKER_ART } from './stickers';

export type JourneyEnd = 'garden' | 'again';

export interface JourneyHost {
  stage: HTMLElement;
  setScene(s: Scene): void;
}

/** Counting out loud: "One!", "Two!"... */
const count = (n: number) => void say(`n${n}`);

export async function journey(host: JourneyHost): Promise<JourneyEnd> {
  setTime('day');
  guide.show();
  const shape = await eggScene(host);
  const { foods, golden } = await eatScene(host);
  return cocoonScene(host, shape, foods, golden);
}

// ---------------------------------------------------------------------------
// 1. Pick an egg and hatch it

async function eggScene(host: JourneyHost): Promise<Shape> {
  const sc = new Scene(host.stage, 'egg-scene');
  host.setScene(sc);

  el('div', 'big-leaf', sc.root, leafSVG());
  const row = el('div', 'egg-row', sc.root);
  const eggs = SHAPES.map((s, i) => {
    const b = el('button', 'egg-btn', row, eggSVG(s));
    b.style.setProperty('--d', `${i * 0.2}s`);
    b.setAttribute('aria-label', `${s} egg`);
    return b;
  });

  void say('pickEgg');
  const idx = await sc.tapAny(eggs);
  const shape = SHAPES[idx];
  const chosen = eggs[idx];
  sound.pop();
  guide.hop();
  burstAt(chosen, { kind: 'sparkle', count: 10 });

  eggs.forEach((e, i) => i !== idx && e.classList.add('gone'));
  await sc.wait(350);
  await flip(chosen, () => {
    eggs.forEach((e, i) => i !== idx && e.remove());
    row.classList.add('solo');
    chosen.classList.add('chosen');
  });

  await sc.until(say('tapEgg'), 3000);
  const TAPS = 5;
  // Sometimes the egg sneezes. Achoo!
  const sneezeAt = Math.random() < 0.4 ? pickInt(2, 3) : -1;
  for (let t = 1; t <= TAPS; t++) {
    await sc.tap(chosen, 3500);
    if (t < TAPS) {
      sound.crack(t);
      chosen.innerHTML = eggSVG(shape, t);
      replay(chosen, 'wobble');
      burstAt(chosen, { kind: 'bits', count: 5, colors: ['#fff8e1', '#ffe3a6'], spread: 0.5, size: 0.7 });
      count(t);
      if (t === sneezeAt) {
        await sc.wait(700);
        sound.sneeze();
        replay(chosen, 'sneeze');
        await sc.wait(420);
        burstAt(chosen, { kind: 'bits', count: 10, colors: ['#e8f4ff', '#ffffff'], spread: 0.8, size: 0.6 });
        guide.cheer();
        await sc.until(say('achoo'), 3000);
      }
    }
  }

  // Hatch!
  count(5);
  sound.crack(4);
  sound.pop(1.4);
  const c = center(chosen);
  burst(c.x, c.y, { kind: 'bits', count: 22, colors: ['#fff8e1', '#ffe3a6', '#ffffff'] });
  burst(c.x, c.y, { kind: 'sparkle', count: 12 });
  chosen.classList.add('hatched');
  el('div', 'baby-cat', sc.root, caterpillarSVG([]));
  guide.cheer();
  await sc.wait(700);
  sound.squeak();
  await sc.until(say('hello'), 3500);
  await sc.wait(900);
  sc.destroy();
  return shape;
}

// ---------------------------------------------------------------------------
// 2. Feed the hungry caterpillar

async function eatScene(host: JourneyHost): Promise<{ foods: FoodId[]; golden: boolean }> {
  const sc = new Scene(host.stage, 'eat-scene');
  host.setScene(sc);

  const meter = el('div', 'meal-meter', sc.root);
  const pips = Array.from({ length: MEALS }, () => el('div', 'pip', meter));

  el('div', 'cat-branch', sc.root, leafSVG());
  const catBox = el('div', 'cat-box', sc.root);
  const foods: FoodId[] = [];
  const drawCat = (o: Parameters<typeof caterpillarSVG>[1] = {}) => {
    catBox.innerHTML = caterpillarSVG(foods, o);
  };
  drawCat();

  const tray = el('div', 'food-tray', sc.root);
  // A golden leaf shows up in about a quarter of games, on a random turn.
  const goldenTurn = Math.random() < 0.28 ? pickInt(1, MEALS - 1) : -1;
  let offer: FoodId[] = shuffle(EVERYDAY_FOODS).slice(0, 4);
  const slots = offer.map(() => el('button', 'food-btn', tray));
  const paint = (i: number) => {
    slots[i].innerHTML = foodSVG(offer[i]);
    slots[i].classList.toggle('is-golden', offer[i] === 'golden');
    slots[i].setAttribute('aria-label', FOODS[offer[i]].name);
    replay(slots[i], 'pop-in');
  };
  offer.forEach((_, i) => paint(i));

  // Sometimes a snail wanders by while the caterpillar eats.
  if (Math.random() < 0.45) void snailVisit(sc);

  void say('hungry');

  let golden = false;
  for (let meal = 0; meal < MEALS; meal++) {
    if (meal === goldenTurn) {
      const gi = Math.floor(Math.random() * offer.length);
      offer[gi] = 'golden';
      paint(gi);
      sound.sparkle();
    }
    const i = await sc.tapAny(slots, 4500);
    const food = offer[i];
    tray.classList.add('busy');
    sound.pop();

    const svg = catBox.querySelector('svg')!;
    const r = svg.getBoundingClientRect();
    const units = svg.viewBox.baseVal.width;
    const mouth = {
      x: r.left + ((units - 24) / units) * r.width,
      y: r.top + (68 / 96) * r.height,
    };
    drawCat({ mouthOpen: true });
    slots[i].classList.add('empty');
    await flyClone(foodSVG(food), slots[i].getBoundingClientRect(), mouth, 650, 0.35);
    if (!sc.alive) throw new Aborted();

    sound.chomp();
    foods.push(food);
    if (food === 'golden') golden = true;
    drawCat({ popIndex: foods.length + 1 });
    replay(catBox, 'munch');
    burst(mouth.x, mouth.y, { kind: 'heart', count: 5, colors: ['#ff8595', '#ffa3d2'], spread: 0.6 });
    pips[meal].style.background = FOODS[food].color;
    replay(pips[meal], 'fill');
    guide.hop();
    if (food === 'golden') {
      burst(mouth.x, mouth.y, { kind: 'sparkle', count: 16, colors: ['#ffe066', '#fff6a8'] });
      sound.sparkle();
      void say('sparkly');
    } else {
      count(meal + 1);
    }

    // Offer something new in the emptied spot.
    const next = shuffle(EVERYDAY_FOODS.filter((f) => !offer.includes(f)))[0] ?? EVERYDAY_FOODS[0];
    offer = offer.slice();
    offer[i] = next;
    await sc.wait(450);
    slots[i].classList.remove('empty');
    paint(i);
    tray.classList.remove('busy');
  }

  // Full!
  tray.classList.add('leaving');
  await sc.wait(700);
  sound.gulp();
  drawCat({ sleepy: true });
  replay(catBox, 'full');
  burstAt(catBox, { kind: 'sparkle', count: 14 });
  guide.cheer();
  if (Math.random() < 0.5) {
    await sc.wait(900);
    sound.burp();
    const bubble = el('div', 'burp-bubble', catBox);
    replay(catBox, 'munch');
    await sc.wait(500);
    bubble.classList.add('popped');
    await sc.until(say('burp'), 2500);
  }
  await sc.until(say('full'), 4000);
  await sc.wait(700);
  sc.destroy();
  return { foods, golden };
}

async function snailVisit(sc: Scene) {
  try {
    await sc.wait(rand(2500, 6000));
    const snail = el('button', 'snail', sc.root, snailSVG());
    snail.setAttribute('aria-label', 'snail');
    sc.on(snail, 'pointerdown', (e) => {
      e.preventDefault();
      sound.boing();
      replay(snail, 'shy');
      burstAt(snail, { kind: 'sparkle', count: 5, spread: 0.5 });
    });
    await sc.wait(16000);
    snail.remove();
  } catch {
    /* scene ended */
  }
}

// ---------------------------------------------------------------------------
// 3. Chrysalis, night, and the big reveal

async function cocoonScene(host: JourneyHost, shape: Shape, foods: FoodId[], golden: boolean): Promise<JourneyEnd> {
  const sc = new Scene(host.stage, 'cocoon-scene');
  host.setScene(sc);

  el('div', 'branch', sc.root, branchSVG());
  const hang = el('div', 'hang', sc.root);
  const cat = el('div', 'hang-cat', hang, caterpillarSVG(foods, { sleepy: true }));
  const silk = el('div', 'silk', hang);

  await sc.wait(700);
  void say('wrap');
  for (let t = 1; t <= 3; t++) {
    await sc.tap(hang, 3500);
    sound.wrap();
    silk.dataset.level = String(t);
    replay(hang, 'wiggle');
    burstAt(hang, { kind: 'sparkle', count: 6, colors: ['#ffffff', '#e8f4ff'], spread: 0.6 });
    count(t);
  }
  sound.whoosh();
  cat.classList.add('gone');
  silk.classList.add('gone');
  const chrys = el('div', 'chrys', hang, chrysalisSVG(foods, null));
  replay(chrys, 'pop-in');
  burstAt(hang, { kind: 'sparkle', count: 14 });
  guide.cheer();
  await sc.wait(900);

  // Pick a sticker (the wing pattern).
  void say('sticker');
  const bar = el('div', 'sticker-row', sc.root);
  const stickers = PATTERNS.map((p, i) => {
    const b = el('button', 'sticker-btn', bar, stickerSVG(p));
    b.style.setProperty('--d', `${i * 0.08}s`);
    b.setAttribute('aria-label', `${p} sticker`);
    return b;
  });
  const pi = await sc.tapAny(stickers);
  const pattern: Pattern = PATTERNS[pi];
  sound.pop();
  const target = center(chrys);
  stickers.forEach((s, i) => i !== pi && s.classList.add('gone'));
  await flyClone(stickerSVG(pattern), stickers[pi].getBoundingClientRect(), target, 600, 0.5);
  if (!sc.alive) throw new Aborted();
  stickers[pi].classList.add('gone');
  chrys.innerHTML = chrysalisSVG(foods, pattern);
  replay(chrys, 'wiggle');
  sound.tada();
  guide.cheer();
  burstAt(chrys, { kind: 'sparkle', count: 18 });
  await sc.wait(1200);
  bar.remove();

  // Night time: tap the stars to sing a lullaby.
  setTime('night');
  void say('night');
  chrys.classList.add('sway');
  await sc.wait(2000);
  const sky = el('div', 'star-field', sc.root);
  const spots = starSpots(TWINKLE.length);
  const shootAfter = Math.random() < 0.55 ? 3 : -1;
  for (let i = 0; i < TWINKLE.length; i++) {
    const s = el('button', 'tap-star', sky, starSVG());
    s.setAttribute('aria-label', 'star');
    s.style.left = `${spots[i].x}%`;
    s.style.top = `${spots[i].y}%`;
    await sc.tap(s, 3000);
    sound.bell(TWINKLE[i]);
    burstAt(s, { kind: 'sparkle', count: 8, colors: ['#fff6a8', '#ffffff'] });
    s.classList.add('lit');
    if (i === shootAfter) await shootingStar(sc, sky);
  }
  await sc.wait(900);
  sound.yawn();
  chrys.classList.add('sleep');
  const zzz = el('div', 'zzz', hang, '<span>z</span><span>z</span><span>z</span>');
  await sc.wait(600);
  sound.snore();
  await sc.wait(1800);

  // Morning.
  zzz.remove();
  setTime('dawn');
  sky.classList.add('gone');
  await sc.wait(1400);
  setTime('day');
  void say('morning');
  chrys.classList.remove('sway', 'sleep');
  chrys.classList.add('jiggle');

  for (let t = 1; t <= 4; t++) {
    await sc.tap(chrys, 3500);
    sound.crack(t);
    count(t);
    if (t < 4) {
      chrys.innerHTML = chrysalisSVG(foods, pattern, t);
      replay(chrys, 'wiggle');
      burstAt(chrys, { kind: 'bits', count: 5, colors: foods.map((f) => FOODS[f].color), spread: 0.5, size: 0.7 });
    }
  }

  // It's a butterfly!
  const b: Butterfly = { id: uid(), shape, pattern, foods, golden, created: Date.now() };
  const before = discovered().size;
  const unlocksBefore = unlocked().length;
  const { isNew } = addButterfly(b);
  const bookDone = isNew && before + 1 === SHAPES.length * PATTERNS.length;
  const newUnlock = unlocked().length > unlocksBefore;

  const cc = center(chrys);
  chrys.classList.add('burst');
  sound.pop(1.5);
  burst(cc.x, cc.y, { kind: 'confetti', count: 36, colors: foods.map((f) => FOODS[f].color), spread: 1.4 });
  burst(cc.x, cc.y, { kind: 'sparkle', count: 16 });

  const reveal = el('div', 'reveal', sc.root);
  const bfly = el('div', 'reveal-fly', reveal, butterflySVG(b, { flap: true, speed: 0.4 }));
  await sc.wait(80);
  hang.classList.add('gone');
  reveal.classList.add('open');
  sound.fanfare();
  guide.cheer();
  await sc.wait(900);
  const bc = center(bfly);
  burst(bc.x, bc.y, { kind: 'confetti', count: 40, spread: 1.8 });

  const name = nameOf(b);
  if (isNew) el('div', 'new-badge', reveal, '<span>NEW!</span>');
  const recipe = el('div', 'recipe', reveal);
  el('div', 'recipe-item', recipe, eggSVG(shape));
  el('div', 'recipe-plus', recipe, '+');
  const fr = el('div', 'recipe-foods', recipe);
  foods.forEach((f) => el('div', 'recipe-item small', fr, foodSVG(f)));
  el('div', 'recipe-plus', recipe, '+');
  el('div', 'recipe-item', recipe, stickerSVG(pattern));

  const actions = el('div', 'reveal-actions', reveal);
  const toGarden = el('button', 'big-btn green', actions, ICONS.garden);
  toGarden.setAttribute('aria-label', 'Garden');
  const again = el('button', 'big-btn orange', actions, ICONS.replay);
  again.setAttribute('aria-label', 'Play again');

  bfly.addEventListener('pointerdown', () => {
    sound.giggle();
    replay(bfly, 'spin');
    burstAt(bfly, { kind: 'heart', count: 6 });
    void sayText(name);
  });

  // The recorded "wow" line can't know the butterfly's name, so the robot
  // voice only announces the name when there's no recording.
  await sc.until(hasRecording('wow') ? say('wow') : sayText(`Wow! A ${name}!`), 6000);
  if (save.name.trim()) await sc.until(say('goodJob'), 4000);
  if (bookDone) {
    sound.fanfare();
    for (let k = 0; k < 3; k++) {
      burst(rand(0.2, 0.8) * innerWidth, rand(0.2, 0.6) * innerHeight, { count: 40, spread: 1.6 });
      await sc.wait(300);
    }
    await sc.until(say('bookDone'), 6000);
  } else if (isNew) {
    sound.sparkle();
    await sc.until(say('newOne'), 4000);
  }
  if (newUnlock) {
    sound.chime();
    toGarden.classList.add('nudge');
    await sc.until(say('gardenNew'), 4000);
  }
  // A sticker for the sticker book, now and then.
  await stickerMoment('butterfly-garden', { sc, art: STICKER_ART, chime: () => sound.chime(), say: () => say('sticker') });

  const choice = await sc.tapAny([toGarden, again], 9000);
  sound.pop();
  if (choice === 0) {
    sound.whoosh();
    bfly.classList.add('fly-away');
    await sc.wait(700);
  }
  sc.destroy();
  return choice === 0 ? 'garden' : 'again';
}

async function shootingStar(sc: Scene, sky: HTMLElement) {
  const s = el('button', 'shooting-star', sky, '<span></span>');
  s.setAttribute('aria-label', 'shooting star');
  sound.swoosh();
  let caught = false;
  sc.on(s, 'pointerdown', (e) => {
    e.preventDefault();
    if (caught) return;
    caught = true;
    sound.chime();
    burstAt(s, { kind: 'sparkle', count: 16, colors: ['#fff6a8', '#ffffff', '#ffc2dc'] });
    guide.cheer();
  });
  await sc.until(say('shootingStar'), 3500);
  await sc.wait(600);
  s.remove();
}

// Star positions spread around the sky, avoiding the chrysalis in the middle.
function starSpots(n: number) {
  const portrait = innerHeight > innerWidth;
  const out: { x: number; y: number }[] = [];
  let tries = 0;
  while (out.length < n && tries++ < 500) {
    const x = rand(10, 88);
    const y = rand(portrait ? 24 : 26, portrait ? 80 : 76);
    const nearMiddle = Math.abs(x - 50) < (portrait ? 18 : 12) && y < 70;
    const nearGuide = x > 78 && y > 68;
    const crowded = out.some((p) => Math.hypot(p.x - x, (p.y - y) * (portrait ? 0.6 : 1.4)) < 16);
    if (!nearMiddle && !nearGuide && !crowded) out.push({ x, y });
  }
  while (out.length < n) out.push({ x: rand(10, 88), y: rand(20, 70) });
  return out;
}

const pickInt = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

function branchSVG() {
  return `<svg viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true">
    <path d="M-10,26 C80,18 160,34 240,24 C300,18 360,28 410,22 L410,40 C360,44 300,36 240,42 C160,50 80,36 -10,44 Z" fill="#c9a07a" stroke="#5a4272" stroke-width="4"/>
    <path d="M40,30 C80,26 120,34 160,30 M260,32 C300,28 330,34 370,30" stroke="#a88062" stroke-width="3" fill="none"/>
  </svg>`;
}
