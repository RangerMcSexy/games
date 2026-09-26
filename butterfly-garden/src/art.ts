// All artwork is hand-built SVG so the game ships with zero image files.
import { SPRITES, type SpriteName } from './sprites';
import { FOODS, colorsOf, type Butterfly, type FoodId, type Pattern, type Shape } from './data';

export const INK = '#5a4272';
let idCounter = 0;
const nid = (p: string) => `${p}${++idCounter}`;

// ---------------------------------------------------------------------------
// Shapes shared between pieces

const WINGS: Record<Shape, { fore: string; hind: string }> = {
  round: {
    fore: 'M3,-4 C8,-52 60,-88 86,-60 C104,-40 80,-6 3,4 Z',
    hind: 'M3,4 C50,0 88,22 74,56 C60,88 18,66 3,16 Z',
  },
  pointy: {
    fore: 'M3,-4 C22,-50 64,-86 100,-88 C88,-48 58,-8 3,4 Z',
    hind: 'M3,4 C44,2 76,26 68,54 C62,72 30,58 3,16 Z',
  },
  swallow: {
    fore: 'M3,-4 C14,-50 56,-86 92,-78 C94,-40 66,-6 3,4 Z',
    hind: 'M3,4 C40,2 66,20 60,44 C57,58 56,74 62,94 C46,86 40,70 32,62 C18,54 8,34 3,16 Z',
  },
  heart: {
    fore: 'M3,-2 C0,-40 20,-82 54,-82 C86,-82 98,-50 86,-30 C74,-12 40,-2 3,4 Z',
    hind: 'M3,4 C40,0 86,10 82,38 C78,62 40,72 12,88 C8,60 4,30 3,16 Z',
  },
  frilly: {
    fore: scallop([[3, -4], [12, -46], [40, -78], [74, -84], [98, -60], [92, -26], [60, -6], [3, 4]], [2, 3, 4, 5]),
    hind: scallop([[3, 4], [44, 4], [78, 22], [82, 52], [60, 80], [30, 76], [8, 40], [3, 16]], [1, 2, 3, 4, 5]),
  },
};

