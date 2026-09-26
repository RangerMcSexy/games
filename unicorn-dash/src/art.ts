// All the art is drawn here as SVG in code: Sparkle the unicorn (side on,
// with everything she can wear), the meadow she dashes through, the things
// on the way, the twelve presents and the button icons.
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

// ---------------------------------------------------------------------------
// Sparkle the unicorn, side on and facing right. In her own units 100 is one
// "unicorn" (see dash.ts); the ground is at y = 0 and her middle at x = 0.

const WHITE = '#ffffff';
const FAR = '#ece5f8';
const HOOF = '#d9ccf2';

export const MANES: Record<string, string[]> = {
  plain: ['#ff9fd0', '#c9a2ff', '#ffc4e6'],
  rainbow: ['#ff6b6b', '#ffae5c', '#ffd84a', '#7ed957', '#5eaaff', '#b184f5'],
  bluemane: ['#6fc0ff', '#b3e3ff', '#8fd0ff', '#5aa8f0'],
};

/** A leg hangs from the hip at (x, 0) in its own group, so it can swing. */
function leg(x: number, cls: string, fill: string, boots: boolean): string {
  const hoof = boots
    ? `<path d="M-8.5,-20 L8.5,-20 L8.5,-5 Q8.5,0 2,0 L-2,0 Q-8.5,0 -8.5,-5 Z" fill="#ff7ab8" ${S} stroke-width="3"/>
       <rect x="-10" y="-24" width="20" height="7" rx="3.5" fill="#fff" ${S} stroke-width="2.5"/>
       <circle cx="-2" cy="-10" r="1.8" fill="#fff"/><circle cx="3" cy="-6" r="1.5" fill="#fff"/>`
    : `<path d="M-7.5,-10 L7.5,-10 L7.5,-5 Q7.5,0 2,0 L-2,0 Q-7.5,0 -7.5,-5 Z" fill="${HOOF}" ${S} stroke-width="3"/>`;
  return `<g transform="translate(${x},0)"><g class="leg ${cls}">
    <path d="M-7.5,-48 L7.5,-48 L7.5,-6 Q7.5,0 1.5,0 L-1.5,0 Q-7.5,0 -7.5,-6 Z" fill="${fill}" ${S}/>
    ${hoof}
  </g></g>`;
}

const lobes = (spots: [number, number, number][], palette: string[], offset = 0) =>
  spots.map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${palette[(i + offset) % palette.length]}" ${S} stroke-width="3"/>`).join('');

const MANE_SPOTS: [number, number, number][] = [
  [-4, -84, 9],
  [6, -92, 11],
  [12, -106, 12],
  [18, -117, 12],
  [26, -130, 12],
  [37, -137, 11],
];
const TAIL_SPOTS: [number, number, number][] = [
  [-72, -26, 9],
  [-78, -40, 11],
  [-74, -54, 12],
  [-64, -66, 12],
  [-52, -72, 10],
];

// Things to wear, each drawn around its own 0,0 so the same drawing works
// on Sparkle and on its own (in the dressing-up strip and the present).

const flowerBit = (x: number, y: number, c: string, r = 5) =>
  `<g transform="translate(${x},${y})">${[0, 72, 144, 216, 288].map((a) => `<circle cy="${-r}" r="${r * 0.8}" fill="${c}" stroke="${INK}" stroke-width="2" transform="rotate(${a})"/>`).join('')}<circle r="${r * 0.6}" fill="#ffd84a" stroke="${INK}" stroke-width="2"/></g>`;

