// The colouring pages. Each picture is a stack of layers drawn in order in a
// 400×400 box: regions (big shapes Mia can paint) and details (eyes, smiles,
// lines) that sit on top and let taps fall through to the region beneath.
// Layers can be grouped so parts can move when the finished picture comes alive.
import { INK } from './art';
import { PAINT, RAINBOW_STOPS, type PaintId } from './data';

// ---------------------------------------------------------------------------
// Shape helpers (everything becomes a path so it can be reused as a clip)

const f = (v: number) => Math.round(v * 10) / 10;

export const E = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f(cx - rx)},${f(cy)}a${f(rx)},${f(ry)} 0 1,0 ${f(2 * rx)},0a${f(rx)},${f(ry)} 0 1,0 ${f(-2 * rx)},0Z`;
export const C = (cx: number, cy: number, r: number) => E(cx, cy, r, r);
export const R = (x: number, y: number, w: number, h: number, r = 0) =>
  r
    ? `M${x + r},${y}h${w - 2 * r}a${r},${r} 0 0 1 ${r},${r}v${h - 2 * r}a${r},${r} 0 0 1 ${-r},${r}h${-(w - 2 * r)}a${r},${r} 0 0 1 ${-r},${-r}v${-(h - 2 * r)}a${r},${r} 0 0 1 ${r},${-r}Z`
    : `M${x},${y}h${w}v${h}h${-w}Z`;
export const P = (...pts: number[]) => {
  let d = '';
  for (let i = 0; i < pts.length; i += 2) d += `${i ? 'L' : 'M'}${f(pts[i])},${f(pts[i + 1])}`;
  return `${d}Z`;
};

const FRAME = R(8, 8, 384, 384, 36);

// ---------------------------------------------------------------------------
// Types

type DetailKind = 'ink' | 'line' | 'thin' | 'white' | 'eye' | 'bubble' | 'pink' | 'shine' | 'dash';

export type Item =
  /** A paintable region, with the colour it "should" be (used by the magic brush and previews). */
  | { r: string; d: string; c: PaintId }
  /** Decoration drawn on top. `col` overrides the colour. */
  | { d: string; k: DetailKind; col?: string };

export interface Layer {
  /** Group name, becomes class `part-<g>` for animations. */
  g?: string;
  /** Transform origin for the group, in picture units. */
  o?: [number, number];
  /** A fixed SVG transform (e.g. to make a small drawing bigger), kept apart from the animations. */
  t?: string;
  items?: Item[];
  layers?: Layer[];
}

export interface Picture {
  id: string;
  /** The voice line that names it. */
  line: string;
  layers: Layer[];
}

const r = (id: string, c: PaintId, d: string): Item => ({ r: id, d, c });
const d = (path: string, k: DetailKind = 'ink', col?: string): Item => ({ d: path, k, col });
const bg = (c: PaintId) => r('bg', c, FRAME);
/** Scale a layer about a point. */
const grow = (k: number, x: number, y: number) => `translate(${x},${y}) scale(${k}) translate(${-x},${-y})`;

/** Two shiny eyes. */
const eyes = (x1: number, x2: number, y: number, rx = 8, ry = 11) => [
  d(E(x1, y, rx, ry) + E(x2, y, rx, ry)),
  d(C(x1 + rx * 0.35, y - ry * 0.4, rx * 0.4) + C(x2 + rx * 0.35, y - ry * 0.4, rx * 0.4), 'white'),
];

// ---------------------------------------------------------------------------
// The pictures

const sunRays = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4;
  const w = 0.24;
  const pt = (ang: number, rad: number) => [200 + Math.cos(ang) * rad, 180 + Math.sin(ang) * rad];
  return P(...pt(a - w, 96), ...pt(a, 158), ...pt(a + w, 96));
}).join('');

const SUN: Picture = {
  id: 'sun',
  line: 'p-sun',
  layers: [
    { items: [bg('blue'), r('hill', 'green', 'M0,310 C120,262 280,262 400,310 L400,400 L0,400 Z')] },
    { g: 'rays', o: [200, 180], items: [r('rays', 'orange', sunRays)] },
    {
      g: 'face',
      o: [200, 268],
      items: [
        r('face', 'yellow', C(200, 180, 88)),
        ...eyes(170, 230, 165, 9, 12),
        d(C(150, 200, 13) + C(250, 200, 13), 'pink'),
        d('M165,205 Q200,240 235,205', 'line'),
      ],
    },
  ],
};

const weed = (x: number) =>
  `M${x},345 C${x - 22},305 ${x + 18},275 ${x - 2},235 C${x - 12},212 ${x + 3},192 ${x + 8},180 C${x + 24},200 ${x + 18},222 ${x + 26},242 C${x + 42},282 ${x + 8},305 ${x + 22},345 Z`;

const FISH: Picture = {
  id: 'fish',
  line: 'p-fish',
  layers: [
    { items: [bg('blue'), r('sand', 'yellow', 'M0,332 C100,310 180,348 260,326 C320,312 360,320 400,332 L400,400 L0,400 Z')] },
    { g: 'weed', o: [200, 345], items: [r('weed', 'green', weed(46) + weed(330))] },
    {
      g: 'fish',
      o: [200, 190],
      items: [
        r('fins', 'red', 'M146,138 C160,58 244,52 266,134 Z M176,248 C186,304 244,310 256,246 Z'),
        r('tail', 'orange', 'M118,190 L30,118 C54,166 54,214 30,262 Z'),
        r('body', 'orange', E(205, 190, 115, 72)),
        r('stripe', 'yellow', 'M168,124 C184,160 184,220 168,256 L196,262 C214,220 214,160 196,118 Z'),
        d(C(270, 172, 17), 'eye'),
        d(C(275, 173, 8)),
        d(C(278, 169, 3), 'white'),
        d('M284,206 Q299,216 313,200', 'line'),
        d('M236,148 Q252,190 236,232', 'line'),
      ],
    },
    { g: 'bubbles', o: [335, 90], items: [d(C(330, 118, 13) + C(352, 82, 9) + C(336, 52, 6), 'bubble')] },
  ],
};

const BUTTERFLY: Picture = {
  id: 'butterfly',
  line: 'p-butterfly',
  layers: [
    { items: [bg('blue'), r('grass', 'green', 'M0,340 C130,318 270,318 400,340 L400,400 L0,400 Z')] },
    {
      g: 'bfly',
      o: [200, 200],
      layers: [
        {
          g: 'wings',
          o: [200, 200],
          items: [
            r('upper', 'pink', 'M195,190 C150,88 70,58 55,118 C45,170 110,206 195,206 Z M205,190 C250,88 330,58 345,118 C355,170 290,206 205,206 Z'),
            r('lower', 'purple', 'M195,206 C130,206 80,250 100,290 C120,326 175,300 197,230 Z M205,206 C270,206 320,250 300,290 C280,326 225,300 203,230 Z'),
            r('spots', 'yellow', C(112, 132, 20) + C(288, 132, 20) + C(138, 266, 14) + C(262, 266, 14)),
          ],
        },
        {
          items: [
            d('M192,112 C180,86 166,76 154,70 M208,112 C220,86 234,76 246,70', 'line'),
            d(C(154, 70, 8) + C(246, 70, 8)),
            r('body', 'brown', E(200, 208, 17, 70) + C(200, 128, 22)),
            d(C(192, 125, 4) + C(208, 125, 4)),
            d('M192,137 Q200,144 208,137', 'line'),
          ],
        },
      ],
    },
  ],
};

const HOUSE: Picture = {
  id: 'house',
  line: 'p-house',
  layers: [
    { items: [bg('blue'), r('grass', 'green', 'M0,320 C120,298 280,298 400,320 L400,400 L0,400 Z')] },
    { g: 'smoke', o: [285, 40], items: [d(C(276, 36, 10) + C(296, 20, 12) + C(322, 12, 8), 'bubble')] },
    {
      g: 'house',
      o: [200, 325],
      items: [
        r('chimney', 'brown', R(250, 50, 44, 100, 4)),
        r('wall', 'yellow', R(95, 178, 210, 147, 4)),
        r('roof', 'red', P(66, 186, 200, 72, 334, 186)),
        r('door', 'brown', R(175, 245, 50, 80, 10)),
        d(C(214, 288, 4.5)),
        r('windows', 'blue', R(114, 204, 46, 46, 8) + R(240, 204, 46, 46, 8) + C(200, 142, 17)),
        d('M137,204v46M114,227h46M263,204v46M240,227h46M200,125v34M183,142h34', 'thin'),
      ],
    },
  ],
};

const CAR: Picture = {
  id: 'car',
  line: 'p-car',
  layers: [
    { items: [bg('blue'), r('road', 'brown', R(-10, 302, 420, 110)), d(R(30, 348, 56, 12, 6) + R(170, 348, 56, 12, 6) + R(310, 348, 56, 12, 6), 'white')] },
    {
      g: 'car',
      o: [200, 300],
      items: [
        r('body', 'red', R(58, 196, 290, 82, 32) + 'M118,202 L150,138 L262,138 L298,202 Z'),
        r('windows', 'blue', 'M140,196 L162,152 L200,152 L200,196 Z M212,196 L212,152 L254,152 L278,196 Z'),
        d('M206,204 V268 M218,220 h16', 'line'),
        r('lights', 'yellow', C(322, 228, 18) + C(84, 228, 15)),
        r('wheels', 'purple', C(122, 280, 32) + C(286, 280, 32)),
        d(C(122, 280, 12) + C(286, 280, 12), 'eye'),
      ],
    },
  ],
};

const petals = Array.from({ length: 6 }, (_, i) => {
  const a = (i * Math.PI) / 3 - Math.PI / 2;
  return C(200 + Math.cos(a) * 60, 150 + Math.sin(a) * 60, 40);
}).join('');

const FLOWER: Picture = {
  id: 'flower',
  line: 'p-flower',
  layers: [
    { items: [bg('blue'), r('table', 'brown', R(-10, 368, 420, 50))] },
    {
      g: 'stem',
      o: [200, 330],
      items: [
        r(
          'stem',
          'green',
          R(192, 176, 16, 170, 8) +
            'M196,286 C160,254 120,262 104,278 C130,304 170,304 196,290 Z M204,254 C240,222 280,232 296,246 C270,272 230,272 204,258 Z',
        ),
        r('petals', 'pink', petals),
        r('centre', 'yellow', C(200, 150, 40)),
        ...eyes(186, 214, 144, 5, 7),
        d('M185,160 Q200,173 215,160', 'line'),
      ],
    },
    { items: [r('pot', 'orange', R(118, 298, 164, 30, 12) + P(134, 324, 266, 324, 250, 384, 150, 384))] },
  ],
};

const CAT: Picture = {
  id: 'cat',
  line: 'p-cat',
  layers: [
    { items: [bg('purple'), r('floor', 'green', R(-10, 322, 420, 90))] },
    {
      items: [
        r('yarn', 'blue', C(78, 308, 38)),
        d('M48,292 Q80,278 110,300 M44,316 Q80,300 116,320 M58,340 Q84,322 110,336', 'thin'),
        d('M114,322 C138,332 140,346 162,340', 'thin'),
      ],
    },
    {
      g: 'tail',
      o: [272, 312],
      items: [r('tail', 'orange', 'M268,300 C338,300 350,232 330,192 C322,176 344,166 354,182 C378,232 362,322 278,328 Z')],
    },
    {
      items: [
        r('body', 'orange', E(200, 272, 85, 74)),
        r('belly', 'yellow', E(200, 290, 44, 42)),
        r('paws', 'orange', E(164, 340, 27, 17) + E(236, 340, 27, 17)),
      ],
    },
    {
      g: 'head',
      o: [200, 205],
      items: [
        r('ears', 'pink', P(114, 130, 130, 28, 196, 92) + P(286, 130, 270, 28, 204, 92)),
        r('head', 'orange', E(200, 140, 86, 70)),
        ...eyes(170, 230, 130, 9, 13),
        d('M191,154 L209,154 L200,165 Z', 'pink'),
        d('M200,165 Q193,178 182,172 M200,165 Q207,178 218,172', 'line'),
        d('M148,158 L104,150 M148,170 L104,176 M252,158 L296,150 M252,170 L296,176', 'thin'),
      ],
    },
  ],
};

const ICECREAM: Picture = {
  id: 'icecream',
  line: 'p-icecream',
  layers: [
    {
      items: [
        bg('green'),
        r('cone', 'orange', P(118, 222, 282, 222, 200, 386)),
        d('M118,222 L227,331 M160,222 L241,303 M200,222 L255,277 M282,222 L173,331 M240,222 L159,303 M200,222 L145,277', 'thin'),
      ],
    },
    {
      g: 'scoops',
      o: [200, 222],
      items: [
        r(
          'low',
          'pink',
          'M104,218 C92,118 308,118 296,218 C280,244 262,220 244,240 C226,260 210,230 192,248 C174,262 150,234 132,244 C116,240 106,230 104,218 Z',
        ),
        ...eyes(176, 224, 196, 7, 9),
        d('M184,212 Q200,225 216,212', 'line'),
        r(
          'top',
          'brown',
          'M124,150 C112,52 288,52 276,150 C262,172 244,152 228,168 C212,184 194,156 178,172 C160,184 134,168 124,150 Z',
        ),
        d('M150,120 l14,-6', 'dash', '#ffe066'),
        d('M196,96 l12,7', 'dash', '#74bdfa'),
        d('M236,118 l14,4', 'dash', '#86d07a'),
        d('M178,142 l7,-12', 'dash', '#fff'),
        d('M252,98 l-5,-12', 'dash', '#ff9fcc'),
        d('M214,140 l12,-6', 'dash', '#ffae5c'),
        d('M200,32 C202,20 212,12 226,8', 'line'),
        r('cherry', 'red', C(200, 60, 28)),
        d(C(190, 50, 7), 'white'),
      ],
    },
  ],
};

const arc = (ro: number, ri: number) =>
  `M${200 - ro},300 A${ro},${ro} 0 0 1 ${200 + ro},300 L${200 + ri},300 A${ri},${ri} 0 0 0 ${200 - ri},300 Z`;
const cloud = (x: number) =>
  `M${x - 60},342 C${x - 84},342 ${x - 86},304 ${x - 58},298 C${x - 62},268 ${x - 26},258 ${x - 12},274 C${x - 6},242 ${x + 44},244 ${x + 44},276 C${x + 66},266 ${x + 88},292 ${x + 72},312 C${x + 90},320 ${x + 82},344 ${x + 60},342 Z`;

const RAINBOW: Picture = {
  id: 'rainbow',
  line: 'p-rainbow',
  layers: [
    { items: [bg('blue')] },
    {
      g: 'arcs',
      o: [200, 300],
      items: [
        r('a1', 'red', arc(176, 150)),
        r('a2', 'orange', arc(150, 124)),
        r('a3', 'yellow', arc(124, 98)),
        r('a4', 'green', arc(98, 72)),
        r('a5', 'purple', arc(72, 46)),
      ],
    },
    {
      g: 'clouds',
      o: [200, 310],
      items: [
        r('clouds', 'pink', cloud(100) + cloud(300)),
        ...eyes(88, 112, 306, 4.5, 6),
        ...eyes(288, 312, 306, 4.5, 6),
        d('M92,320 Q100,327 108,320 M292,320 Q300,327 308,320', 'line'),
      ],
    },
  ],
};

const star = (x: number, y: number, s: number) => {
  const pts: number[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const rad = i % 2 ? s * 0.45 : s;
    pts.push(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  return P(...pts);
};

const ROCKET: Picture = {
  id: 'rocket',
  line: 'p-rocket',
  layers: [
    {
      items: [
        bg('purple'),
        d(star(66, 76, 14) + star(334, 62, 11) + star(92, 236, 9) + star(320, 190, 13) + star(350, 320, 9) + star(276, 110, 7), 'ink', '#ffe066'),
        r('planet', 'green', C(58, 352, 78)),
        d(C(40, 330, 12) + C(84, 316, 7) + C(72, 368, 9), 'thin'),
      ],
    },
    {
      g: 'rocket',
      o: [200, 220],
      t: grow(1.15, 200, 220),
      layers: [
        { g: 'flame', o: [200, 300], items: [r('flame', 'yellow', 'M174,296 C168,334 190,350 200,382 C210,350 232,334 226,296 Z')] },
        {
          items: [
            r('fins', 'orange', 'M166,228 L118,290 L118,308 L170,292 Z M234,228 L282,290 L282,308 L230,292 Z'),
            r('body', 'pink', 'M200,58 C252,100 252,200 240,302 L160,302 C148,200 148,100 200,58 Z'),
            r('nose', 'red', 'M200,58 C220,74 230,92 234,112 L166,112 C170,92 180,74 200,58 Z'),
            r('window', 'blue', C(200, 172, 27)),
            d('M187,161 Q194,152 205,153', 'shine'),
          ],
        },
      ],
    },
  ],
};

const DUCK: Picture = {
  id: 'duck',
  line: 'p-duck',
  layers: [
    { items: [bg('green'), r('sun', 'yellow', C(334, 72, 40))] },
    {
      g: 'duck',
      o: [200, 290],
      t: grow(1.2, 200, 262),
      items: [
        r('body', 'yellow', 'M106,262 C104,304 170,326 226,324 C286,322 318,296 316,272 C330,258 342,232 340,206 C322,226 300,232 282,230 C240,212 140,212 106,262 Z'),
        r('wing', 'yellow', 'M172,258 C186,226 252,226 272,252 C252,288 202,292 172,258 Z'),
        r('head', 'yellow', C(130, 184, 48)),
        r('beak', 'orange', 'M96,182 C60,168 38,188 46,206 C58,222 90,218 106,206 Z'),
        ...eyes(124, 124, 172, 7, 9),
        d(C(148, 196, 8), 'pink'),
      ],
    },
    {
      items: [
        r('pond', 'blue', 'M0,292 C60,280 110,302 170,290 C230,278 290,300 340,288 C370,282 390,286 400,290 L400,400 L0,400 Z'),
        d('M60,334 q20,-10 40,0 M250,352 q20,-10 40,0 M140,376 q20,-10 40,0', 'line'),
      ],
    },
  ],
};

const DINO: Picture = {
  id: 'dino',
  line: 'p-dino',
  layers: [
    { items: [bg('blue'), r('ground', 'yellow', 'M0,318 C130,302 270,302 400,318 L400,400 L0,400 Z')] },
    {
      g: 'egg',
      o: [340, 356],
      items: [r('egg', 'pink', E(340, 326, 26, 32)), d('M318,322 l10,-8 l10,8 l10,-8 l10,8 l6,-4', 'thin')],
    },
    {
      g: 'dino',
      o: [220, 312],
      items: [
        r(
          'spikes',
          'orange',
          P(174, 170, 184, 108, 212, 170) + P(212, 176, 236, 112, 256, 186) + P(252, 192, 290, 136, 294, 216) + P(288, 222, 336, 180, 322, 242),
        ),
        r(
          'body',
          'green',
          'M120,108 C150,90 182,110 176,150 C200,160 262,160 300,210 C330,240 366,248 386,250 C370,276 320,282 290,272 L286,312 L254,312 L250,282 C230,287 202,287 186,282 L182,312 L150,312 L148,270 C128,250 124,212 130,182 C104,182 78,172 80,146 C82,120 100,110 120,108 Z',
        ),
        r('belly', 'yellow', 'M152,238 C164,272 226,280 256,270 C250,250 228,234 198,226 C176,222 158,226 152,238 Z'),
        ...eyes(118, 118, 134, 8, 10),
        d(C(90, 140, 3.5)),
        d('M90,160 Q112,172 132,164', 'line'),
        d(C(134, 156, 7), 'pink'),
      ],
    },
  ],
};

export const PICTURES: Picture[] = [SUN, FISH, BUTTERFLY, HOUSE, CAR, FLOWER, CAT, ICECREAM, RAINBOW, ROCKET, DUCK, DINO];

export const pictureById = (id: string) => PICTURES.find((p) => p.id === id);

/** Every paintable region of a picture, in paint order. */
export function regionsOf(pic: Picture): { r: string; d: string; c: PaintId }[] {
  const out: { r: string; d: string; c: PaintId }[] = [];
  const walk = (ls: Layer[]) =>
    ls.forEach((l) => {
      l.items?.forEach((it) => 'r' in it && out.push(it));
      if (l.layers) walk(l.layers);
    });
  walk(pic.layers);
  return out;
}

/** The colours each region "should" be. */
export function naturalFills(pic: Picture): Record<string, PaintId> {
  return Object.fromEntries(regionsOf(pic).map((g) => [g.r, g.c]));
}

// ---------------------------------------------------------------------------
// Drawing

let svgN = 0;
export const BLANK = '#fffdf8';

/** The fill attribute for a paint colour (rainbow uses the picture's own gradient). */
export const paintFill = (c: PaintId | undefined, uid: string) => (!c ? BLANK : c === 'rainbow' ? `url(#${uid}-rainbow)` : PAINT[c].hex);

const DETAIL: Record<DetailKind, (col?: string) => string> = {
  ink: (col) => `fill="${col ?? INK}"`,
  line: () => `fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"`,
  thin: () => `fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".7"`,
  white: (col) => `fill="${col ?? '#fff'}"`,
  eye: () => `fill="#fff" stroke="${INK}" stroke-width="5"`,
  bubble: () => `fill="#fff" fill-opacity=".75" stroke="${INK}" stroke-width="4"`,
  pink: () => `fill="#ff8fb1" fill-opacity=".75" stroke="none"`,
  shine: () => `fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".85"`,
  dash: (col) => `fill="none" stroke="${col ?? '#fff'}" stroke-width="8" stroke-linecap="round"`,
};

/**
 * The picture as SVG markup. `fills` says which colour is in each region
 * (missing = still white). Each call gets its own ids so many can share a page.
 */
export function pictureSVG(pic: Picture, fills: Record<string, PaintId> = {}): { svg: string; uid: string } {
  const uid = `pic${++svgN}`;
  const item = (it: Item) =>
    'r' in it
      ? `<path class="rg" data-r="${it.r}" d="${it.d}" fill="${paintFill(fills[it.r], uid)}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`
      : `<path class="dt" d="${it.d}" ${DETAIL[it.k](it.col)}/>`;
  const layer = (l: Layer): string => {
    const inner = (l.items ?? []).map(item).join('') + (l.layers ?? []).map(layer).join('');
    const o = l.o ? ` style="transform-origin:${l.o[0]}px ${l.o[1]}px"` : '';
    const part = l.g ? `<g class="part part-${l.g}"${o}>${inner}</g>` : inner;
    return l.t ? `<g transform="${l.t}">${part}</g>` : part;
  };
  const stops = RAINBOW_STOPS.map((c, i) => `<stop offset="${i / (RAINBOW_STOPS.length - 1)}" stop-color="${c}"/>`).join('');
  const svg = `<svg class="pic a-${pic.id}" viewBox="0 0 400 400" aria-hidden="true">
    <defs>
      <clipPath id="${uid}-frame"><path d="${FRAME}"/></clipPath>
      <linearGradient id="${uid}-rainbow" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="150" y2="110" spreadMethod="reflect">${stops}</linearGradient>
    </defs>
    <g clip-path="url(#${uid}-frame)"><g class="art">${pic.layers.map(layer).join('')}</g></g>
    <path d="${FRAME}" fill="none" stroke="${INK}" stroke-width="9" pointer-events="none"/>
  </svg>`;
  return { svg, uid };
}
