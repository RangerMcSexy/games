// Bath time with Ducky. The bath starts empty; tap the tap to fill it. Then
// six things in a mixed-up order: bubbles to make and pop, a duck to squeak
// by colour, little ducks to count, mud to scrub off Ducky, Baby Duck
// hiding in the bubbles, and splashing. At the end, pull the plug: a big
// bubble floats up with a new rubber duck inside.
//
// Nothing can go wrong: a wrong duck or a wrong pile of bubbles just
// wobbles, and a hand points the way after a few seconds.
import { ICONS, bigBubbleSVG, bubbleSVG, colourLook, duckSVG, mudSVG, spongeSVG, type TubShape } from './art';
import { sound } from './audio';
import { COLOURS, ITEMS, finishBath, nextItem, save, unseenItems, type Item } from './data';
import { type Host } from './screens';
import { Tub, type Floater } from './tub';
import { HINT_MS, Scene, burst, burstAt, center, el, hint, pick, rand, replay, shuffle } from './ui';
import { say, sayAll } from './voice';

type Move = 'fill' | 'bubbles' | 'colour' | 'count' | 'scrub' | 'hide' | 'splash' | 'goal';

const cap = (id: string) => id[0].toUpperCase() + id.slice(1);
/** The little ducks' colours: not yellow, which is Ducky's. */
const LITTLE = COLOURS.filter((c) => c.id !== 'yellow');
const WATER = ['#7cc8f5', '#b3e3ff', '#ffffff'];
const FOAMY = ['#ffffff', '#e3f4ff', '#cdeeff'];

/** The moves of one bath: fill it up, a mix, then pull the plug. */
function planBath(): Move[] {
  return ['fill', ...shuffle<Move>(['bubbles', 'colour', 'count', 'scrub', 'hide', 'splash']), 'goal'];
}

/** The ducks sitting on the rim: the latest six found. */
export const rimIds = () => save.items.slice(-6);

/** Room around the bath: the top bar above, the dots below. */
const BOTTOM = 58;

export function fitBath(W: number, H: number, t: TubShape) {
  const bar = document.querySelector('.top-bar')?.getBoundingClientRect().bottom ?? 70;
  const home = document.querySelector('.home-btn')?.getBoundingClientRect().right ?? 80;
  // Above the bath: the tap, and on a tall phone the shelf of ducks found.
  const span = t.th + (t.tall ? 250 : 150);
  const maxW = W * (t.tall ? 0.98 : 1);
  let w = Math.min(maxW, ((H - BOTTOM - bar - 8) / span) * t.tw);
  // If the tap keeps clear of the home button it can go up beside the top bar.
  const w2 = Math.min(maxW, ((H - BOTTOM - 8) / span) * t.tw);
  if (!t.tall && w2 > w && (W - w2) / 2 + 100 * (w2 / t.tw) > home + 8) w = w2;
  const u = w / t.tw;
  // Stand it on the floor, a little up from the bottom on tall screens.
  const spare = Math.max(0, H - BOTTOM - bar - 8 - span * u);
  return { w, left: (W - w) / 2, top: H - BOTTOM - t.th * u - spare * 0.35 };
}

