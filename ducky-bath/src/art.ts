// All the art is drawn here as SVG in code: the rubber ducks (Ducky and the
// twelve to find), the bath with its tap, plug, bubble bottle and sponge,
// bubbles and foam, and the button icons.
import type { Colour } from './data';

export const INK = '#4a3b6b';
const S = `stroke="${INK}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;

export function starPath(r: number, inner = 0.45, points = 5): string {
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const a = (i * Math.PI) / points - Math.PI / 2;
    const rad = i % 2 ? r * inner : r;
    d += `${i ? 'L' : 'M'}${(Math.cos(a) * rad).toFixed(2)},${(Math.sin(a) * rad).toFixed(2)}`;
  }
  return `${d}Z`;
}

export function sparkleSVG(color = '#fff6a8'): string {
  return `<svg viewBox="-20 -20 40 40"><path d="${starPath(18, 0.32, 4)}" fill="${color}"/></svg>`;
}

/** Shapes with a soft ink outline all the way round (lines inside don't show). */
function outlined(shapes: string, fill: string, w = 6, ink = INK): string {
  return `<g fill="${ink}" stroke="${ink}" stroke-width="${w}" stroke-linejoin="round">${shapes}</g><g fill="${fill}">${shapes}</g>`;
}

let uid = 0;

// ---------------------------------------------------------------------------
// Rubber ducks, side on and facing right. The water line is y = 0 and the
// duck's middle x = 0; a duck is about 120 across.

const BODY = 'M-44,-28 C-50,-40 -52,-54 -46,-64 C-40,-56 -32,-50 -18,-48 C2,-46 22,-52 40,-40 C56,-28 50,-2 22,2 L-22,2 C-40,2 -46,-14 -44,-28 Z';
const HEAD = { cx: 18, cy: -66, r: 25 };
const BEAK = 'M38,-73 C48,-80 64,-76 63,-67 C62,-60 50,-58 39,-61 Z';
const WING = 'M-28,-30 C-18,-42 6,-42 12,-28 C4,-16 -14,-14 -28,-30 Z';
export const DUCK_BOX = '-66 -134 132 138';
/** Where the water line is, as a share of a duck picture's height from the top. */
export const DUCK_WATER = 134 / 138;

export interface DuckLook {
  body: string;
  shade: string;
  head?: string;
  /** Drawn behind the duck (a cape, a mane, spikes). */
  back?: string;
  /** Drawn over the body, under the head. */
  over?: string;
  /** Drawn over everything (hats and such). */
  front?: string;
  /** Rainbow stripes across the body. */
  stripes?: string[];
}

const RAINBOW = ['#ff5d6c', '#ffa24a', '#ffd84a', '#7fd35b', '#5eaaff', '#b184f5'];
const YELLOW = '#ffd84a';
const YELLOW_SHADE = '#f5b82e';

export const LOOKS: Record<string, DuckLook> = {
  ducky: { body: YELLOW, shade: YELLOW_SHADE },
  baby: {
    body: '#ffe57a',
    shade: '#f5c842',
    front: `<path d="M17,-90 C12,-101 24,-106 26,-97" fill="none" ${S} stroke-width="3.5"/>`,
  },
  rainbow: { body: YELLOW, shade: '#ffffff', stripes: RAINBOW, head: YELLOW },
  princess: {
    body: '#ffb3d6',
    shade: '#ff8fc4',
    front: `${outlined('<path d="M2,-84 L0,-101 L10,-93 L18,-107 L26,-93 L36,-101 L34,-84 C24,-88 12,-88 2,-84 Z"/>', '#ffd23f', 5)}
      <circle cx="18" cy="-93" r="3.6" fill="#ff5d9e"/><circle cx="6" cy="-90" r="2" fill="#7cc0ff"/><circle cx="30" cy="-90" r="2" fill="#7cc0ff"/>
      <path d="M23,-77 L21,-81 M27,-77.5 L27,-82 M31,-76.5 L33,-80" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`,
  },
  pirate: {
    body: YELLOW,
    shade: YELLOW_SHADE,
    front: `${outlined('<path d="M-10,-82 C-6,-107 42,-107 46,-82 C32,-90 4,-90 -10,-82 Z"/>', '#3b3552', 5)}
      <path d="M-3,-86 C10,-93 28,-93 40,-86" stroke="#ffd23f" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="18" cy="-98" r="4.6" fill="#fff"/><circle cx="16.4" cy="-98.6" r="1.2" fill="#3b3552"/><circle cx="19.6" cy="-98.6" r="1.2" fill="#3b3552"/>`,
  },
  fire: {
    body: YELLOW,
    shade: YELLOW_SHADE,
    front: `${outlined('<path d="M-2,-80 C-2,-106 40,-108 40,-82 Z"/>', '#ff5d4a', 5)}
      ${outlined('<path d="M-18,-78 C-6,-85 30,-85 47,-81 C45,-76 30,-77 18,-78 C6,-78 -8,-74 -18,-78 Z"/>', '#e8413a', 5)}
      <path d="M19,-101 L26,-97 L25,-89 L19,-86 L13,-89 L12,-97 Z" fill="#ffd23f" ${S} stroke-width="2.5"/>
      <path d="M8,-100 C10,-96 10,-90 9,-86" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`,
  },
  chef: {
    body: '#fffdf5',
    shade: '#ebe3d3',
    front: outlined('<path d="M4,-84 L5,-99 L33,-99 L34,-84 C24,-88 14,-88 4,-84 Z"/><circle cx="8" cy="-104" r="10"/><circle cx="30" cy="-104" r="10"/><circle cx="19" cy="-110" r="12"/>', '#ffffff', 5),
    over: `<path d="M4,-47 C12,-41 26,-41 36,-48 L33,-38 C28,-36 24,-37 20,-40 C14,-36 8,-38 4,-47 Z" fill="#ff5d6c" ${S} stroke-width="2.5"/>`,
  },
  frog: {
    body: '#7fd35b',
    shade: '#5bb33c',
    head: '#7fd35b',
    front: `${outlined('<circle cx="5" cy="-89" r="10"/><circle cx="30" cy="-92" r="10"/>', '#7fd35b', 5)}
      <circle cx="5" cy="-90" r="6.4" fill="#fff"/><circle cx="30" cy="-93" r="6.4" fill="#fff"/>
      <circle cx="6.5" cy="-90" r="3.4" fill="${INK}"/><circle cx="31.5" cy="-93" r="3.4" fill="${INK}"/>`,
  },
  super: {
    body: '#5eaaff',
    shade: '#3a82dc',
    back: outlined('<path d="M10,-50 C-10,-55 -40,-51 -62,-36 C-57,-28 -55,-20 -53,-10 C-36,-24 -14,-32 12,-40 Z"/>', '#ff5d6c', 5),
    over: `<path d="${starPath(10)}" transform="translate(37 -22)" fill="#ffd23f" ${S} stroke-width="2.5"/>`,
  },
  space: {
    body: YELLOW,
    shade: YELLOW_SHADE,
    front: `<circle cx="22" cy="-68" r="42" fill="#cdefff" fill-opacity=".18" stroke="#ffffff" stroke-width="6"/>
      <circle cx="22" cy="-68" r="42" fill="none" stroke="${INK}" stroke-width="2.5"/>
      <path d="M-8,-86 C-2,-100 10,-106 22,-107" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/>
      <path d="M22,-110 L22,-121" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="22" cy="-124" r="5.5" fill="#ff5d6c" ${S} stroke-width="2.5"/>`,
  },
  unicorn: {
    body: '#ffffff',
    shade: '#ece5f8',
    back: `<g fill="${INK}" stroke="${INK}" stroke-width="6"><circle cx="0" cy="-84" r="9"/><circle cx="-7" cy="-71" r="9"/><circle cx="-5" cy="-57" r="8"/></g>
      <circle cx="0" cy="-84" r="9" fill="#ff94c8"/><circle cx="-7" cy="-71" r="9" fill="#b184f5"/><circle cx="-5" cy="-57" r="8" fill="#7cc0ff"/>`,
    front: `${outlined('<path d="M12,-86 L31,-121 L26,-84 Z"/>', '#ffd23f', 5)}
      <path d="M16,-95 L26,-97 M21,-106 L28,-108" stroke="#e8a817" stroke-width="2.5" stroke-linecap="round"/>`,
  },
  wizard: {
    body: '#b184f5',
    shade: '#8a5bd6',
    front: `${outlined('<ellipse cx="18" cy="-86" rx="27" ry="6"/><path d="M4,-87 C10,-102 14,-116 6,-130 C22,-122 32,-104 32,-87 Z"/>', '#3d6bd6', 5)}
      <path d="${starPath(6)}" transform="translate(19 -101)" fill="#ffd23f"/><circle cx="12" cy="-115" r="2.2" fill="#ffd23f"/><circle cx="26" cy="-92" r="1.8" fill="#ffd23f"/>`,
  },
  dino: {
    body: '#4fc6b0',
    shade: '#34a591',
    back: outlined(
      '<path d="M-37,-50 L-32,-65 L-24,-48 Z"/><path d="M-21,-48 L-15,-63 L-7,-48 Z"/><path d="M-6,-68 L-15,-80 L1,-82 Z"/><path d="M3,-85 L1,-99 L13,-90 Z"/><path d="M15,-91 L19,-104 L25,-90 Z"/>',
      '#ffa24a',
      5,
    ),
    over: '<circle cx="-30" cy="-12" r="4" fill="#34a591"/><circle cx="-18" cy="-6" r="3" fill="#34a591"/><circle cx="-36" cy="-24" r="2.6" fill="#34a591"/>',
  },
  golden: {
    body: '#ffd23f',
    shade: '#f0a81c',
    head: '#ffd23f',
    front: `${outlined('<path d="M2,-84 L-2,-104 L10,-94 L18,-110 L26,-94 L38,-104 L34,-84 C24,-88 12,-88 2,-84 Z"/>', '#ff5d6c', 5)}
      <circle cx="18" cy="-110" r="3.2" fill="#fff6a8"/><circle cx="-2" cy="-104" r="2.6" fill="#fff6a8"/><circle cx="38" cy="-104" r="2.6" fill="#fff6a8"/>
      <path d="${starPath(8, 0.3, 4)}" transform="translate(-40 -82)" fill="#fff6a8"/>
      <path d="${starPath(6, 0.3, 4)}" transform="translate(54 -98)" fill="#fff6a8"/>
      <path d="${starPath(5, 0.3, 4)}" transform="translate(-54 -46)" fill="#fff6a8"/>`,
    over: '<path d="M-36,-18 C-30,-10 -16,-6 -4,-7" stroke="#fff6a8" stroke-width="4" fill="none" stroke-linecap="round"/>',
  },
};

/** A plain little rubber duck in one of the colours. */
export const colourLook = (c: Colour): DuckLook => ({ body: c.petal, shade: c.dark });

export function duckSVG(look: DuckLook | string, cls = ''): string {
  const L = typeof look === 'string' ? (LOOKS[look] ?? LOOKS.ducky) : look;
  const head = L.head ?? L.body;
  const id = `dk${++uid}`;
  const body = L.stripes
    ? `<clipPath id="${id}"><path d="${BODY}"/></clipPath><g clip-path="url(#${id})">${L.stripes
        .map((c, i) => `<rect x="-60" y="${-66 + i * 11.4}" width="120" height="12" fill="${c}"/>`)
        .join('')}</g>`
    : `<path d="${BODY}" fill="${L.body}"/>`;
  return `<svg viewBox="${DUCK_BOX}" aria-hidden="true" class="duck-art ${cls}">
    ${L.back ?? ''}
    <g fill="${INK}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"><path d="${BODY}"/><circle cx="${HEAD.cx}" cy="${HEAD.cy}" r="${HEAD.r}"/><path d="${BEAK}"/></g>
    ${body}
    <path d="${WING}" fill="${L.stripes ? '#ffffff' : L.shade}" ${S} stroke-width="2.5" ${L.stripes ? 'fill-opacity=".55"' : ''}/>
    <path d="M-16,-25 C-8,-29 0,-29 6,-27" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".35"/>
    <path d="M28,-32 C35,-26 38,-18 36,-10" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".55"/>
    ${L.over ?? ''}
    <circle cx="${HEAD.cx}" cy="${HEAD.cy}" r="${HEAD.r}" fill="${head}"/>
    <ellipse cx="8" cy="-80" rx="7" ry="4" transform="rotate(-35 8 -80)" fill="#fff" opacity=".6"/>
    <path d="${BEAK}" fill="#ff9a3c"/>
    <path d="M41,-66 C49,-65 56,-65 62,-67" stroke="#d9702a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <circle cx="24" cy="-57" r="5" fill="#ff8aa0" opacity=".5"/>
    <g class="duck-eye"><circle cx="27" cy="-72" r="4.8" fill="${INK}"/><circle cx="28.6" cy="-73.8" r="1.7" fill="#fff"/></g>
    ${L.front ?? ''}
  </svg>`;
}

/** A splodge of mud (for scrubbing off). */
export function mudSVG(): string {
  return `<svg viewBox="-24 -24 48 48" aria-hidden="true">
    <path d="M-16,-6 C-20,-16 -8,-22 0,-18 C8,-24 20,-16 17,-6 C24,0 18,12 8,11 C6,20 -4,20 -6,12 C-16,16 -22,4 -16,-6 Z" fill="#8a5a3c" stroke="#6b4228" stroke-width="2.5"/>
    <circle cx="-5" cy="-6" r="4" fill="#a9754f"/><circle cx="7" cy="-9" r="2.5" fill="#a9754f"/>
  </svg>`;
}

// ---------------------------------------------------------------------------
// The bath. Everything is placed in the bath's own units: 1000 across and
// 520 down, the top of the back rim at y = 34 and the front rim at y = 232.

export const TUB_W = 1000;
export const TUB_H = 520;

export function tubBackSVG(): string {
  const g = `tb${++uid}`;
  return `<svg viewBox="0 0 ${TUB_W} ${TUB_H}" aria-hidden="true">
    <defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6ebf7"/><stop offset="1" stop-color="#f2faff"/></linearGradient></defs>
    <path d="M56,58 L944,58 L950,430 L50,430 Z" fill="url(#${g})"/>
    <path d="M56,58 L112,70 L112,430 L50,430 Z" fill="#c9e2f0"/>
    <path d="M944,58 L888,70 L888,430 L950,430 Z" fill="#c9e2f0"/>
    <rect x="36" y="34" width="928" height="34" rx="17" fill="#fff" stroke="${INK}" stroke-width="6"/>
    <path d="M60,44 L400,44" stroke="#dcecf6" stroke-width="5" stroke-linecap="round"/>
  </svg>`;
}

export function tubFrontSVG(colour = '#ff9fc0', dots = '#ffffff'): string {
  const foot = (x: number) =>
    `<path d="M${x - 24},462 C${x - 38},492 ${x - 26},514 ${x},514 C${x + 24},514 ${x + 32},494 ${x + 22},462 Z" fill="#ffd23f" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
     <path d="M${x - 14},500 L${x - 14},512 M${x},502 L${x},514 M${x + 12},500 L${x + 12},512" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
  const spots = [
    [150, 330, 22],
    [230, 400, 14],
    [300, 320, 10],
    [720, 340, 12],
    [800, 410, 20],
    [870, 320, 13],
    [500, 440, 9],
    [560, 330, 7],
  ];
  return `<svg viewBox="0 0 ${TUB_W} ${TUB_H}" aria-hidden="true">
    ${foot(175)}${foot(825)}
    <path d="M40,256 L960,256 C962,380 920,462 830,472 L170,472 C80,462 38,380 40,256 Z" fill="${colour}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    ${spots.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${dots}" opacity=".32"/>`).join('')}
    <path d="M86,300 C90,360 110,410 150,440" stroke="#fff" stroke-width="12" opacity=".4" fill="none" stroke-linecap="round"/>
    <rect x="18" y="230" width="964" height="38" rx="19" fill="#fff" stroke="${INK}" stroke-width="6"/>
    <path d="M44,241 L520,241" stroke="#eaf3f9" stroke-width="6" stroke-linecap="round"/>
  </svg>`;
}

/** The tap, 160 by 200: the water comes out at (137, 106). */
export function tapSVG(): string {
  return `<svg viewBox="0 0 160 200" aria-hidden="true">
    <g stroke="${INK}" stroke-width="5" stroke-linejoin="round" fill="#dfe8f0">
      <rect x="62" y="84" width="36" height="120" rx="8"/>
      <path d="M62,98 C62,40 150,36 150,92 L150,106 L124,106 L124,94 C124,72 98,72 98,98 Z"/>
      <rect x="86" y="22" width="20" height="30" rx="5"/>
    </g>
    <g class="tap-knob">
      <ellipse cx="96" cy="22" rx="32" ry="11" fill="#6fb8f0" stroke="${INK}" stroke-width="5"/>
      <ellipse cx="88" cy="18" rx="12" ry="3.5" fill="#fff" opacity=".7"/>
    </g>
    <path d="M70,112 L70,188" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".75"/>
    <path d="M72,82 C74,62 94,50 114,50" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".75"/>
  </svg>`;
}

/** The plug on its chain, 60 by 300: the ring sits on the rim at the top. */
export function plugSVG(): string {
  const links = Array.from({ length: 19 }, (_, i) => `<ellipse cx="30" cy="${30 + i * 12}" rx="${i % 2 ? 2.6 : 5.5}" ry="6.5" fill="none" stroke="#8a9bb0" stroke-width="4"/>`).join('');
  return `<svg viewBox="0 0 60 300" aria-hidden="true">
    ${links}
    <circle cx="30" cy="16" r="14" fill="none" stroke="${INK}" stroke-width="11"/>
    <circle cx="30" cy="16" r="14" fill="none" stroke="#ff5d6c" stroke-width="5.5"/>
    <path d="M10,254 L50,254 L44,290 L16,290 Z" fill="#5b5670" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M18,262 L42,262" stroke="#8a86a0" stroke-width="4" stroke-linecap="round"/>
  </svg>`;
}

/** A bottle of bubble bath, 100 by 160. */
export function bottleSVG(): string {
  return `<svg viewBox="0 0 100 160" aria-hidden="true">
    <g class="bottle-body">
      ${outlined('<rect x="36" y="4" width="28" height="18" rx="5"/><rect x="28" y="18" width="44" height="22" rx="7"/>', '#b184f5', 5)}
      ${outlined('<path d="M22,38 L78,38 C92,50 94,78 92,112 C90,140 78,154 50,154 C22,154 10,140 8,112 C6,78 8,50 22,38 Z"/>', '#ff94c8', 5)}
      <ellipse cx="50" cy="96" rx="28" ry="26" fill="#fff"/>
      <circle cx="42" cy="92" r="9" fill="none" stroke="#7cc0ff" stroke-width="3"/>
      <circle cx="58" cy="102" r="6" fill="none" stroke="#b184f5" stroke-width="3"/>
      <circle cx="56" cy="84" r="4" fill="none" stroke="#ff94c8" stroke-width="3"/>
      <path d="M20,56 C16,76 16,100 20,124" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".55"/>
    </g>
  </svg>`;
}

/** A smiley sponge, 120 by 84. */
export function spongeSVG(): string {
  return `<svg viewBox="0 0 120 84" aria-hidden="true">
    ${outlined('<rect x="6" y="8" width="108" height="70" rx="20"/>', '#ffd84a', 6)}
    <rect x="6" y="54" width="108" height="24" rx="12" fill="#7fd35b" opacity=".9"/>
    <circle cx="26" cy="24" r="4" fill="#f0b92a"/><circle cx="94" cy="22" r="5" fill="#f0b92a"/><circle cx="98" cy="42" r="3" fill="#f0b92a"/><circle cx="20" cy="42" r="3" fill="#f0b92a"/>
    <circle cx="48" cy="32" r="4" fill="${INK}"/><circle cx="72" cy="32" r="4" fill="${INK}"/>
    <path d="M52,42 C56,48 64,48 68,42" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <circle cx="40" cy="42" r="4" fill="#ff8aa0" opacity=".6"/><circle cx="80" cy="42" r="4" fill="#ff8aa0" opacity=".6"/>
  </svg>`;
}

/** A pile of bubble-bath foam: its bottom is the water line. */
export const FOAM_BOX = '-70 -66 140 76';
export const FOAM_WATER = 66 / 76;
export function foamSVG(seed = 0): string {
  const r = (i: number) => ((Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453) % 1 + 1) % 1;
  const blobs: [number, number, number][] = [
    [-44, -6, 18],
    [-22, -24, 24],
    [4, -32, 28],
    [30, -20, 24],
    [50, -4, 17],
    [-6, -2, 22],
    [22, 0, 18],
  ].map(([x, y, s], i) => [x + (r(i) - 0.5) * 8, y + (r(i + 9) - 0.5) * 8, s * (0.85 + r(i + 20) * 0.3)] as [number, number, number]);
  const shapes = blobs.map(([x, y, s]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${s.toFixed(1)}"/>`).join('');
  return `<svg viewBox="${FOAM_BOX}" aria-hidden="true">
    ${outlined(shapes, '#ffffff', 5, '#a9d4ec')}
    <g fill="#e3f4ff">${blobs.slice(0, 5).map(([x, y, s]) => `<circle cx="${(x + s * 0.25).toFixed(1)}" cy="${(y + s * 0.3).toFixed(1)}" r="${(s * 0.55).toFixed(1)}"/>`).join('')}</g>
    <g fill="#ffffff">${blobs.slice(0, 5).map(([x, y, s]) => `<circle cx="${(x - s * 0.1).toFixed(1)}" cy="${(y - s * 0.05).toFixed(1)}" r="${(s * 0.6).toFixed(1)}"/>`).join('')}</g>
    <circle cx="-10" cy="-44" r="4" fill="#fff" stroke="#a9d4ec" stroke-width="2"/>
    <circle cx="10" cy="-40" r="5" fill="#cdeeff" opacity=".8"/>
  </svg>`;
}

