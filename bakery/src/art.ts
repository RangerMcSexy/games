// All artwork is hand-built SVG so the game ships with zero image files.
// Treats are drawn in layers (tin, body, icing, sprinkles, topper) so every
// choice the child makes shows up in the finished bake.
import { SPRITES, type SpriteName } from './sprites';
import { PALETTE, seeded, type AnimalId, type ColorId, type Kind, type ShapeId, type Topper } from './data';

export const INK = '#5a4272';
let idCounter = 0;
const nid = (p: string) => `${p}${++idCounter}`;
const f1 = (n: number) => (Math.round(n * 10) / 10).toString();

export const HEART_PATH = 'M0,6 C-4,2 -8,-1 -8,-4 C-8,-7 -5,-8 -3,-8 C-1.5,-8 -0.5,-7 0,-6 C0.5,-7 1.5,-8 3,-8 C5,-8 8,-7 8,-4 C8,-1 4,2 0,6 Z';

export function starPath(r: number, inner = 0.45, points = 5): string {
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : r * inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    d += `${i === 0 ? 'M' : 'L'}${(Math.cos(a) * rad).toFixed(2)},${(Math.sin(a) * rad).toFixed(2)} `;
  }
  return d + 'Z';
}

/** Blend two #rrggbb colours. */
export function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  const c = (s: number) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * t);
  return `#${((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1)}`;
}

export function sprite(name: SpriteName, cls = 'sprite'): string {
  return `<img class="${cls}" src="${SPRITES[name]}" alt="" draggable="false">`;
}

// ---------------------------------------------------------------------------
// Shapes: a unit outline (about -1..1) for circle, heart and star. Each keeps a
// dense boundary so we can find the front edge (for icing drips) and scatter
// sprinkles inside it.

type Pt = [number, number];

function normalise(pts: Pt[]): Pt[] {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const s = 2 / Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  return pts.map(([x, y]) => [(x - cx) * s, (y - cy) * s]);
}

const OUTLINES: Record<ShapeId, { boundary: Pt[]; corners?: Pt[] }> = (() => {
  const circle: Pt[] = [];
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    circle.push([Math.cos(a), Math.sin(a)]);
  }
  const heart: Pt[] = [];
  for (let i = 0; i < 72; i++) {
    const t = (i / 72) * Math.PI * 2;
    heart.push([16 * Math.sin(t) ** 3, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]);
  }
  const starCorners: Pt[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 1 : 0.5;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    starCorners.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  const corners = normalise(starCorners);
  const star: Pt[] = [];
  corners.forEach((p, i) => {
    const q = corners[(i + 1) % corners.length];
    for (let k = 0; k < 8; k++) star.push([p[0] + ((q[0] - p[0]) * k) / 8, p[1] + ((q[1] - p[1]) * k) / 8]);
  });
  return {
    round: { boundary: circle },
    heart: { boundary: normalise(heart) },
    star: { boundary: star, corners },
  };
})();

/** SVG path for a shape `rx` wide (half-width) and `ry` tall (half-height). */
export function shapePath(shape: ShapeId, rx: number, ry: number, ox = 0, oy = 0): string {
  const P = (x: number, y: number) => `${f1(ox + x * rx)},${f1(oy + y * ry)}`;
  if (shape === 'round') {
    return `M${f1(ox - rx)},${f1(oy)} A${f1(rx)},${f1(ry)} 0 1 0 ${f1(ox + rx)},${f1(oy)} A${f1(rx)},${f1(ry)} 0 1 0 ${f1(ox - rx)},${f1(oy)} Z`;
  }
  if (shape === 'star') {
    // Rounded star: cut each corner with a little curve.
    const c = OUTLINES.star.corners!;
    let d = '';
    c.forEach((p, i) => {
      const prev = c[(i + c.length - 1) % c.length];
      const next = c[(i + 1) % c.length];
      const k = i % 2 === 0 ? 0.16 : 0.12;
      const a: Pt = [p[0] + (prev[0] - p[0]) * k, p[1] + (prev[1] - p[1]) * k];
      const b: Pt = [p[0] + (next[0] - p[0]) * k, p[1] + (next[1] - p[1]) * k];
      d += `${i === 0 ? 'M' : 'L'}${P(...a)} Q${P(...p)} ${P(...b)} `;
    });
    return d + 'Z';
  }
  const b = OUTLINES[shape].boundary;
  return b.map((p, i) => `${i === 0 ? 'M' : 'L'}${P(...p)}`).join(' ') + ' Z';
}

/** Lowest point (front edge) of a shape's outline at unit x. */
function frontEdge(shape: ShapeId, x: number): number {
  const b = OUTLINES[shape].boundary;
  let best = -Infinity;
  let bestDx = Infinity;
  for (const [px, py] of b) {
    const dx = Math.abs(px - x);
    if (dx < 0.08 && py > best) best = py;
    if (dx < bestDx) bestDx = dx;
  }
  return best === -Infinity ? 0 : best;
}

