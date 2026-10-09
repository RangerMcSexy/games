// The bake: a customer comes in with a wish, then the child cracks eggs, pours,
// stirs, bakes, decorates and serves. One scene from start to finish, so the
// customer and the recipe strip stay put while the work area changes.
import {
  ICONS,
  animalSVG,
  awningSVG,
  bowlSVG,
  dropSVG,
  eggSVG,
  flourSVG,
  icingPotSVG,
  ovenDoorSVG,
  ovenSVG,
  shakerSVG,
  shapeSVG,
  spoonSVG,
  sugarSVG,
  sprite,
  treatSVG,
  type TreatLook,
} from './art';
import { sound } from './audio';
import { setTime } from './backdrop';
import {
  ANIMALS,
  COLORS,
  KINDS,
  PALETTE,
  SHAPES,
  TOPPERS,
  addTreat,
  hasShape,
  matchesWish,
  save,
  uid,
  type AnimalId,
  type ColorId,
  type ShapeId,
  type Treat,
  type Wish,
} from './data';
import { guide } from './guide';
import { Scene, burst, burstAt, center, el, flip, flyClone, hint, pick, rand, replay, shuffle, HINT_MS } from '../../shared/ui';
import { say, sayAll } from './voice';
import type { SpriteName } from './sprites';
import { stickerMoment } from '../../shared/sticker-moment';
import { STICKER_ART } from './stickers';

export interface BakeHost {
  stage: HTMLElement;
  setScene(s: Scene): void;
}

export type BakeEnd = 'shop' | 'again';

const STEPS: SpriteName[] = ['egg', 'candy', 'artist-palette', 'spoon', 'fire', 'sparkles'];

/** A big number that pops up while counting. */
function countPop(target: Element, n: number) {
  sound.count(n);
  void say(`n${n}`);
  const c = center(target);
  const p = el('div', 'count-pop', document.body, String(n));
  p.style.left = `${c.x}px`;
  p.style.top = `${c.y - c.h * 0.55}px`;
  p.addEventListener('animationend', () => p.remove());
}

/** The wished-for item plus two others, in a random order. */
function withWish<T>(all: readonly T[], wished: T, n = 3): T[] {
  return shuffle([wished, ...shuffle(all.filter((x) => x !== wished)).slice(0, n - 1)]);
}

/** How many of something the recipe asks for: 3 at first, then 2 to 5. */
const recipeCount = () => (save.treats.length < 2 ? 3 : 2 + Math.floor(Math.random() * 4));

