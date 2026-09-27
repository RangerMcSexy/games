// All the art is drawn here as SVG in code: the letters (drawn the way
// they're written, stroke by stroke), the houses, the twelve letter friends,
// Pip the postie penguin, parcels and the button icons.
import type { Friend } from './data';

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

// ---------------------------------------------------------------------------
// Letters, lower case, one path per pen stroke in the order they're written.
// They share a baseline (y = 82) and x-height (y = 40), so every letter
// sits the same way on a door or a parcel.

export const LETTER_BOX = '10 4 80 104';

export const STROKES: Record<string, string[]> = {
  s: ['M64,47 C60,41 55,39 48,39 C39,39 34,44 34,50 C34,58 43,59 50,61 C58,63 66,66 66,72 C66,79 59,82 50,82 C42,82 36,79 33,74'],
  a: ['M66,50 C62,43 56,40 50,40 C39,40 32,50 32,61 C32,73 40,82 50,82 C58,82 63,77 66,70', 'M67,40 L67,82'],
  t: ['M46,14 L46,72 C46,79 50,82 56,82 C60,82 63,80 65,78', 'M32,40 L62,40'],
  m: ['M24,40 L24,82', 'M24,54 C26,44 32,40 38,40 C45,40 49,45 49,53 L49,82', 'M49,53 C51,44 56,40 63,40 C70,40 76,45 76,53 L76,82'],
  p: ['M34,40 L34,104', 'M34,50 C38,43 44,40 51,40 C61,40 68,49 68,61 C68,73 61,82 51,82 C44,82 38,79 34,72'],
  o: ['M50,40 C39,40 31,49 31,61 C31,73 39,82 50,82 C61,82 69,73 69,61 C69,49 61,40 50,40'],
  c: ['M66,48 C62,43 57,40 50,40 C39,40 32,50 32,61 C32,73 39,82 50,82 C57,82 62,79 66,74'],
  h: ['M34,12 L34,82', 'M34,56 C36,46 43,40 51,40 C60,40 66,46 66,55 L66,82'],
  d: ['M66,50 C62,43 56,40 50,40 C39,40 32,50 32,61 C32,73 40,82 50,82 C58,82 63,77 66,70', 'M67,12 L67,82'],
  f: ['M64,18 C61,14 57,12 53,12 C46,12 42,17 42,25 L42,82', 'M30,42 L58,42'],
  e: ['M32,61 L68,61 C68,49 60,40 50,40 C39,40 32,50 32,61 C32,73 40,82 51,82 C58,82 63,79 66,75'],
  b: ['M34,12 L34,82', 'M34,50 C38,43 44,40 51,40 C61,40 68,49 68,61 C68,73 61,82 51,82 C44,82 38,79 34,72'],
};

export function letterSVG(letter: string, colour = INK, width = 11): string {
  const paths = (STROKES[letter] ?? []).map((d) => `<path d="${d}"/>`).join('');
  return `<svg class="letter" viewBox="${LETTER_BOX}" aria-hidden="true"><g fill="none" stroke="${colour}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`;
}

/** A question mark, on the door of a house nobody has moved into yet. */
export function mysterySVG(colour = '#b3a6cc'): string {
  return `<svg class="letter" viewBox="${LETTER_BOX}" aria-hidden="true"><g fill="none" stroke="${colour}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">
    <path d="M34,32 C34,20 42,14 51,14 C60,14 67,20 67,29 C67,40 52,43 51,56 L51,62"/></g><circle cx="51" cy="80" r="7" fill="${colour}"/></svg>`;
}

// ---------------------------------------------------------------------------
// A house (200 × 250). The door is left to the page, laid over the doorway
// (see HOUSE_DOOR), so it can open and someone can come out.

export const HOUSE_W = 200;
export const HOUSE_H = 250;
/** The doorway, in house units: x, y, width, height. */
export const HOUSE_DOOR = { x: 54, y: 112, w: 92, h: 134 };

