// The title screen and the fish tank (the collection).
import { ICONS, boatSVG, castleSVG, chestSVG, cloudSVG, coralSVG, fishSVG, frogSVG, hillsSVG, plantSVG, sillySVG, silhouetteSVG, snailSVG, sunSVG } from './art';
import { sound } from './audio';
import { FISH, SILLY, fishById, markUnlocksSeen, playerName, save, speciesCount, unlocked, unseenUnlocks, type Fish, type UnlockId } from './data';
import { Swimmer } from './swim';
import { Scene, burst, burstAt, el, pick, rand, replay } from './ui';
import { say } from './voice';

export interface Host {
  stage: HTMLElement;
  setScene(s: Scene): void;
}

const LOGO_COLORS = ['#ff6b6b', '#ffae5c', '#f5c542', '#6fcf6a', '#4ea8f5', '#a57ff0', '#ff8fc4'];

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

// ---------------------------------------------------------------------------
// Title

export async function titleScreen(host: Host): Promise<'play' | 'aquarium'> {
  const sc = new Scene(host.stage, 'title-scene');
  host.setScene(sc);

  const bg = el('div', 'title-bg', sc.root);
  el('div', 't-sun', bg, sunSVG());
  el('div', 'cloud c0', bg, cloudSVG());
  el('div', 'cloud c1', bg, cloudSVG());
  el('div', 'hills', bg, hillsSVG());
  const water = el('div', 't-water', bg);
  el('div', 'water-shine', water);
  const frog = el('div', 't-frog', bg, frogSVG());
  const boat = el('div', 't-boat', bg, boatSVG());
  const jumper = el('div', 't-jumper', bg);

  const logo = el('h1', 'logo', sc.root);
  const name = playerName();
  if (name) el('span', 'logo-name', logo, `${escapeHtml(name)}'s`);
  const words = el('span', 'logo-words', logo);
  let k = 0;
  for (const w of ['Little', 'Fishing', 'Pond']) {
    const word = el('span', 'logo-word', words);
    for (const ch of w) {
      const s = el('span', 'logo-letter', word, ch);
      s.style.color = LOGO_COLORS[k % LOGO_COLORS.length];
      s.style.animationDelay = `${k * 0.08}s`;
      k++;
    }
  }

  const buttons = el('div', 'title-buttons', sc.root);
  const play = el('button', 'big-btn green play-btn', buttons, ICONS.play);
  play.setAttribute('aria-label', 'Go fishing');
  const tank = el('button', 'big-btn blue', buttons, ICONS.tank);
  tank.setAttribute('aria-label', 'Fish tank');
  if (speciesCount()) el('span', 'count-badge', tank, String(speciesCount()));

  // A fish leaps out of the water every few seconds.
  const leap = () => {
    if (!sc.alive) return;
    const pool = FISH.filter((f) => !f.night);
    jumper.innerHTML = fishSVG(pick(pool));
    jumper.style.left = `${rand(52, 80)}%`;
    replay(jumper, 'leap');
    setTimeout(() => sc.alive && sound.bubble(0.8), 900);
  };
  const leapT = window.setInterval(leap, 4200);
  setTimeout(leap, 1200);
  sc.addCleanup(() => clearInterval(leapT));

  sc.on(boat, 'pointerdown', (e) => {
    e.preventDefault();
    sound.honk();
    replay(boat, 'wave');
  });
  sc.on(frog, 'pointerdown', (e) => {
    e.preventDefault();
    sound.ribbit();
    replay(frog, 'jump');
  });
  sc.on(jumper, 'pointerdown', (e) => {
    e.preventDefault();
    sound.bubble(1.2);
    burstAt(jumper, { kind: 'sparkle', count: 8, spread: 0.6 });
  });

  // Greet once audio is available (after the first tap anywhere).
  let greeted = false;
  sc.on(document, 'pointerdown', () => {
    if (greeted) return;
    greeted = true;
    setTimeout(() => sc.alive && void say('title'), 150);
  });

  const i = await sc.tapAny([play, tank], 8000, play);
  greeted = true;
  sound.pop();
  sc.destroy();
  return i === 0 ? 'play' : 'aquarium';
}

// ---------------------------------------------------------------------------
// Fish tank