const WEAR: Record<string, () => string> = {
  flowers: () => `
    <path d="M-28,6 Q0,-12 28,6" fill="none" stroke="#6fcf6a" stroke-width="5" stroke-linecap="round"/>
    ${[
      [-24, 2, '#ff94c8'],
      [-12, -4, '#ffd84a'],
      [0, -6, '#5eaaff'],
      [12, -4, '#fff'],
      [24, 2, '#ffa24a'],
    ]
      .map(([x, y, c]) => flowerBit(x as number, y as number, c as string))
      .join('')}
    <ellipse cx="-18" cy="6" rx="5" ry="2.6" fill="#6fcf6a" transform="rotate(20 -18 6)"/>
    <ellipse cx="18" cy="6" rx="5" ry="2.6" fill="#6fcf6a" transform="rotate(-20 18 6)"/>`,
  partyhat: () => `
    <path d="M-15,0 L0,-42 L15,0 Z" fill="#5eaaff" ${S}/>
    <path d="M-10,-14 L10,-14 M-5,-28 L5,-28" stroke="#ffd84a" stroke-width="5" stroke-linecap="round"/>
    <circle cx="-6" cy="-6" r="2.4" fill="#ff94c8"/><circle cx="6" cy="-22" r="2.2" fill="#ff94c8"/><circle cx="3" cy="-7" r="2" fill="#fff"/>
    <path d="M-17,0 Q0,6 17,0" fill="none" ${S} stroke-width="3"/>
    <circle cx="0" cy="-44" r="7" fill="#ff94c8" ${S} stroke-width="3"/>`,
  crown: () => `
    <path d="M-18,0 L-20,-20 L-9,-10 L0,-26 L9,-10 L20,-20 L18,0 Z" fill="#ffd84a" ${S}/>
    <rect x="-18" y="-6" width="36" height="7" rx="3" fill="#ffc21a" ${S} stroke-width="2.5"/>
    <circle cx="0" cy="-2.5" r="3.2" fill="#ff5d6c"/><circle cx="-11" cy="-2.5" r="2.4" fill="#5eaaff"/><circle cx="11" cy="-2.5" r="2.4" fill="#7ed957"/>
    <circle cx="-20" cy="-21" r="3" fill="#fff" ${S} stroke-width="2"/><circle cx="0" cy="-27" r="3" fill="#fff" ${S} stroke-width="2"/><circle cx="20" cy="-21" r="3" fill="#fff" ${S} stroke-width="2"/>`,
  wings: () => `<g class="wing">
    <path d="M0,0 C-8,-28 -34,-54 -66,-54 C-60,-46 -58,-41 -61,-36 C-52,-34 -48,-29 -51,-23 C-42,-22 -37,-16 -39,-10 C-26,-8 -12,-3 0,0 Z" fill="#fdf0ff" ${S}/>
    <path d="M-10,-10 C-22,-20 -34,-30 -50,-40 M-12,-4 C-22,-10 -30,-14 -40,-18" fill="none" stroke="#e3c7f7" stroke-width="3" stroke-linecap="round"/>
    <path d="${starPath(5, 0.4)}" fill="#ffd84a" transform="translate(-30,-26)"/>
  </g>`,
  bow: () => `
    <path d="M0,0 C-8,-12 -22,-14 -22,-2 C-22,10 -8,8 0,0 Z" fill="#ff7ab8" ${S} stroke-width="3"/>
    <path d="M0,0 C8,-12 22,-14 22,-2 C22,10 8,8 0,0 Z" fill="#ff7ab8" ${S} stroke-width="3"/>
    <path d="M-2,2 L-8,16 M2,2 L8,16" stroke="#ff7ab8" stroke-width="5" stroke-linecap="round"/>
    <circle r="5" fill="#ff9fd0" ${S} stroke-width="3"/>`,
  glasses: () => `
    <path d="M-8,-1 L-20,-5" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <path d="${starPath(13, 0.55)}" fill="rgba(255,122,184,.55)" ${S} stroke-width="3" transform="rotate(-8)"/>
    <path d="M-4,-6 L2,-9" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`,
  cape: () => `<g class="cape">
    <path d="M36,-6 C22,-10 -8,-8 -32,6 C-44,24 -46,42 -40,58 C-22,48 -2,46 16,36 C26,26 34,12 36,-6 Z" fill="#ff6b8a" ${S}/>
    <path d="M30,4 C16,6 -6,12 -24,22" fill="none" stroke="#ff9fb5" stroke-width="4" stroke-linecap="round"/>
    <path d="${starPath(6, 0.45)}" fill="#ffd84a" transform="translate(-20,36)"/>
    <path d="${starPath(4.5, 0.45)}" fill="#ffd84a" transform="translate(4,28) rotate(20)"/>
    <circle cx="34" cy="-4" r="6" fill="#ffd84a" ${S} stroke-width="3"/>
  </g>`,
  necklace: () => `
    <path d="M-16,-10 Q2,6 18,-4" fill="none" stroke="#c9a2ff" stroke-width="2"/>
    ${[-14, -8, -2, 4, 10, 16].map((x, i) => `<circle cx="${x}" cy="${-8 + Math.sin(((x + 16) / 34) * Math.PI) * 8}" r="3.4" fill="${['#ff94c8', '#fff', '#b184f5'][i % 3]}" stroke="${INK}" stroke-width="1.8"/>`).join('')}
    <path d="M4,6 C0,2 -6,4 -4,10 C-2,14 4,17 4,17 C4,17 10,14 12,10 C14,4 8,2 4,6 Z" fill="#ff5d6c" ${S} stroke-width="2.5"/>`,
};