/** A soap bubble, to pop. */
export function bubbleSVG(): string {
  return `<svg viewBox="-32 -32 64 64" aria-hidden="true">
    <circle r="28" fill="#e6f6ff" fill-opacity=".55" stroke="#6fbde8" stroke-width="3.5"/>
    <path d="M18,-14 A22,22 0 0 1 12,20" stroke="#ffb3e0" stroke-width="4" fill="none" stroke-linecap="round" opacity=".75"/>
    <path d="M-4,24 A24,24 0 0 1 -22,8" stroke="#b3f0c8" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".7"/>
    <ellipse cx="-10" cy="-12" rx="8" ry="5" transform="rotate(-40 -10 -12)" fill="#fff" opacity=".9"/>
    <circle cx="-17" cy="-2" r="2.5" fill="#fff" opacity=".9"/>
  </svg>`;
}

/** A big shimmering bubble with a surprise duck shape inside. */
export function bigBubbleSVG(inside: string): string {
  return `<div class="bb-inside">${inside}</div>${bubbleSVG()}`;
}

/** A round window with the sky outside. */
export function windowSVG(): string {
  const g = `win${++uid}`;
  return `<svg viewBox="-60 -60 120 120" aria-hidden="true">
    <defs><clipPath id="${g}"><circle r="44"/></clipPath></defs>
    <circle r="52" fill="#fff" stroke="${INK}" stroke-width="5"/>
    <g clip-path="url(#${g})">
      <rect x="-50" y="-50" width="100" height="100" fill="#8fd3ff"/>
      <circle cx="22" cy="-18" r="13" fill="#ffd84a"/>
      <path d="M-40,8 C-44,-4 -30,-10 -24,-4 C-22,-16 -4,-16 -2,-4 C8,-6 12,6 4,10 Z" fill="#fff"/>
      <path d="M-50,34 C-30,22 -10,26 10,32 C26,26 40,24 50,30 L50,50 L-50,50 Z" fill="#9fe08a"/>
    </g>
    <circle r="44" fill="none" stroke="${INK}" stroke-width="4"/>
    <path d="M0,-44 L0,44 M-44,0 L44,0" stroke="#fff" stroke-width="6"/>
    <path d="M0,-44 L0,44 M-44,0 L44,0" stroke="${INK}" stroke-width="1.5" opacity=".25"/>
  </svg>`;
}

