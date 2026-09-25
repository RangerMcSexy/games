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
  starSVG,
  stickerSVG,
} from './art';
import { TWINKLE, sound } from './audio';
import {
  EVERYDAY_FOODS,
  FOODS,
  MEALS,
  PATTERNS,
  SHAPES,
  addButterfly,
  discovered,
  nameOf,
  uid,
  type Butterfly,
  type FoodId,
  type Pattern,
  type Shape,
} from './data';
import { setTime } from './backdrop';
import { Aborted, Scene, burst, burstAt, center, el, flip, flyClone, pick, rand, replay, shuffle } from './ui';

export type JourneyEnd = 'garden' | 'again';

export interface JourneyHost {
  stage: HTMLElement;
  setScene(s: Scene): void;
}

export async function journey(host: JourneyHost): Promise<JourneyEnd> {
  setTime('day');
  const shape = await eggScene(host);
  const { foods, golden } = await eatScene(host);
  return cocoonScene(host, shape, foods, golden);
}

// ---------------------------------------------------------------------------
// 1. Pick an egg and hatch it

async function eggScene(host: JourneyHost): Promise<Shape> {
  const sc = new Scene(host.stage, 'egg-scene');
  host.setScene(sc);

  const leaf = el('div', 'big-leaf', sc.root, leafSVG());
  const row = el('div', 'egg-row', sc.root);
  const eggs = SHAPES.map((s, i) => {
    const b = el('button', 'egg-btn', row, eggSVG(s));
    b.style.setProperty('--d', `${i * 0.25}s`);
    b.setAttribute('aria-label', `${s} egg`);
    return b;
  });

  await sc.wait(500);
  sound.speak('Pick an egg!');
  const idx = await sc.tapAny(eggs);
  const shape = SHAPES[idx];
  const chosen = eggs[idx];
  sound.pop();
  burstAt(chosen, { kind: 'sparkle', count: 10 });

  eggs.forEach((e, i) => i !== idx && e.classList.add('gone'));
  await sc.wait(350);
  await flip(chosen, () => {
    eggs.forEach((e, i) => i !== idx && e.remove());
    row.classList.add('solo');
    chosen.classList.add('chosen');
  });

  sound.speak('Tap, tap, tap the egg!');
  const TAPS = 5;
  for (let t = 1; t <= TAPS; t++) {
    await sc.tap(chosen, 3500);
    if (t < TAPS) {
      sound.crack(t);
      chosen.innerHTML = eggSVG(shape, t);
      replay(chosen, 'wobble');
      burstAt(chosen, { kind: 'bits', count: 5, colors: ['#fff8e1', '#ffe3a6'], spread: 0.5, size: 0.7 });
    }
  }

  // Hatch!
  sound.crack(4);
  sound.pop(1.4);
  const c = center(chosen);
  burst(c.x, c.y, { kind: 'bits', count: 22, colors: ['#fff8e1', '#ffe3a6', '#ffffff'] });
  burst(c.x, c.y, { kind: 'sparkle', count: 12 });
  chosen.classList.add('hatched');
  const baby = el('div', 'baby-cat', sc.root, caterpillarSVG([]));
  leaf.classList.add('dim');
  await sc.wait(250);
  sound.squeak();
  sound.speak('Hello, little caterpillar!');
  await sc.wait(2300);
  sc.destroy();
  return shape;
}

// ---------------------------------------------------------------------------
// 2. Feed the hungry caterpillar

