// The bathroom and the bath in it: the wall and floor, the tub with its tap,
// plug, bubble bottle and sponge, the water (which can fill and drain), and
// everything floating on it. Used by the title screen and by bath time.
//
// Everything in the bath is placed in the bath's own units (see TUB_W and
// TUB_H in art.ts): 1000 across, with the back rim at the top and the front
// rim at y = 232. Floating things sit on the water at a depth `d` from the
// back (0) to the front (1), so a lower water level carries them down too.
import { DUCK_WATER, FOAM_WATER, TUB_H, TUB_W, bottleSVG, duckSVG, foamSVG, plugSVG, spongeSVG, tapSVG, tubBackSVG, tubFrontSVG, windowSVG } from './art';
import { Scene, el } from './ui';

/** Water levels: where the water meets the back of the bath. */
export const FULL = 120;
export const EMPTY = 275;
/** Where the water comes out of the tap. */
const SPOUT_Y = -40;
const FLOOR_Y = 430;

export interface Floater {
  el: HTMLElement;
  /** The picture inside, for one-off animations (hops and wobbles). */
  art: HTMLElement;
  x: number;
  d: number;
  w: number;
  /** The water line, as a share of the picture's height from the top. */
  anchor: number;
  bob: number;
  /** Held up above the water (e.g. while dropping in). */
  lift: number;
  phase: number;
  swim?: { x0: number; d0: number; x1: number; d1: number; t0: number; ms: number; done?: () => void };
}

/** The wall, floor and window behind every screen. */
export function roomBg(parent: HTMLElement) {
  const room = el('div', 'room', parent);
  el('div', 'wall', room);
  el('div', 'floor', room);
  el('div', 'window', room, windowSVG());
  return room;
}

/** Put `e` at (x, y) in bath units, `w` wide, with its own point (ax, ay) there. */
function anchorAt(e: HTMLElement, x: number, y: number, w: number, ax = 0.5, ay = 1) {
  e.style.left = `${(x / TUB_W) * 100}%`;
  e.style.top = `${(y / TUB_H) * 100}%`;
  e.style.width = `${(w / TUB_W) * 100}%`;
  e.style.translate = `${-ax * 100}% ${-ay * 100}%`;
}

export class Tub {
  readonly room: HTMLElement;
  readonly box: HTMLElement;
  readonly tap: HTMLElement;
  readonly plug: HTMLElement;
  /** The ring on the rim, to point at. */
  readonly plugRing: HTMLElement;
  readonly bottle: HTMLElement;
  readonly sponge: HTMLElement;
  readonly float: HTMLElement;
  readonly props: HTMLElement;
  readonly air: HTMLElement;
  private rim: HTMLElement;
  private stream: HTMLElement;
  private water: HTMLElement;
  /** One bath unit in pixels. */
  u = 1;
  /** The part of the bath on the screen (on a tall phone its ends are off the sides). */
  x0 = 0;
  x1 = TUB_W;
  /** Where the tap pours. */
  spoutX = 237;
  private a = 245;
  private b = 790;
  level: number;
  floaters: Floater[] = [];
  private levelTween?: { from: number; to: number; t0: number; ms: number; done?: () => void };
  private rimDucks: HTMLElement[] = [];

