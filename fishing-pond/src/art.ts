// All the art is drawn here as SVG in code: the fish, the silly catches,
// Pip the penguin in her boat, the pond friends, the sky, the fish tank
// decorations and the button icons.
import type { Fish } from './data';

export const INK = '#3d4a6b';
const S = `stroke="${INK}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;
const RAINBOW = ['#ff6b6b', '#ffae5c', '#ffe066', '#86d07a', '#74bdfa', '#b995f2'];

let uid = 0;
const nextId = (p: string) => `${p}${++uid}`;

export function starPath(r: number, inner = 0.45, points = 5): string {
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const a = (i * Math.PI) / points - Math.PI / 2;
    const rad = i % 2 ? r * inner : r;
    d += `${i ? 'L' : 'M'}${(Math.cos(a) * rad).toFixed(2)},${(Math.sin(a) * rad).toFixed(2)}`;
  }
  return `${d}Z`;
}


const eye = (x: number, y: number, r = 8.5) =>
  `<g class="f-eye"><circle cx="${x}" cy="${y}" r="${r}" fill="#fff" ${S} stroke-width="3"/><circle cx="${x + r * 0.22}" cy="${y}" r="${r * 0.6}" fill="#1f2340"/><circle cx="${x + r * 0.45}" cy="${y - r * 0.28}" r="${r * 0.22}" fill="#fff"/></g>`;

// ---------------------------------------------------------------------------
// Fish (all face right, in a 140×100 box centred on 0,0)

const FISH_VIEW = '-72 -52 144 104';

const BODY = 'M46,0 C44,-24 12,-30 -10,-27 C-28,-24 -38,-12 -38,0 C-38,12 -28,24 -10,27 C12,30 44,24 46,0 Z';
const CAT_BODY = 'M50,4 C48,-18 20,-24 -10,-22 C-30,-20 -40,-10 -40,2 C-40,14 -28,22 -10,22 C18,24 50,22 50,4 Z';
const TAIL = 'M-30,0 C-42,-8 -52,-22 -62,-28 C-56,-10 -56,10 -62,28 C-52,22 -42,8 -30,0 Z';
const FANCY_TAIL = 'M-30,0 C-46,-10 -58,-36 -70,-32 C-64,-20 -60,-8 -52,0 C-60,8 -64,20 -70,32 C-58,36 -46,10 -30,0 Z';

function pattern(f: Fish, clip: string): string {
  const m = f.mark ?? '#fff';
  if (f.pattern === 'spots') {
    const spots: [number, number, number][] = [
      [-22, -8, 5],
      [-8, -17, 4.5],
      [-10, 4, 4],
      [5, -13, 4],
      [-25, 11, 3.5],
      [8, 12, 3.5],
    ];
    return `<g clip-path="url(#${clip})" class="f-marks">${spots.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${m}"/>`).join('')}</g>`;
  }
  if (f.pattern === 'stripes') {
    return `<g clip-path="url(#${clip})">${[-24, -6, 12]
      .map((x) => `<path d="M${x},-40 Q${x - 5},0 ${x},40 L${x + 8},40 Q${x + 3},0 ${x + 8},-40 Z" fill="${m}"/>`)
      .join('')}</g>`;
  }
  if (f.pattern === 'rainbow') {
    return `<g clip-path="url(#${clip})">${RAINBOW.map((c, i) => `<rect x="-50" y="${-32 + i * 10.7}" width="100" height="11" fill="${c}"/>`).join('')}</g>`;
  }
  return '';
}