const YUMS = ['Yum!', 'Munch munch!', 'Tasty!', 'Mmm!', 'Yummy!', 'Crunch!'];

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
  const goldenTurn = Math.random() < 0.28 ? Math.floor(rand(1, MEALS)) : -1;
  let offer: FoodId[] = shuffle(EVERYDAY_FOODS).slice(0, 4);
  const slots = offer.map(() => el('button', 'food-btn', tray));
  const paint = (i: number) => {
    slots[i].innerHTML = foodSVG(offer[i]);
    slots[i].classList.toggle('is-golden', offer[i] === 'golden');
    slots[i].setAttribute('aria-label', FOODS[offer[i]].name);
    replay(slots[i], 'pop-in');
  };
  offer.forEach((_, i) => paint(i));

  await sc.wait(400);
  sound.speak('The caterpillar is hungry! Tap some yummy food!');

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
    if (!sc.alive) break;

    sound.chomp();
    foods.push(food);
    if (food === 'golden') golden = true;
    drawCat({ popIndex: foods.length + 1 });
    replay(catBox, 'munch');
    burst(mouth.x, mouth.y, { kind: 'heart', count: 5, colors: ['#ff5d73', '#ff8fcf'], spread: 0.6 });
    pips[meal].style.background = FOODS[food].color;
    replay(pips[meal], 'fill');
    if (food === 'golden') {
      burst(mouth.x, mouth.y, { kind: 'sparkle', count: 16, colors: ['#ffe066', '#fff6a8'] });
      sound.sparkle();
      sound.speak('Ooh, sparkly!');
    } else {
      sound.speak(pick(YUMS));
    }

    // Offer something new in the emptied spot.
    const next = shuffle(EVERYDAY_FOODS.filter((f) => !offer.includes(f)))[0] ?? pick(EVERYDAY_FOODS);
    offer = offer.slice();
    offer[i] = next;
    await sc.wait(350);
    slots[i].classList.remove('empty');
    paint(i);
    tray.classList.remove('busy');
  }

  // Full!
  tray.classList.add('leaving');
  await sc.wait(500);
  sound.gulp();
  drawCat({ sleepy: true });
  replay(catBox, 'full');
  sound.speak("I'm so full! Time for a nap.");
  burstAt(catBox, { kind: 'sparkle', count: 14 });
  await sc.wait(2600);
  sc.destroy();
  return { foods, golden };
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
  sound.speak('Tap to wrap it up!');
  for (let t = 1; t <= 3; t++) {
    await sc.tap(hang, 3500);
    sound.wrap();
    silk.dataset.level = String(t);
    replay(hang, 'wiggle');
    burstAt(hang, { kind: 'sparkle', count: 6, colors: ['#ffffff', '#e8f4ff'], spread: 0.6 });
  }
  sound.whoosh();
  cat.classList.add('gone');
  silk.classList.add('gone');
  const chrys = el('div', 'chrys', hang, chrysalisSVG(foods, null));
  replay(chrys, 'pop-in');
  burstAt(hang, { kind: 'sparkle', count: 14 });
  await sc.wait(900);

  // Pick a sticker (the wing pattern).
  sound.speak('Pick a sticker!');
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
  burstAt(chrys, { kind: 'sparkle', count: 18 });
  await sc.wait(1200);
  bar.remove();

  // Night time: tap the stars to sing a lullaby.
  sound.speak('Shh. Night night! Tap the stars.');
  setTime('night');
  chrys.classList.add('sway');
  await sc.wait(1600);
  const sky = el('div', 'star-field', sc.root);
  const spots = starSpots(TWINKLE.length);
  for (let i = 0; i < TWINKLE.length; i++) {
    const s = el('button', 'tap-star', sky, starSVG());
    s.setAttribute('aria-label', 'star');
    s.style.left = `${spots[i].x}%`;
    s.style.top = `${spots[i].y}%`;
    await sc.tap(s, 3000);
    sound.bell(TWINKLE[i]);
    burstAt(s, { kind: 'sparkle', count: 8, colors: ['#fff6a8', '#ffffff'] });
    s.classList.add('lit');
  }
  await sc.wait(900);
  sound.yawn();
  chrys.classList.add('sleep');
  const zzz = el('div', 'zzz', hang, '<span>z</span><span>z</span><span>z</span>');
  await sc.wait(2200);

  // Morning.
  zzz.remove();
  setTime('dawn');
  sky.classList.add('gone');
  await sc.wait(1400);
  setTime('day');
  sound.speak('Good morning! Something is wiggling! Tap, tap, tap!');
  chrys.classList.remove('sway', 'sleep');
  chrys.classList.add('jiggle');

  for (let t = 1; t <= 4; t++) {
    await sc.tap(chrys, 3500);
    sound.crack(t);
    if (t < 4) {
      chrys.innerHTML = chrysalisSVG(foods, pattern, t);
      replay(chrys, 'wiggle');
      burstAt(chrys, { kind: 'bits', count: 5, colors: foods.map((f) => FOODS[f].color), spread: 0.5, size: 0.7 });
    }
  }

  // It's a butterfly!
  const b: Butterfly = { id: uid(), shape, pattern, foods, golden, created: Date.now() };
  const before = discovered().size;
  const { isNew } = addButterfly(b);
  const bookDone = isNew && before + 1 === SHAPES.length * PATTERNS.length;

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
  await sc.wait(900);
  const bc = center(bfly);
  burst(bc.x, bc.y, { kind: 'confetti', count: 40, spread: 1.8 });

  const name = nameOf(b);
  sound.speak(`Wow! A ${name}!`);

  if (isNew) {
    el('div', 'new-badge', reveal, '<span>NEW!</span>');
  }
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

  await sc.wait(2600);
  if (bookDone) {
    sound.speak('You filled your whole butterfly book! Hooray!');
    sound.fanfare();
    for (let k = 0; k < 3; k++) {
      burst(rand(0.2, 0.8) * innerWidth, rand(0.2, 0.6) * innerHeight, { count: 40, spread: 1.6 });
      await sc.wait(400);
    }
  } else if (isNew) {
    sound.speak('A new one for your book!');
    sound.sparkle();
  }

  bfly.addEventListener('pointerdown', () => {
    sound.squeak();
    replay(bfly, 'spin');
    burstAt(bfly, { kind: 'heart', count: 6 });
    sound.speak(name);
  });

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

// Star positions spread around the sky, avoiding the chrysalis in the middle.
function starSpots(n: number) {
  const portrait = innerHeight > innerWidth;
  const out: { x: number; y: number }[] = [];
  let guard = 0;
  while (out.length < n && guard++ < 500) {
    const x = rand(10, 90);
    const y = rand(portrait ? 14 : 16, portrait ? 80 : 78);
    const nearMiddle = Math.abs(x - 50) < (portrait ? 18 : 12) && y < 70;
    const crowded = out.some((p) => Math.hypot(p.x - x, (p.y - y) * (portrait ? 0.6 : 1.4)) < 16);
    if (!nearMiddle && !crowded) out.push({ x, y });
  }
  while (out.length < n) out.push({ x: rand(10, 90), y: rand(20, 80) });
  return out;
}

function branchSVG() {
  return `<svg viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true">
    <path d="M-10,26 C80,18 160,34 240,24 C300,18 360,28 410,22 L410,40 C360,44 300,36 240,42 C160,50 80,36 -10,44 Z" fill="#a0724a" stroke="#4a2d5c" stroke-width="4"/>
    <path d="M40,30 C80,26 120,34 160,30 M260,32 C300,28 330,34 370,30" stroke="#7d5535" stroke-width="3" fill="none"/>
  </svg>`;
}
