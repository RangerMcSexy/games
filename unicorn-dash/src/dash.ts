// A dash across the meadow, seen from the side. Sparkle the unicorn runs by
// herself; tap anywhere and she jumps. Along the way there are stars to
// catch, logs, rocks and bushes to jump over, balloons to pop by colour and
// fences to count, and at the end a present to open.
//
// Nothing can go wrong: Sparkle waits in front of anything she has to jump
// over (every jump from there clears it), and puddles only splash. Each dash
// is eight moves.
import {
  ICONS,
  balloonSVG,
  bloomSVG,
  bunnySVG,
  bushSVG,
  butterflySVG,
  fenceSVG,
  itemSVG,
  logSVG,
  mushroomSVG,
  presentSVG,
  puddleSVG,
  rainbowSVG,
  rockSVG,
  starSVG,
  treeSVG,
  unicornSVG,
} from './art';
import { sound } from './audio';
import { COLOURS, ITEMS, addStar, finishDash, nextItem, save, unseenItems, type Item } from './data';
import { Meadow, type Host } from './screens';
import { HINT_MS, Scene, burst, burstAt, center, el, flyClone, hint, pick, rand, replay, shuffle } from '../../shared/ui';
import { say, sayAll } from './voice';
import { stickerMoment } from '../../shared/sticker-moment';
import { STICKER_ART } from './stickers';

type Move = 'stars' | 'jump' | 'puddle' | 'colour' | 'count' | 'goal';

/**
 * Something in the meadow. `x` is its middle and `y` its height above the
 * ground (its bottom, or its middle for things in the air), both in
 * unicorns (see `U`); `w` is its width, in unicorns too.
 */
interface Thing {
  el: HTMLElement;
  x: number;
  y: number;
  w: number;
  air?: boolean;
}

interface Obstacle extends Thing {
  x0: number;
  x1: number;
  kind: string;
  onWait?: () => void;
  onClear?: () => void;
}

interface Puddle extends Thing {
  x0: number;
  x1: number;
  splashed: boolean;
  onPass?: (splashed: boolean) => void;
}

interface Star extends Thing {
  caught: boolean;
}

const cap = (id: string) => id[0].toUpperCase() + id.slice(1);

/** The moves of one dash: a first jump to learn on, a mix, then the present. */
function planDash(): Move[] {
  return ['jump', ...shuffle<Move>(['stars', 'stars', 'colour', 'count', 'jump', 'puddle']), 'goal'];
}

// Sparkle's shape, in unicorns: how far her hooves reach in front of and
// behind her middle, and where her body and head are (for catching stars).
const FRONT = 0.36;
const REAR = 0.4;
/** How far in front of something she stops to wait for a jump. */
const GAP = 0.35;
const RUN = 2.3; // running speed, unicorns a second
const AIR = 0.78; // seconds in the air on each jump
const ACCEL = 4;
const BRAKE = 6;