function standardFish(f: Fish): string {
  const clip = nextId('fc');
  const fancy = f.kind === 'fancy';
  const glow = f.kind === 'glow';
  const cat = f.kind === 'catfish';
  const body = cat ? CAT_BODY : BODY;
  const tail = fancy ? FANCY_TAIL : TAIL;
  const dorsal = fancy ? 'M-20,-22 C-16,-48 16,-46 20,-24 Z' : cat ? 'M-14,-20 C-8,-34 8,-34 14,-22 Z' : 'M-16,-22 C-10,-40 8,-42 18,-24 Z';
  const ex = cat ? 32 : 28;
  const ey = cat ? -6 : -6;
  const whiskers = cat
    ? `<path d="M46,8 C56,12 62,22 60,32 M44,10 C50,20 50,28 46,36 M46,2 C58,0 66,6 68,14" fill="none" ${S} stroke-width="2.5"/>`
    : '';
  const lure = glow
    ? `<path d="M26,-24 C30,-42 48,-46 54,-36" fill="none" ${S} stroke-width="3"/><circle class="glow-bulb" cx="55" cy="-32" r="6.5" fill="#fff27a" ${S} stroke-width="2.5"/>`
    : '';
  return `<svg class="fish-art k-${f.kind}" viewBox="${FISH_VIEW}" aria-hidden="true">
    <defs><clipPath id="${clip}"><path d="${body}"/></clipPath></defs>
    ${lure}
    <g class="f-tail"><path d="${tail}" fill="${f.fin}" ${S}/></g>
    <path d="${dorsal}" fill="${f.fin}" ${S}/>
    <path d="M-4,${cat ? 18 : 20} C0,32 12,34 14,${cat ? 20 : 22} Z" fill="${f.fin}" ${S}/>
    <path d="${body}" fill="${f.body}"/>
    ${f.pattern === 'rainbow' ? '' : `<ellipse cx="4" cy="${cat ? 18 : 20}" rx="42" ry="13" fill="${f.belly}" clip-path="url(#${clip})"/>`}
    ${pattern(f, clip)}
    <path d="${body}" fill="none" ${S}/>
    <path d="M${ex - 12},-14 Q${ex - 18},0 ${ex - 12},14" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" opacity=".3"/>
    <g class="f-fin"><path d="M2,4 C12,6 16,14 10,18 C4,16 0,10 2,4 Z" fill="${f.fin}" ${S} stroke-width="2.5"/></g>
    <circle cx="${ex - 6}" cy="9" r="4.5" fill="#ff8fb1" opacity=".5"/>
    ${eye(ex, ey, cat ? 7.5 : 8.5)}
    <path d="M${ex + 8},${cat ? 11 : 8} Q${ex + 12},${cat ? 15 : 12} ${ex + 16},${cat ? 9 : 7}" fill="none" ${S} stroke-width="2.5"/>
    ${whiskers}
  </svg>`;
}

function pufferFish(f: Fish): string {
  const clip = nextId('fc');
  let spikes = '';
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const b = 0.16;
    const p = (r: number, ang: number) => `${(4 + Math.cos(ang) * r).toFixed(1)},${(Math.sin(ang) * r).toFixed(1)}`;
    spikes += `<path d="M${p(30, a - b)} L${p(42, a)} L${p(30, a + b)} Z" fill="${f.fin}" ${S} stroke-width="2.5"/>`;
  }
  return `<svg class="fish-art k-puffer" viewBox="${FISH_VIEW}" aria-hidden="true">
    <defs><clipPath id="${clip}"><circle cx="4" cy="0" r="33"/></clipPath></defs>
    <g class="f-tail"><path d="M-26,0 C-36,-6 -44,-16 -52,-18 C-48,-6 -48,6 -52,18 C-44,16 -36,6 -26,0 Z" fill="${f.fin}" ${S}/></g>
    <g class="puff">${spikes}
      <circle cx="4" cy="0" r="33" fill="${f.body}"/>
      <ellipse cx="4" cy="22" rx="30" ry="16" fill="${f.belly}" clip-path="url(#${clip})"/>
      <circle cx="4" cy="0" r="33" fill="none" ${S}/>
      <g class="f-fin"><path d="M-2,6 C8,8 12,16 6,20 C0,18 -4,12 -2,6 Z" fill="${f.fin}" ${S} stroke-width="2.5"/></g>
      <circle cx="16" cy="10" r="4.5" fill="#ff5d8f" opacity=".45"/>
      ${eye(20, -8, 9.5)}
      <circle cx="34" cy="6" r="4" fill="#ff8595" ${S} stroke-width="2.5"/>
    </g>
  </svg>`;
}

function crab(f: Fish): string {
  const legs = [-1, 1]
    .map((s) =>
      [0, 1, 2]
        .map((i) => `<path d="M${s * 26},${10 + i * 6} Q${s * (40 + i * 2)},${6 + i * 8} ${s * (44 + i * 2)},${22 + i * 8}" fill="none" stroke="${f.fin}" stroke-width="5" stroke-linecap="round"/>`)
        .join(''),
    )
    .join('');
  const claw = (s: number) =>
    `<g class="claw" style="transform-origin:${s * 24}px -2px">
      <path d="M${s * 22},-2 Q${s * 34},-10 ${s * 38},-22" fill="none" stroke="${f.fin}" stroke-width="7" stroke-linecap="round"/>
      <path d="M${s * 38},-18 C${s * 30},-26 ${s * 32},-44 ${s * 44},-44 C${s * 52},-44 ${s * 56},-36 ${s * 52},-30 L${s * 44},-32 L${s * 50},-24 C${s * 46},-16 ${s * 40},-14 ${s * 38},-18 Z" fill="${f.body}" ${S} stroke-width="3"/>
    </g>`;
  return `<svg class="fish-art k-crab" viewBox="${FISH_VIEW}" aria-hidden="true">
    ${legs}${claw(-1)}${claw(1)}
    <path d="M-9,-10 L-12,-28 M9,-10 L12,-28" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="0" cy="8" rx="34" ry="22" fill="${f.body}" ${S}/>
    <ellipse cx="0" cy="18" rx="24" ry="9" fill="${f.belly}" opacity=".8"/>
    ${eye(-12, -30, 7)}${eye(12, -30, 7)}
    <circle cx="-18" cy="10" r="4.5" fill="#ff5d8f" opacity=".45"/><circle cx="18" cy="10" r="4.5" fill="#ff5d8f" opacity=".45"/>
    <path d="M-8,8 Q0,16 8,8" fill="none" ${S} stroke-width="3"/>
  </svg>`;
}

