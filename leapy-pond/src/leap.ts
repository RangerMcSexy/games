// A trip across the big pond, seen from above. Hoppy sits on a lily pad;
// tap a glowing pad ahead and Hoppy leaps onto it. Along the way there are
// flies to catch, flowers to find by colour and stepping stones to count,
// and at the far side a pond friend waits to be met.
//
// Nothing can go wrong: a wrong flower just wobbles, and the water only
// splashes. Each trip is eight moves.
import { fishShadowSVG, flowerSVG, flySVG, friendSVG, friendSilhouetteSVG, frogSVG, padSVG, reedClumpSVG, stoneSVG, ICONS } from './art';
import { sound } from './audio';
import { COLOURS, FRIENDS, addFly, finishTrip, nextFriend, save, unseenFriends, type Colour, type Friend } from './data';
import type { Host } from './screens';
import { HINT_MS, Scene, burst, burstAt, center, el, pick, rand, replay, shuffle } from '../../shared/ui';
import { say, sayAll } from './voice';
import { stickerMoment } from '../../shared/sticker-moment';
import { STICKER_ART } from './stickers';

type Move = 'free' | 'colour' | 'count' | 'goal';

/** Something in the pond: `x` runs 0..1 across, `y` counts hops up the pond. */
interface Thing {
  el: HTMLElement;
  x: number;
  y: number;
  /** Size, in lily pads. */
  s: number;
}

interface Pad extends Thing {
  fly?: HTMLElement;
  flower?: { el: HTMLElement; colour: Colour };
}

const cap = (id: string) => id[0].toUpperCase() + id.slice(1);

/** The moves of one trip: an easy first hop, a mix, then the friend. */
function planTrip(): Move[] {
  return ['free', ...shuffle<Move>(['colour', 'colour', 'count', 'free', 'free', 'free']), 'goal'];
}

