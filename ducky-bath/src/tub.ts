// The bathroom and the bath in it: the wall and floor, the tub with its tap,
// plug, bubble bottle and sponge, the water (which can fill and drain), and
// everything floating on it. Used by the title screen and by bath time.
//
// The bath is seen a little from above, so the water is a big rounded pool.
// Everything in it is placed in the bath's own units (see TubShape in
// art.ts). Floating things sit on the water at a depth `d` from the back (0)
// to the front (1); when the water is low they sit on the bottom.
import {
  DUCK_WATER,
  FOAM_WATER,
  TALL_TUB,
  WIDE_TUB,
  bottleSVG,
  duckSVG,
  foamSVG,
  plugSVG,
  spongeSVG,
  tapSVG,
  tubBackSVG,
  tubFrontSVG,
  tubParts,
  windowSVG,
  type TubShape,
} from './art';
import { Scene, el } from '../../shared/ui';

/** The water line at the back of the bath when it's full. */
const FULL = 96;
/** The top of the rim, where the tap, plug and ducks stand. */
const RIM_Y = 34;
/** Where the water comes out of the tap. */
const SPOUT_Y = RIM_Y - 94;
/** The shelf on the wall above the bath, on a tall phone. */
const SHELF_Y = -178;

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
  private back: HTMLElement;
  private front: HTMLElement;
  private rim: HTMLElement;
  private stream: HTMLElement;
  private water: HTMLElement;
  private waterBody?: SVGRectElement;
  private waterTop?: SVGGElement;
  private plank: HTMLElement;
  private showShelf: boolean;
  /** The bath's shape (wide, or tall for phones held upright). */
  shape: TubShape = WIDE_TUB;
  /** One bath unit in pixels. */
  u = 1;
  /** Where the tap pours. */
  spoutX = 237;
  private a = 250;
  private b = 770;
  level = FULL;
  floaters: Floater[] = [];
  private levelTween?: { from: number; to: number; t0: number; ms: number; done?: () => void };
  private rimDucks: HTMLElement[] = [];

  constructor(
    private sc: Scene,
    parent: HTMLElement,
    private fit: (W: number, H: number, t: TubShape) => { w: number; left: number; top: number },
    opts: { full?: boolean; shelf?: boolean } = {},
  ) {
    this.showShelf = opts.shelf ?? true;
    this.room = roomBg(parent);
    const box = (this.box = el('div', 'tub', parent));
    this.back = el('div', 'tub-layer back-layer', box);
    this.rim = el('div', 'tub-layer rim-layer', box);
    this.plank = el('div', 'duck-plank', this.rim);
    this.stream = el('div', 'stream', this.rim);
    this.plug = el('div', 'plug', this.rim, plugSVG());
    this.plugRing = el('div', 'plug-ring', this.plug);
    this.tap = el('div', 'tap', this.rim, tapSVG());
    this.water = el('div', 'tub-layer water-layer', box);
    this.float = el('div', 'tub-layer float-layer', box);
    this.front = el('div', 'tub-layer front-layer', box);
    this.props = el('div', 'tub-layer props-layer', box);
    this.sponge = el('div', 'sponge', this.props, spongeSVG());
    this.bottle = el('div', 'bottle', this.props, bottleSVG());
    this.air = el('div', 'tub-layer air-layer', box);

    this.pickShape();
    this.level = opts.full ? this.full : this.empty;
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

  /** Water levels: where the water meets the back of the bath. */
  get full() {
    return FULL;
  }
  get empty() {
    return this.shape.fy + 6;
  }

  private size() {
    const parent = this.box.parentElement!;
    return { W: parent.clientWidth || innerWidth, H: parent.clientHeight || innerHeight };
  }

  /** Wide, or tall on a phone held upright. Redraws the bath if it changed. */
  private pickShape() {
    const { W, H } = this.size();
    const next = H > W * 1.15 ? TALL_TUB : WIDE_TUB;
    if (next === this.shape && this.back.childElementCount) return;
    const before = this.shape;
    this.shape = next;
    this.back.innerHTML = tubBackSVG(next);
    this.front.innerHTML = tubFrontSVG(next);
    this.buildWater();
    this.box.classList.toggle('tall', next.tall);
    if (before === next) return;
    // Turned round: keep the water as full as it was, and everything afloat
    // in the bath.
    const lvl = (to: number) => next.fy + 6 - ((before.fy + 6 - to) / (before.fy + 6 - FULL)) * (next.fy + 6 - FULL);
    this.level = lvl(this.level);
    if (this.levelTween) {
      this.levelTween.from = lvl(this.levelTween.from);
      this.levelTween.to = lvl(this.levelTween.to);
    }
    const across = (x: number) => ((x - 44) / (before.tw - 88)) * (next.tw - 88) + 44;
    for (const f of this.floaters) {
      f.x = across(f.x);
      if (f.swim) {
        f.swim.x0 = across(f.swim.x0);
        f.swim.x1 = across(f.swim.x1);
      }
    }
  }

  private buildWater() {
    const t = this.shape;
    const { inner, r } = tubParts(t);
    const id = `wt${Math.random().toString(36).slice(2, 8)}`;
    const glints = [
      [0.22, 40, 34],
      [0.62, 86, 26],
      [0.4, 150, 40],
      [0.82, 190, 22],
      [0.12, 240, 28],
      [0.55, 280, 30],
    ];
    this.water.innerHTML = `<svg viewBox="0 0 ${t.tw} ${t.th}" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <clipPath id="${id}c"><rect x="${inner.x + 2}" y="${inner.y + 2}" width="${inner.w - 4}" height="${inner.h - 4}" rx="${r - 2}"/></clipPath>
        <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd3f7"/><stop offset="1" stop-color="#5eb6ea"/></linearGradient>
      </defs>
      <g clip-path="url(#${id}c)">
        <rect class="w-body" x="0" y="${t.th}" width="${t.tw}" height="${t.th}" fill="url(#${id}g)" opacity=".92"/>
        <g class="w-top">
          <rect x="0" y="0" width="${t.tw}" height="10" fill="#c9edff"/>
          <rect x="0" y="-2" width="${t.tw}" height="4" fill="#fff"/>
          <g class="w-glints" fill="#fff">${glints.map(([x, y, rx]) => `<ellipse cx="${t.tw * x}" cy="${y}" rx="${rx}" ry="${rx / 7}" opacity=".6"/>`).join('')}</g>
        </g>
      </g>
    </svg>`;
    this.waterBody = this.water.querySelector('.w-body') as SVGRectElement;
    this.waterTop = this.water.querySelector('.w-top') as SVGGElement;
  }

  /** Place `e` at (x, y) in bath units, `w` wide, with its own point (ax, ay) there. */
  private anchorAt(e: HTMLElement, x: number, y: number, w: number, ax = 0.5, ay = 1) {
    e.style.left = this.px(x);
    e.style.top = this.py(y);
    e.style.width = this.px(w);
    e.style.translate = `${-ax * 100}% ${-ay * 100}%`;
  }

  /** Bath units across, and down, as a share of the bath (for CSS). */
  px(x: number) {
    return `${(x / this.shape.tw) * 100}%`;
  }
  py(y: number) {
    return `${(y / this.shape.th) * 100}%`;
  }

  layout() {
    this.pickShape();
    const t = this.shape;
    const { W, H } = this.size();
    const { w, left, top } = this.fit(W, H, t);
    this.u = w / t.tw;
    Object.assign(this.box.style, { left: `${left}px`, top: `${top}px`, width: `${w}px`, height: `${(w * t.th) / t.tw}px` });
    // The floor starts behind the bath, a little above its feet.
    this.room.style.setProperty('--floor', `${Math.round(top + t.th * 0.8 * this.u)}px`);

    this.spoutX = t.tall ? 170 : 237;
    this.stream.style.left = this.px(this.spoutX - 11);
    this.stream.style.width = this.px(22);
    this.anchorAt(this.tap, this.spoutX - 57, RIM_Y + 2, 160, 0.5, 1);
    this.anchorAt(this.plug, this.spoutX + 100, RIM_Y - 18, 60, 0.5, 0);
    // The sponge sits on the front rim; on a tall phone there's no room.
    this.sponge.classList.toggle('off', t.tall);
    this.anchorAt(this.sponge, 125, t.fy + 18, 116);
    if (t.tall) this.anchorAt(this.bottle, t.tw - 92, RIM_Y + 4, 80);
    else this.anchorAt(this.bottle, t.tw - 118, t.fy + 20, 88);
    // Room for the little ducks: clear of the sponge and the bottle.
    this.a = t.tall ? 140 : 250;
    this.b = t.tall ? t.tw - 140 : t.tw - 230;
    this.anchorAt(this.plank, t.tw / 2, SHELF_Y, t.tw - 60, 0.5, 0);
    this.placeRim();
    this.step(performance.now());
  }

  /** The middle of the bath. */
  get mid() {
    return this.shape.tw / 2;
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

  /** Where something at depth `d` sits: on the water, or on the bottom if it's low. */
  surface(d: number, level = this.level) {
    const back = Math.min(level, this.shape.fy - 130) + 34;
    return back + (this.shape.fy - 34 - back) * d;
  }

  /** Is this point (in bath units) on the water you can see? */
  onWater(x: number, y: number) {
    const { inner } = tubParts(this.shape);
    return (
      this.level < this.shape.fy - 40 &&
      x > inner.x + 10 &&
      x < inner.x + inner.w - 10 &&
      y > Math.max(this.level - 20, inner.y) &&
      y < this.shape.fy + 14
    );
  }

  // --- Water --------------------------------------------------------------------

  setLevel(to: number, ms: number): Promise<void> {
    return this.sc.when<void>((done) => {
      this.levelTween = { from: this.level, to, t0: performance.now(), ms, done };
      return () => {
        if (this.levelTween?.done === done) {
          this.level = this.levelTween.to;
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
          f.x = f.swim.x1;
          f.d = f.swim.d1;
          f.swim = undefined;
        }
      };
    });
  }

  // --- The ducks found: along the back rim, or on a shelf above a tall bath -------------

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
    const t = this.shape;
    const n = this.rimDucks.length;
    const shelf = t.tall;
    this.rimDucks.forEach((d) => d.classList.toggle('off', shelf && !this.showShelf));
    // The shelf goes up once there's a duck to put on it.
    this.plank.classList.toggle('on', shelf && this.showShelf && n > 0);
    if (!n) return;
    const from = shelf ? 90 : this.spoutX + 200;
    const to = shelf ? t.tw - 90 : t.tw - 70;
    const w = shelf ? Math.min(100, ((to - from) / Math.max(1, n - 1)) * 0.95) : Math.min(84, n > 1 ? ((to - from) / (n - 1)) * 1.15 : 84);
    this.rimDucks.forEach((d, i) => {
      const x = n === 1 ? (shelf ? t.tw / 2 : to - 80) : from + ((to - from) * i) / (n - 1);
      this.anchorAt(d, x, shelf ? SHELF_Y + 4 : RIM_Y + 4, w, 0.5, DUCK_WATER);
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
    const L = this.level;
    this.waterBody?.setAttribute('y', L.toFixed(1));
    this.waterTop?.setAttribute('transform', `translate(0 ${L.toFixed(1)})`);
    this.water.style.opacity = L >= this.empty - 1 ? '0' : '1';
    this.stream.style.top = `${(SPOUT_Y * u).toFixed(1)}px`;
    this.stream.style.height = `${((Math.min(L, this.shape.fy - 110) + 24 - SPOUT_Y) * u).toFixed(1)}px`;
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
    const y0 = this.surface(f.d);
    const wet = Math.max(0, Math.min(1, (y0 - this.level) / 40));
    const t = now / 1000;
    const y = y0 - f.lift + Math.sin(t * 1.8 + f.phase) * f.bob * wet;
    const rock = Math.sin(t * 1.3 + f.phase) * 3 * wet;
    f.el.style.width = `${(f.w * this.u).toFixed(1)}px`;
    f.el.style.transform = `translate3d(${(f.x * this.u).toFixed(1)}px, ${(y * this.u).toFixed(1)}px, 0) translate(-50%, ${(-f.anchor * 100).toFixed(2)}%) rotate(${rock.toFixed(2)}deg)`;
    f.el.style.zIndex = String(10 + Math.round(f.d * 100));
  }
}
