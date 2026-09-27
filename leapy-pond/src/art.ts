// All the art is drawn here as SVG in code: Hoppy the frog (seen from
// above), the lily pads, flowers, flies and stepping stones, the twelve
// pond friends and the button icons.
import type { Colour } from './data';

export const INK = '#2f4858';
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


const eye = (x: number, y: number, r = 6) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="#1f2340"/><circle cx="${x + r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.35}" fill="#fff"/>`;
const cheeks = (x: number, y: number, r = 4.5) =>
  `<circle cx="${-x}" cy="${y}" r="${r}" fill="#ff8fb1" opacity=".55"/><circle cx="${x}" cy="${y}" r="${r}" fill="#ff8fb1" opacity=".55"/>`;

// ---------------------------------------------------------------------------
// Hoppy, seen from above, facing up. Sitting or mid-leap (legs stretched).

const FROG = '#7ed957';
const FROG_DARK = '#5bbf45';
const FROG_BELLY = '#c9f2a8';

const foot = (x: number, y: number, rot: number) =>
  `<g transform="translate(${x},${y}) rotate(${rot})"><path d="M0,0 L-7,9 M0,0 L0,11 M0,0 L7,9" stroke="${FROG_DARK}" stroke-width="5" stroke-linecap="round"/>${[-7, 0, 7].map((dx, i) => `<circle cx="${dx}" cy="${[9, 11, 9][i]}" r="3.4" fill="${FROG}" ${S} stroke-width="2"/>`).join('')}</g>`;

export function frogSVG(): string {
  return `<svg viewBox="-60 -60 120 120" aria-hidden="true" class="frog-art">
    <g class="legs-sit">
      <path d="M-20,14 C-42,8 -48,30 -34,38 C-26,42 -16,34 -14,26 Z" fill="${FROG_DARK}" ${S}/>
      <path d="M20,14 C42,8 48,30 34,38 C26,42 16,34 14,26 Z" fill="${FROG_DARK}" ${S}/>
      ${foot(-36, 38, 30)}${foot(36, 38, -30)}
      <path d="M-20,-10 C-32,-10 -36,-2 -34,6" fill="none" stroke="${FROG_DARK}" stroke-width="7" stroke-linecap="round"/>
      <path d="M20,-10 C32,-10 36,-2 34,6" fill="none" stroke="${FROG_DARK}" stroke-width="7" stroke-linecap="round"/>
      ${foot(-34, 4, 20)}${foot(34, 4, -20)}
    </g>
    <g class="legs-leap">
      <path d="M-14,20 C-24,30 -26,42 -22,52" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>
      <path d="M14,20 C24,30 26,42 22,52" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>
      <path d="M-14,20 C-24,30 -26,42 -22,52" fill="none" stroke="${FROG_DARK}" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M14,20 C24,30 26,42 22,52" fill="none" stroke="${FROG_DARK}" stroke-width="6.5" stroke-linecap="round"/>
      ${foot(-22, 52, 10)}${foot(22, 52, -10)}
      <path d="M-18,-22 C-28,-32 -30,-40 -28,-48" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
      <path d="M18,-22 C28,-32 30,-40 28,-48" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
      <path d="M-18,-22 C-28,-32 -30,-40 -28,-48" fill="none" stroke="${FROG_DARK}" stroke-width="5" stroke-linecap="round"/>
      <path d="M18,-22 C28,-32 30,-40 28,-48" fill="none" stroke="${FROG_DARK}" stroke-width="5" stroke-linecap="round"/>
      ${foot(-28, -48, 190)}${foot(28, -48, 170)}
    </g>
    <ellipse cx="0" cy="4" rx="25" ry="28" fill="${FROG}" ${S}/>
    <circle cx="-9" cy="12" r="5" fill="${FROG_DARK}" opacity=".7"/>
    <circle cx="8" cy="20" r="4" fill="${FROG_DARK}" opacity=".7"/>
    <circle cx="11" cy="6" r="3" fill="${FROG_DARK}" opacity=".7"/>
    <ellipse cx="0" cy="-18" rx="27" ry="17" fill="${FROG}" ${S}/>
    <path d="M-17,-14 Q0,-6 17,-14" fill="none" ${S} stroke-width="3"/>
    ${cheeks(19, -15)}
    <g class="frog-eyes">
      <circle cx="-14" cy="-30" r="11" fill="${FROG}" ${S}/><circle cx="14" cy="-30" r="11" fill="${FROG}" ${S}/>
      <circle cx="-14" cy="-32" r="7.5" fill="#fff"/><circle cx="14" cy="-32" r="7.5" fill="#fff"/>
      ${eye(-13, -33, 4.5)}${eye(15, -33, 4.5)}
    </g>
    <path class="frog-tongue" d="M0,-12 L0,-12" stroke="#ff7a9a" stroke-width="6" stroke-linecap="round"/>
  </svg>`;
}

/** Hoppy sitting, from the front: for the title screen and the pond. */
export function frogFrontSVG(small = false): string {
  const body = small ? '#9be870' : FROG;
  return `<svg viewBox="-60 -56 120 100" aria-hidden="true" class="frog-front">
    <ellipse cx="-24" cy="30" rx="16" ry="8" fill="${FROG_DARK}" ${S}/>
    <ellipse cx="24" cy="30" rx="16" ry="8" fill="${FROG_DARK}" ${S}/>
    <path d="M-34,26 C-40,-6 -26,-20 0,-20 C26,-20 40,-6 34,26 C22,36 -22,36 -34,26 Z" fill="${body}" ${S}/>
    <ellipse cx="0" cy="14" rx="20" ry="14" fill="${FROG_BELLY}"/>
    <path d="M-12,30 L-12,20 M12,30 L12,20" ${S} stroke-width="3"/>
    <g class="frog-eyes">
      <circle cx="-17" cy="-24" r="14" fill="${body}" ${S}/><circle cx="17" cy="-24" r="14" fill="${body}" ${S}/>
      <circle cx="-17" cy="-25" r="9.5" fill="#fff"/><circle cx="17" cy="-25" r="9.5" fill="#fff"/>
      ${eye(-16, -25, 5.5)}${eye(18, -25, 5.5)}
    </g>
    <path class="frog-mouth" d="M-16,-6 Q0,8 16,-6" fill="none" ${S} stroke-width="3"/>
    ${cheeks(24, -6, 5)}
  </svg>`;
}

// ---------------------------------------------------------------------------
// Lily pads, flowers, flies and stepping stones (seen from above)

const PAD_SHADES = [
  ['#6fcf5f', '#4faf48'],
  ['#62c35a', '#459f45'],
  ['#7fd66a', '#57b54f'],
];

/** A round lily pad with the little notch, rotated by `rot` degrees. */
export function padSVG(shade = 0, rot = 0, big = false): string {
  const [fill, vein] = PAD_SHADES[shade % PAD_SHADES.length];
  const r = 46;
  const notch = 16; // degrees either side of the notch
  const a1 = ((90 - notch) * Math.PI) / 180;
  const a2 = ((90 + notch) * Math.PI) / 180;
  const p = (a: number, rr = r) => `${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`;
  let veins = '';
  for (let i = 0; i < 9; i++) {
    const a = ((90 + notch + 12 + i * ((360 - notch * 2 - 24) / 8)) * Math.PI) / 180;
    veins += `<path d="M0,0 L${p(a, r * 0.82)}"/>`;
  }
  return `<svg viewBox="-50 -50 100 100" aria-hidden="true" class="pad-art">
    <g transform="rotate(${rot})">
      <path d="M0,4 L${p(a1)} A${r},${r} 0 1 0 ${p(a2)} Z" fill="rgba(20,70,90,.25)" transform="translate(3,5)"/>
      <path d="M0,4 L${p(a1)} A${r},${r} 0 1 0 ${p(a2)} Z" fill="${fill}" ${S} stroke-width="${big ? 2.6 : 3}"/>
      <g stroke="${vein}" stroke-width="2.4" stroke-linecap="round" opacity=".8">${veins}</g>
      <path d="M-30,-22 A36,36 0 0 1 8,-38" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".35"/>
    </g>
  </svg>`;
}

/** A water lily flower seen from above. */
export function flowerSVG(c: Colour): string {
  const petals = (n: number, rx: number, ry: number, cy: number, fill: string, off = 0) =>
    Array.from({ length: n }, (_, i) => `<ellipse rx="${rx}" ry="${ry}" cy="${cy}" fill="${fill}" ${S} stroke-width="2.4" transform="rotate(${off + (i * 360) / n})"/>`).join('');
  return `<svg viewBox="-50 -50 100 100" aria-hidden="true" class="flower-art">
    ${petals(8, 11, 22, -22, c.petal)}
    ${petals(6, 9, 16, -14, `color-mix(in srgb, ${c.petal} 55%, #fff)`, 30)}
    <circle r="11" fill="#ffd84a" ${S} stroke-width="2.4"/>
    ${[0, 72, 144, 216, 288].map((a) => `<circle r="2.2" cy="-5" fill="#f0a020" transform="rotate(${a})"/>`).join('')}
  </svg>`;
}

/** A little buzzing fly (the wings flutter in CSS). */
export function flySVG(): string {
  return `<svg viewBox="-30 -30 60 60" aria-hidden="true" class="fly-art">
    <g class="fly-wings" opacity=".85">
      <ellipse class="wing-l" cx="-10" cy="-8" rx="11" ry="7" fill="#e8f7ff" ${S} stroke-width="2" transform="rotate(-30 -10 -8)"/>
      <ellipse class="wing-r" cx="10" cy="-8" rx="11" ry="7" fill="#e8f7ff" ${S} stroke-width="2" transform="rotate(30 10 -8)"/>
    </g>
    <ellipse cx="0" cy="4" rx="9" ry="11" fill="#4a4f6a" ${S} stroke-width="2.5"/>
    <circle cx="-5" cy="-6" r="5" fill="#ff7a7a" ${S} stroke-width="2"/><circle cx="5" cy="-6" r="5" fill="#ff7a7a" ${S} stroke-width="2"/>
    <circle cx="-4" cy="-7" r="1.6" fill="#fff"/><circle cx="6" cy="-7" r="1.6" fill="#fff"/>
  </svg>`;
}

/** A round stepping stone. */
export function stoneSVG(seed = 0): string {
  const shapes = [
    'M-40,-6 C-40,-30 -14,-40 6,-38 C30,-36 42,-18 40,4 C38,28 16,40 -6,38 C-30,36 -40,18 -40,-6 Z',
    'M-38,-12 C-34,-34 -6,-40 14,-36 C36,-30 42,-8 38,12 C32,34 8,40 -12,36 C-34,30 -42,10 -38,-12 Z',
    'M-40,0 C-42,-24 -20,-40 2,-40 C26,-40 42,-22 40,0 C38,24 20,38 -2,38 C-24,38 -38,22 -40,0 Z',
  ];
  const d = shapes[seed % shapes.length];
  return `<svg viewBox="-50 -50 100 100" aria-hidden="true" class="stone-art">
    <path d="${d}" fill="rgba(20,70,90,.25)" transform="translate(3,6)"/>
    <path d="${d}" fill="#c9cfd8" ${S} stroke-width="3"/>
    <path d="M-24,-20 C-14,-30 4,-32 16,-28" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/>
    <circle cx="16" cy="18" r="7" fill="#9ccf6a" opacity=".8"/><circle cx="24" cy="10" r="4" fill="#9ccf6a" opacity=".8"/>
  </svg>`;
}

/** A dark fish shape gliding under the water. */
export function fishShadowSVG(): string {
  return `<svg viewBox="-40 -16 80 32" aria-hidden="true"><path d="M-30,0 C-20,-14 12,-14 22,0 C12,14 -20,14 -30,0 Z M18,0 L36,-12 L32,0 L36,12 Z" fill="#1f5f7a" opacity=".22"/></svg>`;
}

/** A tuft of reeds, seen from above, for the pond's edges. */
export function reedClumpSVG(): string {
  let blades = '';
  for (let i = 0; i < 8; i++) {
    const a = i * 45 + (i % 2) * 14;
    const len = 26 + (i % 3) * 8;
    blades += `<path d="M0,0 Q6,${-len * 0.5} 0,${-len} Q-6,${-len * 0.5} 0,0 Z" fill="${i % 2 ? '#7ccf6e' : '#62bb5c'}" stroke="#3f8f45" stroke-width="2" stroke-linejoin="round" transform="rotate(${a})"/>`;
  }
  return `<svg viewBox="-50 -50 100 100" aria-hidden="true" class="reed-art">
    <circle r="30" fill="rgba(20,70,90,.18)" transform="translate(3,5)"/>
    ${blades}
    ${[20, 160, 260].map((a) => `<ellipse cx="0" cy="-30" rx="5" ry="9" fill="#b07a52" stroke="#7a5236" stroke-width="2" transform="rotate(${a})"/>`).join('')}
    <circle r="8" fill="#4f9e4f"/>
  </svg>`;
}

// ---------------------------------------------------------------------------
// The pond friends (side on, in a 100×100 box centred on 0,0)

const FRIEND_ART: Record<string, () => string> = {
  duck: () => `
    <path d="M-36,12 C-42,-4 -30,-10 -22,-2 C-8,8 8,6 12,0 C20,-4 34,4 32,16 C28,30 -24,32 -36,12 Z" fill="#ffe066" ${S}/>
    <path d="M-14,6 C-4,16 8,14 12,6" fill="none" ${S} stroke-width="3"/>
    <circle cx="14" cy="-16" r="15" fill="#ffe066" ${S}/>
    <path d="M27,-18 C38,-22 46,-18 44,-12 C40,-8 32,-10 27,-12 Z" fill="#ffa53a" ${S} stroke-width="3"/>
    ${eye(18, -20, 3.6)}
    <circle cx="10" cy="-10" r="3.5" fill="#ff8fb1" opacity=".6"/>
    <path d="M10,-30 C12,-38 18,-38 16,-30" fill="#ffe066" ${S} stroke-width="2.5"/>`,
  turtle: () => `
    <g class="f-head"><circle cx="34" cy="0" r="12" fill="#a8e07a" ${S}/>${eye(38, -3, 3.2)}<path d="M36,6 Q41,9 44,5" fill="none" ${S} stroke-width="2.5"/></g>
    <ellipse cx="-22" cy="20" rx="9" ry="7" fill="#a8e07a" ${S} stroke-width="3"/>
    <ellipse cx="20" cy="20" rx="9" ry="7" fill="#a8e07a" ${S} stroke-width="3"/>
    <path d="M-38,16 C-38,-30 30,-30 30,16 Z" fill="#5fb35c" ${S}/>
    <path d="M-16,-12 L8,-12 L14,2 L-4,10 L-22,2 Z" fill="#7ccb67" ${S} stroke-width="2.5"/>
    <path d="M-40,16 L32,16" ${S}/>
    <path d="M-44,12 L-38,8" ${S}/>`,
  dragonfly: () => `
    <g class="f-wings" opacity=".8">
      <ellipse cx="-14" cy="-12" rx="24" ry="8" fill="#d6f3ff" ${S} stroke-width="2.5" transform="rotate(-20 -14 -12)"/>
      <ellipse cx="-14" cy="6" rx="22" ry="7" fill="#d6f3ff" ${S} stroke-width="2.5" transform="rotate(18 -14 6)"/>
      <ellipse cx="14" cy="-12" rx="24" ry="8" fill="#d6f3ff" ${S} stroke-width="2.5" transform="rotate(20 14 -12)"/>
      <ellipse cx="14" cy="6" rx="22" ry="7" fill="#d6f3ff" ${S} stroke-width="2.5" transform="rotate(-18 14 6)"/>
    </g>
    <rect x="-5" y="-6" width="10" height="46" rx="5" fill="#4ea8ff" ${S} stroke-width="3"/>
    <path d="M-5,8 L5,8 M-5,18 L5,18 M-5,28 L5,28" ${S} stroke-width="2"/>
    <ellipse cx="0" cy="-10" rx="10" ry="9" fill="#3d8fe6" ${S} stroke-width="3"/>
    <circle cx="-7" cy="-20" r="8" fill="#5ad3a0" ${S} stroke-width="3"/><circle cx="7" cy="-20" r="8" fill="#5ad3a0" ${S} stroke-width="3"/>
    ${eye(-6, -21, 3.4)}${eye(8, -21, 3.4)}`,
  snail: () => `
    <path d="M36,-4 L30,-26 M40,-4 L46,-24" ${S} stroke-width="3"/>
    <circle cx="30" cy="-28" r="4.5" fill="#1f2340"/><circle cx="46" cy="-26" r="4.5" fill="#1f2340"/>
    <path d="M-42,28 C-42,18 -22,16 0,16 L22,16 C26,4 30,-6 38,-6 C46,-6 48,6 46,16 C46,24 42,28 32,28 Z" fill="#ffd6a0" ${S}/>
    <path d="M34,8 Q38,12 42,8" fill="none" ${S} stroke-width="2.5"/>
    <circle cx="-8" cy="-6" r="24" fill="#ff9e7a" ${S}/>
    <path d="M-8,-6 m-2,0 a4,4 0 1 1 6,3 a9,9 0 1 1 -13,-7 a15,15 0 1 1 5,17" fill="none" ${S} stroke-width="3"/>`,
  fish: () => `
    <g class="f-tail"><path d="M-22,0 L-44,-18 L-38,0 L-44,18 Z" fill="#ff8a3a" ${S}/></g>
    <path d="M-28,0 C-16,-28 22,-28 34,0 C22,28 -16,28 -28,0 Z" fill="#ffa34d" ${S}/>
    <path d="M-2,-20 C4,-32 16,-30 18,-18" fill="#ff8a3a" ${S} stroke-width="3"/>
    <ellipse cx="6" cy="10" rx="16" ry="7" fill="#ffd08a" opacity=".8"/>
    <circle cx="20" cy="-5" r="7.5" fill="#fff" ${S} stroke-width="2.5"/>${eye(21, -5, 4.2)}
    <path d="M28,8 Q31,11 34,8" fill="none" ${S} stroke-width="2.5"/>`,
  ladybird: () => `
    <path d="M-20,-30 C-24,-40 -30,-42 -34,-40 M-8,-32 C-6,-42 -2,-46 4,-46" fill="none" ${S} stroke-width="2.5"/>
    <path d="M-34,10 L-44,18 M-30,20 L-38,30 M30,10 L40,18 M26,20 L34,30" ${S} stroke-width="3"/>
    <circle cx="-14" cy="-20" r="15" fill="#3a3f55" ${S}/>
    ${eye(-20, -22, 3.4)}${eye(-8, -24, 3.4)}
    <path d="M-36,10 C-36,-22 36,-22 36,10 C36,30 -36,30 -36,10 Z" fill="#ff5d6c" ${S}/>
    <path d="M0,-12 L0,28" ${S} stroke-width="3"/>
    ${[[-18, 0], [-22, 16], [-8, 14], [16, -2], [22, 14], [8, 18]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#3a3f55"/>`).join('')}`,
  tadpoles: () =>
    [[-22, -14, 0], [16, -20, 1], [-2, 16, 2]]
      .map(
        ([x, y, i]) => `<g transform="translate(${x},${y})" class="tad t${i}">
      <path d="M-4,0 C-18,-6 -24,8 -36,2" fill="none" stroke="#3a3f55" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="4" cy="0" rx="13" ry="10" fill="#4a4f6a" ${S} stroke-width="2.5"/>
      <circle cx="10" cy="-4" r="3.4" fill="#fff"/><circle cx="11" cy="-4" r="1.8" fill="#1f2340"/>
    </g>`,
      )
      .join(''),
  butterfly: () => `
    <g class="f-wings">
      <path d="M-3,-4 C-20,-40 -46,-34 -40,-12 C-36,2 -16,4 -3,0 Z" fill="#ff9ec4" ${S}/>
      <path d="M3,-4 C20,-40 46,-34 40,-12 C36,2 16,4 3,0 Z" fill="#c9a8ff" ${S}/>
      <path d="M-3,2 C-20,6 -34,22 -24,32 C-14,40 -4,22 -3,6 Z" fill="#ffd36e" ${S}/>
      <path d="M3,2 C20,6 34,22 24,32 C14,40 4,22 3,6 Z" fill="#8fd3ff" ${S}/>
      <circle cx="-26" cy="-18" r="4.5" fill="#fff" opacity=".8"/><circle cx="26" cy="-18" r="4.5" fill="#fff" opacity=".8"/>
    </g>
    <rect x="-4" y="-16" width="8" height="42" rx="4" fill="#5a4272"/>
    <path d="M-2,-16 C-6,-28 -12,-32 -16,-34 M2,-16 C6,-28 12,-32 16,-34" fill="none" stroke="#5a4272" stroke-width="3" stroke-linecap="round"/>`,
  bee: () => `
    <g class="f-wings" opacity=".85">
      <ellipse cx="-8" cy="-26" rx="12" ry="18" fill="#e8f7ff" ${S} stroke-width="2.5" transform="rotate(-24 -8 -26)"/>
      <ellipse cx="10" cy="-26" rx="12" ry="18" fill="#e8f7ff" ${S} stroke-width="2.5" transform="rotate(20 10 -26)"/>
    </g>
    <path d="M-34,6 L-44,6" ${S}/>
    <ellipse cx="-2" cy="6" rx="34" ry="24" fill="#ffd84a" ${S}/>
    <path d="M-18,-16 C-22,0 -22,14 -16,28 M-2,-18 C-6,0 -6,14 -2,30 M14,-16 C10,0 10,14 14,28" fill="none" stroke="#3a3f55" stroke-width="7"/>
    <ellipse cx="-2" cy="6" rx="34" ry="24" fill="none" ${S}/>
    <circle cx="30" cy="0" r="14" fill="#3a3f55" ${S}/>
    <circle cx="34" cy="-3" r="4" fill="#fff"/><circle cx="35" cy="-3" r="2" fill="#1f2340"/>
    <path d="M30,-12 C30,-22 34,-26 38,-28 M36,-10 C40,-18 46,-20 48,-20" fill="none" ${S} stroke-width="2.5"/>
    <path d="M34,6 Q38,9 42,5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`,
  swan: () => `
    <path d="M-40,10 C-44,-6 -30,-12 -20,-4 C-8,4 8,4 14,0 C22,-2 30,8 28,18 C24,32 -30,32 -40,10 Z" fill="#fff" ${S}/>
    <path d="M-30,-2 C-38,-18 -26,-24 -24,-14 C-20,-4 -6,6 4,4" fill="#f1f4fa" ${S} stroke-width="3"/>
    <path d="M18,6 C30,-4 26,-18 16,-26 C8,-34 12,-46 24,-44 C32,-42 34,-34 30,-30" fill="none" stroke="${INK}" stroke-width="13" stroke-linecap="round"/>
    <path d="M18,6 C30,-4 26,-18 16,-26 C8,-34 12,-46 24,-44 C32,-42 34,-34 30,-30" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>
    <path d="M30,-38 C38,-38 44,-34 42,-30 C38,-28 32,-30 29,-31 Z" fill="#ffa53a" ${S} stroke-width="2.5"/>
    ${eye(24, -40, 2.8)}
    <circle cx="22" cy="-33" r="3" fill="#ff8fb1" opacity=".6"/>`,
  otter: () => `
    <path d="M-44,26 C-40,14 -26,6 -8,6 C14,6 30,12 38,26 Z" fill="#9a6a4a" ${S}/>
    <path d="M-6,12 C-26,10 -34,-8 -26,-22 C-18,-36 16,-36 22,-20 C28,-6 18,12 -6,12 Z" fill="#b07f5a" ${S}/>
    <ellipse cx="-2" cy="-4" rx="16" ry="11" fill="#e8c9a4"/>
    <circle cx="-24" cy="-28" r="6" fill="#9a6a4a" ${S} stroke-width="2.5"/><circle cx="18" cy="-28" r="6" fill="#9a6a4a" ${S} stroke-width="2.5"/>
    ${eye(-11, -16, 3.6)}${eye(8, -16, 3.6)}
    <ellipse cx="-2" cy="-7" rx="5" ry="3.5" fill="#3a3f55"/>
    <path d="M-2,-4 L-2,0 M-8,1 Q-2,5 4,1" fill="none" ${S} stroke-width="2.4"/>
    <path d="M-12,-4 L-26,-8 M-12,-1 L-26,0 M8,-4 L22,-8 M8,-1 L22,0" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M-40,26 Q-30,20 -20,26 Q-10,20 0,26 Q10,20 20,26 Q30,20 40,26" fill="none" stroke="#8fd3ff" stroke-width="4" stroke-linecap="round"/>`,
  babyfrog: () => frogFrontSVG(true).replace(/^<svg[^>]*>|<\/svg>\s*$/g, '').replace('class="frog-eyes"', 'class="frog-eyes" transform="translate(0,4)"'),
};

export function friendSVG(id: string): string {
  const art = FRIEND_ART[id]?.() ?? '';
  const view = id === 'babyfrog' ? '-60 -60 120 108' : '-50 -50 100 100';
  return `<svg viewBox="${view}" aria-hidden="true" class="friend-art f-${id}">${art}</svg>`;
}

/** The same friend as a dark shape, for the ones not met yet. */
export function friendSilhouetteSVG(id: string): string {
  return friendSVG(id)
    .replace(/fill="(?!none)[^"]*"/g, 'fill="#8fb8c4"')
    .replace(/stroke="(?!none)[^"]*"/g, 'stroke="#8fb8c4"')
    .replace('class="friend-art', 'class="friend-art silhouette');
}

// ---------------------------------------------------------------------------
// Sky and scenery for the title

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
  /** Your pond: a lily pad with a flower. */
  pond: `<svg viewBox="-50 -50 100 100"><path d="M0,4 L-10,-32 A34,34 0 1 0 10,-32 Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><g transform="translate(8,-6)">${[0, 72, 144, 216, 288].map((a) => `<ellipse rx="6" ry="11" cy="-8" fill="currentColor" transform="rotate(${a})"/>`).join('')}<circle r="6" fill="#fff"/></g></svg>`,
  soundOn: `<svg viewBox="-50 -50 100 100"><path d="M-30,-12 L-16,-12 L2,-28 L2,28 L-16,12 L-30,12 Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><path d="M14,-14 Q24,0 14,14 M22,-24 Q38,0 22,24" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/></svg>`,
  soundOff: `<svg viewBox="-50 -50 100 100"><path d="M-30,-12 L-16,-12 L2,-28 L2,28 L-16,12 L-30,12 Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><path d="M14,-12 L34,12 M34,-12 L14,12" stroke="#fff" stroke-width="7" stroke-linecap="round"/></svg>`,
  musicOn: `<svg viewBox="-50 -50 100 100"><path d="M-10,20 L-10,-24 L24,-32 L24,12" stroke="#fff" stroke-width="7" fill="none" stroke-linejoin="round"/><ellipse cx="-18" cy="22" rx="10" ry="8" fill="#fff"/><ellipse cx="16" cy="14" rx="10" ry="8" fill="#fff"/></svg>`,
  musicOff: `<svg viewBox="-50 -50 100 100"><g opacity=".55"><path d="M-10,20 L-10,-24 L24,-32 L24,12" stroke="#fff" stroke-width="7" fill="none" stroke-linejoin="round"/><ellipse cx="-18" cy="22" rx="10" ry="8" fill="#fff"/><ellipse cx="16" cy="14" rx="10" ry="8" fill="#fff"/></g><path d="M-30,-30 L30,30" stroke="#fff" stroke-width="8" stroke-linecap="round"/></svg>`,
  close: `<svg viewBox="-50 -50 100 100"><path d="M-20,-20 L20,20 M20,-20 L-20,20" stroke="#fff" stroke-width="10" stroke-linecap="round"/></svg>`,
  gear: `<svg viewBox="-50 -50 100 100"><g fill="currentColor">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="-7" y="-40" width="14" height="18" rx="4" transform="rotate(${a})"/>`).join('')}<circle r="27"/></g><circle r="10" fill="#fff"/></svg>`,
};
