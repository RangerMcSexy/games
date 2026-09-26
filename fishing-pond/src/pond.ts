// The pond: tap the water and Pip rows over and casts. A fish swims up,
// nibbles, bites, and one more tap reels it in. Nothing can get away.
import {
  BOAT_H,
  BOAT_W,
  ICONS,
  ROD_TIP,
  WATERLINE,
  bobberSVG,
  boatSVG,
  cloudSVG,
  duckSVG,
  frogSVG,
  hillsSVG,
  hookSVG,
  lilyPadSVG,
  moonSVG,
  reedsSVG,
  sillySVG,
  sunSVG,
  turtleSVG,
  weedSVG,
} from './art';
import { sound } from './audio';
import {
  FISH,
  SILLY,
  WEATHERS,
  addCatch,
  save,
  setWeather,
  speciesCount,
  unseenUnlocks,
  type Fish,
  type Silly,
  type Weather,
} from './data';
import type { Host } from './screens';
import { Swimmer, catchArt } from './swim';
import { Aborted, HINT_MS, Scene, burst, el, flyClone, hint, pick, rand, replay } from './ui';
import { say, sayAll } from './voice';

type State = 'idle' | 'casting' | 'waiting' | 'bite' | 'reeling' | 'reveal';
type Catch = { kind: 'fish'; fish: Fish; swimmer: Swimmer } | { kind: 'silly'; silly: Silly };

const CHEERS = ['yay', 'wow', 'wellDone'];
/** The weather moves on by itself after this many catches. */
const CATCHES_PER_WEATHER = 3;

/** Pick a fish to swim by, favouring ones not caught yet. */
function pickFish(weather: Weather): Fish {
  const pool = FISH.filter((f) => !f.night || weather === 'night');
  const weights = pool.map((f) => (save.caught[f.id] ? 1 : 3) * (f.night ? 2 : 1));
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) if ((r -= weights[i]) <= 0) return pool[i];
  return pool[0];
}

function pickSilly(): Silly {
  const fresh = SILLY.filter((s) => !save.silly[s.id]);
  return pick(fresh.length && Math.random() < 0.7 ? fresh : SILLY);
}

