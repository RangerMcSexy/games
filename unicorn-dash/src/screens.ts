// The meadow scenery every screen stands in, the title screen, and dressing
// up, where Sparkle can wear everything she has found.
import { ICONS, cloudSVG, hillsSVG, itemSVG, itemSilhouetteSVG, rainbowSVG, sunSVG, unicornSVG } from './art';
import { sound } from './audio';
import { ITEMS, markItemsSeen, playerName, save, toggleWear, unseenItems } from './data';
import { Scene, burst, burstAt, el, replay } from '../../shared/ui';
import { say } from './voice';

export interface Host {
  stage: HTMLElement;
  setScene(s: Scene): void;
}

const LOGO_COLORS = ['#ff6b6b', '#ffae5c', '#f5c542', '#6fcf6a', '#4ea8f5', '#a57ff0', '#ff8fc4'];

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

const FAR_HILLS = hillsSVG('#c6ebb4', '#aadd96', [2, 3, 5], 0.4);
const NEAR_HILLS = hillsSVG('#a4e08b', '#86cc6f', [1, 3, 4], 2.1);

/**
 * A band of hills: copies of one tile side by side, slid along with a
 * transform. (As a repeating background, the tile's edge showed as a thin
 * line at some sizes.)
 */
class Hills {
  readonly el: HTMLElement;
  private strip: HTMLElement;
  private tile = 1;

  constructor(parent: HTMLElement, cls: string, private art: string) {
    this.el = el('div', `hills ${cls}`, parent);
    this.strip = el('div', 'hills-strip', this.el);
  }

  fit(width: number) {
    const h = Math.round(this.el.clientHeight) || 1;
    this.tile = h * 4;
    const n = Math.ceil(width / this.tile) + 1;
    this.strip.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const t = el('div', 'hills-tile', this.strip, this.art);
      t.style.left = `${i * this.tile}px`;
      t.style.width = `${this.tile + 1}px`;
    }
  }

  scroll(px: number) {
    const x = ((px % this.tile) + this.tile) % this.tile;
    this.strip.style.transform = `translate3d(${(-x).toFixed(1)}px, 0, 0)`;
  }
}

// ---------------------------------------------------------------------------
// The meadow: sky, sun, clouds and hills, and the grass Sparkle runs on.
// `scroll` slides it along (the hills slower, as they're further away).

export class Meadow {
  readonly root: HTMLElement;
  private far: Hills;
  private near: Hills;
  private grass: HTMLElement;
  private clouds: { el: HTMLElement; at: number; speed: number }[] = [];
  private y = 0;

  constructor(parent: HTMLElement) {
    this.root = el('div', 'meadow', parent);
    el('div', 'sun', this.root, sunSVG());
    [
      [0.05, 12, 1],
      [0.35, 24, 0.7],
      [0.62, 8, 1.2],
      [0.88, 20, 0.85],
    ].forEach(([at, top, size], i) => {
      const c = el('div', 'cloud', this.root, cloudSVG());
      c.style.top = `${top}%`;
      c.style.setProperty('--s', String(size));
      this.clouds.push({ el: c, at, speed: 0.04 + i * 0.012 });
    });
    this.far = new Hills(this.root, 'far', FAR_HILLS);
    this.near = new Hills(this.root, 'near', NEAR_HILLS);
    this.grass = el('div', 'grass', this.root);
  }

  /** Put the ground line `px` from the top (by default, a set share of the height `h`) and return it. */
  ground(h: number, px?: number): number {
    const portrait = innerHeight > innerWidth;
    this.y = Math.round(px ?? h * (portrait ? 0.72 : 0.8));
    // Set on the screen around the meadow, so Sparkle can stand on it too.
    (this.root.parentElement ?? this.root).style.setProperty('--ground', `${this.y}px`);
    const w = this.root.clientWidth || innerWidth;
    this.far.fit(w);
    this.near.fit(w);
    return this.y;
  }

  /** Slide the scenery along: `px` is how far we've come. */
  scroll(px: number, now: number) {
    this.far.scroll(px * 0.16);
    this.near.scroll(px * 0.4);
    this.grass.style.backgroundPositionX = `${(-px).toFixed(1)}px`;
    const span = this.root.clientWidth + 360;
    for (const c of this.clouds) {
      const x = (((c.at * span - px * c.speed - now * 0.008) % span) + span) % span;
      c.el.style.transform = `translate3d(${(x - 240).toFixed(1)}px, 0, 0)`;
    }
  }
}