export async function bake(host: BakeHost): Promise<BakeEnd> {
  setTime('day');
  guide.show();
  const sc = new Scene(host.stage, 'bake-scene');
  host.setScene(sc);

  // --- Fixed furniture: recipe strip, serving hatch, work area -------------
  const strip = el('div', 'strip', sc.root);
  const steps = STEPS.map((s, i) => {
    const d = el('div', 'strip-step', strip, `${sprite(s)}<span class="tick">${ICONS.check}</span>`);
    if (i < STEPS.length - 1) el('i', 'strip-dot', strip);
    return d;
  });
  let stepAt = -1;
  const setStep = (i: number) => {
    if (stepAt >= 0) {
      steps[stepAt].classList.remove('active');
      steps[stepAt].classList.add('done');
      burstAt(steps[stepAt], { kind: 'sparkle', count: 6, spread: 0.4, size: 0.7 });
      sound.sparkle();
    }
    stepAt = i;
    if (i < steps.length) replay(steps[i], 'active');
  };

  const hatch = el('div', 'hatch', sc.root);
  el('div', 'hatch-awning', hatch, awningSVG(true));
  const view = el('div', 'hatch-view', hatch);
  el('div', 'hatch-sill', hatch);
  const bubble = el('div', 'wish-bubble', sc.root);

  const work = el('div', 'work', sc.root);
  const choices = el('div', 'choices', work);
  const bench = el('div', 'bench', work);

  /** Show up to three big choices; resolves with the one tapped. */
  async function choose<T>(items: T[], render: (t: T) => string, cls: string, wished?: T): Promise<{ item: T; btn: HTMLElement; index: number }> {
    choices.innerHTML = '';
    const btns = items.map((t, i) => {
      const b = el('button', `choice ${cls}${t === wished ? ' wished' : ''}`, choices, render(t));
      b.style.setProperty('--d', `${i * 0.12}s`);
      return b;
    });
    // The hint points at the customer's wish, but any choice is fine.
    const index = await sc.tapAny(btns, HINT_MS, wished === undefined ? undefined : btns[items.indexOf(wished)]);
    const btn = btns[index];
    sound.pop(1 + index * 0.1);
    burstAt(btn, { kind: 'sparkle', count: 10 });
    guide.hop();
    btns.forEach((b, i) => i !== index && b.classList.add('gone'));
    btn.classList.add('picked');
    return { item: items[index], btn, index };
  }
  const clearChoices = async () => {
    choices.querySelectorAll('.choice, .recipe-card').forEach((b) => b.classList.add('gone'));
    await sc.wait(320);
    choices.innerHTML = '';
  };

  /** The recipe card: how many, as a number and as a row of little pictures that fill in as they're counted. */
  function recipeCard(n: number, icon: string) {
    choices.innerHTML = '';
    const card = el('div', 'recipe-card', choices);
    el('b', 'recipe-num', card, String(n));
    const row = el('div', 'recipe-row', card);
    const slots = Array.from({ length: n }, () => el('i', '', row, icon));
    return (k: number) => {
      slots[k - 1]?.classList.add('done');
      if (k === n) replay(card, 'jiggle');
    };
  }

  // --- The customer comes in -----------------------------------------------
  const last = save.treats[save.treats.length - 1]?.customer;
  const animal: AnimalId = pick(ANIMALS.filter((a) => a !== last));
  const wishKind = pick(KINDS);
  const wish: Wish = { kind: wishKind, shape: hasShape(wishKind) ? pick(SHAPES) : 'round', color: pick(COLORS) };
  const customer = el('div', `customer an-${animal}`, view, animalSVG(animal));
  customer.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (customer.classList.contains('busy')) return;
    sound.animal(animal);
    replay(customer, 'tickled');
  });

  await sc.wait(500);
  sound.doorBell();
  await sc.wait(500);
  customer.classList.add('in');
  await sc.wait(600);
  sound.animal(animal);
  replay(customer, 'hello');
  await sc.until(say(animal), 3000);

  const wishLook: TreatLook = { kind: wish.kind, shape: wish.shape, batter: wish.color, icing: wish.color, sprinkles: 2, topper: 'cherry', seed: 'wish' };
  bubble.innerHTML = `<div class="bubble-body">${treatSVG(wishLook, { plate: true })}</div><i class="bubble-dot d1"></i><i class="bubble-dot d2"></i>`;
  bubble.classList.add('show');
  sound.bloop(4);
  await sc.until(sayAll(hasShape(wish.kind) ? ['wish', wish.color, wish.shape, wish.kind] : ['wish', wish.color, wish.kind]), 7000);

  // --- What shall we bake? -------------------------------------------------
  void say('whatBake');
  const kindPick = await choose(
    KINDS,
    (k) => treatSVG({ kind: k, shape: 'round', batter: 'yellow', icing: 'pink', sprinkles: 2, topper: 'cherry', seed: `pick-${k}` }),
    'kind-choice',
    wish.kind,
  );
  const kind = kindPick.item;
  await sc.until(say(kind), 2000);
  await clearChoices();

  // --- 1. Crack the eggs ---------------------------------------------------
  setStep(0);
  const bowlBox = el('div', 'bowl-box', bench, bowlSVG());
  const bowl = bowlBox.querySelector('svg')!;
  // The recipe says how many eggs; there's a spare one on the side.
  const eggN = recipeCount();
  const eggTick = recipeCard(eggN, eggSVG());
  const eggRow = el('div', 'egg-row', bench);
  const eggs = Array.from({ length: Math.min(5, eggN + 1) }, (_, i) => {
    const b = el('button', 'egg-btn', eggRow, eggSVG());
    b.style.setProperty('--d', `${i * 0.15}s`);
    return b;
  });
  eggRow.style.setProperty('--n', String(eggs.length));
  await sc.wait(500);
  void say(`eggs${eggN}`);
  const rollAt = Math.random() < 0.3 ? 1 : -1;
  const left = eggs.slice();
  for (let n = 1; n <= eggN; n++) {
    const i = await sc.tapAny(left);
    const egg = left[i];
    left.splice(i, 1);
    if (n === rollAt) {
      // Silly: the egg rolls away and Pip fetches it back.
      sound.roll();
      egg.classList.add('rolling');
      await sc.wait(700);
      void say('rollAway');
      await guide.visit(egg, async () => {
        guide.hop();
        await sc.wait(250);
      });
      egg.classList.remove('rolling');
      egg.classList.add('rolled-back');
      await sc.wait(600);
    }
    sound.crack(n - 1);
    egg.classList.add('cracking');
    await sc.wait(260);
    const to = center(bowlBox);
    const from = egg.getBoundingClientRect();
    egg.classList.add('used');
    const ex = ((n - 1) / Math.max(1, eggN - 1) - 0.5) * 2;
    await flyClone(eggSVG(), from, { x: to.x + ex * to.w * 0.14, y: to.y - to.h * 0.2 }, 500, 0.7);
    sound.crack(2);
    sound.plop();
    burst(to.x + ex * to.w * 0.14, to.y - to.h * 0.2, { kind: 'bits', count: 8, colors: ['#fff8ec', '#ffe9c6'], spread: 0.4, size: 0.7 });
    bowl.classList.add(`y${Math.min(3, n)}`);
    replay(bowlBox, 'jiggle');
    countPop(bowlBox, n);
    eggTick(n);
    await sc.wait(500);
  }
  guide.cheer();
  eggRow.classList.add('gone');
  await clearChoices();
  eggRow.remove();

  // --- 2. Shake in the sugar ------------------------------------------------
  setStep(1);
  const sugarJar = el('button', 'sugar-btn', bench, sugarSVG());
  sugarJar.setAttribute('aria-label', 'Sugar');
  const sugarN = recipeCount();
  const sugarTick = recipeCard(sugarN, sugarSVG());
  await sc.wait(400);
  void say(`sugar${sugarN}`);
  for (let n = 1; n <= sugarN; n++) {
    await sc.tap(sugarJar);
    replay(sugarJar, 'shaking');
    sound.shake();
    const s = sugarJar.getBoundingClientRect();
    const to = center(bowlBox);
    // Sparkly sugar showers from the lid into the bowl.
    burst(s.left + s.width * 0.5, s.top + s.height * 0.1, { kind: 'bits', count: 12, colors: ['#ffffff', '#fff6fb', '#ffe3ef'], spread: 0.5, size: 0.6 });
    await sc.wait(220);
    burst(to.x, to.y - to.h * 0.25, { kind: 'sparkle', count: 6, colors: ['#ffffff', '#ffd6e6'], spread: 0.45, size: 0.7 });
    replay(bowlBox, 'jiggle');
    countPop(bowlBox, n);
    sugarTick(n);
    await sc.wait(450);
  }
  sound.sparkle();
  void say('sweet');
  void clearChoices();
  guide.cheer();
  sugarJar.classList.add('gone');
  await sc.wait(500);
  sugarJar.remove();

  // --- 3. Flour and colour -------------------------------------------------
  setStep(2);
  const bag = el('button', 'flour-btn', bench, flourSVG());
  await sc.wait(400);
  void say('flour');
  await sc.tap(bag);
  bag.classList.add('pouring');
  sound.pour();
  await sc.wait(500);
  sound.poof();
  const bc = center(bowlBox);
  burst(bc.x, bc.y - bc.h * 0.3, { kind: 'bits', count: 26, colors: ['#ffffff', '#fffaf0', '#f6ead6'], spread: 0.9, size: 1.3 });
  bowl.classList.add('floured');
  replay(bowlBox, 'jiggle');
  await sc.wait(700);
  bag.classList.add('gone');
  if (Math.random() < 0.35) {
    await sc.wait(300);
    guide.sneeze();
    await sc.wait(400);
    await sc.until(say('achoo'), 3000);
  }
  await sc.wait(300);
  bag.remove();

  void say('pickColour');
  const colorPick = await choose(withWish(COLORS, wish.color), (c) => dropSVG(c), 'drop-choice', wish.color);
  const batter: ColorId = colorPick.item;
  void say(batter);
  bowl.style.setProperty('--batter', PALETTE[batter].batter);
  await flyClone(dropSVG(batter), colorPick.btn.getBoundingClientRect(), { x: bc.x, y: bc.y - bc.h * 0.25 }, 550, 0.45);
  sound.plop();
  bowl.classList.add('coloured');
  replay(bowlBox, 'jiggle');
  burst(bc.x, bc.y - bc.h * 0.25, { kind: 'bits', count: 10, colors: [PALETTE[batter].batter], spread: 0.5, size: 0.8 });
  await clearChoices();

  // --- 4. Stir -------------------------------------------------------------
  setStep(3);
  const spoon = el('div', 'spoon-box', bowlBox, spoonSVG());
  void say('stir');
  await stir(sc, bowlBox, bowl, spoon);
  sound.tada();
  burstAt(bowlBox, { kind: 'sparkle', count: 14 });
  guide.cheer();
  spoon.classList.add('gone');
  await sc.wait(500);
  if (Math.random() < 0.3) {
    // Silly: Pip sneaks a taste.
    await guide.visit(bowlBox, async () => {
      guide.nibble();
      sound.slurp();
      await sc.until(say('yumBatter'), 2500);
    });
  }
  spoon.remove();

  // --- 5. Shape (a cake tin or cookie cutter), then into the oven ----------
  // Cupcakes go straight into their round paper case.
  setStep(4);
  let shape: ShapeId = 'round';
  if (hasShape(kind)) {
    void say('pickShape');
    const shapes = wish.kind === kind ? withWish(SHAPES, wish.shape) : shuffle(SHAPES).slice(0, 3);
    shape = (await choose(shapes, (s) => shapeSVG(s, batter), 'shape-choice', wish.kind === kind ? wish.shape : undefined)).item;
    void say(shape);
    await clearChoices();
  }

  const look: TreatLook = { kind, shape, batter, seed: uid() };
  const tinBox = el('div', 'treat-box tin-box', bench, treatSVG(look, { stage: 'raw', tin: true, rise: 0.15 }));
  await sc.wait(350);
  bowlBox.classList.add('tipping');
  sound.pour();
  for (let r = 0.15; r <= 0.46; r += 0.06) {
    tinBox.innerHTML = treatSVG(look, { stage: 'raw', tin: true, rise: r });
    await sc.wait(110);
  }
  await sc.wait(400);
  bowlBox.classList.add('gone');
  await sc.wait(400);
  bowlBox.remove();

  const oven = el('div', 'oven', bench);
  el('div', 'oven-body-box', oven, ovenSVG());
  const cavity = el('div', 'oven-cavity', oven);
  const inOven = el('div', 'cavity-treat', cavity);
  const door = el('button', 'oven-door open', oven, ovenDoorSVG());
  await sc.wait(600);
  sound.whoosh();
  const cav = center(cavity);
  const fromTin = tinBox.getBoundingClientRect();
  tinBox.classList.add('used');
  await flyClone(tinBox.innerHTML, fromTin, cav, 600, (cav.w * 0.8) / fromTin.width);
  inOven.innerHTML = treatSVG(look, { stage: 'raw', tin: true, rise: 0.46 });
  tinBox.remove();

  void say('oven');
  await sc.tap(door);
  door.classList.remove('open');
  sound.ovenDoor(false);
  await sc.wait(350);
  oven.classList.add('hot');
  void say('waiting');
  const puffy = Math.random() < 0.25;
  const frames = 14;
  for (let f = 1; f <= frames; f++) {
    sound.tick(f % 2 === 0);
    const t = f / frames;
    const rise = 0.46 + (puffy ? 1.35 - 0.46 : 0.54) * t;
    inOven.innerHTML = treatSVG(look, { stage: t > 0.5 ? 'baked' : 'raw', tin: true, rise });
    await sc.wait(260);
  }
  if (puffy) {
    sound.boing();
    replay(oven, 'boing');
    await sc.until(say('puffy'), 2500);
    inOven.innerHTML = treatSVG(look, { stage: 'baked', tin: true, rise: 1 });
    sound.squish();
    await sc.wait(300);
  }
  oven.classList.remove('hot');
  sound.ding();
  replay(oven, 'dinged');
  void say('ding');
  await sc.tap(door);
  door.classList.add('open');
  sound.ovenDoor(true);
  burst(cav.x, cav.y - cav.h * 0.4, { kind: 'bits', count: 12, colors: ['#ffffff', '#f4f0ff'], spread: 0.6, size: 1.4 });
  await sc.wait(400);

  const treatBox = el('div', 'treat-box final', bench);
  treatBox.style.visibility = 'hidden';
  const paint = (t: TreatLook, plate = true) => (treatBox.innerHTML = treatSVG(t, { plate }));
  paint(look);
  inOven.innerHTML = '';
  const outTo = center(treatBox);
  await flyClone(treatSVG(look, { stage: 'baked', tin: true }), cavity.getBoundingClientRect(), outTo, 650, (outTo.w * 0.9) / cav.w);
  treatBox.style.visibility = '';
  sound.pop();
  burstAt(treatBox, { kind: 'sparkle', count: 10 });
  oven.classList.add('gone');
  await sc.wait(450);
  await flip(treatBox, () => oven.remove());

  // --- 6. Decorate ---------------------------------------------------------
  setStep(5);
  void say('icing');
  const icingPick = await choose(withWish(COLORS, wish.color), (c) => icingPotSVG(c), 'icing-choice', wish.color);
  const icing: ColorId = icingPick.item;
  void say(icing);
  await flyClone(icingPotSVG(icing), icingPick.btn.getBoundingClientRect(), { x: outTo.x, y: outTo.y - outTo.h * 0.25 }, 500, 0.5);
  look.icing = icing;
  paint(look);
  replay(treatBox, 'iced');
  sound.squish();
  setTimeout(() => sound.drip(), 250);
  await clearChoices();
  await sc.wait(500);

  // Sprinkles: shake as much as you like; after three shakes it moves on by itself.
  const shaker = el('button', 'shaker-btn', work, shakerSVG());
  await sc.wait(300);
  void say('sprinkles');
  look.sprinkles = 0;
  for (;;) {
    const tapped = look.sprinkles < 3 ? await sc.tap(shaker).then(() => true) : await tapOrIdle(sc, shaker, 2200);
    if (!tapped) break;
    look.sprinkles++;
    replay(shaker, 'shaking');
    sound.shake();
    const tc = center(treatBox);
    burst(tc.x, tc.y - tc.h * 0.35, { kind: 'confetti', count: 10, spread: 0.35, size: 0.5 });
    paint(look);
    if (look.sprinkles >= 7) break;
  }
  shaker.classList.add('gone');
  guide.cheer();
  await sc.wait(400);
  shaker.remove();

  void say('onTop');
  const topperPick = await choose(
    TOPPERS,
    (t) => `<span class="topper-icon">${sprite(t === 'cherry' ? 'cherries' : t === 'strawberry' ? 'strawberry' : 'candle')}</span>`,
    'topper-choice',
  );
  const topper = topperPick.item;
  await clearChoices();
  let candles = 0;
  if (topper === 'candles') {
    // How many candles? The customer says how old they are.
    candles = recipeCount();
    const candleTick = recipeCard(candles, `<span class="topper-icon">${sprite('candle')}</span>`);
    await sc.until(say(`candles${candles}`), 3000);
    for (let n = 1; n <= candles; n++) {
      await sc.tap(treatBox);
      look.candles = n;
      look.lit = true;
      paint(look);
      sound.flame();
      replay(treatBox, 'bounce');
      countPop(treatBox, n);
      candleTick(n);
      await sc.wait(450);
    }
    await sc.wait(300);
    void clearChoices();
    void say('blow');
    await sc.tap(treatBox);
    sound.blow();
    treatBox.classList.add('blown');
    await sc.wait(700);
    sound.tada();
    burstAt(treatBox, { kind: 'confetti', count: 20 });
    guide.cheer();
    void say('yay');
    await sc.wait(1100);
    look.lit = false;
    look.topper = 'candles';
    paint(look);
    treatBox.classList.remove('blown');
  } else {
    void say(topper);
    look.topper = topper;
    paint(look);
    replay(treatBox, 'topped');
    sound.plop();
    await sc.wait(900);
  }

  // --- Serve! --------------------------------------------------------------
  const treat: Treat = {
    id: look.seed!,
    kind,
    shape,
    batter,
    icing,
    sprinkles: look.sprinkles ?? 0,
    topper,
    ...(candles ? { candles } : {}),
    customer: animal,
    wished: false,
    created: Date.now(),
  };
  treat.wished = matchesWish(treat, wish);

  void say('serve');
  treatBox.classList.add('ready');
  await sc.tap(treatBox);
  treatBox.classList.remove('ready');
  bubble.classList.remove('show');
  sound.whoosh();
  const mouth = mouthPoint(customer, animal);
  const tr = treatBox.getBoundingClientRect();
  treatBox.classList.add('served');
  await flyClone(treatSVG(look), tr, mouth, 700, (hatch.clientWidth * 0.45) / tr.width);
  await eat(sc, customer, animal, look, mouth);

  addTreat(treat);
  if (treat.wished) {
    sound.fanfare();
    burstAt(hatch, { kind: 'confetti', count: 36 });
    await sc.until(say('justRight'), 3500);
  } else {
    burstAt(hatch, { kind: 'heart', count: 8, colors: ['#ff8595', '#ffa3d2'] });
    await sc.until(say('yummy'), 3000);
  }
  guide.cheer();
  await sc.until(say('thankYou'), 3500);
  replay(customer, 'wave');
  void say('byeBye');
  await sc.wait(1200);
  customer.classList.remove('in');
  sound.doorBell();

  // A twin treat for the shop window.
  treatBox.classList.remove('served', 'blown');
  paint({ ...look, lit: false }, true);
  replay(treatBox, 'reappear');
  sound.sparkle();
  burstAt(treatBox, { kind: 'sparkle', count: 16 });
  await sc.wait(700);
  // A sticker for the sticker book, now and then.
  await stickerMoment('bakery', { sc, art: STICKER_ART, chime: () => sound.chime(), say: () => say('sticker') });

  const ends = el('div', 'end-buttons', work);
  const shopBtn = el('button', 'big-btn orange', ends, ICONS.shop);
  shopBtn.setAttribute('aria-label', 'Shop window');
  const againBtn = el('button', 'big-btn green', ends, ICONS.replay);
  againBtn.setAttribute('aria-label', 'Bake again');
  const choice = await sc.tapAny([shopBtn, againBtn], 6000);
  sound.pop();
  if (choice === 0) {
    const sb = center(shopBtn);
    await flyClone(treatBox.innerHTML, treatBox.getBoundingClientRect(), sb, 700, 0.3);
  }
  sc.destroy();
  return choice === 0 ? 'shop' : 'again';
}