export interface HouseLook {
  wall: string;
  roof: string;
}

export function houseSVG(look: HouseLook): string {
  const { x, y, w, h } = HOUSE_DOOR;
  return `<svg class="house-art" viewBox="0 0 ${HOUSE_W} ${HOUSE_H}" aria-hidden="true">
    <rect x="138" y="22" width="24" height="52" rx="3" fill="#e0876a" ${S}/>
    <rect x="134" y="16" width="32" height="10" rx="3" fill="#c96a50" ${S}/>
    <rect x="14" y="92" width="172" height="154" rx="6" fill="${look.wall}" ${S}/>
    <path d="M14,110 L186,110" stroke="${INK}" stroke-width="2" opacity=".12"/>
    <path d="M-2,100 L100,14 L202,100 Z" fill="${look.roof}" ${S}/>
    <path d="M24,92 L100,28 L176,92" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".3"/>
    <circle cx="100" cy="68" r="15" fill="#fff8d8" ${S}/>
    <path d="M100,54 L100,82 M86,68 L114,68" stroke="${INK}" stroke-width="2.5"/>
    <g>
      <rect x="22" y="128" width="26" height="34" rx="4" fill="#bfe6ff" ${S}/>
      <path d="M35,128 L35,162 M22,145 L48,145" stroke="${INK}" stroke-width="2.5"/>
      <rect x="152" y="128" width="26" height="34" rx="4" fill="#bfe6ff" ${S}/>
      <path d="M165,128 L165,162 M152,145 L178,145" stroke="${INK}" stroke-width="2.5"/>
    </g>
    <path d="M${x - 4},${y + h} L${x - 4},${y + 40} C${x - 4},${y - 8} ${x + w + 4},${y - 8} ${x + w + 4},${y + 40} L${x + w + 4},${y + h} Z" fill="#fff4e0" ${S}/>
    <rect x="${x - 10}" y="${y + h - 2}" width="${w + 20}" height="8" rx="3" fill="#d8cbe0" ${S} stroke-width="3"/>
    <g transform="translate(30,238)"><circle r="12" fill="#6fcf6a" ${S} stroke-width="3"/><circle cx="-4" cy="-3" r="3" fill="#ff8fc4"/><circle cx="5" cy="2" r="3" fill="#ffd84a"/></g>
    <g transform="translate(170,238)"><circle r="12" fill="#6fcf6a" ${S} stroke-width="3"/><circle cx="4" cy="-3" r="3" fill="#ff8fc4"/><circle cx="-4" cy="3" r="3" fill="#fff"/></g>
  </svg>`;
}

// ---------------------------------------------------------------------------
// The letter friends: a head and shoulders, to peek out of a door
// (viewBox -60 -64 120 134; the bottom edge is the doorstep).

export const FRIEND_BOX = '-60 -64 120 134';

function eyes(y = -4, dx = 15, r = 5.5): string {
  return `<g class="f-eyes"><ellipse cx="${-dx}" cy="${y}" rx="${r}" ry="${r * 1.15}" fill="${INK}"/><ellipse cx="${dx}" cy="${y}" rx="${r}" ry="${r * 1.15}" fill="${INK}"/>
    <circle cx="${-dx + 1.8}" cy="${y - 2.2}" r="${r * 0.36}" fill="#fff"/><circle cx="${dx + 1.8}" cy="${y - 2.2}" r="${r * 0.36}" fill="#fff"/></g>`;
}
function cheeks(y = 10, dx = 26, colour = '#ff8fb1'): string {
  return `<circle cx="${-dx}" cy="${y}" r="6" fill="${colour}" opacity=".55"/><circle cx="${dx}" cy="${y}" r="6" fill="${colour}" opacity=".55"/>`;
}
function smile(y = 16, w = 8): string {
  return `<path d="M${-w},${y} Q0,${y + w * 0.9} ${w},${y}" fill="none" ${S} stroke-width="3"/>`;
}
function shoulders(fill: string, extra = ''): string {
  return `<path d="M-46,72 C-46,44 -30,30 0,30 C30,30 46,44 46,72 Z" fill="${fill}" ${S}/>${extra}`;
}
function whiskers(y = 14): string {
  return `<path d="M-14,${y} L-38,${y - 5} M-14,${y + 5} L-38,${y + 8} M14,${y} L38,${y - 5} M14,${y + 5} L38,${y + 8}" ${S} stroke-width="2.2" opacity=".7"/>`;
}