/** A path through `pts` whose chosen segments bulge outward into frilly scallops. */
function scallop(pts: number[][], frilly: number[]): string {
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    if (!frilly.includes(i)) {
      d += ` L${bx},${by}`;
      continue;
    }
    // Two bumps per segment.
    for (let k = 0; k < 2; k++) {
      const x0 = ax + ((bx - ax) * k) / 2, y0 = ay + ((by - ay) * k) / 2;
      const x1 = ax + ((bx - ax) * (k + 1)) / 2, y1 = ay + ((by - ay) * (k + 1)) / 2;
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
      const len = Math.hypot(mx - cx, my - cy) || 1;
      const bulge = Math.hypot(x1 - x0, y1 - y0) * 0.45;
      d += ` Q${(mx + ((mx - cx) / len) * bulge).toFixed(1)},${(my + ((my - cy) / len) * bulge).toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
    }
  }
  return d + ' Z';
}

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

/** A tiling <pattern> of little shapes used on wings and chrysalises. */
function patternDef(id: string, pattern: Pattern, color: string, scale = 1, mono = false): string {
  const s = 40 * scale;
  const outline = `stroke="#fff" stroke-width="${2 * scale}"`;
  let inner = '';
  const at = (x: number, y: number, body: string) =>
    `<g transform="translate(${x * scale},${y * scale}) scale(${scale})">${body}</g>`;
  switch (pattern) {
    case 'dots':
      inner = at(10, 10, `<circle r="7" fill="${color}" ${outline}/>`) + at(30, 30, `<circle r="5" fill="${color}" ${outline}/>`);
      break;
    case 'stripes':
      inner = `<rect x="0" y="0" width="${12 * scale}" height="${s}" fill="${color}"/>
               <rect x="${12 * scale}" y="0" width="${3 * scale}" height="${s}" fill="#fff" opacity=".85"/>`;
      break;
    case 'hearts':
      inner = at(10, 11, `<path d="${HEART_PATH}" fill="${color}" ${outline} transform="scale(1.2)"/>`) +
        at(30, 31, `<path d="${HEART_PATH}" fill="${color}" ${outline} transform="scale(.8)"/>`);
      break;
    case 'stars':
      inner = at(10, 11, `<path d="${starPath(9)}" fill="${color}" ${outline}/>`) +
        at(30, 31, `<path d="${starPath(6)}" fill="${color}" ${outline}/>`);
      break;
    case 'rainbow':
      inner = at(20, 26, rainbowArcs(13, 3, mono ? color : undefined));
      break;
  }
  const rot = pattern === 'stripes' ? ` patternTransform="rotate(35)"` : '';
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${s}" height="${s}"${rot}>${inner}</pattern>`;
}

// ---------------------------------------------------------------------------
// Butterfly

export interface ButterflyOpts {
  flap?: boolean;
  silhouette?: boolean;
  /** Seconds per flap. */
  speed?: number;
}

export function butterflySVG(
  b: Pick<Butterfly, 'shape' | 'pattern' | 'foods' | 'golden'>,
  opts: ButterflyOpts = {},
): string {
  const w = WINGS[b.shape];
  const [c0, c1, c2, c3, c4] = colorsOf(b);
  const fg = nid('fg');
  const hg = nid('hg');
  const pt = nid('pt');
  const sil = opts.silhouette;
  const edge = sil ? '#c9bedb' : b.golden ? '#d99a00' : INK;
  const edgeW = b.golden && !sil ? 5 : 4;
  const patColor = c4 === c0 || c4 === c1 ? '#ffffff' : c4;

  const defs = sil
    ? `<defs>${patternDef(pt, b.pattern, '#e6def0', 1, true)}</defs>`
    : `<defs>
        <linearGradient id="${fg}" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stop-color="${c0}"/><stop offset="1" stop-color="${c1}"/>
        </linearGradient>
        <linearGradient id="${hg}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/>
        </linearGradient>
        ${patternDef(pt, b.pattern, patColor, 1)}
      </defs>`;

  const foreFill = sil ? '#f3eef9' : `url(#${fg})`;
  const hindFill = sil ? '#f3eef9' : `url(#${hg})`;
  const dash = sil ? ' stroke-dasharray="7 6"' : '';
  const wingSet = `
    <path d="${w.hind}" fill="${hindFill}"/>
    <path d="${w.hind}" fill="url(#${pt})" opacity="${sil ? 1 : 0.95}"/>
    <path d="${w.hind}" fill="none" stroke="${edge}" stroke-width="${edgeW}" stroke-linejoin="round"${dash}/>
    <path d="${w.fore}" fill="${foreFill}"/>
    <path d="${w.fore}" fill="url(#${pt})" opacity="${sil ? 1 : 0.95}"/>
    <path d="${w.fore}" fill="none" stroke="${edge}" stroke-width="${edgeW}" stroke-linejoin="round"${dash}/>
    ${sil ? '' : `<path d="M16,-20 C30,-44 48,-58 64,-62" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".35" fill="none"/>`}
  `;

  const bodyColor = sil ? '#d8cde6' : '#5b3a70';
  const tip = sil ? '#d8cde6' : c0;
  const face = sil
    ? ''
    : `<circle cx="-4.2" cy="-25" r="3.8" fill="#fff"/><circle cx="4.2" cy="-25" r="3.8" fill="#fff"/>
       <circle cx="-3.6" cy="-24.4" r="2.1" fill="#2a1836"/><circle cx="4.8" cy="-24.4" r="2.1" fill="#2a1836"/>
       <circle cx="-3" cy="-25.4" r=".8" fill="#fff"/><circle cx="5.4" cy="-25.4" r=".8" fill="#fff"/>
       <path d="M-3,-19 Q0,-16.5 3,-19" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>
       <circle cx="-7" cy="-20.5" r="2" fill="#ff8fb1" opacity=".8"/><circle cx="7" cy="-20.5" r="2" fill="#ff8fb1" opacity=".8"/>`;

  const body = `
    <path d="M-3,-34 C-8,-50 -18,-60 -26,-64" stroke="${bodyColor}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M3,-34 C8,-50 18,-60 26,-64" stroke="${bodyColor}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="-26" cy="-64" r="5" fill="${tip}" stroke="${bodyColor}" stroke-width="2.5"/>
    <circle cx="26" cy="-64" r="5" fill="${tip}" stroke="${bodyColor}" stroke-width="2.5"/>
    <ellipse cx="0" cy="22" rx="7" ry="26" fill="${bodyColor}"/>
    <ellipse cx="0" cy="-5" rx="8.5" ry="13" fill="${bodyColor}"/>
    <circle cx="0" cy="-24" r="11.5" fill="${bodyColor}"/>
    ${sil ? '' : `<path d="M-5,12 Q0,15 5,12 M-5,22 Q0,25 5,22 M-4.5,32 Q0,35 4.5,32" stroke="#8d6aa6" stroke-width="2" fill="none" stroke-linecap="round"/>`}
    ${face}
  `;

  const sparkles =
    b.golden && !sil
      ? `<g class="glints">
          <path class="glint" d="${starPath(9, 0.3, 4)}" fill="#fff6c2" transform="translate(-70,-58)"/>
          <path class="glint" d="${starPath(7, 0.3, 4)}" fill="#fff6c2" transform="translate(64,40)" style="animation-delay:-.6s"/>
          <path class="glint" d="${starPath(8, 0.3, 4)}" fill="#fff6c2" transform="translate(52,-70)" style="animation-delay:-1.1s"/>
        </g>`
      : '';

  const speed = opts.speed ?? 0.34;
  const flapCls = opts.flap ? ' flapping' : '';
  return `<svg class="butterfly${flapCls}" viewBox="-104 -100 208 200" style="--flap:${speed}s" aria-hidden="true">
    ${defs}
    <g class="flap-l"><g transform="scale(-1 1)">${wingSet}</g></g>
    <g class="flap-r">${wingSet}</g>
    ${body}
    ${sparkles}
  </svg>`;
}

// ---------------------------------------------------------------------------
// Caterpillar

const CAT_BASE = '#aee59a';

export interface CaterpillarOpts {
  mouthOpen?: boolean;
  sleepy?: boolean;
  /** Index of a segment to animate popping in. */
  popIndex?: number;
}

export function caterpillarSVG(foods: FoodId[], opts: CaterpillarOpts = {}): string {
  const segColors = [CAT_BASE, CAT_BASE, ...foods.map((f) => FOODS[f].color)];
  const n = segColors.length;
  const segs = segColors
    .map((c, i) => {
      const cx = 24 + i * 24;
      const pop = opts.popIndex === i ? ' pop' : '';
      const gold = c === FOODS.golden.color;
      return `<g class="seg${pop}" style="--i:${n - i}">
        <ellipse cx="${cx - 7}" cy="84" rx="5" ry="4" fill="${INK}"/>
        <ellipse cx="${cx + 7}" cy="84" rx="5" ry="4" fill="${INK}"/>
        <circle cx="${cx}" cy="64" r="19" fill="${c}" stroke="${gold ? '#d99a00' : INK}" stroke-width="3.5"/>
        <ellipse cx="${cx - 4}" cy="54" rx="8" ry="4.5" fill="#fff" opacity=".45"/>
        ${gold ? `<path d="${starPath(6, 0.35, 4)}" fill="#fff" transform="translate(${cx + 6},${70})"/>` : ''}
      </g>`;
    })
    .join('');

  const hx = 24 + n * 24 + 8;
  const eyes = opts.sleepy
    ? `<path d="M${hx - 12},44 q6,5 12,0 M${hx + 6},44 q6,5 12,0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`
    : `<ellipse cx="${hx - 5}" cy="42" rx="8" ry="9.5" fill="#fff" stroke="${INK}" stroke-width="2"/>
       <ellipse cx="${hx + 12}" cy="42" rx="8" ry="9.5" fill="#fff" stroke="${INK}" stroke-width="2"/>
       <circle class="pupil" cx="${hx - 2}" cy="43" r="4.6" fill="#2a1836"/>
       <circle class="pupil" cx="${hx + 15}" cy="43" r="4.6" fill="#2a1836"/>
       <circle cx="${hx - 0.5}" cy="41" r="1.7" fill="#fff"/><circle cx="${hx + 16.5}" cy="41" r="1.7" fill="#fff"/>`;
  const mouth = opts.mouthOpen
    ? `<ellipse cx="${hx + 10}" cy="64" rx="8" ry="7" fill="#7a2745" stroke="${INK}" stroke-width="2.5"/>
       <ellipse cx="${hx + 10}" cy="68" rx="4.5" ry="2.6" fill="#ff7c9c"/>`
    : `<path d="M${hx + 1},61 Q${hx + 10},70 ${hx + 19},60" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`;

  const head = `<g class="cat-head">
    <path d="M${hx - 6},30 C${hx - 12},18 ${hx - 16},12 ${hx - 20},6" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M${hx + 10},28 C${hx + 12},16 ${hx + 16},10 ${hx + 22},5" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <circle cx="${hx - 20}" cy="6" r="6" fill="#ff8fcf" stroke="${INK}" stroke-width="3"/>
    <circle cx="${hx + 22}" cy="5" r="6" fill="#ff8fcf" stroke="${INK}" stroke-width="3"/>
    <circle cx="${hx}" cy="52" r="28" fill="${CAT_BASE}" stroke="${INK}" stroke-width="3.5"/>
    <ellipse cx="${hx - 8}" cy="36" rx="10" ry="5" fill="#fff" opacity=".45"/>
    <circle cx="${hx - 14}" cy="62" r="5" fill="#ff8fb1" opacity=".7"/>
    <circle cx="${hx + 24}" cy="58" r="4" fill="#ff8fb1" opacity=".7"/>
    ${eyes}${mouth}
  </g>`;

  const w = hx + 34;
  const grow = opts.popIndex !== undefined ? ' grow' : '';
  return `<svg class="caterpillar${grow}" viewBox="0 -4 ${w} 96" style="--units:${w}" aria-hidden="true">${segs}${head}</svg>`;
}

// ---------------------------------------------------------------------------
// Eggs

export const RAINBOW = ['#ff8a9a', '#ffb870', '#ffe07a', '#a6e08a', '#8cc4f7', '#c2a3f2'];

function rainbowArcs(r: number, w: number, mono?: string): string {
  return RAINBOW.map((c0, i) => {
    const c = mono ?? c0;
    const rr = r - i * w;
    return `<path d="M${-rr},0 A${rr},${rr} 0 0 1 ${rr},0" stroke="${c}" stroke-width="${w + 0.4}" fill="none"/>`;
  }).join('') + `<path d="M${-r - w / 2},0 A${r + w / 2},${r + w / 2} 0 0 1 ${r + w / 2},0" stroke="#fff" stroke-width="1.6" fill="none"/>`;
}

const EGG_PATHS: Record<Shape, string> = {
  round: 'M0,-52 C30,-52 46,-24 46,6 C46,36 26,54 0,54 C-26,54 -46,36 -46,6 C-46,-24 -30,-52 0,-52 Z',
  pointy: 'M0,-66 C26,-42 46,-4 44,22 C42,50 22,62 0,62 C-22,62 -42,50 -44,22 C-46,-4 -26,-42 0,-66 Z',
  swallow: 'M0,-64 C22,-64 34,-30 34,4 C34,40 22,62 0,62 C-22,62 -34,40 -34,4 C-34,-30 -22,-64 0,-64 Z',
  heart: 'M0,58 C-30,40 -54,14 -52,-14 C-50,-42 -20,-52 0,-28 C20,-52 50,-42 52,-14 C54,14 30,40 0,58 Z',
  frilly: roundedStar(58, 0.68, 5, 6),
};

/** A soft, puffy star: points joined by rounded curves. */
function roundedStar(r: number, inner: number, points: number, dy: number): string {
  const n = points * 2;
  const pt = (i: number) => {
    const rad = i % 2 === 0 ? r : r * inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    return [Math.cos(a) * rad, Math.sin(a) * rad + dy];
  };
  const mid = (i: number) => {
    const [x, y] = pt(i), [x2, y2] = pt(i + 1);
    return `${((x + x2) / 2).toFixed(1)},${((y + y2) / 2).toFixed(1)}`;
  };
  let d = `M${mid(0)}`;
  for (let i = 1; i <= n; i++) {
    const [x, y] = pt(i);
    d += ` Q${x.toFixed(1)},${y.toFixed(1)} ${mid(i)}`;
  }
  return d + ' Z';
}

const EGG_TINT: Record<Shape, [string, string]> = {
  round: ['#fffaf0', '#ffe3a6'],
  pointy: ['#f4fbff', '#b9e3ff'],
  swallow: ['#f7fff0', '#c6efa6'],
  heart: ['#fff5fa', '#ffc2dc'],
  frilly: ['#fbf6ff', '#dcc8fa'],
};

const CRACKS = [
  'M-30,-6 L-18,4 L-10,-8 L0,4',
  'M0,4 L10,-6 L20,6 L32,-4',
  'M-8,-8 L-4,-22 L4,-30',
  'M20,6 L24,20 L16,30',
];

export function eggSVG(shape: Shape, cracks = 0): string {
  const g = nid('eg');
  const [a, b] = EGG_TINT[shape];
  const ribs =
    shape === 'swallow'
      ? `<path d="M-14,-56 C-20,-20 -20,30 -14,56 M0,-62 L0,60 M14,-56 C20,-20 20,30 14,56" stroke="${b}" stroke-width="3" fill="none" opacity=".9"/>`
      : shape === 'pointy'
        ? `<circle cx="-18" cy="30" r="5" fill="${b}"/><circle cx="16" cy="12" r="6" fill="${b}"/><circle cx="4" cy="42" r="4" fill="${b}"/><circle cx="-8" cy="-10" r="4" fill="${b}"/>`
        : shape === 'round'
          ? `<path d="M-40,18 Q-20,8 0,18 T40,18" stroke="${b}" stroke-width="5" fill="none"/>`
          : shape === 'frilly'
          ? `<path d="${starPath(9)}" fill="${b}" transform="translate(-16,18)"/><path d="${starPath(7)}" fill="${b}" transform="translate(16,0)"/><path d="${starPath(5)}" fill="${b}" transform="translate(8,32)"/>`
          : `<path d="${HEART_PATH}" fill="${b}" transform="translate(-20,6) scale(1.3)"/><path d="${HEART_PATH}" fill="${b}" transform="translate(22,-4) scale(1)"/>`;
  const crackPaths = CRACKS.slice(0, cracks)
    .map((d) => `<path d="${d}" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`)
    .join('');
  return `<svg class="egg" viewBox="-62 -76 124 146" aria-hidden="true">
    <defs><radialGradient id="${g}" cx=".35" cy=".3" r=".9">
      <stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
    </radialGradient></defs>
    <ellipse cx="0" cy="64" rx="36" ry="6" fill="#000" opacity=".12"/>
    <path d="${EGG_PATHS[shape]}" fill="url(#${g})"/>
    ${ribs}
    <path d="${EGG_PATHS[shape]}" fill="none" stroke="${INK}" stroke-width="4"/>
    <ellipse cx="-18" cy="-30" rx="8" ry="13" fill="#fff" opacity=".7" transform="rotate(20 -18 -30)"/>
    ${crackPaths}
  </svg>`;
}

// ---------------------------------------------------------------------------
// Chrysalis

const CHRYS_PATH = 'M0,6 C24,10 36,40 34,76 C32,112 14,140 0,158 C-14,140 -32,112 -34,76 C-36,40 -24,10 0,6 Z';

function soften(hex: string, amt = 0.3): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amt);
  const r = mix((n >> 16) & 255), g = mix((n >> 8) & 255), b = mix(n & 255);
  return `rgb(${r},${g},${b})`;
}