export function fishSVG(f: Fish): string {
  if (f.kind === 'puffer') return pufferFish(f);
  if (f.kind === 'crab') return crab(f);
  return standardFish(f);
}

/** The grey shape shown for fish not caught yet. */
export function silhouetteSVG(f: Fish): string {
  return fishSVG({ ...f, body: '#c9d6e6', fin: '#b3c3d8', belly: '#c9d6e6', mark: '#c9d6e6', pattern: 'plain' }).replace('class="fish-art', 'class="fish-art silhouette');
}

// ---------------------------------------------------------------------------
// Silly catches (100×100, centred)

export function sillySVG(id: string): string {
  const v = 'viewBox="-50 -50 100 100" aria-hidden="true" class="silly-art"';
  switch (id) {
    case 'boot':
      return `<svg ${v}>
        <path d="M-20,-40 L10,-40 L10,6 C26,8 40,16 40,28 L40,36 L-20,36 Z" fill="#9a6444" ${S}/>
        <path d="M-22,34 L42,34 L42,42 L-22,42 Z" fill="#5e3b2a" ${S}/>
        <path d="M-22,-44 L12,-44 L12,-34 L-22,-34 Z" fill="#b57b56" ${S}/>
        <path d="M-6,-24 L8,-18 M-6,-18 L8,-24 M-6,-10 L8,-4 M-6,-4 L8,-10" stroke="#f4e3c3" stroke-width="3" stroke-linecap="round"/>
        <path d="M-14,-30 C-16,-10 -16,10 -14,26" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".3" fill="none"/>
        <path d="M30,40 Q32,48 28,50" stroke="#74bdfa" stroke-width="4" stroke-linecap="round" fill="none"/>
      </svg>`;
    case 'duck':
      return `<svg ${v}>
        <path d="M-40,8 C-44,-6 -30,-10 -20,-4 C-6,4 14,2 20,-4 C30,-8 38,4 34,16 C28,34 -26,38 -38,20 Z" fill="#ffd93d" ${S}/>
        <circle cx="16" cy="-20" r="17" fill="#ffd93d" ${S}/>
        <path d="M30,-20 C40,-24 48,-20 46,-14 C42,-10 34,-12 30,-14 Z" fill="#ff9f1c" ${S} stroke-width="3"/>
        ${eye(20, -24, 5)}
        <path d="M-18,4 C-8,14 8,14 12,4" fill="none" ${S} stroke-width="3"/>
        <circle cx="10" cy="-12" r="3.5" fill="#ff8fb1" opacity=".6"/>
      </svg>`;
    case 'teapot':
      return `<svg ${v}>
        <path d="M24,-2 C36,-4 42,-18 46,-22" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>
        <path d="M24,-2 C36,-4 42,-18 46,-22" fill="none" stroke="#74bdfa" stroke-width="6" stroke-linecap="round"/>
        <path d="M-28,-10 C-46,-10 -46,20 -26,18" fill="none" ${S} stroke-width="8"/>
        <path d="M-28,-10 C-46,-10 -46,20 -26,18" fill="none" stroke="#74bdfa" stroke-width="3"/>
        <path d="M-32,-16 C-38,20 -26,36 0,36 C26,36 38,20 32,-16 Z" fill="#74bdfa" ${S}/>
        <circle cx="-14" cy="4" r="5" fill="#fff"/><circle cx="8" cy="16" r="5" fill="#fff"/><circle cx="16" cy="-4" r="4" fill="#fff"/><circle cx="-8" cy="24" r="3.5" fill="#fff"/>
        <path d="M-26,-16 C-20,-30 20,-30 26,-16 Z" fill="#ff9fcc" ${S}/>
        <circle cx="0" cy="-30" r="6" fill="#ff9fcc" ${S} stroke-width="3"/>
      </svg>`;
    case 'sock': {
      const clip = nextId('sk');
      const sock = 'M-16,-42 L14,-42 L14,8 C14,22 30,22 36,28 C42,38 32,46 18,44 L-4,42 C-18,40 -16,22 -16,10 Z';
      return `<svg ${v}>
        <defs><clipPath id="${clip}"><path d="${sock}"/></clipPath></defs>
        <path d="${sock}" fill="#fff"/>
        <g clip-path="url(#${clip})">${[-38, -20, -2].map((y) => `<rect x="-20" y="${y}" width="40" height="9" fill="#ff6b6b"/>`).join('')}
          <path d="M8,26 C20,26 40,30 40,46 L-20,46 L-20,36 C-6,38 0,30 8,26 Z" fill="#ff6b6b"/></g>
        <path d="${sock}" fill="none" ${S}/>
        <path d="M-30,-30 C-24,-36 -36,-42 -30,-48 M-38,-12 C-32,-18 -44,-24 -38,-30 M26,-12 C32,-18 20,-24 26,-30" fill="none" stroke="#8cc63f" stroke-width="3.5" stroke-linecap="round"/>
      </svg>`;
    }
    case 'crown':
      return `<svg ${v}>
        <path d="M-38,26 L-42,-24 L-20,-2 L0,-34 L20,-2 L42,-24 L38,26 Z" fill="#ffd23f" ${S}/>
        <rect x="-40" y="22" width="80" height="14" rx="4" fill="#ffc21a" ${S}/>
        <circle cx="-42" cy="-26" r="5" fill="#ff6b6b" ${S} stroke-width="2.5"/><circle cx="0" cy="-36" r="6" fill="#74bdfa" ${S} stroke-width="2.5"/><circle cx="42" cy="-26" r="5" fill="#86d07a" ${S} stroke-width="2.5"/>
        <circle cx="-20" cy="29" r="4" fill="#ff6b6b"/><circle cx="0" cy="29" r="4" fill="#b995f2"/><circle cx="20" cy="29" r="4" fill="#86d07a"/>
        <path d="M-28,10 L-30,-8" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/>
      </svg>`;
    case 'hat':
    default:
      return `<svg ${v}>
        <ellipse cx="0" cy="30" rx="46" ry="12" fill="#8e62db" ${S}/>
        <path d="M-26,30 L-24,-34 C-24,-42 24,-42 24,-34 L26,30 Z" fill="#b58cf5" ${S}/>
        <path d="M-25,12 L25,12 L26,24 L-26,24 Z" fill="#ff9fcc" ${S} stroke-width="3"/>
        <g transform="translate(18,12)"><circle r="9" fill="#ffe066" ${S} stroke-width="2.5"/><circle r="3.5" fill="#ffae5c"/></g>
        <path d="M-16,-28 L-16,4" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".4"/>
      </svg>`;
  }
}