export async function dashScreen(host: Host): Promise<'again' | 'dress'> {
  const sc = new Scene(host.stage, 'dash-scene');
  host.setScene(sc);

  const meadow = new Meadow(sc.root);
  const world = el('div', 'world', sc.root);
  const backLayer = el('div', 'layer', world);
  const itemLayer = el('div', 'layer', world);
  const uniLayer = el('div', 'layer', world);
  const frontLayer = el('div', 'layer', world);
  const airLayer = el('div', 'layer', world);
  const trail = el('div', 'trail', sc.root);

  // --- Measuring and placing ----------------------------------------------------
  let W = 0;
  let H = 0;
  let U = 0; // one unicorn, in pixels
  let GROUND = 0; // the ground line, in pixels from the top
  let UX = 0; // where Sparkle runs on the screen, in unicorns from the left
  let JH = 0; // how high she jumps, in unicorns
  let G = 0; // gravity and take-off speed to match
  let VY = 0;
  const measure = () => {
    W = sc.root.clientWidth || innerWidth;
    H = sc.root.clientHeight || innerHeight;
    U = Math.max(64, Math.min(150, W * 0.24, H * 0.2));
    GROUND = meadow.ground(H);
    UX = Math.max(W * 0.22, U * 1.05) / U;
    // As high as looks fun, but never up under the buttons at the top.
    const top = (document.querySelector('.top-bar')?.getBoundingClientRect().bottom ?? 70) + 8;
    JH = Math.max(0.9, Math.min(1.25, (GROUND - top) / U - 1.62));
    G = (8 * JH) / (AIR * AIR);
    VY = (4 * JH) / AIR;
  };
  measure();

  const things: Thing[] = [];
  const place = (t: Thing) => {
    t.el.style.left = `${(t.x * U).toFixed(1)}px`;
    t.el.style.top = `${(GROUND - t.y * U).toFixed(1)}px`;
    t.el.style.width = `${(t.w * U).toFixed(1)}px`;
  };
  const add = <T extends Thing>(t: T): T => {
    things.push(t);
    place(t);
    return t;
  };

  // --- Sparkle ------------------------------------------------------------------
  let ux = 0; // her middle, in unicorns along the meadow
  let uy = 0; // how high her hooves are
  let vy = 0;
  let vx = 0; // speed through the air
  let speed = 0; // speed along the ground
  let air = false;
  let hold = true; // stand still (for balloons and the present)
  let stopX: number | null = null; // somewhere she must stop
  let resting = true;
  let queued = false; // tapped on the way down: jump again on landing
  const uni = el('div', 'uni idle', uniLayer);
  const tilt = el('div', 'uni-tilt', uni, unicornSVG(save.wearing));
  const dress = () => (tilt.innerHTML = unicornSVG(save.wearing));

  const cam = () => ux - UX;
  const ahead = () => cam() + W / U + 0.8;

  const obstacles: Obstacle[] = [];
  const puddles: Puddle[] = [];
  const stars: Star[] = [];

  // Frame checks for the flow below: resolve once `test` is true.
  const watchers = new Set<{ test: () => boolean; done: () => void }>();
  const until = (test: () => boolean) =>
    sc.when<void>((done) => {
      const w = { test, done };
      watchers.add(w);
      return () => watchers.delete(w);
    });
  const reach = (x: number) => until(() => ux >= x);

  // Words: the game's own lines always get said; the odd happy "Wheee!" only
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

  // --- Jumping ------------------------------------------------------------------
  let stopHint = () => {};
  let jumps = 0;
  function jump() {
    if (air) {
      if (vy < 0) queued = true;
      return;
    }
    queued = false;
    stopHint();
    let land = ux + (hold ? 0 : RUN * AIR);
    const o = obstacles[0];
    if (o && !hold) {
      // Coming down on top of it? Leap right over it instead (the middle of
      // the jump over its middle), or, when it's too far to reach, land just
      // in front of it.
      const before = o.x0 - (ux + FRONT);
      const short = land + FRONT < o.x0 - 0.1;
      const over = land - REAR > o.x1 + 0.3 && before > 0.3;
      if (!short && !over) {
        const across = o.x1 + REAR + Math.max(GAP, before);
        land = across - ux <= 4 ? across : Math.max(ux, o.x0 - FRONT - 0.2);
      }
    }
    if (stopX !== null) land = Math.min(land, Math.max(ux, stopX));
    air = true;
    resting = false;
    vx = (land - ux) / AIR;
    vy = VY;
    jumps++;
    uni.classList.remove('idle', 'run');
    uni.classList.add('air');
    sound.jump();
    if (Math.random() < 0.3) chirp(pick(['wheee', 'upHigh', 'jump']));
  }

  function landed() {
    air = false;
    uy = 0;
    vy = 0;
    speed = hold ? 0 : Math.min(RUN, vx);
    uni.classList.remove('air');
    replay(uni, 'squash');
    sound.land();
    if (queued) jump();
  }

  // --- The frame loop -------------------------------------------------------------
  let last = performance.now();
  let clopT = 0;
  let clops = 0;
  let streak = 0;
  let lastStarAt = 0;
  let raf = 0;
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt, now);
    render(now);
    watchers.forEach((w) => w.test() && w.done());
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  sc.addCleanup(() => cancelAnimationFrame(raf));

  function step(dt: number, now: number) {
    const o = obstacles[0];
    if (air) {
      ux += vx * dt;
      vy -= G * dt;
      uy += vy * dt;
      if (uy <= 0) landed();
    } else {
      // Run, slowing down in good time for anything she has to stop at.
      let limit = o ? o.x0 - GAP - FRONT : Infinity;
      if (stopX !== null) limit = Math.min(limit, stopX);
      const dist = limit - ux;
      let target = hold ? 0 : RUN;
      if (dist < Infinity) target = Math.min(target, Math.sqrt(2 * BRAKE * Math.max(0, dist)));
      speed = speed < target ? Math.min(target, speed + ACCEL * dt) : target;
      ux = Math.min(ux + speed * dt, Math.max(ux, limit));
      const wasResting = resting;
      resting = speed < 0.02;
      uni.classList.toggle('run', !resting);
      uni.classList.toggle('idle', resting);
      if (resting && !wasResting && o && limit === o.x0 - GAP - FRONT && dist < 0.05) {
        sound.skid();
        o.onWait?.();
      }
      if (!resting) {
        clopT += dt;
        if (clopT > 0.18) {
          clopT = 0;
          sound.clop(clops++);
        }
      }
    }

    // Over something: it's done with.
    if (o && ux - REAR > o.x1) {
      obstacles.shift();
      o.onClear?.();
    }
    for (let i = puddles.length - 1; i >= 0; i--) {
      const p = puddles[i];
      if (!air && !p.splashed && ux + FRONT > p.x0 + 0.1 && ux - REAR < p.x1 - 0.1) {
        p.splashed = true;
        splash(p);
      }
      if (ux - REAR > p.x1) {
        puddles.splice(i, 1);
        p.onPass?.(p.splashed);
      }
    }

    // Stars: caught by her body or her head.
    const bx = ux - 0.05;
    const by = uy + 0.6;
    const hx = ux + 0.55;
    const hy = uy + 1.12;
    for (const s of stars) {
      if (s.caught || Math.abs(s.x - ux) > 1.4) continue;
      if (Math.hypot(s.x - bx, s.y - by) < 0.72 || Math.hypot(s.x - hx, s.y - hy) < 0.6) catchStar(s, now);
    }
  }

  function render(now: number) {
    const c = cam();
    world.style.transform = `translate3d(${(-c * U).toFixed(1)}px, 0, 0)`;
    meadow.scroll(c * U, now);
    // Leaning into the jump: nose up going up, down coming down.
    const lean = air ? Math.max(-14, Math.min(12, (-vy / VY) * 12)) : 0;
    uni.style.transform = `translate3d(${((ux - 1) * U).toFixed(1)}px, ${(GROUND - (uy + 1.8) * U).toFixed(1)}px, 0)`;
    tilt.style.transform = air ? `rotate(${lean.toFixed(1)}deg)` : '';
  }

  const layout = () => {
    measure();
    uni.style.width = `${(2.1 * U).toFixed(1)}px`;
    things.forEach(place);
    render(performance.now());
  };
  layout();
  sc.on(window, 'resize', layout);

  /** Drop what has gone well off the left of the screen. */
  const tidy = () => {
    const c = cam() - 2.5;
    for (let i = things.length - 1; i >= 0; i--) {
      const t = things[i];
      if (t.x + t.w / 2 < c) {
        t.el.remove();
        things.splice(i, 1);
      }
    }
    for (let i = stars.length - 1; i >= 0; i--) if (stars[i].caught || stars[i].x < c) stars.splice(i, 1);
  };
  const tidyT = window.setInterval(tidy, 1000);
  sc.addCleanup(() => clearInterval(tidyT));

  // --- Stars --------------------------------------------------------------------
  let caughtThisDash = 0;
  const countEl = el('div', 'star-count', trail, `${starSVG()}<b>0</b>`);
  const countNum = countEl.querySelector('b')!;
  const countIcon = countEl.querySelector('svg')!;

  const makeStar = (x: number, y: number) => {
    const s = add<Star>({ el: el('div', 'star', airLayer, starSVG()), x, y, w: 0.44, air: true, caught: false });
    s.el.style.animationDelay = `${-rand(0, 2)}s`;
    stars.push(s);
    return s;
  };

  function catchStar(s: Star, now: number) {
    s.caught = true;
    streak = now - lastStarAt < 700 ? streak + 1 : 0;
    lastStarAt = now;
    sound.star(streak);
    addStar();
    caughtThisDash++;
    const r = s.el.getBoundingClientRect();
    s.el.remove();
    burst(r.left + r.width / 2, r.top + r.height / 2, { kind: 'sparkle', count: 6, spread: 0.45, colors: ['#fff6a8', '#ffffff', '#ffd84a'] });
    // Off it flies to the counter.
    const to = countIcon.getBoundingClientRect();
    void flyClone(starSVG(), r, { x: to.left + to.width / 2, y: to.top + to.height / 2 }, 550, to.width / r.width).then(() => {
      countNum.textContent = String(caughtThisDash);
      replay(countEl, 'bump');
    });
  }

  /** A row of stars in the air, shaped like a jump, `n` long. */
  const starArc = (x: number, n = 5) => {
    const out: Star[] = [];
    for (let i = 0; i < n; i++) {
      const h = 0.95 + (JH - 0.15) * 0.8 * Math.sin((Math.PI * (i + 0.5)) / n);
      out.push(makeStar(x + i * 0.45, h + 0.25));
    }
    return out;
  };
  /** A few stars low down, caught just by running. */
  const starRun = (x: number, n = 3) => Array.from({ length: n }, (_, i) => makeStar(x + i * 0.55, 0.62));

  // --- The meadow's scenery ----------------------------------------------------------
  let decoratedTo = -3;
  const BLOOMS = ['#ff94c8', '#ffd84a', '#ffffff', '#b184f5', '#ff7a7a', '#7cc0ff'];
  const decorate = (upTo: number) => {
    while (decoratedTo < upTo) {
      decoratedTo += rand(0.55, 1.1);
      const x = decoratedTo;
      const r = Math.random();
      if (r < 0.28) add({ el: el('div', 'tree', backLayer, treeSVG(Math.floor(rand(0, 3)))), x, y: 0.28, w: rand(0.9, 1.3) });
      else if (r < 0.36) add({ el: el('div', 'shroom', backLayer, mushroomSVG()), x, y: 0.2, w: 0.4 });
      else if (r < 0.43) add({ el: el('div', 'critter bunny', backLayer, bunnySVG()), x, y: 0.16, w: 0.55 });
      if (Math.random() < 0.8) {
        const k = Math.floor(rand(0, 3));
        const b = add({ el: el('div', 'bloom', frontLayer, bloomSVG(k, pick(BLOOMS))), x: x + rand(-0.3, 0.3), y: -rand(0.2, 0.55), w: k === 2 ? 0.34 : 0.26 });
        b.el.style.animationDelay = `${-rand(0, 3)}s`;
      }
      if (Math.random() < 0.08) {
        const f = add({ el: el('div', 'critter butterfly', airLayer, butterflySVG()), x, y: JH + 1.3 + rand(0, 0.2), w: 0.42, air: true });
        f.el.style.animationDelay = `${-rand(0, 4)}s`;
      }
    }
  };
  const decorT = window.setInterval(() => decorate(ahead() + 3), 300);
  sc.addCleanup(() => clearInterval(decorT));
  decorate(ahead() + 3);

  // --- Things in the way -------------------------------------------------------------
  const OBSTACLES: Record<string, { art: () => string; w: number; h: number }> = {
    log: { art: logSVG, w: 0.8, h: 0.37 },
    rock: { art: rockSVG, w: 0.72, h: 0.39 },
    bush: { art: bushSVG, w: 0.8, h: 0.46 },
    fence: { art: fenceSVG, w: 0.56, h: 0.37 },
  };
  const makeObstacle = (kind: string, x: number): Obstacle => {
    const k = OBSTACLES[kind];
    const o = add<Obstacle>({ el: el('div', `obstacle ${kind}`, itemLayer, k.art()), x, y: 0.02, w: k.w, x0: x - k.w / 2, x1: x + k.w / 2, kind });
    obstacles.push(o);
    return o;
  };
  let toldTap = false;
  /** Wait until Sparkle is over `o`; if she stops in front of it, a word and a helping hand. */
  const over = (o: Obstacle, word?: string) =>
    sc.when<void>((done) => {
      o.onWait = () => {
        if (!toldTap) {
          toldTap = true;
          void talk('tapJump');
        } else if (word) void talk(word);
        stopHint = hint.schedule(() => uni, jumps ? HINT_MS : 1200);
      };
      o.onClear = () => done();
      return () => {
        o.onWait = o.onClear = undefined;
        stopHint();
      };
    });

  function splash(p: Puddle) {
    const r = p.el.getBoundingClientRect();
    const x = Math.min(r.right, Math.max(r.left, (ux - cam()) * U));
    burst(x, r.top + r.height / 2, { kind: 'drop', count: 14, spread: 0.7, colors: ['#7cc8f5', '#b3e3ff', '#ffffff'] });
    replay(p.el, 'splash');
    sound.splash();
    setTimeout(() => sc.alive && sound.giggle(), 250);
  }

  // Tapping: a critter says hello; anywhere else, Sparkle jumps.
  let lastCritterWord = 0;
  sc.on(sc.root, 'pointerdown', (e) => {
    const t = e.target as Element;
    if (t.closest('button, .balloon, .present, .reveal, .end-buttons')) return;
    e.preventDefault();
    const critter = t.closest('.critter') as HTMLElement | null;
    if (critter) {
      const bunny = critter.classList.contains('bunny');
      replay(critter, 'hello');
      if (bunny) sound.boing();
      else sound.sparkle();
      if (performance.now() - lastCritterWord > 6000) {
        lastCritterWord = performance.now();
        void say(bunny ? 'bunny' : 'butterfly');
      }
      return;
    }
    jump();
  });

  // --- The dash -------------------------------------------------------------------
  const moves = planDash();
  const dots = moves.map((m) => el('span', m === 'goal' ? 'dot goal' : 'dot', trail, m === 'goal' ? '★' : ''));
  const { item, isNew } = nextItem();
  /** Where the next thing can go: off the right of the screen, after the last. */
  let free = 0;
  const spot = (min = 0) => Math.max(ahead() + min, free);

  async function starsMove(first: boolean) {
    const x = spot(1.8);
    starRun(x - 1.6, 2);
    const arc = starArc(x);
    free = x + 3;
    if (first) {
      await reach(x - W / U + UX + 0.5);
      void talk('catchStars');
    }
    await reach(arc[arc.length - 1].x + 0.6);
    if (arc.every((s) => s.caught)) {
      sound.sparkle();
      burstAt(uni, { kind: 'sparkle', count: 12 });
      await speak('allStars', 3000);
    }
  }

  async function jumpMove() {
    const kind = pick(['log', 'rock', 'bush']);
    const x = spot(2.4);
    starRun(x - 2.2, 2);
    const o = makeObstacle(kind, x);
    // A star right over the top, for jumping.
    makeStar(x, JH + 0.5);
    free = x + 2.4;
    await over(o, `over${cap(kind)}`);
    sound.chime();
    burstAt(o.el, { kind: 'sparkle', count: 8, spread: 0.6 });
    if (Math.random() < 0.5) chirp(pick(['yay', 'wow']), 0);
    await reach(x + 1);
  }

  async function puddleMove() {
    const x = spot();
    const w = 1.3;
    const p = add<Puddle>({ el: el('div', 'puddle', itemLayer, puddleSVG()), x, y: -0.06, w, x0: x - w / 2, x1: x + w / 2, splashed: false });
    puddles.push(p);
    starArc(x - 0.9, 5);
    free = x + 2.2;
    const splashed = await sc.when<boolean>((done) => {
      p.onPass = done;
      return () => (p.onPass = undefined);
    });
    if (splashed) await speak('splash', 3000);
    else await speak('overPuddle', 3000);
  }

  /**
   * Stop at `x`, and stay there until `go()`. Arriving is enough: a child
   * who keeps tapping keeps her hopping on the spot, and the game goes on.
   */
  async function stopAt(x: number) {
    stopX = x;
    await reach(x - 0.01);
    hold = true;
  }
  const go = () => {
    hold = false;
    stopX = null;
  };

  async function colourMove() {
    // Stop for balloons.
    await stopAt(ux + 1.2);
    const n = save.dashes < 2 ? 2 : 3;
    const colours = shuffle(COLOURS).slice(0, n);
    const target = pick(colours);
    const from = ux + 1.1;
    const to = Math.min(cam() + W / U - 0.5, from + 1.6 * (n - 1));
    const heights = shuffle([1.35, 1.8, 1.5]).map((h) => Math.min(h, JH + 0.9));
    const balloons = colours.map((c, i) => {
      const b = add({ el: el('div', 'balloon', airLayer, balloonSVG(c)), x: from + ((to - from) * i) / (n - 1), y: heights[i], w: 0.62, air: true });
      b.el.style.animationDelay = `${i * 0.15}s, ${-rand(0, 2)}s`;
      return b;
    });
    const right = balloons[colours.indexOf(target)];
    await sc.wait(500);
    await speak(`pop${cap(target.id)}`, 4000);
    const misses = await sc.ask(
      balloons.map((b) => b.el),
      balloons.indexOf(right),
      async (i) => {
        sound.nope();
        replay(balloons[i].el, 'nope');
        await speak([`that${cap(colours[i].id)}`, `pop${cap(target.id)}`], 6000);
      },
    );
    // Pop! The others float away.
    const c = center(right.el);
    sound.bang();
    burst(c.x, c.y - c.h * 0.2, { count: 22, spread: 1.1, colors: [target.petal, target.dark, '#fff', '#ffd84a'] });
    right.el.remove();
    balloons.forEach((b) => b !== right && b.el.classList.add('away'));
    await speak([target.id, misses ? 'yay' : pick(['yay', 'wow'])], 4000);
    go();
    await reach(ux + 0.6);
  }

  async function countMove() {
    const n = Math.min(5, 3 + Math.floor(save.dashes / 3));
    const x = spot();
    const fences = Array.from({ length: n }, (_, i) => makeObstacle('fence', x + i * 2.3));
    fences.forEach((f) => makeStar(f.x, JH + 0.5));
    free = x + n * 2.3 + 0.8;
    await reach(x - W / U + UX + 0.6);
    void talk('count');
    for (let i = 0; i < n; i++) {
      await over(fences[i]);
      sound.knock(i);
      el('div', 'fence-num', fences[i].el, String(i + 1));
      void talk(`n${i + 1}`);
    }
    await sc.wait(500);
    sound.sparkle();
    burstAt(uni, { kind: 'sparkle', count: 12 });
    await speak(pick(['yay', 'youDidIt']), 3000);
  }

  async function goalMove() {
    const x = spot(0.6);
    const present = add({ el: el('div', 'present', itemLayer, presentSVG()), x: x + 1.2, y: 0, w: 0.9 });
    add({ el: el('div', 'rainbow', backLayer, rainbowSVG()), x: x + 1.2, y: 0.05, w: Math.min(5, W / U - 0.5) });
    free = x + 4;
    await reach(x - W / U + UX + 1.4);
    void talk('nearly');
    await stopAt(present.x - 0.45 - FRONT - 0.35);
    present.el.classList.add('choice');
    await speak(isNew ? 'present' : 'another', 4000);
    await sc.tap(present.el);
    present.el.classList.remove('choice');
    replay(present.el, 'open');
    sound.magic();
    burstAt(present.el, { kind: 'sparkle', count: 18, spread: 1.1 });
    await sc.wait(600);
    await reveal(item);
    present.el.classList.add('gone');
    // Sparkle puts it straight on.
    dress();
    replay(uni, 'dance');
    sound.magic();
    burstAt(uni, { kind: 'sparkle', count: 22, spread: 1.2 });
    burstAt(uni, { kind: 'heart', count: 8, colors: ['#ff7ab8', '#ff94c8', '#c9a2ff'] });
    await speak('lovely', 3500);
  }

  async function reveal(it: Item) {
    finishDash(it);
    const allNow = isNew && save.items.length === ITEMS.length;
    const box = el('div', 'reveal', sc.root);
    const card = el('div', 'reveal-card', box);
    el('div', 'reveal-rays', card);
    el('div', `reveal-art i-${it.id}`, card, itemSVG(it.id));
    el('div', 'reveal-name', card, it.name);
    if (isNew) el('div', 'reveal-new', card, '<span>★</span>');
    requestAnimationFrame(() => box.classList.add('open'));
    sound.fanfare();
    const c = center(card);
    burst(c.x, c.y, { count: 30, spread: 1.4 });
    setTimeout(() => sc.alive && burst(c.x, c.y, { kind: 'sparkle', count: 16, spread: 1.2 }), 400);
    await speak(isNew ? ['newThing', `i-${it.id}`] : [`i-${it.id}`], 6000);
    if (allNow) {
      sound.fanfare();
      burst(c.x, c.y, { count: 40, spread: 1.8 });
      await speak('allItems', 4000);
    }
    // Stay a moment (or until tapped), then back to the meadow.
    await sc.when<void>((done) => {
      const t = window.setTimeout(done, 1800);
      box.addEventListener('pointerdown', () => done(), { once: true });
      return () => clearTimeout(t);
    });
    box.classList.add('closing');
    await sc.wait(350);
    box.remove();
    // A sticker for the sticker book, now and then.
    await stickerMoment('unicorn-dash', { sc, art: STICKER_ART, chime: () => sound.chime(), say: () => say('sticker') });
  }

  // Off we go.
  await sc.wait(600);
  go();
  let firstStars = true;
  for (let i = 0; i < moves.length; i++) {
    dots[i].classList.add('now');
    const m = moves[i];
    if (m === 'stars') {
      await starsMove(firstStars);
      firstStars = false;
    } else if (m === 'jump') await jumpMove();
    else if (m === 'puddle') await puddleMove();
    else if (m === 'colour') await colourMove();
    else if (m === 'count') await countMove();
    else await goalMove();
    dots[i].classList.remove('now');
    dots[i].classList.add('done');
  }

  // A happy dance; then dash again or go and dress up.
  const buttons = el('div', 'end-buttons', sc.root);
  const again = el('button', 'big-btn green play-btn', buttons, ICONS.play);
  again.setAttribute('aria-label', 'Dash again');
  const wardrobe = el('button', 'big-btn purple dress-btn', buttons, `${ICONS.dress}<span class="new-star">★</span>`);
  wardrobe.setAttribute('aria-label', 'Dress up');
  if (unseenItems().length) wardrobe.classList.add('has-new');
  if (isNew) void talk('goDress');
  const i = await sc.tapAny([again, wardrobe], 8000, isNew ? wardrobe : again);
  sound.pop();
  sc.destroy();
  return i === 0 ? 'again' : 'dress';
}
