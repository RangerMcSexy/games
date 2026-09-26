// Everything outside the colouring pages is drawn here as SVG in code: the
// paint pots, Dot the puppy, the gallery decorations and the button icons.
import { PAINT, RAINBOW_STOPS, type PaintId } from './data';

export const INK = '#5a4272';

export function starPath(r: number, inner = 0.45, points = 5): string {
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const a = (i * Math.PI) / points - Math.PI / 2;
    const rad = i % 2 ? r * inner : r;
    d += `${i ? 'L' : 'M'}${(Math.cos(a) * rad).toFixed(2)},${(Math.sin(a) * rad).toFixed(2)}`;
  }
  return `${d}Z`;
}

export function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}

const rainbowDef = (id: string, x2 = 1, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${RAINBOW_STOPS.map(
    (c, i) => `<stop offset="${i / (RAINBOW_STOPS.length - 1)}" stop-color="${c}"/>`,
  ).join('')}</linearGradient>`;

/** A blobby paint splat (seeded so the same splat always looks the same). */
export function splatPath(seed: number, r = 40, lumps = 9): string {
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const pts: [number, number][] = [];
  for (let i = 0; i < lumps; i++) {
    const a = (i / lumps) * Math.PI * 2;
    const rad = r * (0.72 + rnd() * 0.45);
    pts.push([Math.cos(a) * rad, Math.sin(a) * rad]);
  }
  // Smooth closed curve through the points.
  let d = `M${((pts[0][0] + pts[lumps - 1][0]) / 2).toFixed(1)},${((pts[0][1] + pts[lumps - 1][1]) / 2).toFixed(1)}`;
  for (let i = 0; i < lumps; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % lumps];
    d += `Q${p[0].toFixed(1)},${p[1].toFixed(1)} ${((p[0] + q[0]) / 2).toFixed(1)},${((p[1] + q[1]) / 2).toFixed(1)}`;
  }
  return `${d}Z`;
}

// ---------------------------------------------------------------------------
// Paint pots

let potN = 0;

export function potSVG(c: PaintId): string {
  const id = `pot${++potN}`;
  const fill = c === 'rainbow' ? `url(#${id})` : PAINT[c].hex;
  const top = c === 'rainbow' ? `url(#${id})` : mix(PAINT[c].hex, '#ffffff', 0.25);
  return `<svg viewBox="-50 -56 100 106" aria-hidden="true">
    <defs>${rainbowDef(id)}</defs>
    <path d="M-36,-16 L36,-16 L30,38 C29,46 -29,46 -30,38 Z" fill="#fff" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M-34,-4 L34,-4 L30,36 C29,42 -29,42 -30,36 Z" fill="${fill}"/>
    <path d="M-36,-16 L36,-16 L30,38 C29,46 -29,46 -30,38 Z" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <ellipse cx="0" cy="-16" rx="38" ry="12" fill="${top}" stroke="${INK}" stroke-width="5"/>
    <path d="M18,-10 C22,0 20,10 24,14 C28,18 32,8 30,-6 Z" fill="${fill}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M-24,4 L-22,30" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".6"/>
    <path d="M-18,-22 Q-4,-28 12,-24" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".7"/>
  </svg>`;
}

// ---------------------------------------------------------------------------
// Dot the paint-splodge puppy

export function puppySVG(): string {
  const fur = '#fff6e8';
  const ear = '#c9936c';
  return `<svg class="puppy" viewBox="-70 -104 140 170" aria-hidden="true">
    <path class="d-tail" d="M26,46 C48,44 56,24 50,8" stroke="${INK}" stroke-width="11" fill="none" stroke-linecap="round"/>
    <path class="d-tail" d="M26,46 C48,44 56,24 50,8" stroke="${fur}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <ellipse cx="-15" cy="60" rx="14" ry="8" fill="${fur}" stroke="${INK}" stroke-width="3.5"/>
    <ellipse cx="15" cy="60" rx="14" ry="8" fill="${fur}" stroke="${INK}" stroke-width="3.5"/>
    <path d="M-32,58 C-36,22 -22,2 0,2 C22,2 36,22 32,58 Z" fill="${fur}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    <circle cx="-13" cy="34" r="8" fill="#ff9fcc"/><circle cx="15" cy="22" r="6" fill="#74bdfa"/><circle cx="8" cy="46" r="5" fill="#86d07a"/>
    <g class="d-brush">
      <path d="M26,34 L52,-4" stroke="#c98f6a" stroke-width="7" stroke-linecap="round"/>
      <path d="M26,34 L52,-4" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity=".4"/>
      <path d="M48,-2 C50,-14 58,-20 64,-18 C66,-10 62,-2 54,2 Z" fill="#ff6b6b" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="28" cy="32" rx="8" ry="10" fill="${fur}" stroke="${INK}" stroke-width="3" transform="rotate(-30 28 32)"/>
    </g>
    <ellipse cx="0" cy="-26" rx="35" ry="31" fill="${fur}" stroke="${INK}" stroke-width="3.5"/>
    <circle cx="16" cy="-40" r="7" fill="#ffe066"/>
    <g class="d-ear-l"><ellipse cx="-33" cy="-24" rx="12" ry="25" fill="${ear}" stroke="${INK}" stroke-width="3.5" transform="rotate(16 -33 -24)"/></g>
    <g class="d-ear-r"><ellipse cx="33" cy="-24" rx="12" ry="25" fill="${ear}" stroke="${INK}" stroke-width="3.5" transform="rotate(-16 33 -24)"/></g>
    <g class="d-eyes"><ellipse cx="-12" cy="-30" rx="5.5" ry="6.5" fill="#2a1836"/><ellipse cx="12" cy="-30" rx="5.5" ry="6.5" fill="#2a1836"/>
      <circle cx="-10.5" cy="-32" r="2" fill="#fff"/><circle cx="13.5" cy="-32" r="2" fill="#fff"/></g>
    <circle cx="-21" cy="-16" r="5" fill="#ff8fb1" opacity=".5"/><circle cx="21" cy="-16" r="5" fill="#ff8fb1" opacity=".5"/>
    <ellipse cx="0" cy="-17" rx="7.5" ry="5.5" fill="#2a1836"/>
    <path d="M-4,-9 Q0,4 4,-9 Z" fill="#ff8595" stroke="${INK}" stroke-width="2"/>
    <path d="M-8,-11 Q-4,-6 0,-11 Q4,-6 8,-11" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <g class="d-beret" transform="rotate(-12 0 -54)">
      <path d="M-30,-50 C-32,-70 30,-72 30,-52 C20,-46 -20,-45 -30,-50 Z" fill="#ff6b6b" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M0,-66 L2,-76" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    </g>
  </svg>`;
}

// ---------------------------------------------------------------------------
// Gallery decorations

const G = `stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"`;
const FLAGS = ['#ff9fcc', '#ffe066', '#74bdfa', '#86d07a', '#ffae5c', '#b995f2'];

export function buntingSVG(): string {
  let flags = '';
  for (let i = 0; i < 12; i++) {
    const x = 10 + i * 50;
    flags += `<g class="flag" style="animation-delay:${-i * 0.3}s;transform-origin:${x + 20}px 22px"><path d="M${x},${20 + Math.sin(i / 1.9) * 4} L${x + 40},${20 + Math.sin((i + 1) / 1.9) * 4} L${x + 20},64 Z" fill="${FLAGS[i % FLAGS.length]}" ${G}/></g>`;
  }
  return `<svg viewBox="0 0 620 70" preserveAspectRatio="none" aria-hidden="true"><path d="M0,16 Q310,34 620,16" stroke="${INK}" stroke-width="4" fill="none"/>${flags}</svg>`;
}

export function lightsSVG(): string {
  let bulbs = '';
  for (let i = 0; i < 16; i++) {
    const x = 18 + i * 38;
    const y = 14 + Math.sin((i / 15) * Math.PI) * 18;
    bulbs += `<g class="bulb" style="animation-delay:${(i % 4) * 0.4}s"><circle cx="${x}" cy="${y + 12}" r="11" fill="${FLAGS[i % FLAGS.length]}" opacity=".45"/><rect x="${x - 4}" y="${y - 2}" width="8" height="7" rx="2" fill="${INK}"/><ellipse cx="${x}" cy="${y + 12}" rx="6" ry="8" fill="${FLAGS[i % FLAGS.length]}" stroke="${INK}" stroke-width="2.5"/></g>`;
  }
  return `<svg viewBox="0 0 620 50" preserveAspectRatio="none" aria-hidden="true"><path d="M0,10 Q310,50 620,10" stroke="${INK}" stroke-width="3" fill="none"/>${bulbs}</svg>`;
}

export function easelSVG(): string {
  return `<svg viewBox="0 0 200 260" aria-hidden="true">
    <path d="M100,10 L40,250 M100,10 L160,250 M100,10 L100,240" stroke="#b27a52" stroke-width="12" stroke-linecap="round"/>
    <path d="M100,10 L40,250 M100,10 L160,250 M100,10 L100,240" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity=".35"/>
    <rect x="30" y="178" width="140" height="14" rx="6" fill="#c98f6a" ${G}/>
    <g transform="translate(150,210)"><ellipse rx="26" ry="16" fill="#fff4e0" ${G}/><circle cx="-12" cy="-3" r="5" fill="#ff6b6b"/><circle cx="2" cy="-7" r="5" fill="#74bdfa"/><circle cx="14" cy="0" r="5" fill="#ffe066"/><circle cx="-2" cy="6" r="4" fill="#86d07a"/></g>
  </svg>`;
}

export function rugSVG(): string {
  return `<svg viewBox="-110 -40 220 80" aria-hidden="true">
    <path d="${splatPath(7, 100, 12)}" transform="scale(1,.36)" fill="#ffd1e3" ${G}/>
    <path d="${splatPath(3, 70, 10)}" transform="scale(1,.36)" fill="#fff0a8" stroke="none"/>
    <path d="${splatPath(5, 36, 8)}" transform="scale(1,.36)" fill="#a8d8ff" stroke="none"/>
  </svg>`;
}

export function rainbowSVG(): string {
  const cols = ['#ff6b6b', '#ffae5c', '#ffe066', '#86d07a', '#74bdfa', '#b995f2'];
  const arcs = cols
    .map((c, i) => {
      const r = 190 - i * 22;
      return `<path d="M${200 - r},210 A${r},${r} 0 0 1 ${200 + r},210" stroke="${c}" stroke-width="23" fill="none"/>`;
    })
    .join('');
  return `<svg viewBox="0 0 400 220" aria-hidden="true">${arcs}</svg>`;
}

export function balloonsSVG(): string {
  const b = (x: number, y: number, c: string, rot: number, delay: number) =>
    `<g class="balloon" style="animation-delay:${delay}s;transform-origin:${x}px 200px">
      <path d="M${x},${y + 34} C${x - 6},${y + 80} ${x + 8},${y + 120} ${x - 2},200" stroke="${INK}" stroke-width="2.5" fill="none"/>
      <g transform="rotate(${rot} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="28" ry="34" fill="${c}" ${G}/>
      <path d="M${x - 5},${y + 33} L${x + 5},${y + 33} L${x},${y + 40} Z" fill="${c}" ${G}/>
      <ellipse cx="${x - 10}" cy="${y - 12}" rx="6" ry="10" fill="#fff" opacity=".55"/></g>
    </g>`;
  return `<svg viewBox="0 0 140 210" aria-hidden="true">${b(40, 60, '#ff9fcc', -8, 0)}${b(100, 46, '#74bdfa', 8, -1.2)}${b(70, 90, '#ffe066', 0, -2.1)}</svg>`;
}

// ---------------------------------------------------------------------------
// Icons

export const ICONS = {
  play: `<svg viewBox="-50 -50 100 100"><path d="M-14,-26 L28,0 L-14,26 Z" fill="#fff" stroke="#fff" stroke-width="10" stroke-linejoin="round"/></svg>`,
  home: `<svg viewBox="-50 -50 100 100"><path d="M-28,-2 L0,-28 L28,-2 L28,28 L-28,28 Z" fill="#fff" stroke="#fff" stroke-width="8" stroke-linejoin="round"/><rect x="-8" y="8" width="16" height="22" rx="3" fill="currentColor"/></svg>`,
  gallery: `<svg viewBox="-50 -50 100 100"><rect x="-34" y="-28" width="68" height="56" rx="6" fill="#fff" stroke="#fff" stroke-width="6"/><path d="M-26,20 L-8,-2 L4,10 L14,0 L28,20 Z" fill="currentColor"/><circle cx="16" cy="-14" r="7" fill="currentColor"/></svg>`,
  more: `<svg viewBox="-50 -50 100 100"><path d="M-22,0 L20,0 M4,-18 L22,0 L4,18" stroke="#fff" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  magic: `<svg viewBox="-50 -50 100 100"><path d="${starPath(34, 0.46)}" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><circle cx="30" cy="-30" r="5" fill="#fff"/><circle cx="-32" cy="28" r="4" fill="#fff"/></svg>`,
  soundOn: `<svg viewBox="-50 -50 100 100"><path d="M-30,-12 L-16,-12 L2,-28 L2,28 L-16,12 L-30,12 Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><path d="M14,-14 Q24,0 14,14 M22,-24 Q38,0 22,24" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/></svg>`,
  soundOff: `<svg viewBox="-50 -50 100 100"><path d="M-30,-12 L-16,-12 L2,-28 L2,28 L-16,12 L-30,12 Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><path d="M14,-12 L34,12 M34,-12 L14,12" stroke="#fff" stroke-width="7" stroke-linecap="round"/></svg>`,
  musicOn: `<svg viewBox="-50 -50 100 100"><path d="M-10,20 L-10,-24 L24,-32 L24,12" stroke="#fff" stroke-width="7" fill="none" stroke-linejoin="round"/><ellipse cx="-18" cy="22" rx="10" ry="8" fill="#fff"/><ellipse cx="16" cy="14" rx="10" ry="8" fill="#fff"/></svg>`,
  musicOff: `<svg viewBox="-50 -50 100 100"><g opacity=".55"><path d="M-10,20 L-10,-24 L24,-32 L24,12" stroke="#fff" stroke-width="7" fill="none" stroke-linejoin="round"/><ellipse cx="-18" cy="22" rx="10" ry="8" fill="#fff"/><ellipse cx="16" cy="14" rx="10" ry="8" fill="#fff"/></g><path d="M-30,-30 L30,30" stroke="#fff" stroke-width="8" stroke-linecap="round"/></svg>`,
  close: `<svg viewBox="-50 -50 100 100"><path d="M-20,-20 L20,20 M20,-20 L-20,20" stroke="#fff" stroke-width="10" stroke-linecap="round"/></svg>`,
  gear: `<svg viewBox="-50 -50 100 100"><g fill="currentColor">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="-7" y="-40" width="14" height="18" rx="4" transform="rotate(${a})"/>`).join('')}<circle r="27"/></g><circle r="10" fill="#fff"/></svg>`,
};

export function sparkleSVG(color = '#fff6a8'): string {
  return `<svg viewBox="-20 -20 40 40"><path d="${starPath(18, 0.32, 4)}" fill="${color}"/></svg>`;
}