// ---------------------------------------------------------------------------
// Pip the penguin in her little rowing boat (220×180). The rod tip is at
// (214, 8) and the waterline at y = 150.

export const BOAT_W = 220;
export const BOAT_H = 180;
export const ROD_TIP = { x: 214, y: 8 };
export const WATERLINE = 150;

export function boatSVG(): string {
  const navy = '#34406b';
  return `<svg class="boat-art" viewBox="0 0 ${BOAT_W} ${BOAT_H}" aria-hidden="true">
    <g class="pip">
      <g class="pip-wing-l"><path d="M70,92 C52,96 46,110 54,118 C62,114 70,104 70,92 Z" fill="${navy}" ${S}/></g>
      <ellipse cx="100" cy="100" rx="34" ry="34" fill="${navy}" ${S}/>
      <ellipse cx="100" cy="106" rx="22" ry="24" fill="#fff"/>
      <circle cx="100" cy="60" r="30" fill="${navy}" ${S}/>
      <path d="M78,62 C78,46 96,44 100,54 C104,44 122,46 122,62 C122,78 110,86 100,86 C90,86 78,78 78,62 Z" fill="#fff"/>
      <g class="pip-eyes"><ellipse cx="91" cy="61" rx="4.5" ry="5.5" fill="#1f2340"/><ellipse cx="109" cy="61" rx="4.5" ry="5.5" fill="#1f2340"/>
        <circle cx="92.5" cy="59" r="1.8" fill="#fff"/><circle cx="110.5" cy="59" r="1.8" fill="#fff"/></g>
      <circle cx="84" cy="72" r="4.5" fill="#ff8fb1" opacity=".6"/><circle cx="116" cy="72" r="4.5" fill="#ff8fb1" opacity=".6"/>
      <path class="pip-beak" d="M93,69 L107,69 L100,79 Z" fill="#ffa53a" ${S} stroke-width="2.5"/>
      <path d="M71,46 C70,18 130,18 129,46 Z" fill="#ff6b8a" ${S}/>
      <path d="M69,42 L131,42 L131,52 L69,52 Z" fill="#fff4e0" ${S} stroke-width="3" rx="4"/>
      <circle cx="100" cy="17" r="9" fill="#fff" ${S} stroke-width="3"/>
    </g>
    <g class="rod"><path d="M126,118 L${ROD_TIP.x},${ROD_TIP.y}" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
      <path d="M126,118 L${ROD_TIP.x},${ROD_TIP.y}" stroke="#c98f5a" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="136" cy="104" r="7" fill="#b8c4d6" ${S} stroke-width="2.5"/></g>
    <g class="pip-wing-r"><path d="M128,90 C146,92 150,104 140,110 C132,106 126,100 128,90 Z" fill="${navy}" ${S}/></g>
    <path d="M14,118 L206,118 C202,150 180,170 152,172 L68,172 C40,170 18,150 14,118 Z" fill="#ff6b6b" ${S}/>
    <path d="M12,114 L208,114 L206,127 L14,127 Z" fill="#fff4e0" ${S}/>
    <path d="M30,146 C60,152 160,152 190,146" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".45"/>
    <circle cx="110" cy="142" r="7" fill="#ffe066" ${S} stroke-width="2.5"/>
  </svg>`;
}