const ANIMALS: Record<string, () => string> = {
  snake: () => `
    <path d="M-26,74 C-30,46 30,50 22,20" fill="none" stroke="${INK}" stroke-width="36" stroke-linecap="round"/>
    <path d="M-26,74 C-30,46 30,50 22,20" fill="none" stroke="#7fd35b" stroke-width="29" stroke-linecap="round"/>
    <circle cx="-16" cy="56" r="4" fill="#ffd84a"/><circle cx="8" cy="46" r="4.5" fill="#ffd84a"/><circle cx="-4" cy="66" r="3.5" fill="#ffd84a"/>
    <ellipse cx="4" cy="-4" rx="42" ry="32" fill="#7fd35b" ${S}/>
    <path d="M4,26 L4,40 M4,40 L-3,47 M4,40 L11,47" stroke="#ff5d6c" stroke-width="3.5" stroke-linecap="round" fill="none"/>
    ${eyes(-10, 16, 6)}${cheeks(6, 28)}${smile(12, 12)}`,
  ant: () => `
    ${shoulders('#e8604f')}
    <path d="M-40,48 L-56,38 M40,48 L56,38" ${S} stroke-width="4"/>
    <path d="M-12,-30 C-18,-46 -26,-52 -34,-56 M12,-30 C18,-46 26,-52 34,-56" fill="none" ${S} stroke-width="4"/>
    <circle cx="-34" cy="-56" r="6" fill="#e8604f" ${S} stroke-width="3"/><circle cx="34" cy="-56" r="6" fill="#e8604f" ${S} stroke-width="3"/>
    <circle cx="0" cy="0" r="36" fill="#e8604f" ${S}/>
    <ellipse cx="-12" cy="-18" rx="10" ry="6" fill="#fff" opacity=".35" transform="rotate(-30 -12 -18)"/>
    ${eyes(-4, 14, 6.5)}${cheeks(10, 24, '#ffb3c0')}${smile(16, 9)}`,
  tiger: () => `
    ${shoulders('#ffa24a', `<path d="M-30,44 L-22,56 M30,44 L22,56 M0,34 L0,48" ${S} stroke-width="4"/><ellipse cx="0" cy="58" rx="16" ry="12" fill="#fff4e0"/>`)}
    <circle cx="-30" cy="-30" r="13" fill="#ffa24a" ${S}/><circle cx="30" cy="-30" r="13" fill="#ffa24a" ${S}/>
    <circle cx="-30" cy="-30" r="6" fill="#ffd0a6"/><circle cx="30" cy="-30" r="6" fill="#ffd0a6"/>
    <ellipse cx="0" cy="0" rx="44" ry="38" fill="#ffa24a" ${S}/>
    <path d="M0,-38 L0,-26 M-12,-36 L-9,-24 M12,-36 L9,-24 M-44,-4 L-32,-2 M-44,8 L-32,6 M44,-4 L32,-2 M44,8 L32,6" ${S} stroke-width="4"/>
    <ellipse cx="0" cy="16" rx="22" ry="15" fill="#fff4e0"/>
    ${eyes(-6, 16)}<path d="M-6,8 L6,8 L0,15 Z" fill="#ff7a9a" ${S} stroke-width="2.5"/>
    <path d="M0,15 L0,20 M-8,22 Q-4,26 0,20 Q4,26 8,22" fill="none" ${S} stroke-width="2.5"/>`,
  mouse: () => `
    ${shoulders('#c3bcd3', '<ellipse cx="0" cy="58" rx="18" ry="13" fill="#ece8f4"/>')}
    <circle cx="-32" cy="-28" r="22" fill="#c3bcd3" ${S}/><circle cx="32" cy="-28" r="22" fill="#c3bcd3" ${S}/>
    <circle cx="-32" cy="-28" r="13" fill="#ffb3cf"/><circle cx="32" cy="-28" r="13" fill="#ffb3cf"/>
    <ellipse cx="0" cy="2" rx="34" ry="32" fill="#c3bcd3" ${S}/>
    ${eyes(-4, 13)}${cheeks(12, 22)}${whiskers(16)}
    <circle cx="0" cy="13" r="5.5" fill="#ff7a9a" ${S} stroke-width="2.5"/>${smile(21, 6)}`,
  pig: () => `
    ${shoulders('#ffb3c7')}
    <path d="M-34,-18 L-38,-46 L-14,-32 Z M34,-18 L38,-46 L14,-32 Z" fill="#ff94b0" ${S}/>
    <circle cx="0" cy="0" r="38" fill="#ffb3c7" ${S}/>
    ${eyes(-10, 15)}${cheeks(8, 28, '#ff7a9a')}
    <ellipse cx="0" cy="12" rx="17" ry="12" fill="#ff94b0" ${S}/>
    <ellipse cx="-6" cy="12" rx="3" ry="4.5" fill="${INK}"/><ellipse cx="6" cy="12" rx="3" ry="4.5" fill="${INK}"/>
    ${smile(28, 8)}`,
  octopus: () => `
    <g fill="none" stroke-linecap="round">
      ${[-34, -12, 12, 34].map((x) => `<path d="M${x * 0.7},24 C${x},44 ${x * 1.3 - 8},54 ${x * 1.3},70" stroke="${INK}" stroke-width="19"/>`).join('')}
      ${[-34, -12, 12, 34].map((x) => `<path d="M${x * 0.7},24 C${x},44 ${x * 1.3 - 8},54 ${x * 1.3},70" stroke="#b184f5" stroke-width="12.5"/>`).join('')}
    </g>
    <path d="M-40,20 C-46,-20 -30,-48 0,-48 C30,-48 46,-20 40,20 C28,32 -28,32 -40,20 Z" fill="#b184f5" ${S}/>
    <circle cx="-22" cy="-30" r="5" fill="#d9c2ff"/><circle cx="18" cy="-36" r="4" fill="#d9c2ff"/><circle cx="28" cy="-22" r="3" fill="#d9c2ff"/>
    ${eyes(-2, 15, 6.5)}${cheeks(12, 26)}${smile(16, 8)}`,
  cat: () => `
    ${shoulders('#ffc36b', '<ellipse cx="0" cy="58" rx="16" ry="12" fill="#fff4e0"/>')}
    <path d="M-38,-12 L-34,-50 L-10,-32 Z M38,-12 L34,-50 L10,-32 Z" fill="#ffc36b" ${S}/>
    <path d="M-32,-22 L-31,-40 L-20,-31 Z M32,-22 L31,-40 L20,-31 Z" fill="#ffb3cf"/>
    <ellipse cx="0" cy="2" rx="40" ry="34" fill="#ffc36b" ${S}/>
    <path d="M-10,-32 L-8,-22 M0,-34 L0,-24 M10,-32 L8,-22" ${S} stroke-width="3.5" stroke="#e8972e"/>
    ${eyes(-4, 15)}${cheeks(12, 26)}${whiskers(14)}
    <path d="M-5,8 L5,8 L0,14 Z" fill="#ff7a9a" ${S} stroke-width="2.5"/>
    <path d="M0,14 L0,18 M-8,20 Q-4,24 0,18 Q4,24 8,20" fill="none" ${S} stroke-width="2.5"/>`,
  hen: () => `
    ${shoulders('#ffffff', `<path d="M-40,60 C-30,50 -20,54 -14,62" fill="none" ${S} stroke-width="3"/><path d="M40,60 C30,50 20,54 14,62" fill="none" ${S} stroke-width="3"/>`)}
    <path d="M-16,-30 C-22,-50 -6,-54 -4,-40 C-2,-58 16,-56 10,-38 C22,-50 32,-38 16,-28 Z" fill="#ff5d6c" ${S}/>
    <ellipse cx="0" cy="0" rx="34" ry="36" fill="#ffffff" ${S}/>
    ${eyes(-8, 14)}${cheeks(6, 22)}
    <path d="M-10,4 L10,4 L0,20 Z" fill="#ffae3c" ${S} stroke-width="3"/>
    <path d="M-5,20 C-8,32 6,32 3,20" fill="#ff5d6c" ${S} stroke-width="2.5"/>`,
  dog: () => `
    ${shoulders('#e0ae78', `<path d="M-20,34 L0,46 L20,34" fill="none" stroke="#ff5d6c" stroke-width="7" stroke-linecap="round"/><circle cx="0" cy="50" r="6" fill="#ffd84a" ${S} stroke-width="2.5"/>`)}
    <circle cx="0" cy="0" r="37" fill="#e0ae78" ${S}/>
    <path d="M-30,-26 C-50,-24 -54,6 -42,20 C-34,14 -30,-6 -24,-18 Z M30,-26 C50,-24 54,6 42,20 C34,14 30,-6 24,-18 Z" fill="#a8703f" ${S}/>
    <ellipse cx="14" cy="-12" rx="13" ry="11" fill="#fff4e0" opacity=".85"/>
    ${eyes(-10, 14)}
    <ellipse cx="0" cy="14" rx="18" ry="13" fill="#fff4e0" ${S} stroke-width="2.5"/>
    <ellipse cx="0" cy="8" rx="7" ry="5" fill="${INK}"/>
    <path d="M-7,18 Q0,24 7,18" fill="none" ${S} stroke-width="2.5"/><path d="M-4,21 C-4,30 4,30 4,21" fill="#ff7a9a" ${S} stroke-width="2"/>`,
  fox: () => `
    ${shoulders('#ff8a3d', '<path d="M-18,34 C-10,50 10,50 18,34 C10,30 -10,30 -18,34 Z" fill="#fff"/>')}
    <path d="M-38,-8 L-34,-52 L-8,-30 Z M38,-8 L34,-52 L8,-30 Z" fill="#ff8a3d" ${S}/>
    <path d="M-35,-38 L-34,-52 L-24,-44 Z M35,-38 L34,-52 L24,-44 Z" fill="${INK}"/>
    <path d="M-44,0 C-44,-24 -24,-36 0,-36 C24,-36 44,-24 44,0 C44,14 24,34 0,36 C-24,34 -44,14 -44,0 Z" fill="#ff8a3d" ${S}/>
    <path d="M-42,4 C-30,6 -14,14 0,34 C-20,32 -38,18 -42,4 Z M42,4 C30,6 14,14 0,34 C20,32 38,18 42,4 Z" fill="#fff"/>
    ${eyes(-8, 15)}
    <ellipse cx="0" cy="22" rx="6" ry="4.5" fill="${INK}"/>`,
  elephant: () => `
    ${shoulders('#aebdd6')}
    <ellipse cx="-40" cy="-4" rx="24" ry="30" fill="#aebdd6" ${S}/><ellipse cx="40" cy="-4" rx="24" ry="30" fill="#aebdd6" ${S}/>
    <ellipse cx="-40" cy="-4" rx="14" ry="19" fill="#ffc2d6"/><ellipse cx="40" cy="-4" rx="14" ry="19" fill="#ffc2d6"/>
    <circle cx="0" cy="-4" r="32" fill="#aebdd6" ${S}/>
    <path d="M-10,8 C-12,30 -4,48 12,50 C18,50 20,44 16,42 C6,42 8,26 10,8 Z" fill="#aebdd6" ${S}/>
    <path d="M-6,20 L6,20 M-5,30 L8,30" ${S} stroke-width="2" opacity=".4"/>
    ${eyes(-10, 13)}${cheeks(4, 22)}`,
  bear: () => `
    ${shoulders('#b8825a', '<ellipse cx="0" cy="58" rx="18" ry="13" fill="#e6c49e"/>')}
    <circle cx="-30" cy="-30" r="15" fill="#b8825a" ${S}/><circle cx="30" cy="-30" r="15" fill="#b8825a" ${S}/>
    <circle cx="-30" cy="-30" r="7.5" fill="#e6c49e"/><circle cx="30" cy="-30" r="7.5" fill="#e6c49e"/>
    <circle cx="0" cy="0" r="38" fill="#b8825a" ${S}/>
    ${eyes(-8, 15)}${cheeks(10, 27)}
    <ellipse cx="0" cy="15" rx="18" ry="13" fill="#e6c49e" ${S} stroke-width="2.5"/>
    <ellipse cx="0" cy="9" rx="7" ry="5" fill="${INK}"/>${smile(18, 7)}`,
};