/** Where each thing sits on Sparkle, and which slot it takes. */
export const WEAR_SPOT: Record<string, { slot: string; at: string }> = {
  rainbow: { slot: 'mane', at: '' },
  bluemane: { slot: 'mane', at: '' },
  goldhorn: { slot: 'horn', at: '' },
  boots: { slot: 'hooves', at: '' },
  flowers: { slot: 'head', at: 'translate(38,-133) rotate(12) scale(.9)' },
  partyhat: { slot: 'head', at: 'translate(32,-141) rotate(-22) scale(.85)' },
  crown: { slot: 'head', at: 'translate(33,-141) rotate(-14) scale(.85)' },
  wings: { slot: 'back', at: 'translate(-12,-86)' },
  cape: { slot: 'back', at: 'translate(-12,-82)' },
  bow: { slot: 'tail', at: 'translate(-52,-74) rotate(-20) scale(.8)' },
  glasses: { slot: 'face', at: 'translate(54,-108)' },
  necklace: { slot: 'neck', at: 'translate(28,-78) rotate(-28) scale(.95)' },
};

const horn = (gold: boolean) => {
  const [fill, band] = gold ? ['#ffd84a', '#f0a91c'] : ['#fff0fa', '#f5b3dc'];
  return `<g class="horn">
    <path d="M48,-128 L71,-165 L62,-123 Z" fill="${fill}" ${S}/>
    <path d="M52,-136 L62,-131 M56,-144 L65,-140 M60,-152 L67,-149" stroke="${band}" stroke-width="3.2" stroke-linecap="round"/>
    ${gold ? `<path d="${starPath(7, 0.3, 4)}" fill="#fff" transform="translate(73,-155)" class="horn-glint"/>` : ''}
  </g>`;
};

export function unicornSVG(wearing: string[] = []): string {
  const has = (id: string) => wearing.includes(id);
  const mane = MANES[has('rainbow') ? 'rainbow' : has('bluemane') ? 'bluemane' : 'plain'];
  const boots = has('boots');
  const wear = (id: string) => (has(id) ? `<g class="wear w-${id}" transform="${WEAR_SPOT[id].at}">${WEAR[id]()}</g>` : '');
  const body = `<ellipse cx="-5" cy="-60" rx="48" ry="32"/>`;
  const neck = `<path d="M8,-82 C14,-98 22,-110 30,-120 L60,-104 C52,-90 46,-74 38,-52 Z"/>`;
  const head = `<circle cx="45" cy="-112" r="24"/><ellipse cx="71" cy="-98" rx="21" ry="16" transform="rotate(22 71 -98)"/>`;
  const ear = `<path d="M28,-124 C20,-142 24,-154 28,-158 C38,-148 43,-138 41,-126 Z"/>`;
  return `<svg viewBox="-100 -180 210 186" aria-hidden="true" class="uni-art">
    <g class="far">${leg(-20, 'lb2', FAR, boots)}${leg(18, 'lf2', FAR, boots)}</g>
    <g class="tail">${lobes(TAIL_SPOTS, mane, 1)}${wear('bow')}</g>
    <g class="body">
      <g fill="${INK}" stroke="${INK}" stroke-width="7" stroke-linejoin="round">${body}${neck}${head}${ear}</g>
      ${leg(-32, 'lb', WHITE, boots)}${leg(28, 'lf', WHITE, boots)}
      <g fill="${WHITE}">${body}${neck}${head}${ear}</g>
      <path d="M29,-129 C26,-140 27,-147 29,-150 C34,-143 36,-137 36,-130 Z" fill="#ffc4e6"/>
      <path d="M-40,-44 C-26,-32 12,-30 30,-42" fill="none" stroke="${FAR}" stroke-width="7" stroke-linecap="round"/>
      ${wear('cape')}${wear('necklace')}
      ${wear('wings')}
      <g class="mane">${lobes(MANE_SPOTS, mane)}<circle cx="49" cy="-131" r="8" fill="${mane[1 % mane.length]}" ${S} stroke-width="3"/></g>
      <g class="face">
        <g class="uni-eye"><ellipse cx="55" cy="-108" rx="6" ry="8" fill="#2d2447"/><circle cx="57.5" cy="-111" r="2.6" fill="#fff"/></g>
        <path d="M59.5,-115.5 L64.5,-120 M61,-111.5 L67,-114" stroke="#2d2447" stroke-width="2.4" stroke-linecap="round"/>
        <ellipse cx="65" cy="-93" rx="6.5" ry="4.5" fill="#ff8fb1" opacity=".55"/>
        <ellipse cx="86" cy="-98" rx="2.2" ry="3" fill="${INK}" opacity=".55" transform="rotate(20 86 -98)"/>
        <path d="M73,-86 Q79,-82 85,-87" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
      </g>
      ${horn(has('goldhorn'))}
      ${wear('glasses')}${wear('flowers')}${wear('partyhat')}${wear('crown')}
    </g>
  </svg>`;
}