export async function leapScreen(host: Host): Promise<'pond' | 'again'> {
  const sc = new Scene(host.stage, 'leap-scene');
  host.setScene(sc);

  const water = el('div', 'water-pattern', sc.root);
  const world = el('div', 'world', sc.root);
  const decorLayer = el('div', 'layer', world);
  const rippleLayer = el('div', 'layer', world);
  const padLayer = el('div', 'layer', world);
  const topLayer = el('div', 'layer', world);
  const trail = el('div', 'trail', sc.root);

  // --- Measuring and placing ----------------------------------------------------
  let W = 0;
  let H = 0;
  let P = 0; // a lily pad, in pixels
  let HOP = 0; // one hop up the pond, in pixels
  let ANCHOR = 0; // where Hoppy sits on the screen
  let cam = 0; // how far up the pond we've come, in hops
  const measure = () => {
    W = sc.root.clientWidth || innerWidth;
    H = sc.root.clientHeight || innerHeight;
    P = Math.max(90, Math.min(165, Math.min(W, H) * 0.23));
    HOP = Math.max(P * 1.3, Math.min(P * 2.1, H * 0.3));
    ANCHOR = H * 0.73;
  };
  measure();
  const sx = (x: number) => P * 0.62 + x * (W - P * 1.24);
  const sy = (y: number) => ANCHOR - y * HOP;
  const things: Thing[] = [];
  const place = (t: Thing) => {
    t.el.style.left = `${sx(t.x)}px`;
    t.el.style.top = `${sy(t.y)}px`;
    t.el.style.width = `${t.s * P}px`;
  };
  const add = <T extends Thing>(t: T): T => {
    things.push(t);
    place(t);
    return t;
  };
  const render = () => {
    world.style.transform = `translate3d(0, ${(cam * HOP).toFixed(1)}px, 0)`;
    water.style.backgroundPosition = `0 ${(cam * HOP).toFixed(1)}px`;
  };
  sc.on(window, 'resize', () => {
    measure();
    things.forEach(place);
    render();
  });
  /** Drop what has scrolled well off the bottom. */
  const tidy = () => {
    for (let i = things.length - 1; i >= 0; i--) {
      if (things[i].y < cam - 2.2 && things[i] !== frog) {
        things[i].el.remove();
        things.splice(i, 1);
      }
    }
  };

  // --- The pond ------------------------------------------------------------------
  let shade = 0;
  /** Scenery must not hide the pads Hoppy hops to: clear it away from `p`. */
  const clearAround = (p: Thing) => {
    for (let i = things.length - 1; i >= 0; i--) {
      const t = things[i];
      if (!t.el.matches('.decor-pad, .reeds')) continue;
      const gap = Math.hypot(sx(t.x) - sx(p.x), (t.y - p.y) * HOP);
      if (gap < ((t.s + p.s) * P) / 2) {
        t.el.remove();
        things.splice(i, 1);
      }
    }
  };
  const makePad = (x: number, y: number, s = 1, cls = 'pad'): Pad => {
    const p = add({ el: el('div', cls, padLayer, padSVG(shade++, rand(0, 360), s > 1.2)), x, y, s });
    clearAround(p);
    return p;
  };
  const makeStone = (x: number, y: number, i: number): Pad => {
    const p = add({ el: el('div', 'pad stone', padLayer, stoneSVG(i)), x, y, s: 0.62 });
    clearAround(p);
    return p;
  };
  const giveFly = (p: Pad) => (p.fly = el('div', 'fly', p.el, flySVG()));
  const giveFlower = (p: Pad, colour: Colour, big = false) => {
    p.flower = { el: el('div', `flower${big ? ' big' : ''}`, p.el, flowerSVG(colour)), colour };
  };

  // Scenery between the hops: little pads, reeds at the edges, fish below.
  let decoratedTo = -2;
  const decorate = (upTo: number) => {
    while (decoratedTo < upTo) {
      decoratedTo += 0.5;
      const y = decoratedTo + rand(-0.15, 0.15);
      const side = Math.random() < 0.5 ? rand(-0.08, 0.06) : rand(0.94, 1.08);
      if (Math.random() < 0.7) {
        const d = add({ el: el('div', 'decor-pad', decorLayer, padSVG(shade++, rand(0, 360))), x: side, y, s: rand(0.45, 0.7) });
        if (Math.random() < 0.3) el('div', 'flower tiny', d.el, flowerSVG(pick(COLOURS)));
      } else add({ el: el('div', 'reeds', decorLayer, reedClumpSVG()), x: side, y, s: rand(0.8, 1.1) });
      if (Math.random() < 0.25) {
        const f = add({ el: el('div', 'fish-shadow', decorLayer, fishShadowSVG()), x: rand(0.1, 0.9), y: decoratedTo + 0.25, s: 0.9 });
        f.el.style.animationDuration = `${rand(9, 16)}s`;
        f.el.style.animationDelay = `${-rand(0, 9)}s`;
        if (Math.random() < 0.5) f.el.classList.add('flip');
      }
    }
  };

  // --- Hoppy --------------------------------------------------------------------
  makePad(0.5, 0, 1.1);
  const frog = add({ el: el('div', 'frog', topLayer), x: 0.5, y: 0, s: 0.72 });
  const shadow = el('div', 'frog-shadow', frog.el);
  const lift = el('div', 'frog-lift', frog.el);
  const turn = el('div', 'frog-turn', lift, frogSVG());
  let angle = 0;
  let leaping = false;
  decorate(3);
  render();

  const face = (x: number, y: number) => {
    const dx = sx(x) - sx(frog.x);
    const dy = (y - frog.y) * HOP;
    if (Math.hypot(dx, dy) < 4) return;
    let a = (Math.atan2(dx, dy) * 180) / Math.PI;
    // Turn the short way round.
    while (a - angle > 180) a -= 360;
    while (a - angle < -180) a += 360;
    angle = a;
    turn.style.transform = `rotate(${angle.toFixed(1)}deg)`;
  };

  const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  /** Leap to (x, y), with the pond scrolling along. */
  async function hopTo(x: number, y: number, { dur = 640, height = 1 } = {}) {
    face(x, y);
    await sc.wait(130);
    const from = { x: frog.x, y: frog.y };
    const cam0 = cam;
    leaping = true;
    frog.el.classList.add('leaping');
    sound.hop();
    decorate(y + 3);
    await sc.when<void>((done) => {
      const t0 = performance.now();
      let raf = 0;
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / dur);
        const e = ease(t);
        frog.x = from.x + (x - from.x) * e;
        frog.y = from.y + (y - from.y) * e;
        place(frog);
        const up = Math.sin(Math.PI * t) * height;
        lift.style.transform = `translateY(${(-up * P * 0.18).toFixed(1)}px) scale(${(1 + 0.42 * up).toFixed(3)})`;
        shadow.style.transform = `translate(-50%, -50%) scale(${(1 - 0.3 * up).toFixed(3)})`;
        shadow.style.opacity = String(0.35 - 0.15 * up);
        cam = cam0 + (y - cam0) * e;
        render();
        if (t < 1) raf = requestAnimationFrame(step);
        else done();
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    });
    leaping = false;
    frog.el.classList.remove('leaping');
    sound.land();
    tidy();
  }

  function rippleAt(x: number, y: number, big = false) {
    const r = el('div', `ripple${big ? ' big' : ''}`, rippleLayer);
    r.style.left = `${x}px`;
    r.style.top = `${y}px`;
    setTimeout(() => r.remove(), 1300);
  }

  /** Landing on a pad: it dips, the water rings, and whatever's there happens. */
  async function landOn(p: Pad) {
    replay(p.el, 'bob');
    rippleAt(sx(p.x), sy(p.y), p.s > 1.2);
    if (p.fly) await eatFly(p);
  }

  async function eatFly(p: Pad) {
    const fly = p.fly!;
    p.fly = undefined;
    const f = center(fly);
    const m = center(turn);
    face(frog.x + ((f.x - m.x) / (W - P * 1.24)), frog.y - (f.y - m.y) / HOP);
    await sc.wait(160);
    const dist = Math.hypot(f.x - m.x, f.y - m.y);
    const tongue = el('div', 'tongue', sc.root);
    tongue.style.left = `${m.x}px`;
    tongue.style.top = `${m.y}px`;
    tongue.style.width = `${dist}px`;
    tongue.style.rotate = `${Math.atan2(f.y - m.y, f.x - m.x)}rad`;
    sound.slurp();
    tongue.animate([{ scale: '0 1' }, { scale: '1 1', offset: 0.45 }, { scale: '0 1' }], { duration: 420, easing: 'ease-in-out' });
    fly.animate(
      [{ translate: '0 0', scale: '1' }, { translate: '0 0', scale: '1', offset: 0.45 }, { translate: `${m.x - f.x}px ${m.y - f.y}px`, scale: '0.2' }],
      { duration: 420, easing: 'ease-in', fill: 'forwards' },
    );
    await sc.wait(430);
    tongue.remove();
    fly.remove();
    addFly();
    replay(frog.el, 'gulp');
    burst(m.x, m.y, { kind: 'sparkle', count: 8, spread: 0.5, colors: ['#fff6a8', '#ffffff'] });
    await sc.until(say('fly'), 3000);
  }

  // Tapping Hoppy or the water.
  sc.on(frog.el, 'pointerdown', (e) => {
    e.preventDefault();
    if (leaping) return;
    sound.ribbit();
    replay(frog.el, 'tickle');
    void say('ribbit');
  });
  let lastSplashWord = 0;
  let waterTaps = 0;
  sc.on(sc.root, 'pointerdown', (e) => {
    const t = e.target as Element;
    if (t.closest('.pad, .frog, button, .reveal')) return;
    const r = world.getBoundingClientRect();
    rippleAt(e.clientX - r.left, e.clientY - r.top);
    sound.ripple();
    // Now and then a fish leaps out to say hello.
    if (++waterTaps % 4 === 0) {
      const fish = el('div', 'jump-fish', sc.root, friendSVG('fish'));
      fish.style.left = `${e.clientX}px`;
      fish.style.top = `${e.clientY}px`;
      if (e.clientX > W / 2) fish.classList.add('flip');
      setTimeout(() => sc.alive && sound.splash(), 700);
      setTimeout(() => fish.remove(), 1500);
      if (performance.now() - lastSplashWord > 6000) {
        lastSplashWord = performance.now();
        void say('fishy');
      }
    } else if (performance.now() - lastSplashWord > 9000) {
      lastSplashWord = performance.now();
      void say('splash');
    }
  });

  // --- The trip -------------------------------------------------------------------
  const moves = planTrip();
  const dots = moves.map((m) => el('span', m === 'goal' ? 'dot goal' : 'dot', trail, m === 'goal' ? '★' : ''));
  const { friend, isNew } = nextFriend();

  /** Pads spread across the pond, `n` of them, one hop up. */
  const rowXs = (n: number) => {
    const base = n === 2 ? (Math.random() < 0.5 ? [0.18, 0.62] : [0.38, 0.82]) : [0.08, 0.5, 0.92];
    return base.map((b) => Math.min(1, Math.max(0, b + rand(-0.06, 0.06))));
  };

  const hopWord = () => {
    if (Math.random() < 0.35) void say(pick(['hop', 'wheee', 'boing']));
  };

  async function freeMove(first: boolean) {
    const n = Math.random() < 0.5 ? 2 : 3;
    const y = frog.y + 1;
    const pads = rowXs(n).map((x) => makePad(x, y + rand(-0.08, 0.08)));
    // Something to find on most rows: a fly or a flower.
    shuffle(pads).forEach((p, i) => {
      const r = Math.random();
      if (i === 0 && r < 0.55) giveFly(p);
      else if (r < 0.35) giveFlower(p, pick(COLOURS));
    });
    pads.forEach((p) => p.el.classList.add('choice'));
    if (first) void say('tapPad');
    const i = await sc.tapAny(pads.map((p) => p.el));
    pads.forEach((p) => p.el.classList.remove('choice'));
    const p = pads[i];
    if (!p.fly && !p.flower) hopWord();
    await hopTo(p.x, p.y);
    await landOn(p);
    if (p.flower) {
      burstAt(p.flower.el, { kind: 'sparkle', count: 8, spread: 0.5, colors: [p.flower.colour.petal, '#fff'] });
      void say(p.flower.colour.id);
    }
  }

  async function colourMove() {
    const n = save.trips < 2 ? 2 : 3;
    const colours = shuffle(COLOURS).slice(0, n);
    const target = pick(colours);
    const y = frog.y + 1;
    const pads = rowXs(n).map((x, i) => {
      const p = makePad(x, y + rand(-0.06, 0.06));
      giveFlower(p, colours[i], true);
      return p;
    });
    const right = pads[colours.indexOf(target)];
    pads.forEach((p) => p.el.classList.add('choice'));
    await sc.until(say(`find${cap(target.id)}`), 4000);
    const misses = await sc.ask(
      pads.map((p) => p.el),
      pads.indexOf(right),
      async (i) => {
        const wrong = pads[i];
        sound.nope();
        replay(wrong.el, 'nope');
        wrong.el.classList.remove('choice');
        await sc.until(sayAll([`that${cap(wrong.flower!.colour.id)}`, `find${cap(target.id)}`], 300), 6000);
      },
    );
    pads.forEach((p) => p.el.classList.remove('choice', 'ruled-out'));
    await hopTo(right.x, right.y);
    await landOn(right);
    sound.sparkle();
    burstAt(right.flower!.el, { kind: 'sparkle', count: 14, colors: [target.petal, '#fff6a8', '#fff'] });
    await sc.until(sayAll([target.id, misses ? 'yay' : pick(['yay', 'wow'])], 200), 4000);
  }

  async function countMove() {
    const n = Math.min(5, 3 + Math.floor(save.trips / 3));
    let x = frog.x;
    const stones = Array.from({ length: n }, (_, i) => {
      x = Math.min(0.95, Math.max(0.05, x + (i % 2 ? -1 : 1) * rand(0.1, 0.18) * (x > 0.5 ? -1 : 1)));
      return makeStone(x, frog.y + 0.55 * (i + 1) + 0.15, i);
    });
    await sc.until(say('count'), 3500);
    for (let i = 0; i < n; i++) {
      const s = stones[i];
      s.el.classList.add('choice');
      await sc.tap(s.el);
      s.el.classList.remove('choice');
      void say(`n${i + 1}`);
      await hopTo(s.x, s.y, { dur: 440, height: 0.6 });
      sound.knock(i);
      replay(s.el, 'bob');
      el('div', 'stone-num', s.el, String(i + 1));
      rippleAt(sx(s.x), sy(s.y));
    }
    await sc.wait(500);
    sound.sparkle();
    burstAt(turn, { kind: 'sparkle', count: 12 });
    await sc.until(say(pick(['yay', 'youDidIt'])), 3000);
  }

  async function goalMove() {
    const y = frog.y + 1.15;
    const goal = makePad(0.5, y, 1.7, 'pad goal');
    const who = el('div', 'goal-friend', goal.el, isNew ? friendSilhouetteSVG(friend.id) : friendSVG(friend.id));
    if (isNew) el('span', 'goal-q', who, '?');
    goal.el.classList.add('choice');
    await sc.until(say(isNew ? 'whoIs' : 'nearly'), 3000);
    await sc.tap(goal.el);
    goal.el.classList.remove('choice');
    // Land on the near side of the big pad, next to the friend.
    await hopTo(goal.x - (P * 0.32) / (W - P * 1.24), y - 0.12, { dur: 780, height: 1.3 });
    await landOn(goal);
    who.innerHTML = friendSVG(friend.id);
    replay(who, 'hello');
    await reveal(friend);
    return goal;
  }

  async function reveal(f: Friend) {
    finishTrip(f);
    const allNow = isNew && save.friends.length === FRIENDS.length;
    const box = el('div', 'reveal', sc.root);
    const card = el('div', 'reveal-card', box);
    el('div', 'reveal-rays', card);
    el('div', `reveal-art f-${f.id}`, card, friendSVG(f.id));
    el('div', 'reveal-name', card, f.name);
    if (isNew) el('div', 'reveal-new', card, '<span>★</span>');
    requestAnimationFrame(() => box.classList.add('open'));
    sound.fanfare();
    const c = center(card);
    burst(c.x, c.y, { count: 30, spread: 1.4 });
    setTimeout(() => sc.alive && burst(c.x, c.y, { kind: 'sparkle', count: 16, spread: 1.2 }), 400);
    await sc.until(sayAll(isNew ? ['newFriend', `m-${f.id}`] : [`m-${f.id}`], 250), 6000);
    if (allNow) {
      sound.fanfare();
      burst(c.x, c.y, { count: 40, spread: 1.8 });
      await sc.until(say('allFriends'), 4000);
    }
    // Stay a moment (or until tapped), then let the pond show again.
    await sc.when<void>((done) => {
      const t = window.setTimeout(done, 1800);
      box.addEventListener('pointerdown', () => done(), { once: true });
      return () => clearTimeout(t);
    });
    box.classList.add('closing');
    await sc.wait(350);
    box.remove();
    // A sticker for the sticker book, now and then.
    await stickerMoment('leapy-pond', { sc, art: STICKER_ART, chime: () => sound.chime(), say: () => say('sticker') });
  }

  // Off we go.
  await sc.wait(700);
  for (let i = 0; i < moves.length; i++) {
    dots[i].classList.add('now');
    const m = moves[i];
    if (m === 'free') await freeMove(i === 0);
    else if (m === 'colour') await colourMove();
    else if (m === 'count') await countMove();
    else await goalMove();
    dots[i].classList.remove('now');
    dots[i].classList.add('done');
  }

  // Hoppy and the new friend have a little dance; then play again or go home.
  replay(frog.el, 'dance');
  const buttons = el('div', 'end-buttons', sc.root);
  const again = el('button', 'big-btn green play-btn', buttons, ICONS.play);
  again.setAttribute('aria-label', 'Hop again');
  const pond = el('button', 'big-btn blue pond-btn', buttons, `${ICONS.pond}<span class="new-star">★</span>`);
  pond.setAttribute('aria-label', 'Your pond');
  if (unseenFriends().length) pond.classList.add('has-new');
  if (isNew) void say('comeHome');
  const i = await sc.tapAny([again, pond], 8000, isNew ? pond : again);
  sound.pop();
  sc.destroy();
  return i === 0 ? 'again' : 'pond';
}