export function friendSVG(f: Friend | string): string {
  const id = typeof f === 'string' ? f : f.animal;
  return `<svg class="friend-art" viewBox="${FRIEND_BOX}" aria-hidden="true">${ANIMALS[id]?.() ?? ''}</svg>`;
}

// ---------------------------------------------------------------------------
// Pip the postie penguin, standing, with her cap and postbag
// (viewBox -70 -112 140 186; her feet are at y = 70).

export const PIP_BOX = '-70 -112 140 186';

export function pipSVG(): string {
  const navy = '#34406b';
  return `<svg class="pip-art" viewBox="${PIP_BOX}" aria-hidden="true">
    <ellipse cx="-16" cy="66" rx="16" ry="8" fill="#ffa53a" ${S}/><ellipse cx="16" cy="66" rx="16" ry="8" fill="#ffa53a" ${S}/>
    <g class="pip-wing-l"><path d="M-36,-2 C-60,6 -64,32 -56,42 C-44,36 -36,18 -36,-2 Z" fill="${navy}" ${S}/></g>
    <ellipse cx="0" cy="18" rx="42" ry="48" fill="${navy}" ${S}/>
    <ellipse cx="0" cy="26" rx="28" ry="36" fill="#fff"/>
    <path d="M-34,-18 L40,40" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>
    <path d="M-34,-18 L40,40" stroke="#ff5d6c" stroke-width="7" stroke-linecap="round"/>
    <g class="pip-bag">
      <rect x="14" y="20" width="46" height="40" rx="8" fill="#ff5d6c" ${S}/>
      <path d="M14,30 C14,22 18,20 24,20 L50,20 C56,20 60,22 60,30 L60,38 L14,38 Z" fill="#ff7a86" ${S}/>
      <rect x="27" y="44" width="20" height="12" rx="2" fill="#fff" ${S} stroke-width="2.5"/>
      <path d="M27,44 L37,51 L47,44" fill="none" ${S} stroke-width="2.5"/>
    </g>
    <circle cx="0" cy="-44" r="34" fill="${navy}" ${S}/>
    <path d="M-24,-40 C-24,-58 -4,-60 0,-50 C4,-60 24,-58 24,-40 C24,-22 12,-14 0,-14 C-12,-14 -24,-22 -24,-40 Z" fill="#fff"/>
    <g class="pip-eyes"><ellipse cx="-10" cy="-41" rx="4.8" ry="6" fill="#1f2340"/><ellipse cx="10" cy="-41" rx="4.8" ry="6" fill="#1f2340"/>
      <circle cx="-8.4" cy="-43.2" r="1.9" fill="#fff"/><circle cx="11.6" cy="-43.2" r="1.9" fill="#fff"/></g>
    <circle cx="-17" cy="-28" r="5" fill="#ff8fb1" opacity=".6"/><circle cx="17" cy="-28" r="5" fill="#ff8fb1" opacity=".6"/>
    <path d="M-8,-31 L8,-31 L0,-20 Z" fill="#ffa53a" ${S} stroke-width="2.5"/>
    <path d="M-32,-66 C-32,-98 32,-98 32,-66 Z" fill="#4e7fd9" ${S}/>
    <path d="M-36,-68 C-18,-60 18,-60 44,-70 C46,-62 40,-56 30,-56 C10,-54 -20,-56 -36,-60 Z" fill="#2b3a66" ${S}/>
    <rect x="-8" y="-86" width="16" height="12" rx="3" fill="#ffd84a" ${S} stroke-width="2.5"/>
    <g class="pip-wing-r"><path d="M36,-2 C58,-4 66,18 58,30 C48,26 38,12 36,-2 Z" fill="${navy}" ${S}/></g>
  </svg>`;
}