export async function aquariumScreen(host: Host): Promise<'play'> {
  const sc = new Scene(host.stage, 'aq-scene');
  host.setScene(sc);

  const have = new Set<UnlockId>(unlocked());
  const fresh = new Set<UnlockId>(unseenUnlocks());
  const cls = (id: UnlockId, extra = '') => `unlock u-${id}${fresh.has(id) ? ' new' : ''}${extra}`;

  el('div', 'aq-wall', sc.root);
  el('div', 'aq-table', sc.root);
  const signText = playerName() ? `${escapeHtml(playerName())}'s Fish` : 'My Fish';
  el('div', `aq-sign${have.has('sign') ? ' golden' : ''}${fresh.has('sign') ? ' unlock new' : ''}`, sc.root, `<span>${signText}</span>`);

  const tank = el('div', 'tank', sc.root);
  const tankWater = el('div', 'tank-water', tank);
  el('div', 'tank-sand', tank);
  if (have.has('plants')) {
    el('div', cls('plants', ' left'), tank, plantSVG('#5fbf6a'));
    el('div', cls('plants', ' right'), tank, plantSVG('#4fae8a'));
  }
  if (have.has('castle')) el('div', cls('castle'), tank, castleSVG());
  if (have.has('coral')) el('div', cls('coral'), tank, coralSVG());
  const chest = have.has('chest') ? el('div', cls('chest'), tank, chestSVG()) : null;
  if (have.has('snail')) el('div', cls('snail'), tank, snailSVG());

  // Silly catches sit on the sand.
  const sillies = SILLY.filter((s) => save.silly[s.id]);
  // Gaps between the chest, coral and castle.
  const spots = [50, 85, 31, 58, 7, 93];
  sillies.forEach((s, i) => {
    const b = el('div', 'tank-silly', tank, sillySVG(s.id));
    b.style.left = `${spots[i]}%`;
    b.style.setProperty('--r', `${[-12, 8, -4, 14, -8, 4][i]}deg`);
    b.dataset.id = s.id;
  });

  const fishLayer = el('div', 'tank-fish', tank);
  const fx = el('div', 'tank-fx', tank);
  el('div', 'tank-glass', tank);

  // The collection: one slot per fish.
  const bottom = el('div', 'aq-bottom', sc.root);
  const strip = el('div', 'collection', bottom);
  const slots = FISH.map((f) => {
    const got = !!save.caught[f.id];
    const s = el('button', `slot${got ? ' got' : ''}`, strip, got ? fishSVG(f) : silhouetteSVG(f));
    s.setAttribute('aria-label', got ? f.name : 'Not found yet');
    return s;
  });
  const play = el('button', `big-btn green play-btn-small${speciesCount() ? '' : ' nudge'}`, bottom, ICONS.play);
  play.setAttribute('aria-label', 'Go fishing');

  // --- Fish swimming in the tank ---------------------------------------------
  let TW = 0;
  let TH = 0;
  let unit = 0;
  const measure = () => {
    TW = tankWater.clientWidth || innerWidth * 0.8;
    TH = tankWater.clientHeight || innerHeight * 0.5;
    unit = Math.max(56, Math.min(150, Math.min(TW, TH) * 0.22));
  };
  measure();
  const top = () => TH * 0.1;
  const floor = () => TH * 0.8;

  const swimmers: Swimmer[] = [];
  const addFish = (f: Fish) => {
    const s = new Swimmer(fishLayer, f, unit);
    s.x = rand(s.w, TW - s.w);
    s.baseY = s.y = rand(top() + s.h, floor() - s.h / 2);
    s.dir = Math.random() < 0.5 ? 1 : -1;
    s.speed = rand(0.05, 0.1) * Math.min(TW, 900);
    swimmers.push(s);
  };
  for (const id of save.order) {
    const f = fishById(id);
    if (!f) continue;
    addFish(f);
    if ((save.caught[id] ?? 0) >= 3) addFish(f);
  }
  sc.on(window, 'resize', () => {
    measure();
    swimmers.forEach((s) => s.setFish(s.fish, unit));
  });

  // Food flakes that drift down; nearby fish come to eat them.
  interface Flake {
    x: number;
    y: number;
    e: HTMLElement;
    eaten: boolean;
  }
  const flakes: Flake[] = [];
  let saidYum = 0;

  let last = performance.now();
  let raf = 0;
  let bubbleT = 2;
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    for (const f of flakes) {
      if (f.eaten) continue;
      if (f.y < floor() + unit * 0.2) f.y += TH * 0.06 * dt;
      f.x += Math.sin(now / 400 + f.y) * 0.3;
      f.e.style.transform = `translate(${f.x}px, ${f.y}px)`;
    }
    for (const s of swimmers) {
      // Head for the nearest uneaten flake, if there is one close enough.
      const food = flakes.filter((f) => !f.eaten).sort((a, b) => Math.hypot(a.x - s.x, a.y - s.y) - Math.hypot(b.x - s.x, b.y - s.y))[0];
      if (food && Math.hypot(food.x - s.x, food.y - s.y) < TW * 0.7) {
        s.target = { x: food.x - s.dir * s.w * 0.42, y: food.y };
        const m = s.mouth();
        if (Math.hypot(m.x - food.x, m.y - food.y) < s.w * 0.3) {
          food.eaten = true;
          food.e.remove();
          sound.munch();
          s.wiggle();
          if (now - saidYum > 6000) {
            saidYum = now;
            void say('yum');
          }
        }
      } else if (s.target) {
        s.target = null;
        s.baseY = s.y;
      }
      s.step(dt, 6);
      // Turn around at the glass.
      if (!s.target) {
        if (s.x > TW - s.w * 0.55) s.dir = -1;
        if (s.x < s.w * 0.55) s.dir = 1;
        if (Math.random() < dt * 0.15) s.baseY = rand(top() + s.h, floor() - s.h / 2);
        if (Math.random() < dt * 0.05) s.dir = s.dir === 1 ? -1 : 1;
      }
      s.y = Math.max(top() + s.h * 0.3, Math.min(floor(), s.y));
      s.render();
    }
    for (let i = flakes.length - 1; i >= 0; i--) if (flakes[i].eaten) flakes.splice(i, 1);

    if (chest && (bubbleT -= dt) < 0) {
      bubbleT = rand(1.5, 3);
      const r = chest.getBoundingClientRect();
      const tr = tankWater.getBoundingClientRect();
      tankBubbles(r.left - tr.left + r.width * 0.5, r.top - tr.top + r.height * 0.2, 3);
    }
  };
  raf = requestAnimationFrame(frame);
  sc.addCleanup(() => cancelAnimationFrame(raf));

  function tankBubbles(x: number, y: number, n = 4) {
    for (let i = 0; i < n; i++) {
      const b = el('div', 'bubble', fx);
      b.style.left = `${x + rand(-10, 10)}px`;
      b.style.top = `${y}px`;
      b.style.setProperty('--rise', `${Math.max(20, y - TH * 0.06)}px`);
      b.style.setProperty('--size', `${rand(7, 15)}px`);
      b.style.animationDelay = `${i * 0.15}s`;
      setTimeout(() => b.remove(), 2400);
    }
  }

  // --- Taps in the tank ----------------------------------------------------------------
  sc.on(tank, 'pointerdown', (e) => {
    e.preventDefault();
    const r = tankWater.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const silly = (e.target as Element).closest('.tank-silly') as HTMLElement | null;
    if (silly) {
      sound.boing();
      replay(silly, 'wiggle');
      void say(`s-${silly.dataset.id}`);
      return;
    }
    const hit = swimmers.find((s) => Math.hypot(s.x - x, s.y - y) < s.w * 0.55);
    if (hit) {
      hit.wiggle();
      sound.bubble(1.2);
      tankBubbles(hit.mouth().x, hit.y, 3);
      void say(`f-${hit.fish.id}`);
      return;
    }
    if (!swimmers.length) {
      sound.bubble();
      tankBubbles(x, y, 3);
      return;
    }
    // Sprinkle food.
    sound.sprinkle();
    for (let i = 0; i < 4 && flakes.length < 16; i++) {
      const f: Flake = { x: x + rand(-18, 18), y: Math.max(top(), y + rand(-10, 10)), e: el('i', 'flake', fx), eaten: false };
      f.e.style.background = pick(['#ffae5c', '#ff8a8a', '#ffe066', '#86d07a']);
      flakes.push(f);
    }
  });

  slots.forEach((s, i) => {
    sc.on(s, 'pointerdown', (e) => {
      e.preventDefault();
      const f = FISH[i];
      if (!save.caught[f.id]) {
        sound.tapSoft();
        replay(s, 'shake');
        return;
      }
      sound.pop();
      replay(s, 'wiggle');
      void say(`f-${f.id}`);
      swimmers.filter((w) => w.fish.id === f.id).forEach((w) => w.wiggle());
    });
  });

  // --- Greeting and new surprises -----------------------------------------------
  await sc.wait(400);
  if (!swimmers.length && !sillies.length) {
    await sc.until(say('aquariumEmpty'), 4000);
  } else if (fresh.size) {
    await sc.wait(600);
    sound.fanfare();
    sc.root.querySelectorAll('.new').forEach((n) => {
      n.classList.add('show-new');
      burstAt(n, { kind: 'sparkle', count: 14 });
    });
    await sc.until(say('aquariumNew'), 3500);
    markUnlocksSeen();
  } else {
    void say('aquarium');
    if (speciesCount() === FISH.length) {
      const r = strip.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top, { kind: 'sparkle', count: 16, spread: 1.2 });
    }
  }

  await sc.tap(play, 0);
  sound.pop();
  sc.destroy();
  return 'play';
}