export function bobberSVG(): string {
  return `<svg viewBox="-16 -30 32 50" aria-hidden="true">
    <path d="M0,-28 L0,-16" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <path d="M-12,0 A12,12 0 0 1 12,0 Z" fill="#ff5d73" ${S} stroke-width="3"/>
    <path d="M-12,0 A12,12 0 0 0 12,0 Z" fill="#fff" ${S} stroke-width="3"/>
    <circle cx="-4" cy="-6" r="2.5" fill="#fff" opacity=".7"/>
  </svg>`;
}

export function hookSVG(): string {
  return `<svg viewBox="-20 -24 40 48" aria-hidden="true">
    <path d="M0,-24 L0,8 C0,18 -12,18 -12,8" fill="none" stroke="#8a98ad" stroke-width="3.5" stroke-linecap="round"/>
    <path class="worm" d="M0,6 C8,2 12,10 6,14 C0,18 4,24 10,22" fill="none" stroke="#ff8fb1" stroke-width="6" stroke-linecap="round"/>
  </svg>`;
}

// ---------------------------------------------------------------------------
// Pond friends

export function frogSVG(): string {
  return `<svg viewBox="-64 -62 128 96" aria-hidden="true">
    <path d="M0,22 L-8,6 A58,15 0 1 0 8,6 Z" fill="#4fae55" ${S}/>
    <path d="M-40,20 C-20,26 20,26 40,20" stroke="#8fd68a" stroke-width="3" fill="none" stroke-linecap="round"/>
    <g class="frog">
      <ellipse cx="-22" cy="12" rx="12" ry="7" fill="#7ed957" ${S} stroke-width="3"/>
      <ellipse cx="22" cy="12" rx="12" ry="7" fill="#7ed957" ${S} stroke-width="3"/>
      <ellipse cx="0" cy="-4" rx="30" ry="21" fill="#7ed957" ${S}/>
      <ellipse cx="0" cy="4" rx="18" ry="10" fill="#c9f2a8"/>
      <circle cx="-15" cy="-22" r="11" fill="#7ed957" ${S}/><circle cx="15" cy="-22" r="11" fill="#7ed957" ${S}/>
      <g class="frog-eyes"><circle cx="-15" cy="-23" r="6.5" fill="#fff"/><circle cx="15" cy="-23" r="6.5" fill="#fff"/>
      <circle cx="-14" cy="-23" r="4" fill="#1f2340"/><circle cx="16" cy="-23" r="4" fill="#1f2340"/></g>
      <path class="frog-mouth" d="M-14,-6 Q0,6 14,-6" fill="none" ${S} stroke-width="3"/>
      <circle cx="-20" cy="-6" r="4" fill="#ff8fb1" opacity=".55"/><circle cx="20" cy="-6" r="4" fill="#ff8fb1" opacity=".55"/>
    </g>
  </svg>`;
}