export async function bathScreen(host: Host): Promise<'again' | 'shelf'> {
  const sc = new Scene(host.stage, 'bath-scene');
  host.setScene(sc);

  const tub = new Tub(sc, sc.root, fitBath);
  tub.setRim(rimIds());
  // Ducky waits at the back of the empty bath, where he can still be seen.
  const ducky = tub.duck('ducky', 'hero', { x: tub.mid, d: 0, w: 190 });
  const trail = el('div', 'trail', sc.root);
  // Something to point at when it's time to splash: the middle of the water.
  const waterMark = el('div', 'water-mark', tub.float);
  const markWater = () => {
    waterMark.style.left = tub.px(tub.mid);
    waterMark.style.top = tub.py((tub.full + tub.shape.fy) / 2);
  };
  markWater();
  sc.on(window, 'resize', markWater);

  // Words: the game's own lines always get said; the odd happy word only
  // when nothing else is being said.
  let quietUntil = 0;
  const talk = (id: string | string[]) => {
    quietUntil = performance.now() + 2600;
    const p = typeof id === 'string' ? say(id) : sayAll(id, 200);
    void p.then(() => (quietUntil = Math.min(quietUntil, performance.now() + 400)));
    return p;
  };
  const speak = (id: string | string[], ms = 5000) => sc.until(talk(id), ms);
  let lastChirp = 0;
  const chirp = (id: string, every = 3500) => {
    const now = performance.now();
    if (now < quietUntil || now - lastChirp < every) return;
    lastChirp = now;
    void say(id);
  };

  // --- Splashing and squeaking, any time -------------------------------------------------

  const ripple = (x: number, y: number, big: boolean) => {
    const r = el('div', `ripple${big ? ' big' : ''}`, tub.float);
    r.style.left = tub.px(x);
    r.style.top = tub.py(y);
    setTimeout(() => r.remove(), 900);
  };
  const splashAt = (x: number, y: number, big: boolean) => {
    ripple(x, y, big);
    const p = tub.toClient(x, y);
    burst(p.x, p.y, { kind: 'drop', count: big ? 14 : 6, spread: big ? 0.8 : 0.45, colors: WATER });
    for (const f of tub.floaters) if (Math.abs(f.x - x) < 220 && f.el.classList.contains('duck')) replay(f.art, 'bob');
    if (big) sound.splash();
    else sound.blip(0, 0.3);
  };
  const squeakDuck = (d: HTMLElement) => {
    const art = (d.querySelector('.fl-art') as HTMLElement) ?? d;
    replay(art, 'hop');
    sound.squeak(d.classList.contains('hero') ? 0.85 : d.classList.contains('baby') ? 1.25 : 1);
    if (d.classList.contains('hero') && Math.random() < 0.5) {
      setTimeout(() => sc.alive && sound.quack(), 280);
      chirp('quack', 5000);
    }
  };

  /** While splashing is the thing to do, taps on the water land here. */
  let splashing: ((x: number, y: number) => void) | null = null;

  sc.on(sc.root, 'pointerdown', (e) => {
    const t = e.target as Element;
    if (t.closest('button, .reveal, .end-buttons, .live')) return;
    e.preventDefault();
    const pt = tub.fromClient(e.clientX, e.clientY);
    const duck = t.closest('.floater.duck, .rim-duck') as HTMLElement | null;
    if (splashing && (tub.onWater(pt.x, pt.y) || duck?.classList.contains('floater'))) {
      splashing(pt.x, Math.max(pt.y, tub.level + 10));
      return;
    }
    if (duck) return squeakDuck(duck);
    if (t.closest('.tap')) {
      replay(tub.tap, 'turn');
      sound.pour(0.6);
      tub.pour(true);
      setTimeout(() => tub.pour(false), 600);
      return;
    }
    if (t.closest('.bottle')) {
      replay(tub.bottle, 'squeeze');
      sound.squirt();
      squirtFx();
      return;
    }
    if (t.closest('.sponge')) {
      replay(tub.sponge, 'squish');
      sound.scrub();
      return;
    }
    if (t.closest('.plug')) {
      if (!tub.plug.classList.contains('pulled')) replay(tub.plug, 'jiggle');
      sound.tapSoft();
      return;
    }
    if (tub.onWater(pt.x, pt.y)) splashAt(pt.x, Math.max(pt.y, tub.level + 10), false);
  });

  const squirtFx = () => {
    const r = tub.bottle.getBoundingClientRect();
    burst(r.left + r.width * 0.5, r.top + r.height * 0.05, { kind: 'drop', count: 10, spread: 0.6, colors: ['#ff94c8', '#ffffff', '#e3f4ff'] });
  };

  /** Drop a floater in from above, with a plop. */
  const dropIn = (f: Floater, delay = 0) => {
    f.art.style.animationDelay = `${delay}ms`;
    f.art.classList.add('drop');
    setTimeout(() => {
      if (!sc.alive) return;
      sound.plop();
      ripple(f.x, tub.surface(f.d), false);
    }, delay + 420);
  };
  /** Sink out of sight and go. */
  const away = (f: Floater, delay = 0) =>
    setTimeout(() => {
      if (sc.alive) tub.remove(f, 'away', 700);
    }, delay);

  /** Ducky paddles to the back, out of the way of the little ducks, and back again. */
  // (On a wide bath, off to the left by the tap, clear of the ducks on the
  // rim; on a tall one a little right of the middle, clear of the plug chain.)
  const park = () => tub.swim(ducky, tub.shape.tall ? tub.mid + 50 : 200, 0, 900);
  const unpark = () => tub.swim(ducky, tub.mid, 0.5, 900);

  // --- Filling the bath -------------------------------------------------------------------

  async function fillMove() {
    tub.tap.classList.add('live');
    // After "Bath time!".
    await sc.wait(1400);
    void talk('tapTap');
    for (let i = 0; i < 3; i++) {
      await sc.tap(tub.tap, i ? HINT_MS : 1600);
      replay(tub.tap, 'turn');
      sound.pour(1.4);
      tub.pour(true);
      const drops = window.setInterval(() => {
        const p = tub.toClient(tub.spoutX, Math.min(tub.level, tub.shape.fy - 110) + 8);
        burst(p.x, p.y, { kind: 'drop', count: 4, spread: 0.35, colors: WATER });
      }, 240);
      try {
        await tub.setLevel(tub.empty - ((tub.empty - tub.full) * (i + 1)) / 3, 1400);
      } finally {
        clearInterval(drops);
        tub.pour(false);
      }
      if (i < 2) void talk('more');
    }
    tub.tap.classList.remove('live');
    // (Not waited for; a scene closing mid-swim is fine.)
    tub.swim(ducky, tub.mid, 0.5, 900).catch(() => {});
    sound.chime();
    replay(ducky.art, 'hop');
    burstAt(ducky.art, { kind: 'sparkle', count: 12 });
    await speak('full', 3000);
  }

  // --- Bubbles ------------------------------------------------------------------------

  async function bubblesMove() {
    tub.bottle.classList.add('live');
    void talk('bubbleTime');
    const piles: Floater[] = [];
    // Two piles of foam for each squeeze: [across, depth, size].
    const spots: [number, number, number][][] = [
      [
        [0.15, 0.2, 200],
        [0.8, 0.85, 180],
      ],
      [
        [0.4, 0.9, 190],
        [0.65, 0.15, 210],
      ],
      [
        [0, 0.75, 170],
        [1, 0.3, 170],
      ],
    ];
    for (let i = 0; i < 3; i++) {
      await sc.tap(tub.bottle, i ? HINT_MS : 1800);
      replay(tub.bottle, 'squeeze');
      sound.squirt();
      squirtFx();
      for (const [t, d, w] of spots[i]) {
        const f = tub.foam(tub.span(t), d, w);
        f.art.classList.add('grow');
        piles.push(f);
      }
    }
    tub.bottle.classList.remove('live');
    await sc.wait(300);

    // Bubbles float up out of the foam, to pop.
    const n = 5;
    const bubbles = Array.from({ length: n }, (_, i) => {
      const b = el('div', 'bubble live', tub.air, bubbleSVG());
      const x = tub.span(i / (n - 1)) + rand(-25, 25);
      const y = i % 2 ? rand(-10, 40) : rand(70, 120);
      b.style.left = tub.px(x);
      b.style.top = tub.py(y);
      b.style.width = tub.px(tub.shape.tall ? 140 : 110);
      b.style.animationDelay = `${i * 0.15}s, ${-rand(0, 2)}s`;
      return b;
    });
    await sc.wait(700);
    void talk('popBubbles');
    const left = bubbles.slice();
    let k = 0;
    while (left.length) {
      const i = await sc.tapAny(left, HINT_MS, left[0]);
      const b = left.splice(i, 1)[0];
      const c = center(b);
      sound.pop(1 + k * 0.12);
      k++;
      burst(c.x, c.y, { kind: 'drop', count: 10, spread: 0.55, colors: ['#dff3ff', '#ffffff', '#ffb3e0', '#b3f0c8'] });
      b.remove();
      if (k === 2) chirp('pop', 0);
    }
    await speak(pick(['yay', 'wow']), 3000);
    piles.forEach((f, i) => away(f, i * 120));
  }

  // --- Squeak a duck by colour ----------------------------------------------------------------

  async function colourMove() {
    await park();
    const n = save.baths < 2 ? 2 : 3;
    const colours = shuffle(LITTLE).slice(0, n);
    const target = pick(colours);
    const xs = (n === 2 ? [0.2, 0.8] : [0, 0.5, 1]).map((t) => tub.span(t));
    const ds = shuffle([0.55, 0.85, 0.7]);
    const ducks = colours.map((c, i) => {
      const f = tub.duck(colourLook(c), 'cduck live', { x: xs[i], d: ds[i], w: 140 });
      dropIn(f, i * 220);
      return f;
    });
    const right = ducks[colours.indexOf(target)];
    await sc.wait(700 + n * 220);
    await speak(`sq${cap(target.id)}`, 4000);
    let misses = 0;
    for (;;) {
      const i = await sc.tapAny(
        ducks.map((d) => d.el),
        misses ? 1200 : HINT_MS + 1000,
        right.el,
      );
      if (ducks[i] === right) break;
      misses++;
      sound.nope();
      replay(ducks[i].art, 'nope');
      await speak([`that${cap(colours[i].id)}`, `sq${cap(target.id)}`], 6000);
    }
    sound.squeak();
    replay(right.art, 'hop');
    burstAt(right.art, { kind: 'sparkle', count: 14, colors: [target.petal, '#fff6a8', '#ffffff'] });
    ducks.forEach((d) => d.el.classList.remove('live'));
    await speak([target.id, misses ? 'yay' : pick(['yay', 'wow'])], 4000);
    ducks.forEach((d, i) => away(d, i * 150));
    await unpark();
  }

  // --- Count the little ducks -------------------------------------------------------------------

  async function countMove() {
    const n = Math.min(5, 3 + Math.floor(save.baths / 3));
    await park();
    // A row of little ducks in every colour.
    const colours = shuffle(LITTLE);
    const babies = Array.from({ length: n }, (_, i) => {
      const f = tub.duck(colourLook(colours[i % colours.length]), 'cduck live', { x: tub.span(i / (n - 1)), d: i % 2 ? 0.85 : 0.55, w: 112 });
      dropIn(f, i * 200);
      return f;
    });
    await sc.wait(600 + n * 200);
    void talk('count');
    let k = 0;
    const left = babies.slice();
    while (left.length) {
      const i = await sc.tapAny(
        left.map((b) => b.el),
        HINT_MS,
        left[0].el,
      );
      const b = left.splice(i, 1)[0];
      k++;
      b.el.classList.remove('live');
      sound.squeak(1.1 + k * 0.06);
      sound.knock(k - 1);
      replay(b.art, 'hop');
      el('div', 'count-num', b.el, String(k));
      void talk(`n${k}`);
    }
    await sc.wait(700);
    sound.sparkle();
    burstAt(ducky.art, { kind: 'sparkle', count: 12 });
    await speak(pick(['yay', 'youDidIt']), 3000);
    babies.forEach((b, i) => away(b, i * 120));
    await unpark();
  }

  // --- Scrub the mud off Ducky --------------------------------------------------------------

  async function scrubMove() {
    await tub.swim(ducky, tub.mid, 0.35, 700);
    // Where the mud can go on Ducky, in duck units.
    const SPOTS: [number, number][] = [
      [-26, -22],
      [6, -18],
      [32, -30],
      [8, -80],
      [-36, -42],
      [38, -12],
    ];
    const n = save.baths < 2 ? 3 : 4;
    const muds = shuffle(SPOTS)
      .slice(0, n)
      .map(([x, y], i) => {
        const m = el('div', 'mud live', ducky.art, mudSVG());
        m.style.left = `${((x + 66) / 132) * 100}%`;
        m.style.top = `${((y + 134) / 138) * 100}%`;
        m.style.animationDelay = `${i * 0.12}s`;
        return m;
      });
    sound.splat();
    replay(ducky.art, 'nope');
    await speak('muddy', 4000);
    const left = muds.slice();
    let first = true;
    tub.sponge.classList.add('out');
    while (left.length) {
      const i = await sc.tapAny(left, HINT_MS, left[0]);
      const m = left.splice(i, 1)[0];
      m.classList.remove('live');
      const c = center(m);
      const sp = el('div', 'scrub-sponge', sc.root, spongeSVG());
      const box = sc.root.getBoundingClientRect();
      sp.style.left = `${c.x - box.left}px`;
      sp.style.top = `${c.y - box.top}px`;
      sp.style.width = `${Math.max(56, c.w * 1.7)}px`;
      setTimeout(() => sp.remove(), 800);
      sound.scrub();
      burst(c.x, c.y, { kind: 'drop', count: 10, spread: 0.5, colors: FOAMY });
      m.classList.add('gone');
      setTimeout(() => m.remove(), 700);
      if (first) {
        first = false;
        void talk('scrub');
      }
    }
    await sc.wait(700);
    tub.sponge.classList.remove('out');
    sound.sparkle();
    sound.squeak(0.85);
    replay(ducky.art, 'hop');
    burstAt(ducky.art, { kind: 'sparkle', count: 20, spread: 1.1 });
    await speak('clean', 3000);
    await tub.swim(ducky, tub.mid, 0.5, 700);
  }

  // --- Baby Duck hides in the bubbles --------------------------------------------------------

  async function hideMove() {
    await park();
    const xs = [0, 0.5, 1].map((t) => tub.span(t));
    const ds = [0.65, 0.8, 0.6];
    const at = Math.floor(Math.random() * 3);
    const baby = tub.duck('baby', 'cduck baby hiding', { x: xs[at], d: ds[at] - 0.02, w: 104 });
    const piles = xs.map((x, i) => {
      const f = tub.foam(x, ds[i], 200, i * 7 + 3);
      f.el.classList.add('live');
      f.art.classList.add('grow');
      f.art.style.animationDelay = `${i * 0.15}s`;
      return f;
    });
    sound.squirt();
    await sc.wait(900);
    await speak('whereBaby', 4000);
    let misses = 0;
    const left = piles.slice();
    for (;;) {
      const i = await sc.tapAny(
        left.map((p) => p.el),
        misses ? 1200 : HINT_MS + 1000,
        piles[at].el,
      );
      const p = left.splice(i, 1)[0];
      const c = center(p.art);
      tub.remove(p, 'puff', 600);
      sound.whoosh();
      burst(c.x, c.y, { kind: 'drop', count: 14, spread: 0.8, colors: FOAMY });
      if (p === piles[at]) break;
      misses++;
      sound.nope();
      await speak('notHere', 3000);
    }
    baby.el.classList.remove('hiding');
    replay(baby.art, 'peek');
    sound.squeak(1.3);
    setTimeout(() => sc.alive && sound.giggle(), 300);
    burstAt(baby.art, { kind: 'sparkle', count: 14 });
    await speak('peekaboo', 3000);
    // Baby Duck paddles over to Ducky for a cuddle.
    await tub.swim(baby, ducky.x + 110, 0.3, 1100);
    replay(ducky.art, 'hop');
    replay(baby.art, 'hop');
    sound.squeak(1.25);
    burstAt(ducky.art, { kind: 'heart', count: 6, colors: ['#ff7ab8', '#ff94c8'] });
    await sc.wait(900);
    left.forEach((p) => tub.remove(p, 'away', 700));
    away(baby, 300);
    await unpark();
  }

  // --- Splashing -------------------------------------------------------------------------

  async function splashMove() {
    void talk('splashTap');
    const goal = 6;
    let n = 0;
    await sc.when<void>((done) => {
      let stopHint = hint.schedule(() => waterMark, 2000);
      splashing = (x, y) => {
        n++;
        splashAt(x, y, true);
        if (n === 3) chirp('splash', 0);
        stopHint();
        if (n >= goal) done();
        else stopHint = hint.schedule(() => waterMark, HINT_MS + 1000);
      };
      return () => {
        splashing = null;
        stopHint();
      };
    });
    sound.giggle();
    await speak(['wheee', 'yay'], 4000);
  }

  // --- Pull the plug; the big bubble ------------------------------------------------------

  const { item, isNew } = nextItem();

  async function goalMove() {
    // To the back, to stay in sight once the water has gone.
    await tub.swim(ducky, tub.span(0.85), 0, 700);
    tub.plug.classList.add('live');
    await speak('plug', 4000);
    await sc.tapAny([tub.plug], 1500, tub.plugRing);
    tub.plug.classList.remove('live');
    tub.plug.classList.add('pulled');
    sound.pop(0.7);
    sound.glug();
    void talk('glug');
    const swirl = el('div', 'swirl', tub.float);
    swirl.style.left = tub.px(tub.spoutX + 100);
    swirl.style.top = tub.py(tub.level + 60);
    await tub.setLevel(tub.empty, 2800);
    swirl.remove();
    tub.plug.classList.remove('pulled');

    // Up from the plughole floats a big bubble, with a duck inside.
    const bubble = el('div', 'big-bubble live', tub.air, bigBubbleSVG(duckSVG(item.id)));
    bubble.style.width = tub.px(tub.shape.tall ? 330 : 270);
    await sc.wait(1600);
    await speak(isNew ? 'present' : 'another', 4000);
    await sc.tap(bubble);
    const c = center(bubble);
    sound.bang();
    burst(c.x, c.y, { count: 26, spread: 1.2, colors: ['#dff3ff', '#ffffff', '#ffb3e0', '#b3f0c8', '#ffd84a'] });
    bubble.remove();
    await sc.wait(250);
    await reveal(item);
    // The duck takes its place on the rim.
    tub.setRim(rimIds(), item.id);
    const fresh = tub.rimEls.find((d) => d.dataset.id === item.id);
    sound.squeak();
    if (fresh) burstAt(fresh, { kind: 'sparkle', count: 16, spread: 0.9 });
    await sc.wait(900);
  }

  async function reveal(it: Item) {
    finishBath(it);
    const allNow = isNew && save.items.length === ITEMS.length;
    const box = el('div', 'reveal', sc.root);
    const card = el('div', 'reveal-card', box);
    el('div', 'reveal-rays', card);
    el('div', `reveal-art d-${it.id}`, card, duckSVG(it.id));
    el('div', 'reveal-name', card, it.name);
    if (isNew) el('div', 'reveal-new', card, '<span>★</span>');
    requestAnimationFrame(() => box.classList.add('open'));
    sound.fanfare();
    setTimeout(() => sc.alive && sound.squeak(), 700);
    const c = center(card);
    burst(c.x, c.y, { count: 30, spread: 1.4 });
    setTimeout(() => sc.alive && burst(c.x, c.y, { kind: 'sparkle', count: 16, spread: 1.2 }), 400);
    await speak(isNew ? ['newDuck', `d-${it.id}`] : [`d-${it.id}`], 6000);
    if (allNow) {
      sound.fanfare();
      burst(c.x, c.y, { count: 40, spread: 1.8 });
      await speak('allItems', 4000);
    }
    // Stay a moment (or until tapped), then back to the bath.
    await sc.when<void>((done) => {
      const t = window.setTimeout(done, 1800);
      box.addEventListener('pointerdown', () => done(), { once: true });
      return () => clearTimeout(t);
    });
    box.classList.add('closing');
    await sc.wait(350);
    box.remove();
  }

  // --- The bath -------------------------------------------------------------------------

  const moves = planBath();
  const dots = moves.map((m) => el('span', m === 'goal' ? 'dot goal' : 'dot', trail, m === 'goal' ? '★' : ''));
  await sc.wait(500);
  for (let i = 0; i < moves.length; i++) {
    dots[i].classList.add('now');
    const m = moves[i];
    if (m === 'fill') await fillMove();
    else if (m === 'bubbles') await bubblesMove();
    else if (m === 'colour') await colourMove();
    else if (m === 'count') await countMove();
    else if (m === 'scrub') await scrubMove();
    else if (m === 'hide') await hideMove();
    else if (m === 'splash') await splashMove();
    else await goalMove();
    dots[i].classList.remove('now');
    dots[i].classList.add('done');
    if (m !== 'goal') await sc.wait(300);
  }

  // Another bath, or go and see the ducks.
  const buttons = el('div', 'end-buttons', sc.root);
  const again = el('button', 'big-btn green play-btn', buttons, ICONS.play);
  again.setAttribute('aria-label', 'Another bath');
  const shelf = el('button', 'big-btn orange shelf-btn', buttons, `${ICONS.duck}<span class="new-star">★</span>`);
  shelf.setAttribute('aria-label', 'Your ducks');
  if (unseenItems().length) shelf.classList.add('has-new');
  void talk(isNew ? 'goShelf' : 'wellDone');
  const i = await sc.tapAny([again, shelf], 8000, isNew ? shelf : again);
  sound.pop();
  sc.destroy();
  return i === 0 ? 'again' : 'shelf';
}