export function chrysalisSVG(foods: FoodId[], pattern: Pattern | null, cracks = 0): string {
  const g = nid('cg');
  const pt = nid('cp');
  const cols = foods.map((f) => FOODS[f].color);
  const stops = cols
    .map((c, i) => {
      const o0 = (i / cols.length).toFixed(3);
      const o1 = ((i + 1) / cols.length).toFixed(3);
      return `<stop offset="${o0}" stop-color="${soften(c)}"/><stop offset="${o1}" stop-color="${soften(c)}"/>`;
    })
    .join('');
  const crackPaths = [
    'M-20,60 L-8,70 L0,58 L10,72 L22,62',
    'M0,58 L-4,40 L4,28',
    'M10,72 L8,92 L18,104',
    'M-8,70 L-14,90 L-6,106',
  ]
    .slice(0, cracks)
    .map((d) => `<path d="${d}" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`)
    .join('');
  return `<svg class="chrysalis" viewBox="-52 -14 104 180" aria-hidden="true">
    <defs>
      <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient>
      ${pattern ? patternDef(pt, pattern, '#ffffff', 0.85) : ''}
    </defs>
    <path d="M0,-14 L0,10" stroke="#8a6a4a" stroke-width="4"/>
    <path d="${CHRYS_PATH}" fill="url(#${g})"/>
    ${pattern ? `<path class="chrys-pattern" d="${CHRYS_PATH}" fill="url(#${pt})" opacity=".85"/>` : ''}
    <path d="M-30,52 Q0,62 30,52 M-33,90 Q0,100 33,90 M-24,124 Q0,132 24,124" stroke="${INK}" stroke-width="2" fill="none" opacity=".35"/>
    <path d="${CHRYS_PATH}" fill="none" stroke="${INK}" stroke-width="4"/>
    <ellipse cx="-14" cy="44" rx="6" ry="18" fill="#fff" opacity=".45" transform="rotate(12 -14 44)"/>
    <path d="M-14,70 q5,5 10,0 M4,70 q5,5 10,0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="-16" cy="80" r="4" fill="#ff8fb1" opacity=".6"/><circle cx="16" cy="80" r="4" fill="#ff8fb1" opacity=".6"/>
    ${crackPaths}
  </svg>`;
}