export function turtleSVG(): string {
  return `<svg viewBox="-64 -50 128 84" aria-hidden="true">
    <path d="M-58,30 C-56,6 -30,-2 0,-2 C32,-2 58,8 60,30 Z" fill="#a3afbd" ${S}/>
    <path d="M-40,14 C-30,8 -20,8 -12,12" stroke="#fff" stroke-width="3" opacity=".4" fill="none" stroke-linecap="round"/>
    <g class="turtle">
      <g class="turtle-head"><circle cx="36" cy="-12" r="11" fill="#a8e07a" ${S}/>
        <circle cx="40" cy="-15" r="3" fill="#1f2340"/><path d="M38,-7 Q42,-4 45,-8" fill="none" ${S} stroke-width="2.5"/></g>
      <ellipse cx="-22" cy="-2" rx="9" ry="6" fill="#a8e07a" ${S} stroke-width="3"/>
      <ellipse cx="22" cy="-2" rx="9" ry="6" fill="#a8e07a" ${S} stroke-width="3"/>
      <path d="M-32,-2 C-32,-38 32,-38 32,-2 Z" fill="#5fb35c" ${S}/>
      <path d="M-12,-26 L12,-26 L18,-12 L0,-4 L-18,-12 Z" fill="#7ccb67" ${S} stroke-width="2.5"/>
      <path d="M-32,-2 L32,-2" ${S}/>
    </g>
  </svg>`;
}

export function duckSVG(): string {
  return `<svg viewBox="-52 -48 104 80" aria-hidden="true">
    <g class="duck">
      <path d="M-40,6 C-46,-10 -34,-14 -26,-8 C-10,2 12,0 18,-6 C28,-10 40,0 36,12 C30,28 -28,30 -40,6 Z" fill="#fff8e1" ${S}/>
      <path d="M-18,0 C-8,12 8,12 12,2" fill="none" ${S} stroke-width="3"/>
      <circle cx="18" cy="-22" r="15" fill="#fff8e1" ${S}/>
      <path d="M31,-24 C42,-28 50,-24 48,-18 C44,-14 36,-16 31,-18 Z" fill="#ffa53a" ${S} stroke-width="3"/>
      <circle cx="22" cy="-26" r="3.5" fill="#1f2340"/><circle cx="23" cy="-27.5" r="1.2" fill="#fff"/>
      <circle cx="14" cy="-16" r="3.5" fill="#ff8fb1" opacity=".6"/>
    </g>
  </svg>`;
}

export function reedsSVG(): string {
  const reed = (x: number, h: number, lean: number) =>
    `<path d="M${x},140 Q${x + lean * 0.4},${140 - h * 0.6} ${x + lean},${140 - h}" stroke="#5aa857" stroke-width="5" fill="none" stroke-linecap="round"/>
     <rect x="${x + lean - 6}" y="${140 - h - 6}" width="12" height="30" rx="6" fill="#9a6444" ${S} stroke-width="2.5" transform="rotate(${lean * 0.6} ${x + lean} ${140 - h + 9})"/>`;
  const blade = (x: number, h: number, lean: number) =>
    `<path d="M${x - 4},140 Q${x + lean * 0.3},${140 - h * 0.5} ${x + lean},${140 - h} Q${x + lean * 0.3 + 6},${140 - h * 0.5} ${x + 4},140 Z" fill="#6cc46a" ${S} stroke-width="2.5"/>`;
  return `<svg viewBox="0 0 90 140" aria-hidden="true" class="reeds-art">
    ${blade(14, 70, -12)}${reed(30, 110, -6)}${blade(40, 90, 8)}${reed(56, 96, 10)}${blade(70, 60, 14)}
  </svg>`;
}

export function lilyPadSVG(flower = false): string {
  return `<svg viewBox="-40 -16 80 32" aria-hidden="true">
    <path d="M0,0 L-6,-10 A36,11 0 1 0 6,-10 Z" fill="#4fae55" ${S} stroke-width="3"/>
    ${flower ? `<g transform="translate(-10,-6)">${[0, 72, 144, 216, 288].map((a) => `<ellipse rx="5" ry="10" cy="-6" fill="#ffc2dd" ${S} stroke-width="2" transform="rotate(${a})"/>`).join('')}<circle r="4" fill="#ffe066"/></g>` : ''}
  </svg>`;
}

export function weedSVG(color = '#5fbf6a'): string {
  return `<svg viewBox="0 0 60 120" aria-hidden="true" class="weed-art">
    <path class="sway" d="M20,120 C10,90 30,70 18,40 C10,20 22,8 20,0" stroke="${color}" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path class="sway s2" d="M40,120 C50,96 32,80 44,56 C52,40 40,30 44,20" stroke="${color}" stroke-width="8" fill="none" stroke-linecap="round" opacity=".85"/>
  </svg>`;
}

// ---------------------------------------------------------------------------
// Sky

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