  constructor(
    private sc: Scene,
    parent: HTMLElement,
    private fit: (W: number, H: number) => { w: number; left: number; top: number },
    level = EMPTY,
  ) {
    this.level = level;
    this.room = roomBg(parent);
    const box = (this.box = el('div', 'tub', parent));
    el('div', 'tub-layer back-layer', box, tubBackSVG());
    this.rim = el('div', 'tub-layer rim-layer', box);
    this.stream = el('div', 'stream', this.rim);
    this.plug = el('div', 'plug', this.rim, plugSVG());
    this.plugRing = el('div', 'plug-ring', this.plug);
    this.tap = el('div', 'tap', this.rim, tapSVG());
    this.water = el('div', 'water', box);
    el('div', 'water-glint', this.water);
    this.float = el('div', 'tub-layer float-layer', box);
    el('div', 'tub-layer front-layer', box, tubFrontSVG());
    this.props = el('div', 'tub-layer props-layer', box);
    this.sponge = el('div', 'sponge', this.props, spongeSVG());
    this.bottle = el('div', 'bottle', this.props, bottleSVG());
    this.air = el('div', 'tub-layer air-layer', box);

    this.layout();
    sc.on(window, 'resize', () => this.layout());
    let raf = 0;
    const frame = (now: number) => {
      this.step(now);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    sc.addCleanup(() => cancelAnimationFrame(raf));
  }

  layout() {
    const parent = this.box.parentElement!;
    const W = parent.clientWidth || innerWidth;
    const H = parent.clientHeight || innerHeight;
    const { w, left, top } = this.fit(W, H);
    this.u = w / TUB_W;
    Object.assign(this.box.style, { left: `${left}px`, top: `${top}px`, width: `${w}px`, height: `${(w * TUB_H) / TUB_W}px` });
    // The floor starts behind the bath, a little above its feet.
    this.room.style.setProperty('--floor', `${Math.round(top + 395 * this.u)}px`);
    // Keep the tap, the plug, the sponge, the bottle and the ducks on the rim
    // on the screen.
    this.x0 = Math.max(40, -left / this.u + 20);
    this.x1 = Math.min(TUB_W - 40, (W - left) / this.u - 20);
    this.spoutX = Math.max(237, this.x0 + 140);
    this.stream.style.left = `${((this.spoutX - 11) / TUB_W) * 100}%`;
    this.stream.style.width = `${(22 / TUB_W) * 100}%`;
    anchorAt(this.tap, this.spoutX - 57, 54, 160, 0.5, 1);
    anchorAt(this.plug, this.spoutX + 95, 24, 60, 0.5, 0);
    // The sponge sits on the left end of the rim when that's on the screen.
    const sponge = this.x0 < 60;
    this.sponge.classList.toggle('off', !sponge);
    anchorAt(this.sponge, 125, 242, 116);
    const bottle = Math.min(885, this.x1 - 52);
    anchorAt(this.bottle, bottle, 244, 88);
    // Room for the little ducks: between the sponge and the bottle.
    this.a = sponge ? Math.max(this.x0 + 120, 245) : this.x0 + 100;
    this.b = Math.min(this.x1 - 120, bottle - 95);
    this.placeRim();
    this.step(performance.now());
  }

  /** The middle of the bath on the screen. */
  get mid() {
    return (this.x0 + this.x1) / 2;
  }

  /** Across the water, clear of the sponge and the bottle: 0 is the left, 1 the right. */
  span(t: number) {
    return this.a + (this.b - this.a) * t;
  }

  /** Bath units to a point on the screen. */
  toClient(x: number, y: number) {
    const r = this.box.getBoundingClientRect();
    return { x: r.left + x * this.u, y: r.top + y * this.u };
  }

  /** A point on the screen to bath units. */
  fromClient(x: number, y: number) {
    const r = this.box.getBoundingClientRect();
    return { x: (x - r.left) / this.u, y: (y - r.top) / this.u };
  }

  /** Where the water surface is at depth `d`. */
  surface(d: number, level = this.level) {
    return level + 25 + d * 95;
  }

  /** Is this point (in bath units) on the water you can see? */
  onWater(x: number, y: number) {
    return x > 70 && x < 930 && y > this.level - 30 && y < 236 && this.level < EMPTY - 20;
  }

  // --- Water --------------------------------------------------------------------

  setLevel(to: number, ms: number): Promise<void> {
    return this.sc.when<void>((done) => {
      this.levelTween = { from: this.level, to, t0: performance.now(), ms, done };
      return () => {
        if (this.levelTween?.done === done) {
          this.level = to;
          this.levelTween = undefined;
        }
      };
    });
  }

  pour(on: boolean) {
    this.stream.classList.toggle('on', on);
  }

  // --- Floating things -----------------------------------------------------------------

  addFloater(html: string, cls: string, o: { x: number; d: number; w: number; anchor?: number; bob?: number; lift?: number }): Floater {
    const e = el('div', `floater ${cls}`, this.float);
    const art = el('div', 'fl-art', e, html);
    const f: Floater = { el: e, art, x: o.x, d: o.d, w: o.w, anchor: o.anchor ?? DUCK_WATER, bob: o.bob ?? 3, lift: o.lift ?? 0, phase: Math.random() * 6.28 };
    e.style.width = `${(o.w / TUB_W) * 100}%`;
    art.style.transformOrigin = `50% ${f.anchor * 100}%`;
    this.floaters.push(f);
    this.place(f, performance.now());
    return f;
  }

  duck(look: Parameters<typeof duckSVG>[0], cls: string, o: { x: number; d: number; w: number; lift?: number }) {
    return this.addFloater(duckSVG(look), `duck ${cls}`, o);
  }

  foam(x: number, d: number, w: number, seed = Math.random() * 100) {
    return this.addFloater(foamSVG(seed), 'foam', { x, d, w, anchor: FOAM_WATER, bob: 2 });
  }

  remove(f: Floater, cls = '', ms = 0) {
    const i = this.floaters.indexOf(f);
    if (i >= 0) this.floaters.splice(i, 1);
    if (cls) {
      f.el.classList.add(cls);
      setTimeout(() => f.el.remove(), ms);
    } else f.el.remove();
  }

  /** Paddle over to (x, d). */
  swim(f: Floater, x: number, d: number, ms = 900): Promise<void> {
    return this.sc.when<void>((done) => {
      f.swim = { x0: f.x, d0: f.d, x1: x, d1: d, t0: performance.now(), ms, done };
      return () => {
        if (f.swim?.done === done) {
          f.x = x;
          f.d = d;
          f.swim = undefined;
        }
      };
    });
  }

  // --- Ducks sitting along the back rim -----------------------------------------------------

  setRim(ids: string[], fresh?: string) {
    this.rimDucks.forEach((d) => d.remove());
    this.rimDucks = ids.map((id) => {
      const d = el('div', `rim-duck${id === fresh ? ' fresh' : ''}`, this.rim);
      d.dataset.id = id;
      el('div', 'fl-art', d, duckSVG(id));
      return d;
    });
    this.placeRim();
  }

  private placeRim() {
    const n = this.rimDucks.length;
    const from = this.spoutX + 190;
    const to = this.x1 - 60;
    // Smaller when there are lots of them on a narrow screen.
    const w = Math.min(84, n > 1 ? ((to - from) / (n - 1)) * 1.15 : 84);
    this.rimDucks.forEach((d, i) => {
      const x = n === 1 ? to - 80 : from + ((to - from) * i) / (n - 1);
      anchorAt(d, x, 40, w, 0.5, DUCK_WATER);
    });
  }

  get rimEls() {
    return this.rimDucks;
  }

  // --- Each frame ------------------------------------------------------------------

  private step(now: number) {
    const lt = this.levelTween;
    if (lt) {
      const k = Math.min(1, (now - lt.t0) / lt.ms);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      this.level = lt.from + (lt.to - lt.from) * e;
      if (k >= 1) {
        this.levelTween = undefined;
        lt.done?.();
      }
    }
    const u = this.u;
    this.water.style.top = `${(this.level * u).toFixed(1)}px`;
    this.water.style.height = `${(Math.max(0, FLOOR_Y - this.level) * u).toFixed(1)}px`;
    this.stream.style.top = `${(SPOUT_Y * u).toFixed(1)}px`;
    this.stream.style.height = `${((Math.min(this.level, EMPTY) + 30 - SPOUT_Y) * u).toFixed(1)}px`;
    for (const f of this.floaters) this.place(f, now);
  }

  private place(f: Floater, now: number) {
    const s = f.swim;
    if (s) {
      const k = Math.min(1, (now - s.t0) / s.ms);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      f.x = s.x0 + (s.x1 - s.x0) * e;
      f.d = s.d0 + (s.d1 - s.d0) * e;
      if (k >= 1) {
        f.swim = undefined;
        s.done?.();
      }
    }
    // Afloat, things bob and rock; on the bottom of an empty bath they sit still.
    const wet = Math.max(0, Math.min(1, (EMPTY - this.level) / 40));
    const t = now / 1000;
    const y = this.surface(f.d) - f.lift + Math.sin(t * 1.8 + f.phase) * f.bob * wet;
    const rock = Math.sin(t * 1.3 + f.phase) * 3 * wet;
    f.el.style.transform = `translate3d(${(f.x * this.u).toFixed(1)}px, ${(y * this.u).toFixed(1)}px, 0) translate(-50%, ${(-f.anchor * 100).toFixed(2)}%) rotate(${rock.toFixed(2)}deg)`;
    f.el.style.zIndex = String(10 + Math.round(f.d * 100));
  }
}