/** One of the presents on its own, for the dressing-up strip and the reveal. */
export function itemSVG(id: string): string {
  let art = '';
  if (id === 'rainbow' || id === 'bluemane')
    art = lobes(
      [
        [-24, 18, 12],
        [-18, 0, 14],
        [-4, -16, 14],
        [16, -22, 14],
        [30, -8, 12],
      ],
      MANES[id],
    );
  else if (id === 'goldhorn') art = `<g transform="translate(-106,262) scale(1.8)">${horn(true)}</g>`;
  else if (id === 'boots') {
    // A pair of sparkly boots on two little legs.
    const boot = (x: number, y: number) =>
      `<g transform="translate(${x},${y}) scale(2.2)"><path d="M-7.5,-34 Q-7.5,-38 -3,-38 L3,-38 Q7.5,-38 7.5,-34 L7.5,-20 L-7.5,-20 Z" fill="${WHITE}" ${S} stroke-width="2.4"/>${leg(0, '', WHITE, true).replace(/<path d="M-7\.5,-48[^>]*>/, '')}</g>`;
    art = `${boot(-15, 40)}${boot(17, 44)}<path d="${starPath(7, 0.35, 4)}" fill="#ffd84a" transform="translate(34,-6)"/>`;
  }
  else {
    const fit: Record<string, string> = {
      flowers: 'translate(0,8) scale(1.35)',
      partyhat: 'translate(0,30) scale(1.2)',
      crown: 'translate(0,16) scale(1.5)',
      wings: 'translate(32,30) scale(1.05)',
      bow: 'translate(0,-2) scale(1.6)',
      glasses: 'translate(6,4) scale(2)',
      cape: 'translate(2,-24) scale(.95)',
      necklace: 'translate(0,-4) scale(1.8)',
    };
    art = `<g transform="${fit[id]}">${WEAR[id]()}</g>`;
  }
  return `<svg viewBox="-50 -50 100 100" aria-hidden="true" class="item-art i-${id}">${art}</svg>`;
}

/** The same thing as a pale shape, for presents not opened yet. */
export function itemSilhouetteSVG(id: string): string {
  return itemSVG(id)
    .replace(/fill="(?!none)[^"]*"/g, 'fill="#cdbfe6"')
    .replace(/stroke="(?!none)[^"]*"/g, 'stroke="#cdbfe6"')
    .replace('class="item-art', 'class="item-art silhouette');
}

// ---------------------------------------------------------------------------
// The meadow