export function moonSVG(): string {
  const glow = nextId('mg');
  return `<svg viewBox="-60 -60 120 120" aria-hidden="true" class="moon-art">
    <defs><radialGradient id="${glow}"><stop offset=".4" stop-color="#fff6c9" stop-opacity=".35"/><stop offset="1" stop-color="#fff6c9" stop-opacity="0"/></radialGradient></defs>
    <circle r="58" fill="url(#${glow})"/>
    <path d="M10,-36 A36,36 0 1 0 30,20 A28,28 0 1 1 10,-36 Z" fill="#fff3b0" ${S}/>
    <path d="M-16,-2 Q-12,2 -8,-2" fill="none" ${S} stroke-width="3"/>
    <path d="M-14,10 Q-8,15 -2,10" fill="none" ${S} stroke-width="2.5"/>
    <circle cx="-22" cy="6" r="4" fill="#ffb3a0" opacity=".5"/>
  </svg>`;
}

export function cloudSVG(rain = false): string {
  const c = rain ? '#c5cfe0' : '#fff';
  return `<svg viewBox="-70 -40 140 70" aria-hidden="true" class="cloud-art">
    <path d="M-50,20 C-66,20 -66,-4 -48,-4 C-48,-26 -18,-32 -8,-16 C0,-36 36,-34 38,-10 C58,-12 64,20 44,20 Z" fill="${c}" ${S}/>
    ${rain ? `<path d="M-16,4 Q-12,0 -8,4 M8,4 Q12,0 16,4" fill="none" ${S} stroke-width="3"/><path d="M-6,10 Q0,16 6,10" fill="none" ${S} stroke-width="2.5"/><circle cx="-22" cy="8" r="4" fill="#ff9fb8" opacity=".5"/><circle cx="22" cy="8" r="4" fill="#ff9fb8" opacity=".5"/>` : ''}
  </svg>`;
}

export function hillsSVG(): string {
  return `<svg viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0,60 L0,30 C40,4 90,6 130,26 C170,8 230,0 270,24 C310,6 360,10 400,28 L400,60 Z" fill="var(--hill-far)"/>
    <path d="M0,60 L0,44 C60,24 120,30 170,46 C220,30 300,26 400,44 L400,60 Z" fill="var(--hill-near)"/>
  </svg>`;
}

// ---------------------------------------------------------------------------
// Fish tank decorations

export function plantSVG(color = '#5fbf6a'): string {
  return weedSVG(color);
}

export function chestSVG(): string {
  return `<svg viewBox="-50 -50 100 80" aria-hidden="true">
    <g class="chest-lid"><path d="M-36,-14 C-36,-44 36,-44 36,-14 Z" fill="#b57b56" ${S} transform="rotate(-24 -36 -14)"/></g>
    <circle cx="-8" cy="-18" r="7" fill="#ffd23f" ${S} stroke-width="2.5"/><circle cx="8" cy="-20" r="6" fill="#ffd23f" ${S} stroke-width="2.5"/><circle cx="0" cy="-26" r="5" fill="#74bdfa" ${S} stroke-width="2"/>
    <path d="M-36,-14 L36,-14 L34,26 L-34,26 Z" fill="#9a6444" ${S}/>
    <path d="M-36,-2 L36,-2" ${S}/>
    <rect x="-6" y="-8" width="12" height="14" rx="3" fill="#ffd23f" ${S} stroke-width="2.5"/>
  </svg>`;
}

export function castleSVG(): string {
  const tower = (x: number, h: number) =>
    `<path d="M${x - 14},30 L${x - 14},${30 - h} L${x - 14},${24 - h} L${x - 8},${24 - h} L${x - 8},${30 - h} L${x - 3},${30 - h} L${x - 3},${24 - h} L${x + 3},${24 - h} L${x + 3},${30 - h} L${x + 8},${30 - h} L${x + 8},${24 - h} L${x + 14},${24 - h} L${x + 14},30 Z" fill="#ffb3d1" ${S}/>`;
  return `<svg viewBox="-60 -80 120 112" aria-hidden="true">
    ${tower(-34, 70)}${tower(34, 70)}
    <path d="M-24,30 L-24,-24 L24,-24 L24,30 Z" fill="#ffc9df" ${S}/>
    ${tower(0, 96)}
    <path d="M-10,30 L-10,8 A10,10 0 0 1 10,8 L10,30 Z" fill="#8e62db" ${S}/>
    <circle cx="0" cy="-44" r="6" fill="#74bdfa" ${S} stroke-width="2.5"/>
    <path d="M0,-74 L0,-92 L16,-86 L0,-80" fill="#ffe066" ${S} stroke-width="2.5"/>
  </svg>`;
}