/** Keep a meadow's ground and clouds going while a screen is up. */
function liveMeadow(sc: Scene, m: Meadow, groundAt: () => number | undefined, pace = 0) {
  const fit = () => m.ground(sc.root.clientHeight || innerHeight, groundAt());
  fit();
  sc.on(window, 'resize', fit);
  let raf = 0;
  let px = 0;
  let last = performance.now();
  const frame = (now: number) => {
    px += ((now - last) / 1000) * pace;
    last = now;
    m.scroll(px, now);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  sc.addCleanup(() => cancelAnimationFrame(raf));
}

// ---------------------------------------------------------------------------
// Title

export async function titleScreen(host: Host): Promise<'play' | 'dress'> {
  const sc = new Scene(host.stage, 'title-scene');
  host.setScene(sc);

  const bg = el('div', 'title-bg', sc.root);
  const meadow = new Meadow(bg);
  el('div', 't-rainbow', bg, rainbowSVG());
  // Sparkle galloping along on the spot, the meadow going by.
  const uni = el('div', 'uni t-uni run', bg);
  const art = el('div', 'uni-tilt', uni, unicornSVG(save.wearing));
  liveMeadow(sc, meadow, () => undefined, 90);

  const logo = el('h1', 'logo', sc.root);
  const name = playerName();
  if (name) el('span', 'logo-name', logo, `${escapeHtml(name)}'s`);
  const words = el('span', 'logo-words', logo);
  let k = 0;
  for (const w of ['Unicorn', 'Dash']) {
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
  play.setAttribute('aria-label', 'Start dashing');
  const dress = el('button', 'big-btn purple dress-btn', buttons, `${ICONS.dress}<span class="new-star">★</span>`);
  dress.setAttribute('aria-label', 'Dress up');
  if (save.items.length) el('span', 'count-badge', dress, String(save.items.length));
  if (unseenItems().length) dress.classList.add('has-new');

  // Sparkle leaps now and then, and when tapped says hello.
  const leap = () => {
    replay(uni, 'hop');
    sound.jump();
    setTimeout(() => sc.alive && sound.land(), 600);
  };
  const hopT = window.setInterval(() => sc.alive && Math.random() < 0.5 && leap(), 5000);
  sc.addCleanup(() => clearInterval(hopT));
  sc.on(art, 'pointerdown', (e) => {
    e.preventDefault();
    leap();
    sound.neigh();
    void say('hello');
  });

  // Greet once audio is available (after the first tap anywhere).
  let greeted = false;
  sc.on(document, 'pointerdown', () => {
    if (greeted) return;
    greeted = true;
    setTimeout(() => sc.alive && void say('title'), 150);
  });

  const i = await sc.tapAny([play, dress], 8000, play);
  greeted = true;
  sound.pop();
  sc.destroy();
  return i === 0 ? 'play' : 'dress';
}

// ---------------------------------------------------------------------------
// Dressing up

export async function dressScreen(host: Host): Promise<'play'> {
  const sc = new Scene(host.stage, 'dress-scene');
  host.setScene(sc);

  const fresh = new Set(unseenItems());
  const meadow = new Meadow(sc.root);
  const stage = el('div', 'd-stage', sc.root);
  el('div', 'd-rainbow', stage, rainbowSVG());
  const uni = el('div', 'uni d-uni idle', stage);
  const art = el('div', 'uni-tilt', uni, unicornSVG(save.wearing));
  const dress = () => (art.innerHTML = unicornSVG(save.wearing));

  sc.on(uni, 'pointerdown', (e) => {
    e.preventDefault();
    replay(uni, 'hop');
    sound.neigh();
    void say('neigh');
  });

  // Everything there is to find, one slot each: tap to put it on or take it off.
  const bottom = el('div', 'p-bottom', sc.root);
  const strip = el('div', 'collection', bottom);
  const slots = new Map<string, HTMLElement>();
  const paint = () => slots.forEach((s, id) => s.classList.toggle('on', save.wearing.includes(id)));
  ITEMS.forEach((f) => {
    const got = save.items.includes(f.id);
    const s = el('button', `slot${got ? ' got' : ''}${fresh.has(f.id) ? ' new' : ''}`, strip, got ? itemSVG(f.id) : itemSilhouetteSVG(f.id));
    s.setAttribute('aria-label', got ? f.name : 'Not found yet');
    slots.set(f.id, s);
    sc.on(s, 'pointerdown', (e) => {
      e.preventDefault();
      if (!got) {
        sound.tapSoft();
        replay(s, 'shake');
        return;
      }
      const on = toggleWear(f.id);
      dress();
      paint();
      replay(s, 'wiggle');
      if (on) {
        sound.magic();
        replay(uni, 'hop');
        burstAt(uni, { kind: 'sparkle', count: 14, spread: 0.9 });
        void say(`i-${f.id}`);
      } else {
        sound.whoosh();
      }
    });
  });
  paint();
  const play = el('button', `big-btn green play-btn-small${save.items.length ? '' : ' nudge'}`, bottom, ICONS.play);
  play.setAttribute('aria-label', 'Start dashing');

  // Now everything is in place: the grass starts at the foot of the stage,
  // and Sparkle is as big as fits on it.
  liveMeadow(sc, meadow, () => stage.getBoundingClientRect().bottom - sc.root.getBoundingClientRect().top);
  const size = () => {
    const r = stage.getBoundingClientRect();
    uni.style.width = `${Math.min(r.width * 0.9, ((r.height * 0.92) / 186) * 210, 560)}px`;
  };
  size();
  sc.on(window, 'resize', size);

  // --- Greeting and new things -----------------------------------------------------
  await sc.wait(400);
  if (!save.items.length) {
    await sc.until(say('dressEmpty'), 4000);
  } else if (fresh.size) {
    await sc.wait(400);
    sound.fanfare();
    fresh.forEach((id) => burstAt(slots.get(id)!, { kind: 'sparkle', count: 12 }));
    await sc.until(say('dressNew'), 3500);
    markItemsSeen();
  } else {
    void say('dressUp');
    if (save.items.length === ITEMS.length) {
      const r = strip.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top, { kind: 'sparkle', count: 16, spread: 1.2 });
    }
  }

  await sc.tap(play, 0);
  sound.pop();
  sc.destroy();
  return 'play';
}