export function starSVG(): string {
  return `<svg viewBox="-30 -30 60 60" aria-hidden="true" class="star-art">
    <path d="${starPath(25, 0.5)}" fill="#ffd84a" ${S} stroke-width="3"/>
    <path d="M-8,-9 L-3,-17" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".85"/>
    <circle cx="-5" cy="1" r="2.3" fill="${INK}"/><circle cx="5" cy="1" r="2.3" fill="${INK}"/>
    <path d="M-3,6 Q0,9 3,6" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}

export function cloudSVG(): string {
  return `<svg viewBox="0 0 160 70" aria-hidden="true">
    <path d="M22,62 C4,62 2,40 20,38 C18,20 44,12 56,26 C62,6 98,4 104,26 C118,16 142,24 138,42 C156,44 156,62 138,62 Z" fill="#fff"/>
    <path d="M26,62 C40,56 120,56 136,62" fill="none" stroke="#e8eefc" stroke-width="5" stroke-linecap="round"/>
  </svg>`;
}

/**
 * A tile of rolling hills that joins up with itself left to right.
 * `lumps` is how many hills fit across it.
 */
export function hillsSVG(fill: string, edge: string, lumps: number[], seed = 0): string {
  const w = 1200;
  const h = 300;
  let top = '';
  for (let i = 0; i <= 60; i++) {
    const x = (i / 60) * w;
    const t = (i / 60) * Math.PI * 2;
    const y = 120 - lumps.reduce((s, n, k) => s + Math.sin(t * n + seed + k * 1.7) * (38 / (k + 1)), 0);
    top += `${i ? ' L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }
  // The outline runs along the top only: down the sides it would show where the tiles meet.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path d="${top} L${w},${h} L0,${h} Z" fill="${fill}"/><path d="${top}" fill="none" stroke="${edge}" stroke-width="5"/></svg>`;
}

export function treeSVG(c = 0): string {
  const greens = [
    ['#8fdc7a', '#6cc25f'],
    ['#a6e389', '#7fcb6a'],
    ['#7fd6a6', '#5cbd8a'],
  ][c % 3];
  return `<svg viewBox="-50 -120 100 124" aria-hidden="true">
    <path d="M-7,0 L-5,-40 L5,-40 L7,0 Z" fill="#c4966b" ${S} stroke-width="3"/>
    <circle cx="0" cy="-68" r="34" fill="${greens[0]}" ${S} stroke-width="3"/>
    <circle cx="-20" cy="-50" r="20" fill="${greens[0]}" ${S} stroke-width="3"/>
    <circle cx="20" cy="-52" r="22" fill="${greens[0]}" ${S} stroke-width="3"/>
    <path d="M-30,-50 C-10,-40 16,-42 36,-50" fill="${greens[0]}"/>
    <circle cx="-10" cy="-78" r="8" fill="#fff" opacity=".35"/>
    ${c === 1 ? '<circle cx="12" cy="-64" r="5" fill="#ff7a8a"/><circle cx="-16" cy="-56" r="5" fill="#ff7a8a"/><circle cx="4" cy="-86" r="5" fill="#ff7a8a"/>' : ''}
  </svg>`;
}

/** Little flowers and grass tufts along the path. */
export function bloomSVG(kind: number, c: string): string {
  if (kind === 0)
    return `<svg viewBox="-20 -44 40 46" aria-hidden="true"><path d="M0,0 L0,-24" stroke="#5cb85c" stroke-width="3.5" stroke-linecap="round"/><path d="M0,-12 C-8,-16 -12,-12 -12,-8 C-6,-8 -2,-10 0,-12 Z" fill="#6fcf6a"/>${flowerBit(0, -28, c, 7)}</svg>`;
  if (kind === 1)
    return `<svg viewBox="-20 -44 40 46" aria-hidden="true"><path d="M0,0 L0,-22" stroke="#5cb85c" stroke-width="3.5" stroke-linecap="round"/><path d="M-9,-36 C-10,-26 -6,-20 0,-20 C6,-20 10,-26 9,-36 L4,-30 L0,-37 L-4,-30 Z" fill="${c}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/></svg>`;
  return `<svg viewBox="-24 -30 48 32" aria-hidden="true"><path d="M-18,0 Q-14,-16 -10,-22 Q-8,-10 -4,0 M-6,0 Q-2,-20 2,-28 Q4,-12 6,0 M4,0 Q10,-14 16,-20 Q14,-8 16,0" fill="#7fd06a" stroke="#58ad52" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
}

export function mushroomSVG(): string {
  return `<svg viewBox="-30 -46 60 48" aria-hidden="true">
    <path d="M-9,0 L-7,-18 L7,-18 L9,0 Z" fill="#fff5e6" ${S} stroke-width="3"/>
    <path d="M-26,-16 C-26,-38 26,-38 26,-16 Z" fill="#ff6b7a" ${S} stroke-width="3"/>
    <circle cx="-12" cy="-26" r="4" fill="#fff"/><circle cx="6" cy="-30" r="3.5" fill="#fff"/><circle cx="16" cy="-20" r="3" fill="#fff"/>
  </svg>`;
}

// Things to jump over (each sits on the ground, 100 units across).

export function logSVG(): string {
  return `<svg viewBox="-50 -44 100 46" aria-hidden="true">
    <path d="M-38,-40 L38,-40 C50,-40 50,0 38,0 L-38,0 Z" fill="#c68b59" ${S}/>
    <path d="M-28,-26 L10,-26 M-16,-12 L26,-12" stroke="#a36d42" stroke-width="3.5" stroke-linecap="round"/>
    <ellipse cx="-38" cy="-20" rx="11" ry="20" fill="#f2cf9a" ${S}/>
    <ellipse cx="-38" cy="-20" rx="5.5" ry="10" fill="none" stroke="#d9a86c" stroke-width="3"/>
    <path d="M14,-40 C16,-50 24,-52 26,-44" fill="#7ed957" ${S} stroke-width="2.6"/>
  </svg>`;
}
export function rockSVG(): string {
  return `<svg viewBox="-50 -52 100 54" aria-hidden="true">
    <path d="M-46,0 C-48,-26 -30,-48 -2,-48 C28,-48 48,-28 46,0 Z" fill="#c9c3dc" ${S}/>
    <path d="M-26,-34 C-18,-42 -4,-44 8,-42" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>
    <path d="M20,-20 L30,-12 M10,-10 L18,-4" stroke="#a9a1c4" stroke-width="3" stroke-linecap="round"/>
    <path d="M-40,0 C-36,-10 -24,-12 -18,-4 C-12,-12 0,-10 2,0 Z" fill="#9ce07a" ${S} stroke-width="2.6"/>
  </svg>`;
}
export function bushSVG(): string {
  return `<svg viewBox="-50 -58 100 60" aria-hidden="true">
    <path d="M-46,0 C-54,-18 -40,-34 -26,-30 C-26,-50 0,-58 10,-42 C22,-56 46,-44 40,-26 C54,-22 52,0 44,0 Z" fill="#7fd06a" ${S}/>
    <path d="M-26,-30 C-22,-22 -18,-20 -12,-20 M10,-42 C8,-34 10,-30 14,-28" fill="none" stroke="#5cb85c" stroke-width="3" stroke-linecap="round"/>
    ${flowerBit(-24, -14, '#ff94c8', 6)}${flowerBit(8, -30, '#fff', 6)}${flowerBit(28, -12, '#ffd84a', 6)}
  </svg>`;
}
export function fenceSVG(): string {
  return `<svg viewBox="-50 -64 100 66" aria-hidden="true">
    <path d="M-40,-36 L40,-36 M-40,-16 L40,-16" stroke="${INK}" stroke-width="11" stroke-linecap="round"/>
    <path d="M-40,-36 L40,-36 M-40,-16 L40,-16" stroke="#fff5e0" stroke-width="5" stroke-linecap="round"/>
    ${[-30, 0, 30].map((x) => `<path d="M${x - 9},0 L${x - 9},-48 L${x},-60 L${x + 9},-48 L${x + 9},0 Z" fill="#fff5e0" ${S} stroke-width="3"/>`).join('')}
  </svg>`;
}
export function puddleSVG(): string {
  return `<svg viewBox="-60 -14 120 22" aria-hidden="true">
    <ellipse cx="0" cy="0" rx="56" ry="9" fill="#7cc8f5" stroke="#4fa6dc" stroke-width="3"/>
    <path d="M-30,-2 L-10,-3 M14,1 L30,0" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>
  </svg>`;
}

export function balloonSVG(c: Colour): string {
  return `<svg viewBox="-30 -40 60 100" aria-hidden="true" class="balloon-art">
    <path d="M0,22 C-2,34 4,40 0,58" fill="none" stroke="${INK}" stroke-width="2" opacity=".7"/>
    <path d="M0,-36 C20,-36 28,-18 26,-4 C24,12 10,22 0,22 C-10,22 -24,12 -26,-4 C-28,-18 -20,-36 0,-36 Z" fill="${c.petal}" ${S}/>
    <path d="M-4,22 L4,22 L6,28 L-6,28 Z" fill="${c.dark}" ${S} stroke-width="2.4"/>
    <path d="M-14,-18 C-12,-26 -6,-30 0,-30" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>
  </svg>`;
}

/** A present with a lid that pops off (the lid is `.lid`). */
export function presentSVG(): string {
  return `<svg viewBox="-60 -110 120 114" aria-hidden="true" class="present-art">
    <rect x="-40" y="-60" width="80" height="60" rx="6" fill="#b184f5" ${S}/>
    <rect x="-8" y="-60" width="16" height="60" fill="#ffd84a" ${S} stroke-width="3"/>
    <circle cx="-24" cy="-30" r="4" fill="#fff" opacity=".6"/><circle cx="24" cy="-18" r="4" fill="#fff" opacity=".6"/><circle cx="-22" cy="-12" r="3" fill="#fff" opacity=".6"/>
    <g class="lid">
      <rect x="-46" y="-76" width="92" height="20" rx="6" fill="#c9a2ff" ${S}/>
      <rect x="-9" y="-76" width="18" height="20" fill="#ffd84a" ${S} stroke-width="3"/>
      <path d="M0,-76 C-10,-100 -34,-100 -28,-84 C-24,-76 -10,-76 0,-76 Z" fill="#ffd84a" ${S} stroke-width="3"/>
      <path d="M0,-76 C10,-100 34,-100 28,-84 C24,-76 10,-76 0,-76 Z" fill="#ffd84a" ${S} stroke-width="3"/>
    </g>
  </svg>`;
}

export function rainbowSVG(): string {
  const bands = ['#ff7a7a', '#ffb35c', '#ffe066', '#8fdc7a', '#7cc0ff', '#c29bff'];
  return `<svg viewBox="-200 -200 400 204" aria-hidden="true" class="rainbow-art">
    ${bands.map((c, i) => `<path d="M${-190 + i * 16},0 A${190 - i * 16},${190 - i * 16} 0 0 1 ${190 - i * 16},0" fill="none" stroke="${c}" stroke-width="17"/>`).join('')}
    <g fill="#fff">
      <circle cx="-176" cy="-6" r="22"/><circle cx="-150" cy="-2" r="18"/><circle cx="-196" cy="0" r="14"/>
      <circle cx="176" cy="-6" r="22"/><circle cx="150" cy="-2" r="18"/><circle cx="196" cy="0" r="14"/>
    </g>
  </svg>`;
}

export function bunnySVG(): string {
  return `<svg viewBox="-40 -64 80 66" aria-hidden="true" class="bunny-art">
    <circle cx="-22" cy="-16" r="7" fill="#fff" ${S} stroke-width="3"/>
    <path d="M-20,0 C-28,-20 -8,-34 10,-28 C24,-24 26,-6 20,0 Z" fill="#f4ecff" ${S} stroke-width="3"/>
    <path d="M8,-40 C2,-62 10,-66 14,-46 Z" fill="#f4ecff" ${S} stroke-width="3"/>
    <path d="M16,-40 C18,-62 28,-60 22,-40 Z" fill="#f4ecff" ${S} stroke-width="3"/>
    <circle cx="16" cy="-30" r="12" fill="#f4ecff" ${S} stroke-width="3"/>
    <circle cx="20" cy="-32" r="2.4" fill="${INK}"/>
    <circle cx="27" cy="-27" r="2" fill="#ff8fb1"/>
    <circle cx="18" cy="-25" r="3" fill="#ff8fb1" opacity=".5"/>
  </svg>`;
}

export function butterflySVG(): string {
  return `<svg viewBox="-50 -50 100 100" aria-hidden="true" class="butterfly-art">
    <g class="b-wings">
      <path d="M-3,-4 C-20,-40 -46,-34 -40,-12 C-36,2 -16,4 -3,0 Z" fill="#ff9ec4" ${S}/>
      <path d="M3,-4 C20,-40 46,-34 40,-12 C36,2 16,4 3,0 Z" fill="#c9a8ff" ${S}/>
      <path d="M-3,2 C-20,6 -34,22 -24,32 C-14,40 -4,22 -3,6 Z" fill="#ffd36e" ${S}/>
      <path d="M3,2 C20,6 34,22 24,32 C14,40 4,22 3,6 Z" fill="#8fd3ff" ${S}/>
    </g>
    <rect x="-4" y="-16" width="8" height="42" rx="4" fill="${INK}"/>
    <path d="M-2,-16 C-6,-28 -12,-32 -16,-34 M2,-16 C6,-28 12,-32 16,-34" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}

export function sunSVG(): string {
  let rays = '';
  for (let i = 0; i < 12; i++) rays += `<rect x="-5" y="-56" width="10" height="18" rx="5" fill="#ffc93d" transform="rotate(${i * 30})"/>`;
  return `<svg viewBox="-60 -60 120 120" aria-hidden="true" class="sun-art">
    <g class="rays">${rays}</g>
    <circle r="34" fill="#ffe066" ${S}/>
    <path d="M-14,-6 Q-10,-11 -6,-6 M6,-6 Q10,-11 14,-6" fill="none" ${S} stroke-width="3"/>
    <path d="M-12,6 Q0,18 12,6" fill="none" ${S} stroke-width="3"/>
    <circle cx="-20" cy="6" r="5" fill="#ff9f6b" opacity=".5"/><circle cx="20" cy="6" r="5" fill="#ff9f6b" opacity=".5"/>
  </svg>`;
}

// ---------------------------------------------------------------------------
// Buttons

export const ICONS = {
  play: `<svg viewBox="-50 -50 100 100"><path d="M-14,-26 L28,0 L-14,26 Z" fill="#fff" stroke="#fff" stroke-width="10" stroke-linejoin="round"/></svg>`,
  home: `<svg viewBox="-50 -50 100 100"><path d="M-28,-2 L0,-28 L28,-2 L28,28 L-28,28 Z" fill="#fff" stroke="#fff" stroke-width="8" stroke-linejoin="round"/><rect x="-8" y="8" width="16" height="22" rx="3" fill="currentColor"/></svg>`,
  games: `<svg viewBox="-50 -50 100 100"><g fill="#fff"><rect x="-30" y="-30" width="26" height="26" rx="7"/><rect x="4" y="-30" width="26" height="26" rx="7"/><rect x="-30" y="4" width="26" height="26" rx="7"/><rect x="4" y="4" width="26" height="26" rx="7"/></g></svg>`,
  /** Dressing up: a crown. */
  dress: `<svg viewBox="-50 -50 100 100"><path d="M-30,22 L-34,-18 L-15,0 L0,-30 L15,0 L34,-18 L30,22 Z" fill="#fff" stroke="#fff" stroke-width="7" stroke-linejoin="round"/><circle cx="0" cy="12" r="6" fill="currentColor"/><circle cx="-17" cy="12" r="4" fill="currentColor"/><circle cx="17" cy="12" r="4" fill="currentColor"/></svg>`,
  soundOn: `<svg viewBox="-50 -50 100 100"><path d="M-30,-12 L-16,-12 L2,-28 L2,28 L-16,12 L-30,12 Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><path d="M14,-14 Q24,0 14,14 M22,-24 Q38,0 22,24" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/></svg>`,
  soundOff: `<svg viewBox="-50 -50 100 100"><path d="M-30,-12 L-16,-12 L2,-28 L2,28 L-16,12 L-30,12 Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><path d="M14,-12 L34,12 M34,-12 L14,12" stroke="#fff" stroke-width="7" stroke-linecap="round"/></svg>`,
  musicOn: `<svg viewBox="-50 -50 100 100"><path d="M-10,20 L-10,-24 L24,-32 L24,12" stroke="#fff" stroke-width="7" fill="none" stroke-linejoin="round"/><ellipse cx="-18" cy="22" rx="10" ry="8" fill="#fff"/><ellipse cx="16" cy="14" rx="10" ry="8" fill="#fff"/></svg>`,
  musicOff: `<svg viewBox="-50 -50 100 100"><g opacity=".55"><path d="M-10,20 L-10,-24 L24,-32 L24,12" stroke="#fff" stroke-width="7" fill="none" stroke-linejoin="round"/><ellipse cx="-18" cy="22" rx="10" ry="8" fill="#fff"/><ellipse cx="16" cy="14" rx="10" ry="8" fill="#fff"/></g><path d="M-30,-30 L30,30" stroke="#fff" stroke-width="8" stroke-linecap="round"/></svg>`,
  close: `<svg viewBox="-50 -50 100 100"><path d="M-20,-20 L20,20 M20,-20 L-20,20" stroke="#fff" stroke-width="10" stroke-linecap="round"/></svg>`,
  gear: `<svg viewBox="-50 -50 100 100"><g fill="currentColor">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="-7" y="-40" width="14" height="18" rx="4" transform="rotate(${a})"/>`).join('')}<circle r="27"/></g><circle r="10" fill="#fff"/></svg>`,
};