// ---------------------------------------------------------------------------
// Food

const FOOD_SPRITES: Record<FoodId, SpriteName> = {
  strawberry: 'strawberry',
  orange: 'tangerine',
  banana: 'banana',
  pear: 'pear',
  blueberry: 'blueberries',
  grape: 'grapes',
  melon: 'watermelon',
  golden: 'maple-leaf',
};

/**
 * Food uses Fluent Emoji sprites: they sit in round buttons, where icons look
 * right. An <img> keeps each sprite's gradient ids isolated.
 */
export function foodSVG(id: FoodId): string {
  const img = `<img class="sprite" src="${SPRITES[FOOD_SPRITES[id]]}" alt="" draggable="false">`;
  if (id === 'golden') {
    return `<span class="food golden-leaf">${img}
      <svg class="food-glints" viewBox="-50 -50 100 100" aria-hidden="true">
        <path class="glint" d="${starPath(10, 0.3, 4)}" fill="#fff" transform="translate(-28,-30)"/>
        <path class="glint" d="${starPath(8, 0.3, 4)}" fill="#fff" transform="translate(30,22)" style="animation-delay:-.7s"/>
      </svg></span>`;
  }
  return `<span class="food">${img}</span>`;
}

// ---------------------------------------------------------------------------
// Pattern stickers

const STICKER_BG: Record<Pattern, string> = {
  dots: '#ffa3d2',
  stripes: '#7cb9f7',
  hearts: '#ff8595',
  stars: '#bb97f2',
  rainbow: '#a8dcf7',
};