// ---------------------------------------------------------------------------
// A parcel (200 × 170), with room on its label for a letter or a picture.

export const PARCEL_BOX = '-100 -86 200 176';

export function parcelSVG(gift = false): string {
  const paper = gift ? '#ff94c8' : '#d9a066';
  const shade = gift ? '#ff7ab0' : '#c48a50';
  const string = gift ? '#ffd84a' : '#fff4e0';
  return `<svg class="parcel-art" viewBox="${PARCEL_BOX}" aria-hidden="true">
    <rect x="-86" y="-58" width="172" height="140" rx="12" fill="${paper}" ${S}/>
    <path d="M-86,-30 L86,-30" stroke="${shade}" stroke-width="3" opacity=".6"/>
    <path d="M-86,${gift ? 12 : 60} L86,${gift ? 12 : 60}" stroke="${string}" stroke-width="10"/>
    <path d="M0,-58 L0,82" stroke="${string}" stroke-width="10"/>
    <path d="M0,-58 C-18,-86 -46,-78 -34,-60 C-28,-52 -12,-56 0,-58 Z M0,-58 C18,-86 46,-78 34,-60 C28,-52 12,-56 0,-58 Z" fill="${string}" ${S} stroke-width="3"/>
    <circle cx="0" cy="-58" r="7" fill="${string}" ${S} stroke-width="3"/>
    ${gift ? `<g fill="#fff" opacity=".85"><path d="${starPath(10)}" transform="translate(-52,-12)"/><path d="${starPath(8)}" transform="translate(50,40)"/><path d="${starPath(7)}" transform="translate(-44,54)"/><path d="${starPath(9)}" transform="translate(52,-18)"/></g>` : ''}
  </svg>`;
}