// ---------------------------------------------------------------------------
// Stirring: rub round the bowl, or just tap it. It can't go wrong.

function stir(sc: Scene, bowlBox: HTMLElement, bowl: SVGElement, spoon: HTMLElement): Promise<void> {
  let p = 0;
  let angle = 0;
  let sounded = 0;
  let down = false;
  let lx = 0;
  let ly = 0;
  const apply = () => {
    bowl.style.setProperty('--mix', p.toFixed(3));
    bowl.style.setProperty('--turn', `${angle}deg`);
    const a = (angle * Math.PI) / 180;
    spoon.style.transform = `translate(${Math.cos(a) * 26}%, ${Math.sin(a) * 7}%) rotate(${Math.cos(a) * 12}deg)`;
    while (sounded < Math.floor(p * 10)) sound.stir(sounded++);
  };
  apply();
  return sc.when<void>((resolve) => {
    let stopHint = hint.schedule(() => bowlBox, HINT_MS);
    const add = (amt: number) => {
      p = Math.min(1, p + amt);
      angle += amt * 900;
      apply();
      stopHint();
      stopHint = hint.schedule(() => bowlBox, HINT_MS);
      if (p >= 1) resolve();
    };
    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      down = true;
      lx = e.clientX;
      ly = e.clientY;
      replay(bowlBox, 'jiggle');
      add(0.11);
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const d = Math.hypot(e.clientX - lx, e.clientY - ly);
      lx = e.clientX;
      ly = e.clientY;
      add(Math.min(0.05, d / (bowlBox.clientWidth * 9)));
    };
    const onUp = () => (down = false);
    bowlBox.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      stopHint();
      bowlBox.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  });
}