function inside(shape: ShapeId, x: number, y: number): boolean {
  const b = OUTLINES[shape].boundary;
  let c = false;
  for (let i = 0, j = b.length - 1; i < b.length; j = i++) {
    const [xi, yi] = b[i];
    const [xj, yj] = b[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/** Random points inside a shape (unit coords), kept `margin` in from the edge. */
function scatter(shape: ShapeId, n: number, rnd: () => number, margin = 0.78): Pt[] {
  const out: Pt[] = [];
  let guard = 0;
  while (out.length < n && guard++ < n * 40) {
    const x = rnd() * 2 - 1;
    const y = rnd() * 2 - 1;
    if (inside(shape, x, y)) out.push([x * margin, y * margin]);
  }
  return out;
}

/**
 * A solid "slab": the shape stacked from y0 up to y1 so it looks 3D, with a
 * single ink outline around the whole thing. Returns [outline, body] layers.
 */
function slab(pathId: string, y0: number, y1: number, fill: string | ((y: number) => string)): [string, string] {
  let ink = '';
  let body = '';
  const step = 2.5;
  for (let y = y0; y >= y1 - 0.01; y -= step) {
    ink += `<use href="#${pathId}" y="${f1(y)}"/>`;
    const c = typeof fill === 'string' ? fill : fill(y);
    body += `<use href="#${pathId}" y="${f1(y)}" fill="${c}"/>`;
  }
  return [`<g fill="${INK}" stroke="${INK}" stroke-width="7" stroke-linejoin="round">${ink}</g>`, `<g>${body}</g>`];
}

// ---------------------------------------------------------------------------
// Treats

export interface TreatLook {
  kind: Kind;
  shape: ShapeId;
  batter: ColorId;
  icing?: ColorId;
  /** Shakes of sprinkles (0 = none). */
  sprinkles?: number;
  topper?: Topper;
  /** Candles placed so far (for the counting step). */
  candles?: number;
  lit?: boolean;
  seed?: string;
}

export interface TreatOpts {
  /** Raw batter (before the oven) or baked. */
  stage?: 'raw' | 'baked';
  /** How far it has risen in the oven (0..1). */
  rise?: number;
  /** Show the baking tin / tray. */
  tin?: boolean;
  plate?: boolean;
}

const SPRINKLE_COLORS = ['#ff5d8f', '#ffd23f', '#4ea8ff', '#7fd35b', '#a86cf0', '#ff9f1c', '#ffffff'];
const CREAM = '#fff4e0';
const METAL = '#d6dee8';

export const bakedTop = (c: ColorId) => mix(PALETTE[c].batter, '#f2b36b', c === 'choc' ? 0.04 : 0.14);
export const bakedSide = (c: ColorId) => (c === 'choc' ? mix(bakedTop(c), '#6b4230', 0.3) : mix(PALETTE[c].batter, INK, 0.17));
const rawTop = (c: ColorId) => mix(PALETTE[c].batter, '#ffffff', 0.18);

function sprinkleBits(pts: Pt[], rnd: () => number, sx: number, sy: number, ox: number, oy: number): string {
  return pts
    .map(([x, y], i) => {
      const c = SPRINKLE_COLORS[Math.floor(rnd() * SPRINKLE_COLORS.length)];
      const rot = Math.floor(rnd() * 180);
      const px = f1(ox + x * sx);
      const py = f1(oy + y * sy);
      return i % 4 === 3
        ? `<circle cx="${px}" cy="${py}" r="2.6" fill="${c}" stroke="${INK}" stroke-width=".8"/>`
        : `<rect x="-5" y="-1.8" width="10" height="3.6" rx="1.8" fill="${c}" stroke="${INK}" stroke-width=".8" transform="translate(${px},${py}) rotate(${rot})"/>`;
    })
    .join('');
}

function candlesSVG(n: number, xs: number[], y: number, lit: boolean): string {
  let s = '';
  const stripes = ['#ff8fc0', '#74bdfa', '#8edb7a'];
  for (let i = 0; i < n && i < xs.length; i++) {
    const x = xs[i];
    const c = stripes[i % 3];
    s += `<g class="candle" style="--i:${i}" transform="translate(${f1(x)},${f1(y)})">
      <rect x="-4.5" y="-30" width="9" height="31" rx="3" fill="#fff" stroke="${INK}" stroke-width="2.5"/>
      <path d="M-4.5,-24 L4.5,-19 M-4.5,-14 L4.5,-9 M-4.5,-4 L4.5,1" stroke="${c}" stroke-width="3.5"/>
      <path d="M0,-30 L0,-36" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
      <g class="flame${lit ? '' : ' out'}">
        <circle cx="0" cy="-44" r="11" fill="#ffe27a" opacity=".35"/>
        <path d="M0,-54 C6,-46 7,-40 0,-36 C-7,-40 -6,-46 0,-54 Z" fill="#ffb13b" stroke="#f08a24" stroke-width="1.5"/>
        <path d="M0,-47 C2.5,-43 2.5,-40 0,-38.5 C-2.5,-40 -2.5,-43 0,-47 Z" fill="#fff3b0"/>
      </g>
      <g class="smoke"><path d="M0,-38 C-5,-44 5,-48 0,-54 C-5,-60 4,-64 1,-70" stroke="#c9c3d6" stroke-width="3" fill="none" stroke-linecap="round"/></g>
    </g>`;
  }
  return s;
}

function cherrySVG(x: number, y: number): string {
  return `<g transform="translate(${f1(x)},${f1(y)})"><g class="topper">
    <path d="M1,-12 C3,-22 9,-28 16,-30" stroke="#6b9a3a" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="0" cy="-2" r="12" fill="#ff4d6d" stroke="${INK}" stroke-width="3"/>
    <ellipse cx="-4" cy="-6" rx="3.5" ry="4.5" fill="#fff" opacity=".7"/>
  </g></g>`;
}

function strawberrySVG(x: number, y: number): string {
  const seeds = [[-6, -6], [4, -8], [-2, 2], [7, 1], [-8, 4], [1, 10]]
    .map(([a, b]) => `<ellipse cx="${a}" cy="${b}" rx="1.3" ry="2" fill="#ffe89a"/>`)
    .join('');
  return `<g transform="translate(${f1(x)},${f1(y - 6)})"><g class="topper">
    <path d="M0,18 C-14,10 -18,-4 -14,-10 C-10,-16 10,-16 14,-10 C18,-4 14,10 0,18 Z" fill="#ff5d73" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    ${seeds}
    <path d="M-12,-12 L-4,-10 L0,-18 L4,-10 L12,-12 L6,-6 L0,-8 L-6,-6 Z" fill="#7fd35b" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
    <ellipse cx="-7" cy="-2" rx="2.5" ry="4" fill="#fff" opacity=".45"/>
  </g></g>`;
}

function topperSVG(t: TreatLook, x: number, y: number, spread: number): string {
  if (t.topper === 'cherry') return cherrySVG(x, y);
  if (t.topper === 'strawberry') return strawberrySVG(x, y);
  if (t.topper === 'candles' || (t.candles ?? 0) > 0) {
    return candlesSVG(t.candles ?? 3, [x - spread, x, x + spread], y, t.lit ?? false);
  }
  return '';
}

function plateSVG(rx: number, cy: number, ry: number): string {
  return `<ellipse cx="0" cy="${f1(cy + 4)}" rx="${f1(rx + 4)}" ry="${f1(ry + 3)}" fill="${INK}" opacity=".12"/>
    <ellipse cx="0" cy="${f1(cy)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="#fff" stroke="${INK}" stroke-width="3.5"/>
    <ellipse cx="0" cy="${f1(cy - 1)}" rx="${f1(rx * 0.72)}" ry="${f1(ry * 0.62)}" fill="none" stroke="#e8def5" stroke-width="3"/>`;
}

function cakeSVG(t: TreatLook, o: TreatOpts, rnd: () => number): string {
  const W = 72;
  const SQ = 0.5;
  const sy = W * SQ;
  const base = 44;
  const baked = o.stage !== 'raw';
  const rise = o.rise ?? (baked ? 1 : 0.45);
  const H = 46 * rise;
  const top = base - H;
  const id = nid('ck');
  const defs = [`<path id="${id}" d="${shapePath(t.shape, W, sy)}"/>`];
  let out = '';
  if (o.plate) out += plateSVG(W + 20, base + 8, sy + 14);

  const sideC = baked ? bakedSide(t.batter) : mix(rawTop(t.batter), '#caa27f', 0.12);
  const topC = baked ? bakedTop(t.batter) : rawTop(t.batter);
  const mid = base - H * 0.5;
  const [ink, body] = slab(id, base, top, (y) => (baked && rise > 0.8 && Math.abs(y - mid) < 3 ? CREAM : sideC));

  if (o.tin) {
    // The tin hides the bottom of the batter; anything risen above the rim shows.
    const tid = nid('tn');
    defs.push(`<path id="${tid}" d="${shapePath(t.shape, W + 8, sy + 4)}"/>`);
    const rim = base - 26;
    const [tInk, tBody] = slab(tid, base + 2, rim, (y) => (y < rim + 3 ? '#eef3f8' : METAL));
    out += tInk + tBody;
    out += `<use href="#${tid}" y="${rim}" fill="#b9c4d2" stroke="${INK}" stroke-width="3"/>`;
    if (top < rim) {
      const [i2, b2] = slab(id, rim, top, sideC);
      out += i2 + b2;
    }
    out += `<use href="#${id}" y="${f1(Math.min(top, rim + 2))}" fill="${topC}" stroke="${INK}" stroke-width="3"/>`;
    if (!baked) out += `<path d="${shapePath(t.shape, W * 0.45, sy * 0.3, -W * 0.25, Math.min(top, rim + 2) - sy * 0.3)}" fill="#fff" opacity=".35"/>`;
  } else {
    out += ink + body;
    out += `<use href="#${id}" y="${f1(top)}" fill="${topC}" stroke="${INK}" stroke-width="3"/>`;
  }

  let ice = top;
  if (t.icing && baked) {
    const ic = PALETTE[t.icing].icing;
    const icId = nid('ic');
    defs.push(`<path id="${icId}" d="${shapePath(t.shape, W + 1.5, sy + 1)}"/>`);
    ice = top - 5;
    const [iInk, iBody] = slab(icId, top + 2, ice, ic);
    // Drips hang from the front edge of the icing.
    let dInk = '';
    let dBody = '';
    const n = 7;
    for (let i = 0; i < n; i++) {
      const u = -0.82 + (1.64 * i) / (n - 1) + (rnd() - 0.5) * 0.08;
      const ex = u * W;
      const ey = top + frontEdge(t.shape, u) * sy;
      const len = 8 + rnd() * 16;
      const d = `M${f1(ex - 5)},${f1(ey - 2)} L${f1(ex - 5)},${f1(ey + len)} A5,5 0 0 0 ${f1(ex + 5)},${f1(ey + len)} L${f1(ex + 5)},${f1(ey - 2)} Z`;
      dInk += `<path d="${d}"/>`;
      dBody += `<path class="drip" style="--i:${i}" d="${d}" fill="${ic}"/>`;
    }
    out += `<g class="icing">
      <g fill="${INK}" stroke="${INK}" stroke-width="6" stroke-linejoin="round">${dInk}</g>
      ${iInk}${iBody}${dBody}
      <use href="#${icId}" y="${f1(ice)}" fill="${ic}" stroke="${INK}" stroke-width="3"/>
      <path d="${shapePath(t.shape, W * 0.42, sy * 0.28, -W * 0.28, ice - sy * 0.32)}" fill="#fff" opacity=".4"/>
    </g>`;
  } else if (baked) {
    out += `<path d="${shapePath(t.shape, W * 0.42, sy * 0.28, -W * 0.28, top - sy * 0.32)}" fill="#fff" opacity=".22"/>`;
  }

  if (t.sprinkles && baked) {
    const pts = scatter(t.shape, Math.min(40, 6 + t.sprinkles * 5), rnd);
    out += `<g class="sprinkles">${sprinkleBits(pts, rnd, W, sy, 0, ice)}</g>`;
  }
  if (baked) out += topperSVG(t, 0, ice - 2, 26);
  return `<defs>${defs.join('')}</defs>${out}`;
}

function cupcakeSVG(t: TreatLook, o: TreatOpts, rnd: () => number): string {
  const baked = o.stage !== 'raw';
  const rise = o.rise ?? (baked ? 1 : 0.2);
  const wrapTop = 14;
  const wrapBot = 80;
  const wrapper = mix(PALETTE[t.batter].batter, '#ffffff', 0.45);
  let out = '';
  if (o.plate) out += plateSVG(72, wrapBot + 4, 16);
  if (o.tin) out += `<path d="M-84,${wrapBot - 8} L84,${wrapBot - 8} L76,${wrapBot + 8} L-76,${wrapBot + 8} Z" fill="${METAL}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`;

  // Muffin top, rising out of the paper case.
  const domeH = 10 + 40 * rise;
  const domeC = baked ? bakedTop(t.batter) : rawTop(t.batter);
  out += `<path d="M-60,${wrapTop + 6} C-64,${wrapTop - domeH * 0.8} -32,${wrapTop - domeH} 0,${wrapTop - domeH} C32,${wrapTop - domeH} 64,${wrapTop - domeH * 0.8} 60,${wrapTop + 6} Z" fill="${domeC}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`;
  if (!t.icing || !baked) out += `<ellipse cx="-22" cy="${f1(wrapTop - domeH * 0.6)}" rx="16" ry="6" fill="#fff" opacity=".35" transform="rotate(-12 -22 ${f1(wrapTop - domeH * 0.6)})"/>`;

  // Paper case with pleats.
  let pleats = '';
  for (let i = -3; i <= 3; i++) {
    const xt = i * 16;
    const xb = i * 11.5;
    pleats += `<path d="M${xt},${wrapTop + 4} L${xb},${wrapBot - 2}" stroke="${mix(wrapper, INK, 0.25)}" stroke-width="2.5" stroke-linecap="round"/>`;
  }
  out += `<path d="M-60,${wrapTop} L60,${wrapTop} L42,${wrapBot} L-42,${wrapBot} Z" fill="${wrapper}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>${pleats}
    <path d="M-60,${wrapTop} L60,${wrapTop}" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`;

  let peak = wrapTop - domeH;
  if (t.icing && baked) {
    const ic = PALETTE[t.icing].icing;
    const hi = mix(ic, '#ffffff', 0.45);
    const tiers = [
      { cy: wrapTop - 18, rx: 62, ry: 20 },
      { cy: wrapTop - 40, rx: 48, ry: 18 },
      { cy: wrapTop - 60, rx: 32, ry: 15 },
    ];
    let sw = '';
    for (const r of tiers) {
      sw += `<path d="M${-r.rx},${r.cy + 4} C${-r.rx - 4},${r.cy - r.ry} ${-r.rx * 0.4},${r.cy - r.ry * 1.3} 0,${r.cy - r.ry} C${r.rx * 0.4},${r.cy - r.ry * 1.3} ${r.rx + 4},${r.cy - r.ry} ${r.rx},${r.cy + 4} C${r.rx * 0.6},${r.cy + r.ry * 0.8} ${-r.rx * 0.6},${r.cy + r.ry * 0.8} ${-r.rx},${r.cy + 4} Z" fill="${ic}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M${-r.rx * 0.7},${r.cy - r.ry * 0.25} C${-r.rx * 0.4},${r.cy - r.ry * 0.9} ${-r.rx * 0.05},${r.cy - r.ry * 0.95} ${r.rx * 0.2},${r.cy - r.ry * 0.9}" stroke="${hi}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    }
    const tip = wrapTop - 90;
    sw += `<path d="M-14,${wrapTop - 66} C-12,${tip + 8} -2,${tip} 6,${tip - 2} C4,${tip + 8} 14,${wrapTop - 72} 14,${wrapTop - 66} Z" fill="${ic}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`;
    out += `<g class="icing">${sw}</g>`;
    peak = tip;
    if (t.sprinkles) {
      const n = Math.min(34, 5 + t.sprinkles * 4);
      const pts: Pt[] = [];
      for (let i = 0; i < n; i++) {
        const tier = tiers[i % 3];
        pts.push([(rnd() * 2 - 1) * tier.rx * 0.78, tier.cy - rnd() * tier.ry * 0.8]);
      }
      out += `<g class="sprinkles">${sprinkleBits(pts, rnd, 1, 1, 0, 0)}</g>`;
    }
    // A little shaped cookie stuck in the icing shows the shape choice.
    const sc = bakedTop(t.batter);
    out += `<g transform="translate(40,${wrapTop - 46}) rotate(16)">
      <path d="${shapePath(t.shape, 17, 17, 0, 3)}" fill="${mix(sc, INK, 0.3)}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="${shapePath(t.shape, 17, 17)}" fill="${sc}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="${shapePath(t.shape, 11, 11)}" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="3 4" opacity=".8"/>
    </g>`;
  } else if (baked && t.shape) {
    // Before icing, the shape is pressed into the top of the muffin.
    out += `<path d="${shapePath(t.shape, 16, 9, 0, wrapTop - domeH * 0.55)}" fill="none" stroke="${mix(domeC, INK, 0.35)}" stroke-width="3" stroke-linejoin="round"/>`;
  } else if (!baked) {
    out += `<path d="${shapePath(t.shape, 16, 8, 0, wrapTop - domeH * 0.4)}" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/>`;
  }
  if (baked && t.icing) out += topperSVG(t, 0, peak + 6, 18);
  return out;
}

function cookieSVG(t: TreatLook, o: TreatOpts, rnd: () => number): string {
  const W = 78;
  const sy = W * 0.62;
  const base = 44;
  const baked = o.stage !== 'raw';
  const H = baked ? 11 * (o.rise ?? 1) + 3 : 6;
  const top = base - H;
  const id = nid('co');
  const defs = [`<path id="${id}" d="${shapePath(t.shape, W, sy)}"/>`];
  let out = '';
  if (o.plate) out += plateSVG(W + 18, base + 8, sy * 0.62 + 20);
  if (o.tin) out += `<rect x="-98" y="${base - 4}" width="196" height="18" rx="7" fill="${METAL}" stroke="${INK}" stroke-width="3.5"/>
    <path d="M-90,${base + 1} L90,${base + 1}" stroke="#fff" stroke-width="3" opacity=".6" stroke-linecap="round"/>`;

  const topC = baked ? bakedTop(t.batter) : rawTop(t.batter);
  const sideC = baked ? mix(bakedSide(t.batter), '#b8783f', 0.2) : mix(rawTop(t.batter), '#caa27f', 0.15);
  const [ink, body] = slab(id, base, top, sideC);
  out += ink + body;
  out += `<use href="#${id}" y="${f1(top)}" fill="${topC}" stroke="${INK}" stroke-width="3"/>`;
  // Golden edge and chocolate chips.
  if (baked) {
    out += `<path d="${shapePath(t.shape, W * 0.9, sy * 0.9, 0, top)}" fill="none" stroke="${mix(topC, '#c8843f', 0.35)}" stroke-width="5" opacity=".55"/>`;
    const chips = scatter(t.shape, 9, rnd, 0.7);
    out += chips
      .map(([x, y]) => `<ellipse cx="${f1(x * W)}" cy="${f1(top + y * sy)}" rx="4.5" ry="3.5" fill="${t.batter === 'choc' ? '#fff4e0' : '#6b4230'}"/>`)
      .join('');
  }

  let ice = top;
  if (t.icing && baked) {
    const ic = PALETTE[t.icing].icing;
    const gid = nid('gl');
    defs.push(`<path id="${gid}" d="${shapePath(t.shape, W * 0.8, sy * 0.8)}"/>`);
    ice = top - 3;
    const [gInk, gBody] = slab(gid, top, ice, ic);
    out += `<g class="icing">${gInk.replace('stroke-width="7"', 'stroke-width="5"')}${gBody}
      <use href="#${gid}" y="${f1(ice)}" fill="${ic}" stroke="${INK}" stroke-width="2.5"/>
      <path d="${shapePath(t.shape, W * 0.3, sy * 0.18, -W * 0.3, ice - sy * 0.38)}" fill="#fff" opacity=".45"/></g>`;
  }
  if (t.sprinkles && baked) {
    const pts = scatter(t.shape, Math.min(36, 5 + t.sprinkles * 4), rnd, 0.66);
    out += `<g class="sprinkles">${sprinkleBits(pts, rnd, W, sy, 0, ice)}</g>`;
  }
  if (baked) out += topperSVG(t, 0, ice + 2, 28);
  return `<defs>${defs.join('')}</defs>${out}`;
}

export function treatSVG(t: TreatLook, o: TreatOpts = {}): string {
  const rnd = seeded(t.seed ?? `${t.kind}${t.shape}${t.batter}${t.icing ?? ''}`);
  const inner = t.kind === 'cake' ? cakeSVG(t, o, rnd) : t.kind === 'cupcake' ? cupcakeSVG(t, o, rnd) : cookieSVG(t, o, rnd);
  return `<svg class="treat treat-${t.kind}" viewBox="-100 -115 200 215" aria-hidden="true">${inner}</svg>`;
}

// ---------------------------------------------------------------------------
// Kitchen things

/** The mixing bowl. Contents are toggled by classes in the bake flow. */
export function bowlSVG(): string {
  const yolks = [[-26, -16], [4, -12], [30, -18]]
    .map(([x, y], i) => `<g class="yolk y${i + 1}" transform="translate(${x},${y})">
      <ellipse rx="18" ry="8" fill="#fffaf0" stroke="${INK}" stroke-width="2"/>
      <ellipse cx="1" cy="-1" rx="8" ry="5.5" fill="#ffc93b" stroke="${INK}" stroke-width="2"/>
      <ellipse cx="-1.5" cy="-3" rx="2.5" ry="1.6" fill="#fff" opacity=".7"/></g>`)
    .join('');
  return `<svg class="bowl" viewBox="-110 -80 220 160" aria-hidden="true">
    <ellipse cx="0" cy="68" rx="80" ry="9" fill="${INK}" opacity=".13"/>
    <ellipse cx="0" cy="-22" rx="96" ry="26" fill="#dff0ff" stroke="${INK}" stroke-width="4"/>
    <ellipse class="batter" cx="0" cy="-16" rx="82" ry="18"/>
    <g class="swirl"><path d="M-62,0 A62,62 0 0 1 62,0 A46,46 0 0 1 -30,0 A30,30 0 0 1 22,0 A14,14 0 0 1 -6,0" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".55"/></g>
    <g class="flour-pile"><path d="M-54,-12 C-40,-40 -10,-44 6,-40 C28,-44 50,-30 56,-12 Z" fill="#fffdf8" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M-24,-30 C-14,-36 0,-36 8,-33" stroke="#e8dccb" stroke-width="3" fill="none" stroke-linecap="round"/></g>
    <g class="yolks">${yolks}</g>
    <g class="colour-blob"><path d="M-10,-20 C-2,-32 18,-30 22,-20 C26,-10 10,-4 0,-8 C-10,-6 -16,-12 -10,-20 Z" stroke="${INK}" stroke-width="2.5"/></g>
    <path d="M-96,-22 C-94,38 -54,66 0,66 C54,66 94,38 96,-22 C70,-4 -70,-4 -96,-22 Z" fill="#8fcff7" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M-84,-2 C-78,20 -62,38 -44,48" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".45"/>
    <g fill="#fff" opacity=".85"><circle cx="-40" cy="22" r="6"/><circle cx="-8" cy="34" r="6"/><circle cx="26" cy="30" r="6"/><circle cx="56" cy="16" r="6"/><circle cx="8" cy="10" r="4"/><circle cx="-62" cy="4" r="4"/><circle cx="44" cy="46" r="4"/></g>
  </svg>`;
}

/** A wooden spoon (held in the bowl while stirring). */
export function spoonSVG(): string {
  return `<svg class="spoon" viewBox="-20 -110 40 130" aria-hidden="true">
    <path d="M-4,-106 L4,-106 L5,-10 L-5,-10 Z" fill="#e8b27a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="0" cy="2" rx="13" ry="17" fill="#e8b27a" stroke="${INK}" stroke-width="3"/>
    <ellipse cx="-3" cy="-2" rx="4" ry="8" fill="#fff" opacity=".4"/>
  </svg>`;
}

export function eggSVG(): string {
  return `<svg class="egg" viewBox="-40 -52 80 100" aria-hidden="true">
    <ellipse cx="0" cy="44" rx="26" ry="5" fill="${INK}" opacity=".13"/>
    <path d="M0,-46 C22,-46 34,-14 34,10 C34,32 20,44 0,44 C-20,44 -34,32 -34,10 C-34,-14 -22,-46 0,-46 Z" fill="#fff8ec" stroke="${INK}" stroke-width="4"/>
    <circle cx="10" cy="-16" r="2.5" fill="#e9d6bd"/><circle cx="-12" cy="6" r="2" fill="#e9d6bd"/><circle cx="14" cy="16" r="2.2" fill="#e9d6bd"/>
    <ellipse cx="-12" cy="-18" rx="6" ry="11" fill="#fff" transform="rotate(20 -12 -18)"/>
    <path class="egg-crack" d="M-30,2 L-18,-6 L-8,4 L4,-6 L14,4 L24,-4 L32,2" stroke="${INK}" stroke-width="3" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
  </svg>`;
}

/** A sugar shaker: a glass jar of sparkly sugar with a holey silver lid. */
export function sugarSVG(): string {
  return `<svg class="sugar-shaker" viewBox="-60 -80 120 150" aria-hidden="true">
    <ellipse cx="0" cy="64" rx="40" ry="6" fill="${INK}" opacity=".13"/>
    <path d="M-36,-28 C-44,0 -44,40 -34,60 L34,60 C44,40 44,0 36,-28 Z" fill="#eaf6ff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M-38,4 C-40,26 -38,46 -32,58 L32,58 C38,46 40,26 38,4 C20,12 -20,12 -38,4 Z" fill="#fffdf8"/>
    <g fill="#ffd6e6"><circle cx="-18" cy="30" r="3"/><circle cx="10" cy="22" r="2.5"/><circle cx="20" cy="44" r="3"/><circle cx="-6" cy="48" r="2.5"/></g>
    <g fill="#fff" stroke="#e8dccb" stroke-width="1.5"><rect x="-26" y="18" width="9" height="9" rx="2"/><rect x="4" y="34" width="9" height="9" rx="2" transform="rotate(15 8 38)"/></g>
    <path d="M-26,-16 C-30,6 -30,30 -24,48" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".8"/>
    <path d="M-40,-30 C-40,-62 40,-62 40,-30 Z" fill="#dfe6f2" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <rect x="-42" y="-34" width="84" height="12" rx="5" fill="#c8d2e4" stroke="${INK}" stroke-width="4"/>
    <g fill="${INK}" opacity=".55"><circle cx="-14" cy="-46" r="3"/><circle cx="0" cy="-50" r="3"/><circle cx="14" cy="-46" r="3"/><circle cx="-7" cy="-40" r="2.5"/><circle cx="7" cy="-40" r="2.5"/></g>
    <path d="M-22,-50 C-16,-56 -8,-58 0,-58" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>
  </svg>`;
}

export function flourSVG(): string {
  return `<svg class="flour-bag" viewBox="-60 -80 120 150" aria-hidden="true">
    <ellipse cx="0" cy="64" rx="46" ry="6" fill="${INK}" opacity=".13"/>
    <path d="M-40,-50 L40,-50 C48,-10 50,30 46,62 L-46,62 C-50,30 -48,-10 -40,-50 Z" fill="#f6ead6" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M-40,-50 C-30,-64 -14,-58 -6,-70 C2,-60 18,-66 26,-58 C32,-62 38,-58 40,-50 Z" fill="#fffdf8" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M-40,-50 L40,-50" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="0" cy="12" r="26" fill="#fff" stroke="#e8c98f" stroke-width="3"/>
    <g stroke="#d9a441" stroke-width="3" fill="#ffd87a" stroke-linecap="round">
      <path d="M0,32 L0,-6" fill="none"/>
      <ellipse cx="-6" cy="4" rx="4" ry="7" transform="rotate(-30 -6 4)"/><ellipse cx="6" cy="4" rx="4" ry="7" transform="rotate(30 6 4)"/>
      <ellipse cx="-6" cy="-6" rx="4" ry="7" transform="rotate(-30 -6 -6)"/><ellipse cx="6" cy="-6" rx="4" ry="7" transform="rotate(30 6 -6)"/>
      <ellipse cx="0" cy="-14" rx="4" ry="7"/>
    </g>
    <path d="M-34,-36 C-38,0 -38,30 -36,50" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".6"/>
  </svg>`;
}

/** A happy paint drop, for picking a colour. */
export function dropSVG(c: ColorId): string {
  const col = PALETTE[c].batter;
  const dark = mix(col, INK, 0.25);
  return `<svg class="drop" viewBox="-50 -60 100 110" aria-hidden="true">
    <path d="M0,-54 C14,-30 38,-8 38,14 C38,36 20,46 0,46 C-20,46 -38,36 -38,14 C-38,-8 -14,-30 0,-54 Z" fill="${col}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M-24,4 C-24,-10 -14,-24 -6,-34" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".55"/>
    <circle cx="-11" cy="16" r="4.5" fill="${INK}"/><circle cx="11" cy="16" r="4.5" fill="${INK}"/>
    <circle cx="-9.5" cy="14.5" r="1.5" fill="#fff"/><circle cx="12.5" cy="14.5" r="1.5" fill="#fff"/>
    <path d="M-7,26 Q0,32 7,26" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="-20" cy="24" r="4" fill="${dark}" opacity=".35"/><circle cx="20" cy="24" r="4" fill="${dark}" opacity=".35"/>
  </svg>`;
}

/** A dollop of icing on a little dish, for picking the icing. */
export function icingPotSVG(c: ColorId): string {
  const col = PALETTE[c].icing;
  const hi = mix(col, '#ffffff', 0.45);
  return `<svg class="icing-pot" viewBox="-50 -56 100 104" aria-hidden="true">
    <path d="M-40,14 L40,14 L32,42 L-32,42 Z" fill="#fff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M-40,14 L40,14" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <path d="M-36,16 C-40,-2 -20,-8 -18,-8 C-24,-26 -6,-34 0,-32 C-4,-44 8,-52 12,-50 C8,-40 22,-36 18,-24 C30,-22 42,-6 36,16 Z" fill="${col}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M-26,4 C-24,-6 -14,-8 -10,-8 M-8,-22 C-4,-28 4,-30 8,-30" stroke="${hi}" stroke-width="5" fill="none" stroke-linecap="round"/>
  </svg>`;
}

/** Flat shape (a tin or cutter), for picking a shape. */
export function shapeSVG(s: ShapeId, c: ColorId): string {
  const col = PALETTE[c].batter;
  return `<svg class="shape-pick" viewBox="-50 -50 100 100" aria-hidden="true">
    <path d="${shapePath(s, 38, 38, 0, 5)}" fill="${mix(col, INK, 0.3)}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="${shapePath(s, 38, 38)}" fill="${col}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="${shapePath(s, 16, 12, -12, -14)}" fill="#fff" opacity=".45"/>
  </svg>`;
}

export function shakerSVG(): string {
  const bits = [[-12, 10, '#ff5d8f'], [2, 20, '#ffd23f'], [14, 6, '#4ea8ff'], [-6, 30, '#7fd35b'], [10, 34, '#a86cf0'], [-14, 40, '#ff9f1c'], [4, 44, '#ff5d8f'], [16, 24, '#7fd35b'], [-2, 2, '#a86cf0']]
    .map(([x, y, c]) => `<rect x="-5" y="-2" width="10" height="4" rx="2" fill="${c}" transform="translate(${x},${y}) rotate(${(Number(x) * 7) % 180})"/>`)
    .join('');
  return `<svg class="shaker" viewBox="-40 -60 80 120" aria-hidden="true">
    <path d="M-26,-18 L26,-18 L28,50 C28,56 24,58 18,58 L-18,58 C-24,58 -28,56 -28,50 Z" fill="#e9f6ff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    ${bits}
    <path d="M-20,-8 L-20,44" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>
    <path d="M-30,-18 L30,-18 L26,-44 C20,-54 -20,-54 -26,-44 Z" fill="#ff8fc0" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <g fill="${INK}"><circle cx="-10" cy="-40" r="2.5"/><circle cx="0" cy="-44" r="2.5"/><circle cx="10" cy="-40" r="2.5"/><circle cx="-4" cy="-32" r="2.5"/><circle cx="6" cy="-32" r="2.5"/></g>
  </svg>`;
}

/** The oven body. The door is drawn separately so it can swing open. */
export function ovenSVG(): string {
  return `<svg class="oven-body" viewBox="0 0 200 230" preserveAspectRatio="none" aria-hidden="true">
    <rect x="18" y="214" width="20" height="14" rx="4" fill="${INK}"/><rect x="162" y="214" width="20" height="14" rx="4" fill="${INK}"/>
    <rect x="6" y="6" width="188" height="212" rx="22" fill="#9fe3d0" stroke="${INK}" stroke-width="5"/>
    <rect x="16" y="14" width="168" height="40" rx="12" fill="#c8f1e5"/>
    <g class="knob"><circle cx="44" cy="34" r="11" fill="#fff" stroke="${INK}" stroke-width="3.5"/><path d="M44,34 L44,25" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/></g>
    <g class="knob"><circle cx="156" cy="34" r="11" fill="#fff" stroke="${INK}" stroke-width="3.5"/><path d="M156,34 L163,28" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/></g>
    <circle cx="100" cy="34" r="16" fill="#fff" stroke="${INK}" stroke-width="3.5"/>
    <g class="dial-hand"><path d="M100,34 L100,22" stroke="#ff5d73" stroke-width="3.5" stroke-linecap="round"/></g>
    <circle cx="100" cy="34" r="3" fill="${INK}"/>
    <circle class="oven-light" cx="126" cy="34" r="5" fill="#c9c3d6" stroke="${INK}" stroke-width="2.5"/>
    <rect x="18" y="62" width="164" height="146" rx="14" fill="#6a577f"/>
  </svg>`;
}

export function ovenDoorSVG(): string {
  return `<svg class="oven-door-svg" viewBox="0 0 170 150" preserveAspectRatio="none" aria-hidden="true">
    <defs><mask id="ovenGlass"><rect width="170" height="150" fill="#fff"/><rect x="22" y="36" width="126" height="92" rx="14" fill="#000"/></mask></defs>
    <rect x="3" y="3" width="164" height="144" rx="16" fill="#fff4e0" stroke="${INK}" stroke-width="5" mask="url(#ovenGlass)"/>
    <rect x="22" y="36" width="126" height="92" rx="14" fill="#bfe6ff" opacity=".18" stroke="${INK}" stroke-width="4"/>
    <path d="M36,50 L60,50 M36,62 L48,62" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".55"/>
    <rect x="34" y="12" width="102" height="12" rx="6" fill="#c9c3d6" stroke="${INK}" stroke-width="3.5"/>
  </svg>`;
}

// ---------------------------------------------------------------------------
// Animal customers. Each peeks in through the serving hatch, paws on the sill.
// `.m-smile` / `.m-open` swap while chomping.

const S = `stroke="${INK}" stroke-width="4" stroke-linejoin="round"`;

function eyes(ex: number, ey: number, r = 7.5): string {
  return `<g class="an-eyes">
    <ellipse cx="${-ex}" cy="${ey}" rx="${r}" ry="${r * 1.15}" fill="#fff"/><ellipse cx="${ex}" cy="${ey}" rx="${r}" ry="${r * 1.15}" fill="#fff"/>
    <circle cx="${-ex + 1.5}" cy="${ey + 1}" r="${r * 0.58}" fill="#2a1836"/><circle cx="${ex + 1.5}" cy="${ey + 1}" r="${r * 0.58}" fill="#2a1836"/>
    <circle cx="${-ex + 3}" cy="${ey - 1.5}" r="${r * 0.22}" fill="#fff"/><circle cx="${ex + 3}" cy="${ey - 1.5}" r="${r * 0.22}" fill="#fff"/>
  </g>
  <g class="an-happy-eyes"><path d="M${-ex - r},${ey + 2} Q${-ex},${ey - r * 1.2} ${-ex + r},${ey + 2} M${ex - r},${ey + 2} Q${ex},${ey - r * 1.2} ${ex + r},${ey + 2}" stroke="#2a1836" stroke-width="4" fill="none" stroke-linecap="round"/></g>`;
}

function cheeks(cx: number, cy: number, r = 7): string {
  return `<circle cx="${-cx}" cy="${cy}" r="${r}" fill="#ff8fb1" opacity=".45"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#ff8fb1" opacity=".45"/>`;
}

function mouth(x: number, y: number, w = 9, open = 11): string {
  return `<g class="m-smile"><path d="M${x - w},${y} Q${x},${y + w * 1.1} ${x + w},${y}" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/></g>
    <g class="m-open"><ellipse cx="${x}" cy="${y + 3}" rx="${open}" ry="${open * 0.9}" fill="#7a2f4a" stroke="${INK}" stroke-width="3"/>
    <ellipse cx="${x}" cy="${y + 3 + open * 0.45}" rx="${open * 0.6}" ry="${open * 0.35}" fill="#ff8fa8"/></g>`;
}

function paws(fill: string, y = 104): string {
  return `<ellipse cx="-44" cy="${y}" rx="20" ry="12" fill="${fill}" ${S}/><ellipse cx="44" cy="${y}" rx="20" ry="12" fill="${fill}" ${S}/>
    <path d="M-50,${y - 4} L-50,${y + 4} M-40,${y - 4} L-40,${y + 4} M40,${y - 4} L40,${y + 4} M50,${y - 4} L50,${y + 4}" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>`;
}

function torso(fill: string, belly?: string): string {
  return `<path d="M-72,118 C-72,62 -44,40 0,40 C44,40 72,62 72,118 Z" fill="${fill}" ${S}/>
    ${belly ? `<path d="M-38,118 C-38,82 -22,66 0,66 C22,66 38,82 38,118 Z" fill="${belly}"/>` : ''}`;
}

const ANIMAL_ART: Record<AnimalId, () => string> = {
  bear: () => {
    const fur = '#c98f6a';
    const lt = '#f2d2b3';
    return `${torso(fur, lt)}
      <circle cx="-44" cy="-62" r="20" fill="${fur}" ${S}/><circle cx="44" cy="-62" r="20" fill="${fur}" ${S}/>
      <circle cx="-44" cy="-62" r="10" fill="${lt}"/><circle cx="44" cy="-62" r="10" fill="${lt}"/>
      <circle cx="0" cy="-18" r="58" fill="${fur}" ${S}/>
      <ellipse cx="0" cy="8" rx="28" ry="21" fill="${lt}" ${S}/>
      <ellipse cx="0" cy="-2" rx="10" ry="7" fill="#5a3b2e"/><ellipse cx="-3" cy="-4" rx="3" ry="2" fill="#fff" opacity=".6"/>
      ${eyes(21, -28)}${cheeks(34, -6)}${mouth(0, 11, 8, 10)}
      <g class="crumbs"><circle cx="-18" cy="30" r="3.5" fill="#e6a15a"/><circle cx="14" cy="34" r="3" fill="#e6a15a"/><circle cx="30" cy="20" r="2.5" fill="#e6a15a"/><circle cx="-30" cy="18" r="2.5" fill="#e6a15a"/></g>
      ${paws(fur)}`;
  },
  hippo: () => {
    const c = '#b8a6e0';
    const lt = '#d9ccf5';
    return `${torso(c, lt)}
      <ellipse cx="-38" cy="-70" rx="11" ry="14" fill="${c}" ${S}/><ellipse cx="38" cy="-70" rx="11" ry="14" fill="${c}" ${S}/>
      <ellipse cx="-38" cy="-70" rx="5" ry="7" fill="#ff9fbd"/><ellipse cx="38" cy="-70" rx="5" ry="7" fill="#ff9fbd"/>
      <ellipse cx="0" cy="-32" rx="54" ry="46" fill="${c}" ${S}/>
      <ellipse cx="0" cy="14" rx="64" ry="38" fill="${lt}" ${S}/>
      <ellipse cx="-18" cy="0" rx="6" ry="4.5" fill="${INK}"/><ellipse cx="18" cy="0" rx="6" ry="4.5" fill="${INK}"/>
      ${eyes(22, -46, 8)}${cheeks(46, 12, 8)}
      <g class="m-smile"><path d="M-30,26 Q0,42 30,26" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/></g>
      <g class="m-open"><path d="M-40,18 C-40,56 40,56 40,18 Z" fill="#7a2f4a" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
        <rect x="-26" y="18" width="10" height="10" rx="2" fill="#fff" stroke="${INK}" stroke-width="2"/><rect x="16" y="18" width="10" height="10" rx="2" fill="#fff" stroke="${INK}" stroke-width="2"/>
        <ellipse cx="0" cy="40" rx="18" ry="7" fill="#ff8fa8"/></g>
      ${paws(c)}`;
  },
  bunny: () => {
    const c = '#f5efe9';
    const pink = '#ffc2d4';
    return `${torso(c, '#ffffff')}
      <g class="bunny-ears">
      <ellipse cx="-24" cy="-96" rx="16" ry="44" fill="${c}" ${S} transform="rotate(-10 -24 -96)"/><ellipse cx="-24" cy="-94" rx="7" ry="32" fill="${pink}" transform="rotate(-10 -24 -94)"/>
      <ellipse cx="24" cy="-96" rx="16" ry="44" fill="${c}" ${S} transform="rotate(12 24 -96)"/><ellipse cx="24" cy="-94" rx="7" ry="32" fill="${pink}" transform="rotate(12 24 -94)"/>
      </g>
      <circle cx="0" cy="-16" r="52" fill="${c}" ${S}/>
      ${eyes(19, -26)}${cheeks(32, -4)}
      <path d="M-6,-6 L6,-6 L0,1 Z" fill="#ff8fb1" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M-44,-4 L-22,-2 M-44,6 L-22,3 M44,-4 L22,-2 M44,6 L22,3" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity=".5"/>
      <g class="m-smile"><path d="M-9,4 Q-4,10 0,4 Q4,10 9,4" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <rect x="-5" y="7" width="10" height="9" rx="2" fill="#fff" stroke="${INK}" stroke-width="2"/><path d="M0,7 L0,16" stroke="${INK}" stroke-width="1.5"/></g>
      <g class="m-open"><ellipse cx="0" cy="10" rx="9" ry="8" fill="#7a2f4a" stroke="${INK}" stroke-width="3"/>
        <rect x="-5" y="2" width="10" height="7" rx="2" fill="#fff" stroke="${INK}" stroke-width="2"/></g>
      ${paws(c)}`;
  },
  piggy: () => {
    const c = '#ffb8cc';
    const dk = '#f58fad';
    return `${torso(c, '#ffd2df')}
      <path d="M-50,-58 L-44,-92 L-18,-68 Z" fill="${c}" ${S}/><path d="M50,-58 L44,-92 L18,-68 Z" fill="${c}" ${S}/>
      <path d="M-44,-70 L-42,-84 L-30,-72 Z" fill="${dk}"/><path d="M44,-70 L42,-84 L30,-72 Z" fill="${dk}"/>
      <circle cx="0" cy="-18" r="56" fill="${c}" ${S}/>
      ${eyes(22, -34)}${cheeks(38, -8, 8)}
      <ellipse cx="0" cy="-6" rx="24" ry="16" fill="#ff9fbd" ${S}/>
      <ellipse cx="-8" cy="-6" rx="4" ry="6" fill="#c75c7e"/><ellipse cx="8" cy="-6" rx="4" ry="6" fill="#c75c7e"/>
      <g class="snout-icing"><path d="M-14,-18 C-10,-26 8,-26 14,-18 C18,-10 8,-12 6,-6 C2,-12 -6,-8 -10,-12 C-14,-12 -18,-12 -14,-18 Z" style="fill: var(--icing, #ff8fc0)" stroke="${INK}" stroke-width="2.5"/></g>
      ${mouth(0, 20, 9, 11)}
      ${paws(c)}`;
  },
  elephant: () => {
    const c = '#a9bfd8';
    return `${torso(c, '#c4d4e6')}
      <ellipse cx="-62" cy="-26" rx="36" ry="44" fill="${c}" ${S}/><ellipse cx="62" cy="-26" rx="36" ry="44" fill="${c}" ${S}/>
      <ellipse cx="-62" cy="-24" rx="22" ry="30" fill="#f5c6d6"/><ellipse cx="62" cy="-24" rx="22" ry="30" fill="#f5c6d6"/>
      <circle cx="0" cy="-30" r="50" fill="${c}" ${S}/>
      ${eyes(20, -42)}${cheeks(34, -18)}
      ${mouth(22, 12, 8, 10)}
      <g class="trunk"><path d="M-12,-20 C-14,10 -12,40 -24,58 C-30,68 -18,76 -10,68 C0,54 12,30 12,-20 Z" fill="${c}" ${S}/>
        <path d="M-10,0 L4,0 M-12,16 L4,16 M-14,32 L2,32" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" opacity=".45"/></g>
      ${paws(c)}`;
  },
  dino: () => {
    const c = '#8edb7a';
    const spikes = [-44, -24, 0, 24, 44]
      .map((x, i) => {
        const y = -78 + Math.abs(x) * 0.5;
        return `<path d="M${x - 11},${y + 10} L${x},${y - 12 - (i === 2 ? 4 : 0)} L${x + 11},${y + 10} Z" fill="#ffb870" ${S}/>`;
      })
      .join('');
    return `${torso(c, '#c8f0b8')}
      ${spikes}
      <ellipse cx="0" cy="-22" rx="60" ry="52" fill="${c}" ${S}/>
      <circle cx="-30" cy="-46" r="5" fill="#6cc070"/><circle cx="34" cy="-54" r="4" fill="#6cc070"/><circle cx="40" cy="-38" r="3" fill="#6cc070"/>
      ${eyes(24, -36, 8.5)}${cheeks(42, -10)}
      <ellipse cx="-9" cy="-10" rx="3" ry="2" fill="${INK}"/><ellipse cx="9" cy="-10" rx="3" ry="2" fill="${INK}"/>
      <g class="m-smile"><path d="M-32,4 Q0,26 32,4" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <path d="M-18,10 L-14,16 L-10,12 M10,12 L14,16 L18,10" stroke="${INK}" stroke-width="2" fill="#fff" stroke-linejoin="round"/></g>
      <g class="m-open"><path d="M-38,0 C-36,40 36,40 38,0 Z" fill="#7a2f4a" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M-28,2 L-24,12 L-20,2 M-12,2 L-8,12 L-4,2 M4,2 L8,12 L12,2 M20,2 L24,12 L28,2" fill="#fff" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
        <ellipse cx="0" cy="26" rx="14" ry="6" fill="#ff8fa8"/></g>
      ${paws(c)}`;
  },
  owl: () => {
    const c = '#c9a27a';
    const lt = '#f4e1c6';
    const feathers = [-20, 0, 20].map((x) => `<path d="M${x - 9},84 Q${x},94 ${x + 9},84" stroke="${mix(lt, INK, 0.3)}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`).join('')
      + [-10, 10].map((x) => `<path d="M${x - 9},98 Q${x},108 ${x + 9},98" stroke="${mix(lt, INK, 0.3)}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`).join('');
    return `<path d="M-68,118 C-74,40 -60,-10 0,-10 C60,-10 74,40 68,118 Z" fill="${c}" ${S}/>
      <path d="M-40,118 C-42,80 -26,62 0,62 C26,62 42,80 40,118 Z" fill="${lt}"/>${feathers}
      <path d="M-54,-60 L-50,-96 L-24,-70 Z" fill="${c}" ${S}/><path d="M54,-60 L50,-96 L24,-70 Z" fill="${c}" ${S}/>
      <ellipse cx="0" cy="-26" rx="62" ry="52" fill="${c}" ${S}/>
      <circle cx="-24" cy="-30" r="25" fill="#fff4e0" ${S}/><circle cx="24" cy="-30" r="25" fill="#fff4e0" ${S}/>
      <g class="an-eyes"><circle cx="-24" cy="-30" r="14" fill="#ffd23f" stroke="${INK}" stroke-width="2.5"/><circle cx="24" cy="-30" r="14" fill="#ffd23f" stroke="${INK}" stroke-width="2.5"/>
        <circle cx="-22" cy="-29" r="8" fill="#2a1836"/><circle cx="26" cy="-29" r="8" fill="#2a1836"/>
        <circle cx="-19" cy="-32" r="2.8" fill="#fff"/><circle cx="29" cy="-32" r="2.8" fill="#fff"/></g>
      <g class="an-happy-eyes"><path d="M-36,-26 Q-24,-40 -12,-26 M12,-26 Q24,-40 36,-26" stroke="#2a1836" stroke-width="4" fill="none" stroke-linecap="round"/></g>
      ${cheeks(44, -4)}
      <g class="m-smile"><path d="M-9,-8 L9,-8 L0,8 Z" fill="#ffae5c" ${S}/></g>
      <g class="m-open"><path d="M-10,-12 L10,-12 L0,-2 Z" fill="#ffae5c" ${S}/><path d="M-8,2 L8,2 L0,14 Z" fill="#ffae5c" ${S}/></g>
      <path d="M-66,30 C-86,50 -80,80 -62,92" fill="${mix(c, INK, 0.15)}" ${S}/><path d="M66,30 C86,50 80,80 62,92" fill="${mix(c, INK, 0.15)}" ${S}/>
      ${paws('#ffae5c', 108)}`;
  },
  cat: () => {
    const c = '#ffb870';
    const dk = '#f0934a';
    return `${torso(c, '#fff1e0')}
      <path d="M-52,-54 L-44,-100 L-12,-74 Z" fill="${c}" ${S}/><path d="M52,-54 L44,-100 L12,-74 Z" fill="${c}" ${S}/>
      <path d="M-44,-66 L-40,-88 L-24,-74 Z" fill="#ffc2d4"/><path d="M44,-66 L40,-88 L24,-74 Z" fill="#ffc2d4"/>
      <circle cx="0" cy="-20" r="56" fill="${c}" ${S}/>
      <path d="M-12,-74 L-8,-58 M0,-76 L0,-58 M12,-74 L8,-58" stroke="${dk}" stroke-width="6" stroke-linecap="round"/>
      <path d="M-56,-26 L-42,-24 M-56,-12 L-42,-14 M56,-26 L42,-24 M56,-12 L42,-14" stroke="${dk}" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="-12" cy="4" rx="15" ry="11" fill="#fff1e0"/><ellipse cx="12" cy="4" rx="15" ry="11" fill="#fff1e0"/>
      ${eyes(21, -28)}${cheeks(36, -4)}
      <path d="M-6,-6 L6,-6 L0,1 Z" fill="#ff8fb1" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M-50,0 L-26,2 M-50,10 L-26,7 M50,0 L26,2 M50,10 L26,7" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity=".5"/>
      <g class="m-smile"><path d="M-9,5 Q-4,11 0,5 Q4,11 9,5" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/></g>
      <g class="m-open"><ellipse cx="0" cy="10" rx="9" ry="8" fill="#7a2f4a" stroke="${INK}" stroke-width="3"/>
        <path class="cat-tongue" d="M-5,12 C-5,24 5,24 5,12 Z" fill="#ff8fa8" stroke="${INK}" stroke-width="2"/></g>
      ${paws(c)}`;
  },
};

export function animalSVG(a: AnimalId): string {
  return `<svg class="animal-svg an-${a}" viewBox="-110 -140 220 262" aria-hidden="true">${ANIMAL_ART[a]()}</svg>`;
}

// ---------------------------------------------------------------------------
// Pip the mouse chef (the guide)

export function mouseSVG(): string {
  const fur = '#cfc6dc';
  const pink = '#ffc2d4';
  return `<svg class="mouse" viewBox="-70 -104 140 170" aria-hidden="true">
    <path class="m-tail" d="M30,40 C60,40 66,10 56,-2 C50,-10 58,-18 64,-12" stroke="${INK}" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path class="m-tail" d="M30,40 C60,40 66,10 56,-2 C50,-10 58,-18 64,-12" stroke="${pink}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <ellipse cx="-14" cy="60" rx="14" ry="7" fill="${pink}" stroke="${INK}" stroke-width="3"/><ellipse cx="14" cy="60" rx="14" ry="7" fill="${pink}" stroke="${INK}" stroke-width="3"/>
    <path d="M-30,56 C-34,24 -22,6 0,6 C22,6 34,24 30,56 Z" fill="${fur}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M-20,56 L-22,24 C-10,18 10,18 22,24 L20,56 Z" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M-8,36 C-4,30 4,30 8,36 C10,42 2,46 0,48 C-2,46 -10,42 -8,36 Z" fill="#ff8fb1"/>
    <g class="m-arm-l"><ellipse cx="-30" cy="30" rx="8" ry="12" fill="${fur}" stroke="${INK}" stroke-width="3" transform="rotate(20 -30 30)"/></g>
    <g class="m-arm-r"><ellipse cx="30" cy="30" rx="8" ry="12" fill="${fur}" stroke="${INK}" stroke-width="3" transform="rotate(-20 30 30)"/></g>
    <circle cx="-36" cy="-30" r="22" fill="${fur}" stroke="${INK}" stroke-width="3.5"/><circle cx="36" cy="-30" r="22" fill="${fur}" stroke="${INK}" stroke-width="3.5"/>
    <circle cx="-36" cy="-30" r="13" fill="${pink}"/><circle cx="36" cy="-30" r="13" fill="${pink}"/>
    <ellipse cx="0" cy="-14" rx="32" ry="28" fill="${fur}" stroke="${INK}" stroke-width="3.5"/>
    <g class="m-flour"><circle cx="-12" cy="-20" r="7" fill="#fff"/><circle cx="14" cy="-6" r="6" fill="#fff"/><circle cx="-4" cy="2" r="5" fill="#fff"/><circle cx="22" cy="-22" r="4" fill="#fff"/></g>
    <g class="m-eyes"><ellipse cx="-11" cy="-16" rx="5" ry="6" fill="#2a1836"/><ellipse cx="11" cy="-16" rx="5" ry="6" fill="#2a1836"/>
      <circle cx="-9.5" cy="-18" r="1.8" fill="#fff"/><circle cx="12.5" cy="-18" r="1.8" fill="#fff"/></g>
    <circle cx="-20" cy="-4" r="4.5" fill="#ff8fb1" opacity=".5"/><circle cx="20" cy="-4" r="4.5" fill="#ff8fb1" opacity=".5"/>
    <ellipse cx="0" cy="-4" rx="5" ry="4" fill="#ff8fb1" stroke="${INK}" stroke-width="2"/>
    <path d="M-8,-2 L-30,-6 M-8,1 L-30,4 M8,-2 L30,-6 M8,1 L30,4" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>
    <path d="M-5,4 Q0,9 5,4" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <g class="m-hat">
      <path d="M-22,-38 L22,-38 L20,-52 L-20,-52 Z" fill="#fff" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M-20,-50 C-38,-52 -40,-76 -22,-78 C-22,-96 2,-100 6,-86 C16,-100 40,-90 30,-74 C44,-70 38,-50 20,-50 Z" fill="#fff" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M-10,-52 C-10,-60 -6,-66 0,-68 M10,-52 C12,-60 14,-64 18,-66" stroke="#e8def5" stroke-width="3" fill="none" stroke-linecap="round"/>
    </g>
  </svg>`;
}

// ---------------------------------------------------------------------------
// Shop window art

const G = `stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"`;

export function awningSVG(striped: boolean): string {
  const n = 12;
  let stripes = '';
  let scallops = '';
  for (let i = 0; i < n; i++) {
    const x = (i * 1000) / n;
    const w = 1000 / n;
    const c = striped ? (i % 2 === 0 ? '#ff8fb1' : '#fffaf0') : '#ff8fb1';
    stripes += `<path d="M${x},0 L${x + w},0 L${x + w},60 L${x},60 Z" fill="${c}"/>`;
    scallops += `<path d="M${x},58 A${w / 2},${w / 3} 0 0 0 ${x + w},58 Z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
  }
  return `<svg class="awning-svg" viewBox="0 -4 1000 110" preserveAspectRatio="none" aria-hidden="true">
    ${stripes}<path d="M0,0 L1000,0 L1000,60 L0,60 Z" fill="none" stroke="${INK}" stroke-width="4"/>
    ${scallops}
    <path d="M0,12 L1000,12" stroke="#fff" stroke-width="4" opacity=".4"/>
  </svg>`;
}

export function buntingSVG(): string {
  const cols = ['#ff8fb1', '#ffd84d', '#74bdfa', '#8edb7a', '#b995f2'];
  let flags = '';
  const n = 11;
  for (let i = 0; i < n; i++) {
    const x = 20 + (i * 960) / (n - 1);
    const t = (i / (n - 1)) * 2 - 1;
    const y = 10 + (1 - t * t) * 30;
    flags += `<path class="flag" style="--i:${i}" d="M${x - 30},${y - 4} L${x + 30},${y - 4} L${x},${y + 50} Z" fill="${cols[i % cols.length]}" ${G}/>`;
  }
  return `<svg class="bunting-svg" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0,6 Q500,74 1000,6" stroke="${INK}" stroke-width="4" fill="none"/>${flags}
  </svg>`;
}

export function lightsSVG(): string {
  const cols = ['#ffd84d', '#ff8fb1', '#74bdfa', '#8edb7a', '#b995f2'];
  let bulbs = '';
  const n = 16;
  for (let i = 0; i < n; i++) {
    const x = 20 + (i * 960) / (n - 1);
    const t = (i / (n - 1)) * 2 - 1;
    const y = 8 + (1 - t * t) * 22 + (i % 2) * 6;
    bulbs += `<g class="bulb" style="--i:${i}; --c:${cols[i % cols.length]}" transform="translate(${x},${y})">
      <circle class="bulb-glow" r="18" fill="${cols[i % cols.length]}"/>
      <rect x="-5" y="-4" width="10" height="7" rx="2" fill="#8c7aa3"/>
      <ellipse cx="0" cy="10" rx="7" ry="10" fill="${cols[i % cols.length]}" stroke="${INK}" stroke-width="2.5"/></g>`;
  }
  return `<svg class="lights-svg" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0,4 Q250,40 500,24 T1000,4" stroke="${INK}" stroke-width="3" fill="none"/>${bulbs}
  </svg>`;
}

export function flowerBoxSVG(): string {
  const cols = ['#ff8fb1', '#ffd84d', '#b995f2', '#74bdfa', '#ff9f1c'];
  let fl = '';
  for (let i = 0; i < 9; i++) {
    const x = 40 + i * 65;
    const y = 30 + (i % 2) * 12;
    const c = cols[i % cols.length];
    const petals = [0, 72, 144, 216, 288]
      .map((a) => `<ellipse cx="0" cy="-12" rx="8" ry="12" fill="${c}" stroke="${INK}" stroke-width="2.5" transform="rotate(${a})"/>`)
      .join('');
    fl += `<g transform="translate(${x},${y})"><g class="box-flower" style="--i:${i}">
      <path d="M0,4 L0,44" stroke="#6cc070" stroke-width="5"/>
      <ellipse cx="10" cy="30" rx="10" ry="5" fill="#8fdb8a" stroke="${INK}" stroke-width="2" transform="rotate(-30 10 30)"/>
      ${petals}<circle r="7" fill="#fff4b0" stroke="${INK}" stroke-width="2.5"/></g></g>`;
  }
  return `<svg class="flowerbox-svg" viewBox="0 -10 600 120" preserveAspectRatio="none" aria-hidden="true">
    ${fl}
    <rect x="6" y="66" width="588" height="44" rx="10" fill="#c98f6a" ${G}/>
    <path d="M20,80 L580,80" stroke="#e0ac85" stroke-width="4" stroke-linecap="round"/>
  </svg>`;
}

export function shopCatSVG(): string {
  const c = '#8c7aa3';
  return `<svg class="shop-cat-svg" viewBox="-70 -70 140 110" aria-hidden="true">
    <path class="cat-tail" d="M40,26 C70,26 76,0 64,-14" stroke="${INK}" stroke-width="12" fill="none" stroke-linecap="round"/>
    <path class="cat-tail" d="M40,26 C70,26 76,0 64,-14" stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <ellipse cx="6" cy="16" rx="44" ry="22" fill="${c}" ${G}/>
    <path d="M-44,-18 L-40,-52 L-18,-34 Z M4,-18 L0,-52 L-20,-34 Z" fill="${c}" ${G}/>
    <circle cx="-20" cy="-8" r="28" fill="${c}" ${G}/>
    <g class="cat-awake"><ellipse cx="-30" cy="-10" rx="4" ry="5.5" fill="#2a1836"/><ellipse cx="-10" cy="-10" rx="4" ry="5.5" fill="#2a1836"/>
      <circle cx="-29" cy="-12" r="1.4" fill="#fff"/><circle cx="-9" cy="-12" r="1.4" fill="#fff"/></g>
    <g class="cat-asleep"><path d="M-36,-9 Q-30,-4 -24,-9 M-16,-9 Q-10,-4 -4,-9" stroke="#2a1836" stroke-width="3" fill="none" stroke-linecap="round"/></g>
    <path d="M-23,0 L-17,0 L-20,4 Z" fill="#ff8fb1"/>
    <path d="M-20,4 Q-24,8 -27,6 M-20,4 Q-16,8 -13,6" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="-38" cy="2" r="4" fill="#ff8fb1" opacity=".5"/><circle cx="-2" cy="2" r="4" fill="#ff8fb1" opacity=".5"/>
    <ellipse cx="-24" cy="34" rx="10" ry="6" fill="${c}" ${G}/><ellipse cx="0" cy="36" rx="10" ry="6" fill="${c}" ${G}/>
  </svg>`;
}

export function standSVG(): string {
  return `<svg class="stand-svg" viewBox="-80 -10 160 110" aria-hidden="true">
    <ellipse cx="0" cy="96" rx="46" ry="7" fill="${INK}" opacity=".15"/>
    <path d="M-34,94 C-30,82 -14,78 -8,64 L-8,14 L8,14 L8,64 C14,78 30,82 34,94 Z" fill="#fff" ${G}/>
    <ellipse cx="0" cy="8" rx="76" ry="12" fill="#fff" ${G}/>
    <path d="M-60,8 Q0,24 60,8" stroke="#e8def5" stroke-width="3" fill="none"/>
  </svg>`;
}

export function balloonsSVG(): string {
  const b = [
    [-26, -70, '#ff8fb1'],
    [4, -94, '#74bdfa'],
    [32, -66, '#ffd84d'],
  ] as const;
  return `<svg class="balloons-svg" viewBox="-70 -140 140 230" aria-hidden="true">
    ${b.map(([x, y]) => `<path d="M${x},${y + 34} C${x / 2},${y + 90} 4,60 0,86" stroke="${INK}" stroke-width="2.5" fill="none"/>`).join('')}
    ${b.map(([x, y, c], i) => `<g class="balloon" style="--i:${i}"><ellipse cx="${x}" cy="${y}" rx="24" ry="30" fill="${c}" ${G}/>
      <path d="M${x - 5},${y + 30} L${x + 5},${y + 30} L${x},${y + 36} Z" fill="${c}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <ellipse cx="${x - 9}" cy="${y - 10}" rx="6" ry="10" fill="#fff" opacity=".5" transform="rotate(20 ${x - 9} ${y - 10})"/></g>`).join('')}
  </svg>`;
}

export function doorSVG(): string {
  return `<svg class="door-svg" viewBox="0 0 200 400" preserveAspectRatio="none" aria-hidden="true">
    <rect x="6" y="6" width="188" height="394" rx="16" fill="#a8dcf7" stroke="${INK}" stroke-width="5"/>
    <rect x="22" y="22" width="156" height="170" rx="12" fill="#e8f7ff" stroke="${INK}" stroke-width="4"/>
    <path d="M40,60 L80,30 M40,100 L120,40" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".8"/>
    <rect x="22" y="212" width="156" height="170" rx="12" fill="#8fcff7" stroke="${INK}" stroke-width="4"/>
    <circle cx="160" cy="210" r="11" fill="#ffd84d" stroke="${INK}" stroke-width="4"/>
    <g transform="translate(100,108)"><path d="${shapePath('heart', 26, 24)}" fill="#ff8fb1" stroke="${INK}" stroke-width="4"/></g>
  </svg>`;
}

export function bellSVG(): string {
  return `<svg class="bell-svg" viewBox="-40 -50 80 100" aria-hidden="true">
    <path d="M0,-50 L0,-30" stroke="${INK}" stroke-width="4"/>
    <g class="bell-body"><path d="M-28,20 C-28,-6 -20,-30 0,-30 C20,-30 28,-6 28,20 L34,28 L-34,28 Z" fill="#ffd84d" ${G}/>
      <circle cx="0" cy="34" r="8" fill="#ffae5c" ${G}/>
      <path d="M-14,14 C-14,-4 -10,-16 -4,-22" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".6"/></g>
  </svg>`;
}

export function signSVG(text: string, golden: boolean): string {
  const fill = golden ? '#ffd84d' : '#fff4e0';
  const edge = golden ? '#e0a82e' : '#c98f6a';
  return `<svg class="sign-svg" viewBox="0 0 600 120" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs><linearGradient id="goldGrad" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#fff3a8"/><stop offset=".5" stop-color="${fill}"/><stop offset="1" stop-color="#f4b93a"/></linearGradient></defs>
    <rect x="10" y="10" width="580" height="100" rx="50" fill="${golden ? 'url(#goldGrad)' : fill}" stroke="${INK}" stroke-width="5"/>
    <rect x="24" y="22" width="552" height="76" rx="38" fill="none" stroke="${edge}" stroke-width="4" stroke-dasharray="${golden ? '0' : '10 8'}"/>
    <text x="300" y="80" text-anchor="middle" font-size="54" font-weight="800" fill="${INK}" font-family="'Baloo 2', ui-rounded, system-ui, sans-serif">${text}</text>
  </svg>`;
}

// ---------------------------------------------------------------------------
// Icons

export const ICONS = {
  play: `<svg viewBox="-50 -50 100 100"><path d="M-14,-26 L28,0 L-14,26 Z" fill="#fff" stroke="#fff" stroke-width="10" stroke-linejoin="round"/></svg>`,
  home: `<svg viewBox="-50 -50 100 100"><path d="M-28,-2 L0,-28 L28,-2 L28,28 L-28,28 Z" fill="#fff" stroke="#fff" stroke-width="8" stroke-linejoin="round"/><rect x="-8" y="8" width="16" height="22" rx="3" fill="currentColor"/></svg>`,
  games: `<svg viewBox="-50 -50 100 100"><g fill="#fff"><rect x="-30" y="-30" width="26" height="26" rx="7"/><rect x="4" y="-30" width="26" height="26" rx="7"/><rect x="-30" y="4" width="26" height="26" rx="7"/><rect x="4" y="4" width="26" height="26" rx="7"/></g></svg>`,
  replay: `<svg viewBox="-50 -50 100 100"><path d="M22,-14 A26,26 0 1 0 26,8" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M12,-26 L30,-18 L22,0 Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/></svg>`,
  shop: `<svg viewBox="-50 -50 100 100"><path d="M-34,-10 L34,-10 L34,32 L-34,32 Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><path d="M-38,-30 L38,-30 L40,-10 C34,-2 26,-2 20,-10 C14,-2 6,-2 0,-10 C-6,-2 -14,-2 -20,-10 C-26,-2 -34,-2 -40,-10 Z" fill="#fff" stroke="#fff" stroke-width="5" stroke-linejoin="round"/><rect x="-24" y="4" width="20" height="14" rx="3" fill="currentColor"/><rect x="6" y="4" width="16" height="28" rx="3" fill="currentColor"/></svg>`,
  soundOn: `<svg viewBox="-50 -50 100 100"><path d="M-30,-12 L-16,-12 L2,-28 L2,28 L-16,12 L-30,12 Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><path d="M14,-14 Q24,0 14,14 M22,-24 Q38,0 22,24" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/></svg>`,
  soundOff: `<svg viewBox="-50 -50 100 100"><path d="M-30,-12 L-16,-12 L2,-28 L2,28 L-16,12 L-30,12 Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><path d="M14,-12 L34,12 M34,-12 L14,12" stroke="#fff" stroke-width="7" stroke-linecap="round"/></svg>`,
  musicOn: `<svg viewBox="-50 -50 100 100"><path d="M-10,20 L-10,-24 L24,-32 L24,12" stroke="#fff" stroke-width="7" fill="none" stroke-linejoin="round"/><ellipse cx="-18" cy="22" rx="10" ry="8" fill="#fff"/><ellipse cx="16" cy="14" rx="10" ry="8" fill="#fff"/></svg>`,
  musicOff: `<svg viewBox="-50 -50 100 100"><g opacity=".55"><path d="M-10,20 L-10,-24 L24,-32 L24,12" stroke="#fff" stroke-width="7" fill="none" stroke-linejoin="round"/><ellipse cx="-18" cy="22" rx="10" ry="8" fill="#fff"/><ellipse cx="16" cy="14" rx="10" ry="8" fill="#fff"/></g><path d="M-30,-30 L30,30" stroke="#fff" stroke-width="8" stroke-linecap="round"/></svg>`,
  close: `<svg viewBox="-50 -50 100 100"><path d="M-20,-20 L20,20 M20,-20 L-20,20" stroke="#fff" stroke-width="10" stroke-linecap="round"/></svg>`,
  gear: `<svg viewBox="-50 -50 100 100"><g fill="currentColor">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="-7" y="-40" width="14" height="18" rx="4" transform="rotate(${a})"/>`).join('')}<circle r="27"/></g><circle r="10" fill="#fff"/></svg>`,
  sun: `<svg viewBox="-50 -50 100 100"><circle r="18" fill="#fff"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="-4" y="-38" width="8" height="12" rx="4" fill="#fff" transform="rotate(${a})"/>`).join('')}</svg>`,
  moon: `<svg viewBox="-50 -50 100 100"><path d="M10,-32 A32,32 0 1 0 30,14 A26,26 0 1 1 10,-32 Z" fill="#fff"/></svg>`,
  check: `<svg viewBox="-50 -50 100 100"><path d="M-24,2 L-6,20 L26,-18" stroke="#fff" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