// ---------------------------------------------------------------------------
// Things around the street

export function cloudSVG(): string {
  return `<svg viewBox="0 0 160 70" aria-hidden="true"><path d="M20,62 C2,62 2,38 22,36 C22,14 52,8 64,24 C72,4 110,4 114,28 C138,22 156,40 144,56 C142,62 136,62 130,62 Z" fill="#fff"/></svg>`;
}

export function postboxSVG(): string {
  return `<svg viewBox="-40 -80 80 150" aria-hidden="true">
    <rect x="-8" y="30" width="16" height="36" fill="#d94a4a" ${S}/>
    <path d="M-30,34 L-30,-40 C-30,-76 30,-76 30,-40 L30,34 Z" fill="#ff5d5d" ${S}/>
    <path d="M-34,-42 L34,-42" ${S} stroke-width="5"/>
    <rect x="-18" y="-30" width="36" height="8" rx="4" fill="${INK}"/>
    <rect x="-14" y="0" width="28" height="18" rx="3" fill="#fff4e0" ${S} stroke-width="2.5"/>
    <rect x="-34" y="30" width="68" height="8" rx="3" fill="#d94a4a" ${S} stroke-width="3"/>
  </svg>`;
}

// ---------------------------------------------------------------------------
// Buttons

export const ICONS = {
  play: `<svg viewBox="-50 -50 100 100"><path d="M-14,-26 L28,0 L-14,26 Z" fill="#fff" stroke="#fff" stroke-width="10" stroke-linejoin="round"/></svg>`,
  home: `<svg viewBox="-50 -50 100 100"><path d="M-28,-2 L0,-28 L28,-2 L28,28 L-28,28 Z" fill="#fff" stroke="#fff" stroke-width="8" stroke-linejoin="round"/><rect x="-8" y="8" width="16" height="22" rx="3" fill="currentColor"/></svg>`,
  games: `<svg viewBox="-50 -50 100 100"><g fill="#fff"><rect x="-30" y="-30" width="26" height="26" rx="7"/><rect x="4" y="-30" width="26" height="26" rx="7"/><rect x="-30" y="4" width="26" height="26" rx="7"/><rect x="4" y="4" width="26" height="26" rx="7"/></g></svg>`,
  /** Your street: a row of little houses. */
  street: `<svg viewBox="-50 -50 100 100"><g fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"><path d="M-44,30 L-44,-4 L-26,-20 L-8,-4 L-8,30 Z"/><path d="M-6,30 L-6,-14 L16,-34 L38,-14 L38,30 Z"/></g><rect x="-31" y="10" width="10" height="20" rx="2" fill="currentColor"/><rect x="10" y="4" width="12" height="26" rx="2" fill="currentColor"/><rect x="-50" y="30" width="100" height="6" rx="3" fill="#fff"/></svg>`,
  soundOn: `<svg viewBox="-50 -50 100 100"><path d="M-30,-12 L-16,-12 L2,-28 L2,28 L-16,12 L-30,12 Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><path d="M14,-14 Q24,0 14,14 M22,-24 Q38,0 22,24" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/></svg>`,
  soundOff: `<svg viewBox="-50 -50 100 100"><path d="M-30,-12 L-16,-12 L2,-28 L2,28 L-16,12 L-30,12 Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><path d="M14,-12 L34,12 M34,-12 L14,12" stroke="#fff" stroke-width="7" stroke-linecap="round"/></svg>`,
  musicOn: `<svg viewBox="-50 -50 100 100"><path d="M-10,20 L-10,-24 L24,-32 L24,12" stroke="#fff" stroke-width="7" fill="none" stroke-linejoin="round"/><ellipse cx="-18" cy="22" rx="10" ry="8" fill="#fff"/><ellipse cx="16" cy="14" rx="10" ry="8" fill="#fff"/></svg>`,
  musicOff: `<svg viewBox="-50 -50 100 100"><g opacity=".55"><path d="M-10,20 L-10,-24 L24,-32 L24,12" stroke="#fff" stroke-width="7" fill="none" stroke-linejoin="round"/><ellipse cx="-18" cy="22" rx="10" ry="8" fill="#fff"/><ellipse cx="16" cy="14" rx="10" ry="8" fill="#fff"/></g><path d="M-30,-30 L30,30" stroke="#fff" stroke-width="8" stroke-linecap="round"/></svg>`,
  close: `<svg viewBox="-50 -50 100 100"><path d="M-20,-20 L20,20 M20,-20 L-20,20" stroke="#fff" stroke-width="10" stroke-linecap="round"/></svg>`,
  gear: `<svg viewBox="-50 -50 100 100"><g fill="currentColor">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="-7" y="-40" width="14" height="18" rx="4" transform="rotate(${a})"/>`).join('')}<circle r="27"/></g><circle r="10" fill="#fff"/></svg>`,
};