export async function pondScreen(host: Host): Promise<'aquarium'> {
  const sc = new Scene(host.stage, `pond-scene w-${save.weather}`);
  host.setScene(sc);
  const root = sc.root;
  let weather: Weather = save.weather;

  // --- Scenery ---------------------------------------------------------------
  const sky = el('div', 'sky', root);
  for (const w of WEATHERS) el('div', `sky-tint t-${w}`, sky);
  const stars = el('div', 'stars', sky);
  for (let i = 0; i < 18; i++) {
    const s = el('i', '', stars);
    s.style.left = `${rand(2, 98)}%`;
    s.style.top = `${rand(4, 80)}%`;
    s.style.animationDelay = `${rand(0, 3)}s`;
  }
  const clouds = el('div', 'clouds', sky);
  [0, 1, 2].forEach((i) => {
    const c = el('div', `cloud c${i}`, clouds, cloudSVG());
    c.style.animationDelay = `${-i * 14}s`;
  });
  const skyObj = el('button', 'sky-obj friend', root);
  skyObj.dataset.friend = 'sky';
  skyObj.setAttribute('aria-label', 'Change the weather');
  el('div', 'so so-day', skyObj, sunSVG());
  el('div', 'so so-rain', skyObj, cloudSVG(true));
  el('div', 'so so-sunset', skyObj, sunSVG());
  el('div', 'so so-night', skyObj, moonSVG());

  el('div', 'hills', root, hillsSVG());
  const water = el('div', 'water', root);
  for (const w of WEATHERS) el('div', `water-tint t-${w}`, water);
  el('div', 'water-shine', water);
  const floor = el('div', 'pond-floor', water);
  const weedCols = ['#5fbf6a', '#4fae8a', '#7fcf5a'];
  [4, 18, 34, 58, 76, 92].forEach((x, i) => {
    const w = el('div', 'weed', floor, weedSVG(weedCols[i % 3]));
    w.style.left = `${x}%`;
    w.style.setProperty('--h', `${[1, 0.7, 0.85, 0.65, 0.95, 0.75][i]}`);
    w.style.animationDelay = `${-i * 0.7}s`;
  });
  [10, 26, 47, 66, 84].forEach((x, i) => {
    const p = el('i', 'pebble', floor);
    p.style.left = `${x}%`;
    p.style.setProperty('--s', `${[1, 0.7, 1.2, 0.8, 1][i]}`);
  });

  const fishLayer = el('div', 'fish-layer', root);
  el('div', 'reeds left', root, reedsSVG());
  el('div', 'reeds right', root, reedsSVG());
  el('div', 'lily l1', root, lilyPadSVG(true));
  el('div', 'lily l2', root, lilyPadSVG());

  const turtle = el('div', 'friend turtle-f', root, turtleSVG());
  turtle.dataset.friend = 'turtle';
  const frog = el('div', 'friend frog-f', root, frogSVG());
  frog.dataset.friend = 'frog';
  const duck = el('div', 'friend duck-f', root, `<div class="duck-flip">${duckSVG()}</div>`);
  duck.dataset.friend = 'duck';
  const fireflies = el('div', 'fireflies', root);
  for (let i = 0; i < 6; i++) {
    const f = el('div', 'friend firefly', fireflies, '<i></i>');
    f.dataset.friend = 'firefly';
    f.style.left = `${[8, 20, 70, 84, 92, 40][i]}%`;
    f.style.setProperty('--y', `${[-12, -6, -14, -8, -18, -10][i]}vh`);
    f.style.animationDelay = `${-i * 1.3}s`;
  }
  const rain = el('div', 'rain', root);
  for (let i = 0; i < 46; i++) {
    const d = el('i', '', rain);
    d.style.left = `${rand(0, 100)}%`;
    d.style.animationDelay = `${rand(0, 1.2)}s`;
    d.style.animationDuration = `${rand(0.7, 1.1)}s`;
  }

  const fx = el('div', 'pond-fx', root);
  const lineSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  lineSvg.classList.add('fishing-line');
  const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  lineSvg.append(linePath);
  root.append(lineSvg);
  const bobber = el('div', 'bobber hidden', root, bobberSVG());
  const hookEl = el('div', 'hook hidden', root, `${hookSVG()}<div class="hook-catch"></div>`);
  const hookCatch = hookEl.querySelector('.hook-catch') as HTMLElement;
  const boat = el('div', 'friend boat', root, `<div class="boat-flip">${boatSVG()}</div>`);
  boat.dataset.friend = 'pip';
  const boatFlip = boat.firstElementChild as HTMLElement;
  const bang = el('div', 'bang', root, '!');

  const tankBtn = el('button', 'big-btn blue tank-btn', root, ICONS.tank);
  tankBtn.setAttribute('aria-label', 'Fish tank');
  const badge = el('span', 'count-badge', tankBtn);
  el('span', 'new-star', tankBtn, '★');
  const paintBadge = () => {
    const n = speciesCount();
    badge.textContent = String(n);
    badge.classList.toggle('hidden', !n);
    // Something new to see in the fish tank: it bounces and sparkles.
    tankBtn.classList.toggle('has-new', unseenUnlocks().length > 0);
  };
  paintBadge();

  // --- Geometry ------------------------------------------------------------------
  let W = 0;
  let H = 0;
  let surface = 0;
  let bw = 0;
  let bh = 0;
  let unit = 0;
  const layout = () => {
    W = root.clientWidth || innerWidth;
    H = root.clientHeight || innerHeight;
    surface = Math.round(H * (W < H ? 0.36 : 0.34));
    root.style.setProperty('--surface', `${surface}px`);
    bw = Math.max(130, Math.min(300, Math.min(W, H) * 0.34));
    bh = (bw * BOAT_H) / BOAT_W;
    boat.style.width = `${bw}px`;
    boat.style.height = `${bh}px`;
    unit = Math.max(70, Math.min(170, Math.min(W, H) * (W < H ? 0.25 : 0.19)));
    lineSvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    boatX = Math.max(0, Math.min(W - bw, boatX));
  };
  let boatX = 0;
  let boatFace: 1 | -1 = 1;
  layout();
  boatX = W * 0.5 - bw * 0.62;
  sc.on(window, 'resize', () => {
    layout();
    swimmers.forEach((s) => {
      s.setFish(s.fish, unit);
      s.baseY = clampDepth(s.baseY);
    });
  });

  const tipFrac = ROD_TIP.x / BOAT_W;
  const boatTop = (t: number) => surface - (bh * WATERLINE) / BOAT_H + Math.sin(t * 1.8) * bh * 0.02;
  const tip = (t: number) => ({
    x: boatX + bw * (boatFace === 1 ? tipFrac : 1 - tipFrac),
    y: boatTop(t) + (bh * ROD_TIP.y) / BOAT_H,
  });
  const minDepth = () => surface + unit * 0.7;
  const maxDepth = () => H - unit * 0.55;
  const clampDepth = (y: number) => Math.max(minDepth(), Math.min(maxDepth(), y));

  // --- Swimming fish ----------------------------------------------------------------
  const swimmers: Swimmer[] = [];
  const respawn = (s: Swimmer, onScreen = false) => {
    s.setFish(pickFish(weather), unit);
    s.dir = Math.random() < 0.5 ? 1 : -1;
    s.x = onScreen ? rand(W * 0.1, W * 0.9) : s.dir === 1 ? -s.w : W + s.w;
    s.baseY = s.y = rand(minDepth(), maxDepth());
    s.speed = rand(0.05, 0.09) * Math.min(W, 900);
    s.target = null;
    s.tilt = 0;
    s.held = false;
    s.el.style.opacity = '';
  };
  const fishCount = W > H ? 5 : 4;
  for (let i = 0; i < fishCount; i++) {
    const s = new Swimmer(fishLayer, FISH[0], unit);
    respawn(s, true);
    swimmers.push(s);
  }
  const visible = (s: Swimmer) => s.x > s.w * 0.3 && s.x < W - s.w * 0.3;

  // --- Line state -----------------------------------------------------------------
  const line = { on: false, bobX: 0, bobY: 0, hookY: 0, dunk: 0, flying: false };
  let biter: Swimmer | null = null;
  let state: State = 'idle';

  // --- The animation loop --------------------------------------------------------------
  let last = performance.now();
  let raf = 0;
  let rainT = 0;
  let duckX = W * 0.3;
  let duckDir: 1 | -1 = 1;
  let duckPause = 0;
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now / 1000;

    const top = boatTop(t);
    boat.style.transform = `translate(${boatX}px, ${top}px)`;
    boatFlip.classList.toggle('face-left', boatFace === -1);

    for (const s of swimmers) {
      if (s === biter) continue;
      s.step(dt);
      if (!s.target && (s.x < -s.w * 1.2 || s.x > W + s.w * 1.2)) respawn(s);
      s.render();
    }
    if (biter) {
      biter.step(dt, 0);
      biter.render();
    }

    // Duck paddles along the surface, pausing now and then.
    if (duckPause > 0) duckPause -= dt;
    else {
      duckX += duckDir * Math.min(W, 900) * 0.03 * dt;
      if (duckX > W * 0.8) duckDir = -1;
      if (duckX < W * 0.2) duckDir = 1;
      if (Math.random() < dt * 0.1) duckPause = rand(1.5, 4);
    }
    const dw = duck.clientWidth || 80;
    duck.style.transform = `translate(${duckX - dw / 2}px, ${surface - dw * 0.62 + Math.sin(t * 2) * 2}px)`;
    (duck.firstElementChild as HTMLElement).style.transform = `scaleX(${duckDir})`;

    if (line.on) {
      const p = tip(t);
      const bobY = line.flying ? line.bobY : surface + line.dunk + Math.sin(t * 2.4) * 1.5;
      const hookX = line.bobX + Math.sin(t * 1.3) * 3;
      const sag = Math.max(10, Math.abs(line.bobX - p.x) * 0.25);
      linePath.setAttribute(
        'd',
        `M${p.x},${p.y} Q${(p.x + line.bobX) / 2},${(p.y + bobY) / 2 + sag} ${line.bobX},${bobY} L${hookX},${Math.max(bobY, line.hookY)}`,
      );
      bobber.style.transform = `translate(${line.bobX}px, ${bobY}px)`;
      hookEl.style.transform = `translate(${hookX}px, ${Math.max(bobY, line.hookY)}px)`;
    }
    // The "!" pops up over Pip's head, on the side away from the rod.
    bang.style.transform = `translate(${boatX + bw * (boatFace === 1 ? 0.22 : 0.78)}px, ${top + bh * 0.12}px)`;

    if (weather === 'rain' && (rainT -= dt) < 0) {
      rainT = rand(0.15, 0.4);
      ripple(rand(0, W), 0.5);
    }
  };
  raf = requestAnimationFrame(frame);
  sc.addCleanup(() => cancelAnimationFrame(raf));

  // --- Little effects ---------------------------------------------------------------
  function ripple(x: number, scale = 1, y = surface) {
    const r = el('div', 'ripple', fx);
    r.style.left = `${x}px`;
    r.style.top = `${y}px`;
    r.style.setProperty('--s', `${scale}`);
    setTimeout(() => r.remove(), 1200);
  }
  function bubbles(x: number, y: number, n = 4) {
    for (let i = 0; i < n; i++) {
      const b = el('div', 'bubble', fx);
      b.style.left = `${x + rand(-14, 14)}px`;
      b.style.top = `${y}px`;
      b.style.setProperty('--rise', `${Math.max(20, y - surface)}px`);
      b.style.setProperty('--size', `${rand(8, 18)}px`);
      b.style.animationDelay = `${i * 0.12}s`;
      setTimeout(() => b.remove(), 2200);
    }
  }
  const drops = (x: number, y: number, n = 10) => burst(x, y, { kind: 'drop', count: n, colors: ['#bfe6ff', '#8fd0ff', '#ffffff'], spread: 0.6, size: 0.8 });

  /** A simple tween that stops if the scene goes away. */
  const tween = (ms: number, fn: (k: number) => void, ease = (k: number) => k) =>
    sc.when<void>((resolve) => {
      const start = performance.now();
      let id = 0;
      const tick = (now: number) => {
        const k = Math.min(1, (now - start) / ms);
        fn(ease(k));
        if (k < 1) id = requestAnimationFrame(tick);
        else resolve();
      };
      id = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(id);
    });
  const easeInOut = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);

  // --- Weather ---------------------------------------------------------------------
  function changeWeather(w: Weather, speak = true) {
    root.classList.remove(`w-${weather}`);
    weather = w;
    root.classList.add(`w-${w}`);
    setWeather(w);
    sound.ambience(w);
    // Night-only fish hurry away when the sun comes back.
    if (w !== 'night') for (const s of swimmers) if (s.fish.night && s !== biter) s.speed *= 4;
    if (speak) {
      sound.magic();
      const r = skyObj.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, { kind: 'sparkle', count: 14, spread: 0.9 });
      if (state === 'idle' || state === 'waiting') void say(`w-${w}`);
    }
  }
  const nextWeather = () => WEATHERS[(WEATHERS.indexOf(weather) + 1) % WEATHERS.length];
  sound.ambience(weather);
  sc.addCleanup(() => sound.ambience('none'));

  // --- Taps ---------------------------------------------------------------------------
  let onTap: ((x: number, y: number) => boolean) | null = null;
  const said = new Set<string>();
  const sometimes = (id: string, p = 0.35) => {
    if (!said.has(id) || Math.random() < p) {
      said.add(id);
      void say(id);
    }
  };
  let skyCool = 0;

  function friendTap(f: HTMLElement) {
    const kind = f.dataset.friend;
    const r = f.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    if (kind === 'sky') {
      if (performance.now() < skyCool) return;
      skyCool = performance.now() + 1800;
      replay(skyObj, 'boing');
      changeWeather(nextWeather());
    } else if (kind === 'frog') {
      sound.ribbit();
      replay(frog, 'jump');
      setTimeout(() => sc.alive && ripple(cx, 0.8), 700);
      sometimes('frog');
    } else if (kind === 'turtle') {
      sound.peek();
      replay(turtle, 'peek');
      sometimes('turtle');
    } else if (kind === 'duck') {
      sound.quack();
      replay(duck, 'dive');
      duckPause = 1.2;
      burst(cx, cy - r.height * 0.3, { kind: 'heart', count: 4, colors: ['#ff8595', '#ffa3d2'], spread: 0.5 });
      sometimes('duck');
    } else if (kind === 'pip') {
      sound.honk();
      replay(boat, 'wave');
      if (state === 'idle' || state === 'waiting') sometimes('pip', 0.25);
    } else if (kind === 'firefly') {
      sound.twinkle();
      replay(f, 'glow');
      burst(cx, cy, { kind: 'sparkle', count: 6, colors: ['#fff27a', '#ffe9a8'], spread: 0.4, size: 0.7 });
    }
  }

  sc.on(root, 'pointerdown', (e) => {
    const target = e.target as Element;
    if (target.closest('button:not(.friend)')) return;
    e.preventDefault();
    const r = root.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    let friend = target.closest('.friend') as HTMLElement | null;
    // Below the waterline, the bottom of Pip's boat counts as water.
    if (friend === boat && y > surface + 6) friend = null;
    // While a fish is on the hook, every tap reels it in.
    if (friend && state !== 'bite') return friendTap(friend);
    if (onTap?.(x, y)) return;
    if (y > surface + 10) {
      sound.ripple();
      bubbles(x, y, 3);
    }
  });

  // --- One round of fishing -----------------------------------------------------------
  const waitForCast = () =>
    sc.when<{ x: number; y: number }>((resolve) => {
      onTap = (x, y) => {
        if (y < surface + 10) return false;
        resolve({ x, y });
        return true;
      };
      const stop = hint.schedule(() => {
        const vis = swimmers.filter(visible);
        return (vis.length ? pick(vis) : swimmers[0]).el;
      }, HINT_MS);
      const nag = window.setInterval(() => void say('tapWater'), 14000);
      return () => {
        onTap = null;
        stop();
        clearInterval(nag);
      };
    });

  async function cast(tx: number, ty: number) {
    state = 'casting';
    // Face whichever way can reach the spot, then row over.
    const reachR = (x: number) => x >= bw * tipFrac && x <= W - bw * (1 - tipFrac);
    const reachL = (x: number) => x >= bw * (1 - tipFrac) && x <= W - bw * tipFrac;
    const face: 1 | -1 = boatFace === 1 ? (reachR(tx) || !reachL(tx) ? 1 : -1) : reachL(tx) || !reachR(tx) ? -1 : 1;
    const want = face === 1 ? tx - bw * tipFrac : tx - bw * (1 - tipFrac);
    const toX = Math.max(-bw * 0.08, Math.min(W - bw * 0.92, want));
    const fromX = boatX;
    boatFace = face;
    const dist = Math.abs(toX - fromX);
    if (dist > 4) {
      boat.classList.add('rowing');
      await tween(Math.min(1100, 300 + dist * 1.4), (k) => (boatX = fromX + (toX - fromX) * k), easeInOut);
      boat.classList.remove('rowing');
    }
    // Swish! The float flies out and lands.
    const p = tip(performance.now() / 1000);
    sound.cast();
    replay(boat, 'casting');
    line.on = true;
    line.flying = true;
    line.bobX = p.x;
    line.bobY = p.y;
    line.hookY = 0;
    line.dunk = 0;
    bobber.classList.remove('hidden');
    hookEl.classList.remove('hidden');
    hookCatch.innerHTML = '';
    lineSvg.classList.add('on');
    await tween(
      420,
      (k) => {
        line.bobY = p.y + (surface - p.y) * k - Math.sin(k * Math.PI) * bh * 0.5;
      },
      (k) => k,
    );
    line.flying = false;
    sound.plop();
    ripple(line.bobX, 1);
    drops(line.bobX, surface, 6);
    // The hook sinks down to where the child tapped.
    const depth = clampDepth(ty);
    await tween(700, (k) => (line.hookY = surface + (depth - surface) * k), easeOut);
    bubbles(line.bobX, depth, 2);
  }

  /** Something swims up and has a nibble. */
  async function approach(tapX: number, tapY: number): Promise<Catch> {
    state = 'waiting';
    const hook = { x: line.bobX, y: line.hookY };
    // Tapping right on a fish means that fish is the one that bites.
    const tapped = swimmers.filter((s) => visible(s) && Math.hypot(s.x - tapX, s.y - tapY) < s.w * 0.75);
    const sillyChance = save.total >= 2 && !tapped.length ? 0.18 : 0;
    if (Math.random() < sillyChance) {
      await sc.wait(rand(900, 1500));
      await nibbles(null);
      return { kind: 'silly', silly: pickSilly() };
    }
    if (Math.random() < 0.4) void say('wait');
    await sc.wait(tapped.length ? 250 : rand(500, 1000));
    // The nearest fish comes over; bring one in from the side if none is close.
    const byDist = (tapped.length ? tapped : swimmers.filter(visible)).sort((a, b) => Math.hypot(a.x - hook.x, a.y - hook.y) - Math.hypot(b.x - hook.x, b.y - hook.y));
    let s = byDist[0];
    if (!s) {
      s = swimmers[0];
      respawn(s);
      s.x = hook.x < W / 2 ? -s.w : W + s.w;
      s.baseY = s.y = hook.y;
    }
    biter = s;
    const side = s.x < hook.x ? -1 : 1;
    s.target = { x: hook.x + side * s.w * 0.44, y: hook.y };
    s.speed = Math.max(s.speed, Math.hypot(s.target.x - s.x, s.target.y - s.y) / 2.2);
    await sc.when<void>((resolve) => {
      const id = window.setInterval(() => {
        if (s.target && Math.hypot(s.target.x - s.x, s.target.y - s.y) < 2) resolve();
      }, 50);
      return () => clearInterval(id);
    });
    s.dir = side === -1 ? 1 : -1;
    s.target = null;
    s.held = true;
    await nibbles(s);
    return { kind: 'fish', fish: s.fish, swimmer: s };
  }

  async function nibbles(s: Swimmer | null) {
    if (Math.random() < 0.5) void say('nibble');
    for (let i = 0; i < 2; i++) {
      sound.blip(i);
      line.dunk = 6;
      ripple(line.bobX, 0.45);
      if (s) s.x -= s.dir * 6;
      await sc.wait(160);
      line.dunk = 0;
      if (s) s.x += s.dir * 6;
      await sc.wait(i ? 350 : 420);
    }
  }

  async function bite() {
    state = 'bite';
    line.dunk = 18;
    sound.bite();
    ripple(line.bobX, 1.3);
    drops(line.bobX, surface, 12);
    boat.classList.add('excited');
    bang.classList.add('show');
    void say('bite');
    await sc.when<void>((resolve) => {
      onTap = () => {
        resolve();
        return true;
      };
      const stop = hint.schedule(() => bobber, 2500);
      const t1 = window.setTimeout(() => void say('tapTap'), 5000);
      // Very little ones get a helping hand: it reels itself in eventually.
      const t2 = window.setTimeout(() => resolve(), 10000);
      const wig = window.setInterval(() => {
        line.dunk = line.dunk === 18 ? 13 : 18;
        if (Math.random() < 0.4) ripple(line.bobX, 0.6);
      }, 260);
      return () => {
        onTap = null;
        stop();
        clearTimeout(t1);
        clearTimeout(t2);
        clearInterval(wig);
      };
    });
    bang.classList.remove('show');
  }

  async function reel(c: Catch) {
    state = 'reeling';
    sound.reel(0.9);
    boat.classList.add('reeling');
    const fromY = line.hookY;
    const s = c.kind === 'fish' ? c.swimmer : null;
    if (s) {
      s.held = true;
      s.target = null;
    }
    if (c.kind === 'silly') hookCatch.innerHTML = sillySVG(c.silly.id);
    await tween(
      900,
      (k) => {
        line.hookY = fromY + (surface - fromY) * k;
        line.dunk = 18 * (1 - k);
        if (s) {
          s.tilt = -s.dir * 65 * Math.min(1, k * 2);
          s.x = line.bobX;
          s.y = line.hookY + s.w * 0.4;
        }
      },
      easeInOut,
    );
    sound.splash();
    drops(line.bobX, surface, 16);
    ripple(line.bobX, 1.6);
    boat.classList.remove('reeling', 'excited');
  }

  async function reveal(c: Catch) {
    state = 'reveal';
    const newBefore = unseenUnlocks().length;
    const isNew = c.kind === 'fish' ? addCatch('fish', c.fish.id) : addCatch('silly', c.silly.id);
    const allNow = c.kind === 'fish' && isNew && speciesCount() === FISH.length;
    const art = c.kind === 'fish' ? catchArt('fish', c.fish, '') : catchArt('silly', undefined, c.silly.id);
    const from = { x: line.bobX, y: surface };
    // Put the line away.
    line.on = false;
    bobber.classList.add('hidden');
    hookEl.classList.add('hidden');
    lineSvg.classList.remove('on');
    if (c.kind === 'fish') {
      c.swimmer.el.style.opacity = '0';
    }

    const ov = el('div', 'reveal', root);
    const card = el('div', `reveal-card${c.kind === 'silly' ? ' silly' : ''}${c.kind === 'fish' && c.fish.kind === 'puffer' ? ' puffer' : ''}`, ov);
    el('div', 'reveal-rays', card);
    const artBox = el('div', 'reveal-art', card, art);
    el('div', 'reveal-name', card, c.kind === 'fish' ? c.fish.name : c.silly.name);
    if (isNew && c.kind === 'fish') el('div', 'reveal-new', card, '<span>★</span>');
    const rr = root.getBoundingClientRect();
    card.style.setProperty('--fx', `${from.x - rr.width / 2}px`);
    card.style.setProperty('--fy', `${from.y - rr.height / 2}px`);
    requestAnimationFrame(() => ov.classList.add('open'));
    replay(boat, 'cheer');

    const ab = artBox.getBoundingClientRect();
    if (c.kind === 'fish') {
      if (isNew) sound.fanfare();
      else sound.chime();
      setTimeout(() => {
        if (!sc.alive) return;
        const b = artBox.getBoundingClientRect();
        burst(b.left + b.width / 2, b.top + b.height / 2, { count: isNew ? 34 : 18, spread: isNew ? 1.3 : 0.9 });
        if (isNew) burst(b.left + b.width / 2, b.top + b.height / 2, { kind: 'sparkle', count: 12, spread: 1.2 });
      }, 350);
    } else {
      sound.boing();
      setTimeout(() => sc.alive && sound.giggle(), 450);
      burst(ab.left + ab.width / 2, ab.top + ab.height / 2, { kind: 'sparkle', count: 10, spread: 0.8 });
    }

    const lineId = c.kind === 'fish' ? `f-${c.fish.id}` : `s-${c.silly.id}`;
    const ids = [lineId];
    if (allNow) ids.push('allFish');
    else if (isNew && c.kind === 'fish') ids.push('newFish');
    else if (c.kind === 'fish' && Math.random() < 0.5) ids.push(pick(CHEERS));
    const talk = sayAll(ids);
    await sc.wait(1300);
    await sc.when<void>((resolve) => {
      let spoken = false;
      let tapped = false;
      let linger = 0;
      const go = () => spoken && tapped && resolve();
      void talk.then(() => {
        spoken = true;
        linger = window.setTimeout(() => {
          tapped = true;
          go();
        }, 900);
        go();
      });
      onTap = () => {
        tapped = spoken = true;
        go();
        return true;
      };
      const cap = window.setTimeout(resolve, 6500);
      return () => {
        onTap = null;
        clearTimeout(cap);
        clearTimeout(linger);
      };
    });

    if (allNow) {
      sound.fanfare();
      for (let i = 0; i < 3; i++) setTimeout(() => sc.alive && burst(rand(W * 0.2, W * 0.8), rand(H * 0.2, H * 0.5), { count: 30, spread: 1.4 }), i * 400);
    }

    // Into the fish tank it goes.
    const tb = tankBtn.getBoundingClientRect();
    const a = artBox.getBoundingClientRect();
    ov.classList.add('closing');
    sound.whoosh();
    await flyClone(art, a, { x: tb.left + tb.width / 2, y: tb.top + tb.height / 2 }, 700, 0.25);
    ov.remove();
    if (!sc.alive) throw new Aborted();
    sound.bubble(1.4);
    paintBadge();
    replay(tankBtn, 'gulp');
    burst(tb.left + tb.width / 2, tb.top + tb.height / 2, { kind: 'sparkle', count: 8, spread: 0.5 });
    if (c.kind === 'fish') respawn(c.swimmer);
    biter = null;
    // That catch made the fish tank fancier: say so (fishing carries on).
    if (unseenUnlocks().length > newBefore) {
      await sc.wait(500);
      sound.magic();
      burst(tb.left + tb.width / 2, tb.top + tb.height / 2, { kind: 'sparkle', count: 18, spread: 1 });
      void say('aquariumNew');
    }
  }

  async function flow() {
    // Let "Let's go fishing!" finish before the first prompt.
    const greet = window.setTimeout(() => state === 'idle' && catches === 0 && void say('tapWater'), 2800);
    sc.addCleanup(() => clearTimeout(greet));
    let catches = 0;
    for (;;) {
      state = 'idle';
      const p = await waitForCast();
      await cast(p.x, p.y);
      const c = await approach(p.x, p.y);
      await bite();
      await reel(c);
      await reveal(c);
      state = 'idle';
      if (++catches % CATCHES_PER_WEATHER === 0) changeWeather(nextWeather());
    }
  }

  const running = flow().catch((err) => {
    if (!(err instanceof Aborted)) console.error(err);
  });
  void running;

  await sc.tap(tankBtn, 0);
  sound.pop();
  sc.destroy();
  return 'aquarium';
}