// ---------------------------------------------------------------------------
// Buttons

export const ICONS = {
  play: `<svg viewBox="-50 -50 100 100"><path d="M-14,-26 L28,0 L-14,26 Z" fill="#fff" stroke="#fff" stroke-width="10" stroke-linejoin="round"/></svg>`,
  home: `<svg viewBox="-50 -50 100 100"><path d="M-28,-2 L0,-28 L28,-2 L28,28 L-28,28 Z" fill="#fff" stroke="#fff" stroke-width="8" stroke-linejoin="round"/><rect x="-8" y="8" width="16" height="22" rx="3" fill="currentColor"/></svg>`,
  games: `<svg viewBox="-50 -50 100 100"><g fill="#fff"><rect x="-30" y="-30" width="26" height="26" rx="7"/><rect x="4" y="-30" width="26" height="26" rx="7"/><rect x="-30" y="4" width="26" height="26" rx="7"/><rect x="4" y="4" width="26" height="26" rx="7"/></g></svg>`,
  /** The duck shelf: a duck. */
  duck: `<svg viewBox="-60 -100 128 110"><g fill="#fff" stroke="#fff" stroke-width="8" stroke-linejoin="round"><path d="${BODY}"/><circle cx="${HEAD.cx}" cy="${HEAD.cy}" r="${HEAD.r}"/><path d="${BEAK}"/></g><circle cx="27" cy="-72" r="5.5" fill="currentColor"/><path d="${WING}" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/></svg>`,
  soundOn: `<svg viewBox="-50 -50 100 100"><path d="M-30,-12 L-16,-12 L2,-28 L2,28 L-16,12 L-30,12 Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><path d="M14,-14 Q24,0 14,14 M22,-24 Q38,0 22,24" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/></svg>`,
  soundOff: `<svg viewBox="-50 -50 100 100"><path d="M-30,-12 L-16,-12 L2,-28 L2,28 L-16,12 L-30,12 Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><path d="M14,-12 L34,12 M34,-12 L14,12" stroke="#fff" stroke-width="7" stroke-linecap="round"/></svg>`,
  musicOn: `<svg viewBox="-50 -50 100 100"><path d="M-10,20 L-10,-24 L24,-32 L24,12" stroke="#fff" stroke-width="7" fill="none" stroke-linejoin="round"/><ellipse cx="-18" cy="22" rx="10" ry="8" fill="#fff"/><ellipse cx="16" cy="14" rx="10" ry="8" fill="#fff"/></svg>`,
  musicOff: `<svg viewBox="-50 -50 100 100"><g opacity=".55"><path d="M-10,20 L-10,-24 L24,-32 L24,12" stroke="#fff" stroke-width="7" fill="none" stroke-linejoin="round"/><ellipse cx="-18" cy="22" rx="10" ry="8" fill="#fff"/><ellipse cx="16" cy="14" rx="10" ry="8" fill="#fff"/></g><path d="M-30,-30 L30,30" stroke="#fff" stroke-width="8" stroke-linecap="round"/></svg>`,
  close: `<svg viewBox="-50 -50 100 100"><path d="M-20,-20 L20,20 M20,-20 L-20,20" stroke="#fff" stroke-width="10" stroke-linecap="round"/></svg>`,
  gear: `<svg viewBox="-50 -50 100 100"><g fill="currentColor">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="-7" y="-40" width="14" height="18" rx="4" transform="rotate(${a})"/>`).join('')}<circle r="27"/></g><circle r="10" fill="#fff"/></svg>`,
};