export function snailSVG(): string {
  return `<svg viewBox="-40 -34 80 56" aria-hidden="true">
    <path d="M-34,16 C-34,6 -20,4 -6,6 L28,8 C34,8 36,16 30,18 L-30,20 Z" fill="#ffd9a8" ${S}/>
    <path d="M22,8 L26,-12 M30,8 L36,-10" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="26" cy="-13" r="3" fill="${INK}"/><circle cx="36" cy="-11" r="3" fill="${INK}"/>
    <circle cx="-4" cy="-6" r="20" fill="#ff9fcc" ${S}/>
    <path d="M-4,-6 m0,-12 a12,12 0 1 1 -10,6 a8,8 0 1 1 12,-2 a4,4 0 1 1 -4,2" fill="none" ${S} stroke-width="3"/>
  </svg>`;
}

export function coralSVG(): string {
  return `<svg viewBox="-50 -70 100 90" aria-hidden="true">
    <path d="M0,20 L0,-20 M0,-6 L-18,-28 L-20,-50 M-18,-28 L-34,-36 M0,-20 L14,-40 L12,-60 M14,-40 L30,-48 M0,6 L22,-10 L36,-18" stroke="${INK}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M0,20 L0,-20 M0,-6 L-18,-28 L-20,-50 M-18,-28 L-34,-36 M0,-20 L14,-40 L12,-60 M14,-40 L30,-48 M0,6 L22,-10 L36,-18" stroke="#ff8a8a" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </svg>`;
}

// ---------------------------------------------------------------------------
// Icons

export const ICONS = {
  play: `<svg viewBox="-50 -50 100 100"><path d="M-14,-26 L28,0 L-14,26 Z" fill="#fff" stroke="#fff" stroke-width="10" stroke-linejoin="round"/></svg>`,
  home: `<svg viewBox="-50 -50 100 100"><path d="M-28,-2 L0,-28 L28,-2 L28,28 L-28,28 Z" fill="#fff" stroke="#fff" stroke-width="8" stroke-linejoin="round"/><rect x="-8" y="8" width="16" height="22" rx="3" fill="currentColor"/></svg>`,
  games: `<svg viewBox="-50 -50 100 100"><g fill="#fff"><rect x="-30" y="-30" width="26" height="26" rx="7"/><rect x="4" y="-30" width="26" height="26" rx="7"/><rect x="-30" y="4" width="26" height="26" rx="7"/><rect x="4" y="4" width="26" height="26" rx="7"/></g></svg>`,
  tank: `<svg viewBox="-50 -50 100 100"><path d="M-22,-30 L22,-30 L22,-24 C38,-14 40,18 24,30 L-24,30 C-40,18 -38,-14 -22,-24 Z" fill="#fff" stroke="#fff" stroke-width="5" stroke-linejoin="round"/><path d="M-12,6 C-4,-6 12,-6 18,4 C12,14 -4,14 -12,6 Z M-12,6 L-22,-2 L-22,14 Z" fill="currentColor"/></svg>`,
  soundOn: `<svg viewBox="-50 -50 100 100"><path d="M-30,-12 L-16,-12 L2,-28 L2,28 L-16,12 L-30,12 Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><path d="M14,-14 Q24,0 14,14 M22,-24 Q38,0 22,24" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/></svg>`,
  soundOff: `<svg viewBox="-50 -50 100 100"><path d="M-30,-12 L-16,-12 L2,-28 L2,28 L-16,12 L-30,12 Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><path d="M14,-12 L34,12 M34,-12 L14,12" stroke="#fff" stroke-width="7" stroke-linecap="round"/></svg>`,
  musicOn: `<svg viewBox="-50 -50 100 100"><path d="M-10,20 L-10,-24 L24,-32 L24,12" stroke="#fff" stroke-width="7" fill="none" stroke-linejoin="round"/><ellipse cx="-18" cy="22" rx="10" ry="8" fill="#fff"/><ellipse cx="16" cy="14" rx="10" ry="8" fill="#fff"/></svg>`,
  musicOff: `<svg viewBox="-50 -50 100 100"><g opacity=".55"><path d="M-10,20 L-10,-24 L24,-32 L24,12" stroke="#fff" stroke-width="7" fill="none" stroke-linejoin="round"/><ellipse cx="-18" cy="22" rx="10" ry="8" fill="#fff"/><ellipse cx="16" cy="14" rx="10" ry="8" fill="#fff"/></g><path d="M-30,-30 L30,30" stroke="#fff" stroke-width="8" stroke-linecap="round"/></svg>`,
  close: `<svg viewBox="-50 -50 100 100"><path d="M-20,-20 L20,20 M20,-20 L-20,20" stroke="#fff" stroke-width="10" stroke-linecap="round"/></svg>`,
  gear: `<svg viewBox="-50 -50 100 100"><g fill="currentColor">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="-7" y="-40" width="14" height="18" rx="4" transform="rotate(${a})"/>`).join('')}<circle r="27"/></g><circle r="10" fill="#fff"/></svg>`,
};