/** Resolves true on a tap, or false after `ms` of nothing. */
function tapOrIdle(sc: Scene, target: Element, ms: number): Promise<boolean> {
  return sc.when<boolean>((resolve) => {
    const t = window.setTimeout(() => resolve(false), ms);
    const fn = (e: Event) => {
      e.preventDefault();
      resolve(true);
    };
    target.addEventListener('pointerdown', fn);
    return () => {
      clearTimeout(t);
      target.removeEventListener('pointerdown', fn);
    };
  });
}

// ---------------------------------------------------------------------------
// Eating: every animal has its own silly way.

function mouthPoint(customer: HTMLElement, a: AnimalId) {
  const r = customer.getBoundingClientRect();
  // Mouth positions in the animal's viewBox (-110..110, -140..122).
  const my: Record<AnimalId, number> = { bear: 14, hippo: 30, bunny: 10, piggy: 22, elephant: 14, dino: 14, owl: 2, cat: 10 };
  const mx: Record<AnimalId, number> = { bear: 0, hippo: 0, bunny: 0, piggy: 0, elephant: 22, dino: 0, owl: 0, cat: 0 };
  return { x: r.left + ((mx[a] + 110) / 220) * r.width, y: r.top + ((my[a] + 140) / 262) * r.height };
}

async function eat(sc: Scene, customer: HTMLElement, a: AnimalId, look: TreatLook, mouth: { x: number; y: number }) {
  customer.classList.add('busy');
  const bite = el('div', 'bite', customer.parentElement!, treatSVG(look));
  const cr = customer.getBoundingClientRect();
  const pr = customer.parentElement!.getBoundingClientRect();
  bite.style.left = `${mouth.x - pr.left}px`;
  bite.style.top = `${mouth.y - pr.top}px`;
  bite.style.width = `${cr.width * 0.45}px`;
  bite.style.height = `${cr.width * 0.45}px`;
  const crumbs = [PALETTE[look.batter].batter, PALETTE[look.icing ?? look.batter].icing, '#e6a15a'];
  const chomp = async (scale: number, big = false) => {
    customer.classList.add(big ? 'chomp-big' : 'chomp');
    sound.munch(big ? 1 : 2, 0.14);
    await sc.wait(big ? 260 : 170);
    bite.style.transform = `translate(-50%,-50%) scale(${scale})`;
    burst(mouth.x, mouth.y, { kind: 'bits', count: big ? 12 : 6, colors: crumbs, spread: 0.45, size: 0.6 });
    customer.classList.remove('chomp', 'chomp-big');
    await sc.wait(big ? 260 : 190);
  };

  switch (a) {
    case 'hippo':
      await sc.wait(200);
      await chomp(0, true);
      sound.gulp();
      break;
    case 'bunny':
      for (let i = 5; i >= 0; i--) await chomp(i / 6);
      break;
    case 'elephant':
      customer.classList.add('slurping');
      sound.slurp();
      await sc.wait(500);
      bite.style.transform = 'translate(-50%,-50%) scale(0)';
      await sc.wait(400);
      customer.classList.remove('slurping');
      await chomp(0);
      break;
    default:
      await chomp(0.66);
      await chomp(0.33);
      await chomp(0);
  }
  bite.remove();
  sound.gulp();
  await sc.wait(250);

  // The silly finish.
  customer.classList.add('happy');
  switch (a) {
    case 'bear':
      customer.classList.add('crumby');
      sound.animal('bear');
      replay(customer, 'wiggle');
      break;
    case 'piggy':
      customer.style.setProperty('--icing', PALETTE[look.icing ?? look.batter].icing);
      customer.classList.add('messy');
      sound.animal('piggy');
      replay(customer, 'wiggle');
      break;
    case 'dino':
      customer.classList.add('roaring');
      sound.roar();
      replay(customer, 'shake');
      await sc.wait(900);
      customer.classList.remove('roaring');
      break;
    case 'owl':
      sound.animal('owl');
      replay(customer, 'spin');
      break;
    case 'cat':
      customer.classList.add('licking');
      sound.animal('cat');
      await sc.wait(900);
      customer.classList.remove('licking');
      break;
    case 'hippo':
      customer.classList.add('chomp-big');
      sound.animal('hippo');
      await sc.wait(600);
      customer.classList.remove('chomp-big');
      replay(customer, 'wiggle');
      break;
    default:
      sound.animal(a);
      replay(customer, 'wiggle');
  }
  await sc.wait(rand(500, 700));
  customer.classList.remove('busy');
}