export function stickerSVG(p: Pattern): string {
  const bg = STICKER_BG[p];
  let fg = '';
  switch (p) {
    case 'dots':
      fg = [[-14, -14, 9], [14, -12, 7], [0, 6, 10], [-16, 20, 6], [16, 20, 8]]
        .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/>`).join('');
      break;
    case 'stripes':
      fg = `<g clip-path="circle(38px at 0 0)">${[-30, -10, 10, 30].map((x) => `<rect x="${x - 5}" y="-60" width="10" height="120" fill="#fff" transform="rotate(35)"/>`).join('')}</g>`;
      break;
    case 'hearts':
      fg = `<path d="${HEART_PATH}" fill="#fff" transform="translate(0,2) scale(3.4)"/>`;
      break;
    case 'stars':
      fg = `<path d="${starPath(28)}" fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>`;
      break;
    case 'rainbow':
      fg = `<g transform="translate(0,12) scale(2.2)">${rainbowArcs(14, 3)}</g>
        <ellipse cx="-22" cy="16" rx="12" ry="7" fill="#fff"/><ellipse cx="22" cy="16" rx="12" ry="7" fill="#fff"/>`;
      break;
  }
  return `<svg class="sticker" viewBox="-50 -50 100 100" aria-hidden="true">
    <circle r="44" fill="${bg}" stroke="#fff" stroke-width="6"/>
    <clipPath id="sc-${p}"><circle r="38"/></clipPath>
    <g clip-path="url(#sc-${p})">${fg.replace('clip-path="circle(38px at 0 0)"', '')}</g>
    <circle r="44" fill="none" stroke="${INK}" stroke-width="3" opacity=".25"/>
    <ellipse cx="-16" cy="-24" rx="12" ry="6" fill="#fff" opacity=".35" transform="rotate(-30 -16 -24)"/>
  </svg>`;
}

// ---------------------------------------------------------------------------
// Scenery & icons

export function flowerSVG(color: string, center = '#ffd23f'): string {
  const petals = [0, 72, 144, 216, 288]
    .map((a) => `<ellipse cx="0" cy="-17" rx="11" ry="16" fill="${color}" stroke="${INK}" stroke-width="2.5" transform="rotate(${a})"/>`)
    .join('');
  return `<svg class="flower" viewBox="-40 -44 80 144" aria-hidden="true">
    <path d="M0,10 C4,40 -4,70 0,100" stroke="#6cc070" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M1,64 C8,44 30,40 38,46 C30,64 12,70 1,64 Z" fill="#8fdb8a" stroke="${INK}" stroke-width="2.5"/>
    <path d="M-1,80 C-8,62 -28,58 -36,64 C-28,80 -12,86 -1,80 Z" fill="#8fdb8a" stroke="${INK}" stroke-width="2.5"/>
    <g class="bloom">${petals}<circle r="10" fill="${center}" stroke="${INK}" stroke-width="2.5"/>
    <circle cx="-3" cy="-3" r="3" fill="#fff" opacity=".6"/></g>
  </svg>`;
}

export function leafSVG(): string {
  return `<svg class="leaf" viewBox="-110 -60 220 120" preserveAspectRatio="none" aria-hidden="true">
    <path d="M-104,4 C-60,-60 60,-66 104,0 C60,58 -60,56 -104,4 Z" fill="#8fdb8a" stroke="${INK}" stroke-width="4"/>
    <path d="M-100,4 C-40,0 40,0 100,0 M-40,2 L-20,-24 M-40,2 L-20,26 M10,1 L30,-26 M10,1 L30,26" stroke="#5fb866" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  </svg>`;
}

export const ICONS = {
  play: `<svg viewBox="-50 -50 100 100"><path d="M-14,-26 L28,0 L-14,26 Z" fill="#fff" stroke="#fff" stroke-width="10" stroke-linejoin="round"/></svg>`,
  home: `<svg viewBox="-50 -50 100 100"><path d="M-28,-2 L0,-28 L28,-2 L28,28 L-28,28 Z" fill="#fff" stroke="#fff" stroke-width="8" stroke-linejoin="round"/><rect x="-8" y="8" width="16" height="22" rx="3" fill="currentColor"/></svg>`,
  games: `<svg viewBox="-50 -50 100 100"><g fill="#fff"><rect x="-30" y="-30" width="26" height="26" rx="7"/><rect x="4" y="-30" width="26" height="26" rx="7"/><rect x="-30" y="4" width="26" height="26" rx="7"/><rect x="4" y="4" width="26" height="26" rx="7"/></g></svg>`,
  replay: `<svg viewBox="-50 -50 100 100"><path d="M22,-14 A26,26 0 1 0 26,8" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M12,-26 L30,-18 L22,0 Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/></svg>`,
  garden: `<svg viewBox="-50 -50 100 100"><g transform="translate(0,-6)">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-14" rx="9" ry="13" fill="#fff" transform="rotate(${a})"/>`).join('')}<circle r="8" fill="#ffd23f"/></g><path d="M0,12 L0,34" stroke="#fff" stroke-width="7" stroke-linecap="round"/></svg>`,
  book: `<svg viewBox="-50 -50 100 100"><path d="M0,-18 C-12,-28 -26,-28 -34,-24 L-34,26 C-26,22 -12,22 0,30 C12,22 26,22 34,26 L34,-24 C26,-28 12,-28 0,-18 Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><path d="M0,-18 L0,30" stroke="currentColor" stroke-width="4"/></svg>`,
  soundOn: `<svg viewBox="-50 -50 100 100"><path d="M-30,-12 L-16,-12 L2,-28 L2,28 L-16,12 L-30,12 Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><path d="M14,-14 Q24,0 14,14 M22,-24 Q38,0 22,24" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/></svg>`,
  soundOff: `<svg viewBox="-50 -50 100 100"><path d="M-30,-12 L-16,-12 L2,-28 L2,28 L-16,12 L-30,12 Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><path d="M14,-12 L34,12 M34,-12 L14,12" stroke="#fff" stroke-width="7" stroke-linecap="round"/></svg>`,
  musicOn: `<svg viewBox="-50 -50 100 100"><path d="M-10,20 L-10,-24 L24,-32 L24,12" stroke="#fff" stroke-width="7" fill="none" stroke-linejoin="round"/><ellipse cx="-18" cy="22" rx="10" ry="8" fill="#fff"/><ellipse cx="16" cy="14" rx="10" ry="8" fill="#fff"/></svg>`,
  musicOff: `<svg viewBox="-50 -50 100 100"><g opacity=".55"><path d="M-10,20 L-10,-24 L24,-32 L24,12" stroke="#fff" stroke-width="7" fill="none" stroke-linejoin="round"/><ellipse cx="-18" cy="22" rx="10" ry="8" fill="#fff"/><ellipse cx="16" cy="14" rx="10" ry="8" fill="#fff"/></g><path d="M-30,-30 L30,30" stroke="#fff" stroke-width="8" stroke-linecap="round"/></svg>`,
  close: `<svg viewBox="-50 -50 100 100"><path d="M-20,-20 L20,20 M20,-20 L-20,20" stroke="#fff" stroke-width="10" stroke-linecap="round"/></svg>`,
  trash: `<svg viewBox="-50 -50 100 100"><path d="M-22,-18 L22,-18 L18,30 L-18,30 Z" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/><path d="M-30,-18 L30,-18 M-8,-28 L8,-28" stroke="currentColor" stroke-width="6" stroke-linecap="round"/></svg>`,
};

export function sparkleSVG(color = '#fff6a8'): string {
  return `<svg viewBox="-20 -20 40 40"><path d="${starPath(18, 0.32, 4)}" fill="${color}"/></svg>`;
}

export function starSVG(): string {
  return `<svg viewBox="-50 -50 100 100"><path d="${starPath(44, 0.48)}" fill="#ffe66d" stroke="#f4b400" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="-10" cy="4" r="4" fill="${INK}"/><circle cx="10" cy="4" r="4" fill="${INK}"/>
    <path d="M-7,14 Q0,20 7,14" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
}

// ---------------------------------------------------------------------------
// Dot the ladybug (the guide)

export function ladybugSVG(): string {
  const spot = '#4b3a5e';
  return `<svg class="ladybug" viewBox="-60 -64 120 120" aria-hidden="true">
    <g class="lb-wings">
      <ellipse class="lb-wing-l" cx="-26" cy="-2" rx="26" ry="14" fill="#e8f4ff" opacity=".85" stroke="#bcd6ee" stroke-width="2"/>
      <ellipse class="lb-wing-r" cx="26" cy="-2" rx="26" ry="14" fill="#e8f4ff" opacity=".85" stroke="#bcd6ee" stroke-width="2"/>
    </g>
    <path d="M-24,30 l-10,10 M24,30 l10,10 M-30,14 l-12,4 M30,14 l12,4" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="0" cy="10" r="32" fill="#ff7b8e" stroke="${INK}" stroke-width="4"/>
    <path d="M0,-18 L0,42" stroke="${INK}" stroke-width="3.5"/>
    <circle cx="-15" cy="0" r="6" fill="${spot}"/><circle cx="15" cy="0" r="6" fill="${spot}"/>
    <circle cx="-18" cy="22" r="5" fill="${spot}"/><circle cx="18" cy="22" r="5" fill="${spot}"/>
    <circle cx="-6" cy="34" r="3.5" fill="${spot}"/><circle cx="6" cy="34" r="3.5" fill="${spot}"/>
    <ellipse cx="-14" cy="-10" rx="9" ry="5" fill="#fff" opacity=".45" transform="rotate(-25 -14 -10)"/>
    <path d="M-7,-36 C-12,-48 -18,-52 -24,-54 M7,-36 C12,-48 18,-52 24,-54" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="-24" cy="-54" r="4.5" fill="#ffdb6e" stroke="${INK}" stroke-width="2.5"/>
    <circle cx="24" cy="-54" r="4.5" fill="#ffdb6e" stroke="${INK}" stroke-width="2.5"/>
    <circle cx="0" cy="-24" r="18" fill="#5a4272" stroke="${INK}" stroke-width="3"/>
    <g class="lb-eyes">
      <ellipse cx="-7" cy="-27" rx="5.5" ry="6.5" fill="#fff"/><ellipse cx="7" cy="-27" rx="5.5" ry="6.5" fill="#fff"/>
      <circle cx="-6" cy="-26" r="3" fill="#2a1836"/><circle cx="8" cy="-26" r="3" fill="#2a1836"/>
      <circle cx="-5" cy="-27.5" r="1.1" fill="#fff"/><circle cx="9" cy="-27.5" r="1.1" fill="#fff"/>
    </g>
    <circle cx="-11" cy="-18" r="3" fill="#ff9fbd" opacity=".85"/><circle cx="11" cy="-18" r="3" fill="#ff9fbd" opacity=".85"/>
    <path class="lb-mouth" d="M-5,-17 Q0,-12 5,-17" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  </svg>`;
}

// ---------------------------------------------------------------------------
// Garden unlocks

const G = `stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"`;

export function mushroomSVG(): string {
  return `<svg viewBox="-60 -70 120 120" aria-hidden="true">
    <ellipse cx="0" cy="46" rx="40" ry="6" fill="#000" opacity=".1"/>
    <path d="M-24,4 C-26,24 -24,40 -20,46 L20,46 C24,40 26,24 24,4 Z" fill="#fff4e0" ${G}/>
    <path d="M-7,46 L-7,28 A7,7 0 0 1 7,28 L7,46 Z" fill="#c98f6a" ${G}/>
    <circle cx="12" cy="18" r="5" fill="#ffe89a" ${G}/>
    <path d="M-54,6 C-54,-40 -24,-62 0,-62 C24,-62 54,-40 54,6 C30,12 -30,12 -54,6 Z" fill="#ff8595" ${G}/>
    <circle cx="-26" cy="-24" r="8" fill="#fff"/><circle cx="4" cy="-44" r="7" fill="#fff"/>
    <circle cx="28" cy="-18" r="9" fill="#fff"/><circle cx="-4" cy="-10" r="5" fill="#fff"/>
    <path d="M-40,-24 C-34,-40 -20,-50 -8,-54" stroke="#fff" stroke-width="5" opacity=".5" fill="none" stroke-linecap="round"/>
  </svg>`;
}

export function pondSVG(): string {
  return `<svg viewBox="-100 -40 200 80" aria-hidden="true">
    <ellipse cx="0" cy="4" rx="96" ry="30" fill="#9fd4f5" ${G}/>
    <ellipse cx="-4" cy="6" rx="78" ry="20" fill="#b9e2fa"/>
    <path class="ripple" d="M-50,4 q10,-5 20,0 M20,14 q10,-5 20,0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M40,-2 A18,9 0 1 0 58,6 L44,4 Z" fill="#8fdb8a" ${G}/>
    <path d="M-66,12 A14,7 0 1 1 -46,16 L-58,12 Z" fill="#8fdb8a" ${G}/>
    <circle cx="-50" cy="8" r="5" fill="#ffc2dc" ${G}/>
  </svg>`;
}

export function frogSVG(): string {
  return `<svg viewBox="-40 -40 80 70" aria-hidden="true">
    <ellipse cx="0" cy="12" rx="26" ry="18" fill="#9fdc7c" ${G}/>
    <ellipse cx="0" cy="18" rx="15" ry="9" fill="#e4f7c8"/>
    <circle cx="-13" cy="-8" r="10" fill="#9fdc7c" ${G}/><circle cx="13" cy="-8" r="10" fill="#9fdc7c" ${G}/>
    <circle cx="-13" cy="-9" r="5" fill="#fff"/><circle cx="13" cy="-9" r="5" fill="#fff"/>
    <circle cx="-12" cy="-8" r="2.8" fill="#2a1836"/><circle cx="14" cy="-8" r="2.8" fill="#2a1836"/>
    <path d="M-10,6 Q0,14 10,6" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="-18" cy="6" r="3" fill="#ff9fbd" opacity=".8"/><circle cx="18" cy="6" r="3" fill="#ff9fbd" opacity=".8"/>
    <path d="M-24,26 l-8,4 M24,26 l8,4" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
  </svg>`;
}

export function rainbowSVG(): string {
  const arcs = RAINBOW.map((c, i) => {
    const r = 100 - i * 11;
    return `<path d="M${-r},0 A${r},${r} 0 0 1 ${r},0" stroke="${c}" stroke-width="12" fill="none"/>`;
  }).join('');
  const cloud = (x: number) =>
    `<g transform="translate(${x},0)"><circle cx="-14" cy="0" r="16" fill="#fff"/><circle cx="8" cy="-8" r="20" fill="#fff"/><circle cx="26" cy="4" r="13" fill="#fff"/><rect x="-28" y="0" width="64" height="16" rx="8" fill="#fff"/></g>`;
  return `<svg viewBox="-130 -110 260 130" aria-hidden="true">${arcs}${cloud(-92)}${cloud(84)}</svg>`;
}

export function bushSVG(): string {
  return `<svg viewBox="-70 -50 140 80" aria-hidden="true">
    <path d="M-62,24 C-72,4 -56,-16 -38,-12 C-36,-36 -6,-44 8,-28 C20,-46 52,-38 50,-12 C70,-12 74,14 62,24 Z" fill="#8fdb8a" ${G}/>
    <circle cx="-30" cy="4" r="5" fill="#ffa3d2"/><circle cx="20" cy="-10" r="5" fill="#ffdb6e"/><circle cx="42" cy="10" r="5" fill="#ffa3d2"/>
  </svg>`;
}

export function bunnySVG(): string {
  return `<svg viewBox="-40 -80 80 110" aria-hidden="true">
    <ellipse cx="-11" cy="-46" rx="8" ry="26" fill="#fff" ${G}/><ellipse cx="11" cy="-46" rx="8" ry="26" fill="#fff" ${G}/>
    <ellipse cx="-11" cy="-44" rx="3.5" ry="17" fill="#ffc2dc"/><ellipse cx="11" cy="-44" rx="3.5" ry="17" fill="#ffc2dc"/>
    <ellipse cx="0" cy="-6" rx="26" ry="22" fill="#fff" ${G}/>
    <circle cx="-9" cy="-10" r="3.5" fill="#2a1836"/><circle cx="9" cy="-10" r="3.5" fill="#2a1836"/>
    <path d="M-3,-3 L3,-3 L0,1 Z" fill="#ff9fbd"/>
    <path d="M0,1 Q-5,6 -8,3 M0,1 Q5,6 8,3" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="-15" cy="-1" r="3.5" fill="#ffc2dc"/><circle cx="15" cy="-1" r="3.5" fill="#ffc2dc"/>
  </svg>`;
}

export function treeSVG(): string {
  return `<svg viewBox="-110 -170 220 250" aria-hidden="true">
    <path d="M-16,76 C-12,30 -14,-10 -22,-40 L22,-40 C14,-10 12,30 16,76 Z" fill="#c9966c" ${G}/>
    <path d="M-2,-20 C30,-30 56,-40 76,-44" stroke="#c9966c" stroke-width="14" fill="none" stroke-linecap="round"/>
    <g fill="#9fdc7c" ${G}>
      <circle cx="-50" cy="-80" r="44"/><circle cx="40" cy="-90" r="48"/><circle cx="-6" cy="-128" r="42"/><circle cx="70" cy="-50" r="26"/>
    </g>
    <g fill="#b6e79c"><circle cx="-50" cy="-80" r="40"/><circle cx="40" cy="-90" r="44"/><circle cx="-6" cy="-128" r="38"/><circle cx="70" cy="-50" r="22"/></g>
    <circle cx="-30" cy="-100" r="6" fill="#ff8595"/><circle cx="30" cy="-120" r="6" fill="#ff8595"/><circle cx="60" cy="-76" r="6" fill="#ff8595"/><circle cx="-64" cy="-60" r="6" fill="#ff8595"/>
    <g class="swing">
      <path d="M40,-34 L40,40 M70,-40 L70,40" stroke="#a88062" stroke-width="3"/>
      <rect x="30" y="38" width="50" height="10" rx="4" fill="#ffae5c" ${G}/>
    </g>
  </svg>`;
}

export function birdbathSVG(): string {
  return `<svg viewBox="-60 -40 120 110" aria-hidden="true">
    <path d="M-14,66 L-8,10 L8,10 L14,66 Z" fill="#e6e0f0" ${G}/>
    <rect x="-26" y="60" width="52" height="10" rx="5" fill="#e6e0f0" ${G}/>
    <path d="M-50,-4 C-46,16 46,16 50,-4 Z" fill="#e6e0f0" ${G}/>
    <ellipse cx="0" cy="-4" rx="50" ry="8" fill="#b9e2fa" ${G}/>
  </svg>`;
}

export function birdSVG(): string {
  return `<svg viewBox="-34 -34 68 60" aria-hidden="true">
    <path d="M-24,4 C-24,-20 18,-24 22,-2 C26,14 -20,20 -24,4 Z" fill="#8cc4f7" ${G}/>
    <path d="M-4,-2 C4,-14 16,-10 14,2 C8,6 -2,6 -4,-2 Z" fill="#b9dcfb" ${G}/>
    <path d="M-24,0 L-34,-6 L-30,6 Z" fill="#8cc4f7" ${G}/>
    <circle cx="-12" cy="-8" r="3" fill="#2a1836"/>
    <path d="M-25,-9 L-35,-5 L-25,-2 Z" fill="#ffb870" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M-4,18 L-4,24 M4,18 L4,24" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}

export function balloonSVG(): string {
  const stripes = ['#ff8595', '#ffdb6e', '#8cc4f7', '#ffdb6e', '#ff8595'];
  const env = 'M0,-80 C44,-80 62,-46 58,-16 C54,14 22,34 12,48 L-12,48 C-22,34 -54,14 -58,-16 C-62,-46 -44,-80 0,-80 Z';
  return `<svg viewBox="-70 -90 140 180" aria-hidden="true">
    <defs><clipPath id="bal-clip"><path d="${env}"/></clipPath></defs>
    <g clip-path="url(#bal-clip)">${stripes.map((c, i) => `<rect x="${-60 + i * 24}" y="-90" width="24" height="150" fill="${c}"/>`).join('')}</g>
    <path d="${env}" fill="none" ${G}/>
    <path d="M-12,48 L-14,68 M12,48 L14,68" stroke="${INK}" stroke-width="2.5"/>
    <rect x="-18" y="66" width="36" height="20" rx="4" fill="#c9966c" ${G}/>
    <ellipse cx="-24" cy="-50" rx="8" ry="16" fill="#fff" opacity=".4" transform="rotate(20 -24 -50)"/>
  </svg>`;
}

export function fairyhouseSVG(): string {
  return `<svg viewBox="-70 -130 140 200" aria-hidden="true">
    <path d="M-40,64 C-44,20 -40,-30 -34,-50 L34,-50 C40,-30 44,20 40,64 Z" fill="#e8c9a8" ${G}/>
    <path d="M-16,64 L-16,30 A16,16 0 0 1 16,30 L16,64 Z" fill="#b98a66" ${G}/>
    <circle cx="10" cy="46" r="2.5" fill="#ffdb6e"/>
    <circle class="fh-light" cx="-18" cy="-12" r="11" fill="#fff4c2" ${G}/>
    <circle class="fh-light" cx="20" cy="4" r="9" fill="#fff4c2" ${G}/>
    <path d="M-58,-44 C-50,-100 -14,-124 0,-124 C14,-124 50,-100 58,-44 C30,-36 -30,-36 -58,-44 Z" fill="#c2a3f2" ${G}/>
    <circle cx="-24" cy="-74" r="7" fill="#fff"/><circle cx="16" cy="-96" r="6" fill="#fff"/><circle cx="30" cy="-62" r="8" fill="#fff"/>
    <path d="M0,-124 L0,-136" stroke="${INK}" stroke-width="3"/>
    <path d="${starPath(9)}" fill="#ffdb6e" stroke="${INK}" stroke-width="2.5" transform="translate(0,-140)"/>
  </svg>`;
}

export function snailSVG(): string {
  return `<svg viewBox="-60 -50 120 80" aria-hidden="true">
    <path d="M-50,22 C-50,8 -30,6 -20,10 L40,10 C54,10 56,22 50,24 Z" fill="#ffe0b8" ${G}/>
    <path d="M40,12 C42,0 44,-10 46,-16 M48,12 C52,2 56,-8 60,-12" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="46" cy="-16" r="3.5" fill="${INK}"/><circle cx="60" cy="-12" r="3.5" fill="${INK}"/>
    <circle cx="4" cy="-8" r="26" fill="#ffb3cf" ${G}/>
    <path d="M4,-8 m-4,0 a4,4 0 1 1 8,0 a8,8 0 1 1 -16,0 a12,12 0 1 1 24,0 a16,16 0 1 1 -32,0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M38,18 Q44,22 50,18" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </svg>`;
}

export function beeSVG(): string {
  return `<svg viewBox="-50 -40 100 80" aria-hidden="true">
    <g class="bee-wings">
      <ellipse cx="-8" cy="-22" rx="12" ry="16" fill="#e8f4ff" opacity=".9" stroke="#bcd6ee" stroke-width="2" transform="rotate(-20 -8 -22)"/>
      <ellipse cx="8" cy="-22" rx="12" ry="16" fill="#e8f4ff" opacity=".9" stroke="#bcd6ee" stroke-width="2" transform="rotate(20 8 -22)"/>
    </g>
    <path d="M30,4 L42,4" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="0" cy="4" rx="32" ry="22" fill="#ffdb6e" ${G}/>
    <path d="M-8,-17 C-12,-4 -12,12 -8,25 M8,-17 C4,-4 4,12 8,25" stroke="${INK}" stroke-width="7" fill="none"/>
    <circle cx="-26" cy="2" r="14" fill="#5a4272" stroke="${INK}" stroke-width="3"/>
    <circle cx="-29" cy="-1" r="4" fill="#fff"/><circle cx="-30" cy="-1" r="2.2" fill="#2a1836"/>
    <path d="M-34,8 Q-30,12 -26,9" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M-30,-12 C-34,-22 -38,-26 -42,-28" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <circle cx="-42" cy="-28" r="3" fill="${INK}"/>
  </svg>`;
}

export function appleSVG(): string {
  return `<svg viewBox="-24 -26 48 50" aria-hidden="true">
    <path d="M0,-12 C-14,-22 -22,-8 -20,4 C-18,16 -8,22 0,18 C8,22 18,16 20,4 C22,-8 14,-22 0,-12 Z" fill="#ff8595" ${G}/>
    <path d="M0,-12 L2,-22" stroke="#a88062" stroke-width="3" stroke-linecap="round"/>
    <path d="M2,-18 C8,-26 16,-22 16,-18 C10,-14 6,-15 2,-18 Z" fill="#8fdb8a" stroke="${INK}" stroke-width="2"/>
    <ellipse cx="-9" cy="-4" rx="3.5" ry="5" fill="#fff" opacity=".5"/>
  </svg>`;
}

export const ICONS_EXTRA = {
  gear: `<svg viewBox="-50 -50 100 100"><g fill="currentColor">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="-7" y="-40" width="14" height="18" rx="4" transform="rotate(${a})"/>`).join('')}<circle r="27"/></g><circle r="10" fill="#fff"/></svg>`,
  sun: `<svg viewBox="-50 -50 100 100"><circle r="18" fill="#fff"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="-4" y="-38" width="8" height="12" rx="4" fill="#fff" transform="rotate(${a})"/>`).join('')}</svg>`,
  moon: `<svg viewBox="-50 -50 100 100"><path d="M10,-32 A32,32 0 1 0 30,14 A26,26 0 1 1 10,-32 Z" fill="#fff"/></svg>`,
};
