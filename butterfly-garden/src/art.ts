// All artwork is hand-built SVG so the game ships with zero image files.
import { FOODS, colorsOf, type Butterfly, type FoodId, type Pattern, type Shape } from './data';

export const INK = '#4a2d5c';
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
};

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
function patternDef(id: string, pattern: Pattern, color: string, scale = 1): string {
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
    ? `<defs>${patternDef(pt, b.pattern, '#e6def0', 1)}</defs>`
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

const CAT_BASE = '#9be27a';

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

const EGG_PATHS: Record<Shape, string> = {
  round: 'M0,-52 C30,-52 46,-24 46,6 C46,36 26,54 0,54 C-26,54 -46,36 -46,6 C-46,-24 -30,-52 0,-52 Z',
  pointy: 'M0,-66 C26,-42 46,-4 44,22 C42,50 22,62 0,62 C-22,62 -42,50 -44,22 C-46,-4 -26,-42 0,-66 Z',
  swallow: 'M0,-64 C22,-64 34,-30 34,4 C34,40 22,62 0,62 C-22,62 -34,40 -34,4 C-34,-30 -22,-64 0,-64 Z',
  heart: 'M0,58 C-30,40 -54,14 -52,-14 C-50,-42 -20,-52 0,-28 C20,-52 50,-42 52,-14 C54,14 30,40 0,58 Z',
};

const EGG_TINT: Record<Shape, [string, string]> = {
  round: ['#fffaf0', '#ffe3a6'],
  pointy: ['#f4fbff', '#b9e3ff'],
  swallow: ['#f7fff0', '#c6efa6'],
  heart: ['#fff5fa', '#ffc2dc'],
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

export function foodSVG(id: FoodId): string {
  const s = `stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"`;
  let body = '';
  switch (id) {
    case 'strawberry':
      body = `<path d="M0,44 C-30,30 -40,-2 -34,-18 C-28,-32 -12,-30 0,-26 C12,-30 28,-32 34,-18 C40,-2 30,30 0,44 Z" fill="#ff4d6d" ${s}/>
        ${[[-16, -8], [0, -12], [16, -8], [-20, 10], [-4, 6], [12, 8], [-8, 24], [8, 24]]
          .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.2" ry="3.2" fill="#ffe08a"/>`).join('')}
        <path d="M-24,-28 L-8,-24 L0,-40 L8,-24 L24,-28 L12,-16 L0,-20 L-12,-16 Z" fill="#5cc95c" ${s}/>
        <ellipse cx="-18" cy="-14" rx="5" ry="3" fill="#fff" opacity=".5"/>`;
      break;
    case 'orange':
      body = `<circle cx="0" cy="6" r="36" fill="#ff9f1c" ${s}/>
        ${[[-14, 0], [10, -6], [14, 18], [-8, 22], [0, 8]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#e07b00"/>`).join('')}
        <path d="M0,-30 L2,-38" stroke="#7a4a1a" stroke-width="4" stroke-linecap="round"/>
        <path d="M2,-34 C12,-46 26,-42 28,-34 C18,-28 8,-30 2,-34 Z" fill="#5cc95c" ${s}/>
        <ellipse cx="-16" cy="-10" rx="8" ry="5" fill="#fff" opacity=".5" transform="rotate(-30 -16 -10)"/>`;
      break;
    case 'banana':
      body = `<path d="M-36,-30 C-34,10 -4,38 36,24 C40,22 40,16 36,14 C8,20 -18,0 -24,-30 Z" fill="#ffd93d" ${s}/>
        <path d="M-30,-18 C-26,6 -4,24 26,20" stroke="#e6b800" stroke-width="3" fill="none"/>
        <path d="M-36,-30 L-38,-38 L-26,-38 L-24,-30" fill="#7a5a2a" ${s}/>`;
      break;
    case 'pear':
      body = `<path d="M0,-30 C10,-30 12,-16 16,-6 C30,8 38,20 34,32 C28,46 -28,46 -34,32 C-38,20 -30,8 -16,-6 C-12,-16 -10,-30 0,-30 Z" fill="#9be15d" ${s}/>
        <path d="M0,-30 L-2,-42" stroke="#7a4a1a" stroke-width="4" stroke-linecap="round"/>
        <path d="M0,-38 C8,-50 22,-48 24,-40 C14,-34 6,-34 0,-38 Z" fill="#5cc95c" ${s}/>
        <ellipse cx="-16" cy="14" rx="6" ry="10" fill="#fff" opacity=".45" transform="rotate(20 -16 14)"/>`;
      break;
    case 'blueberry':
      body = [[-17, 12], [17, 12], [0, -14]]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="19" fill="#4e8cff" ${s}/>
          <path d="${starPath(6, 0.45, 5)}" fill="#2a4a9a" transform="translate(${x},${y - 8})"/>
          <circle cx="${x - 7}" cy="${y + 3}" r="3.5" fill="#fff" opacity=".6"/>`)
        .join('');
      break;
    case 'grape':
      body = `<path d="M0,-34 L4,-44" stroke="#7a4a1a" stroke-width="4" stroke-linecap="round"/>
        <path d="M2,-40 C12,-52 26,-48 28,-40 C18,-34 8,-36 2,-40 Z" fill="#5cc95c" ${s}/>` +
        [[-22, -20], [0, -22], [22, -20], [-12, 0], [12, 0], [-22, 18], [0, 20], [22, 18], [-10, 36], [10, 36]]
          .filter((_, i) => i !== 5 && i !== 7)
          .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="12" fill="#9d5cf0" ${s}/><circle cx="${x - 4}" cy="${y - 4}" r="3" fill="#fff" opacity=".55"/>`)
          .join('');
      break;
    case 'melon':
      body = `<path d="M0,40 L-40,-24 Q0,-46 40,-24 Z" fill="#ff6f91" ${s}/>
        <path d="M-40,-24 Q0,-46 40,-24" stroke="#4caf50" stroke-width="10" fill="none" stroke-linecap="round"/>
        ${[[-14, -14], [8, -18], [-2, 2], [14, -2], [-6, 20]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.5" ry="4" fill="#2a1836"/>`).join('')}`;
      break;
    case 'golden':
      body = `<path d="M0,-42 C30,-28 36,10 0,42 C-36,10 -30,-28 0,-42 Z" fill="#ffd54a" stroke="#c98a00" stroke-width="3.5"/>
        <path d="M0,-34 L0,38 M0,-10 L-14,-22 M0,-10 L14,-22 M0,10 L-16,-2 M0,10 L16,-2" stroke="#e0a400" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path class="glint" d="${starPath(10, 0.3, 4)}" fill="#fff" transform="translate(-24,-28)"/>
        <path class="glint" d="${starPath(8, 0.3, 4)}" fill="#fff" transform="translate(26,20)" style="animation-delay:-.7s"/>`;
      break;
  }
  return `<svg class="food" viewBox="-50 -50 100 100" aria-hidden="true">${body}</svg>`;
}

// ---------------------------------------------------------------------------
// Pattern stickers

const STICKER_BG: Record<Pattern, string> = {
  dots: '#ff8fcf',
  stripes: '#4ea8ff',
  hearts: '#ff5d73',
  stars: '#a86cf0',
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
    <path d="M0,10 C4,40 -4,70 0,100" stroke="#4caf50" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M1,64 C8,44 30,40 38,46 C30,64 12,70 1,64 Z" fill="#6bd06b" stroke="${INK}" stroke-width="2.5"/>
    <path d="M-1,80 C-8,62 -28,58 -36,64 C-28,80 -12,86 -1,80 Z" fill="#6bd06b" stroke="${INK}" stroke-width="2.5"/>
    <g class="bloom">${petals}<circle r="10" fill="${center}" stroke="${INK}" stroke-width="2.5"/>
    <circle cx="-3" cy="-3" r="3" fill="#fff" opacity=".6"/></g>
  </svg>`;
}

export function leafSVG(): string {
  return `<svg class="leaf" viewBox="-110 -60 220 120" preserveAspectRatio="none" aria-hidden="true">
    <path d="M-104,4 C-60,-60 60,-66 104,0 C60,58 -60,56 -104,4 Z" fill="#6bd06b" stroke="${INK}" stroke-width="4"/>
    <path d="M-100,4 C-40,0 40,0 100,0 M-40,2 L-20,-24 M-40,2 L-20,26 M10,1 L30,-26 M10,1 L30,26" stroke="#3f9f47" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  </svg>`;
}

export const ICONS = {
  play: `<svg viewBox="-50 -50 100 100"><path d="M-14,-26 L28,0 L-14,26 Z" fill="#fff" stroke="#fff" stroke-width="10" stroke-linejoin="round"/></svg>`,
  home: `<svg viewBox="-50 -50 100 100"><path d="M-28,-2 L0,-28 L28,-2 L28,28 L-28,28 Z" fill="#fff" stroke="#fff" stroke-width="8" stroke-linejoin="round"/><rect x="-8" y="8" width="16" height="22" rx="3" fill="currentColor"/></svg>`,
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
