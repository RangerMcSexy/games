// This game's four stickers for the sticker book (shared/stickers.ts).
import { INK, LETTER_BOX, PARCEL_BOX, STROKES, parcelSVG, pipSVG, postboxSVG } from './art';

const inner = (svg: string) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
/** A letter drawn into the box at (x, y), `w` across (not a nested <svg>: page styles would resize it). */
function letter(l: string, x: number, y: number, w: number, colour = INK) {
  const [bx, by, bw] = LETTER_BOX.split(' ').map(Number);
  const k = w / bw;
  return `<g transform="translate(${x - bx * k},${y - by * k}) scale(${k})" fill="none" stroke="${colour}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">${STROKES[l].map((d) => `<path d="${d}"/>`).join('')}</g>`;
}

/** A letter block, 100 across, with a letter on its front. */
const block = (x: number, y: number, l: string, colour: string, turn = 0) =>
  `<g transform="translate(${x},${y}) rotate(${turn})">
    <rect x="-50" y="-50" width="100" height="100" rx="14" fill="${colour}" stroke="${INK}" stroke-width="5"/>
    <rect x="-38" y="-38" width="76" height="76" rx="10" fill="#fff" opacity=".9"/>
    ${letter(l, -34, -42, 68)}
  </g>`;

export const STICKER_ART: Record<string, () => string> = {
  'pip-postie': () => pipSVG(),
  parcel: () =>
    `<svg viewBox="${PARCEL_BOX}">${inner(parcelSVG())}<rect x="-44" y="-22" width="88" height="96" rx="12" fill="#fff" stroke="${INK}" stroke-width="3.5"/>${letter('s', -36, -22, 72)}</svg>`,
  postbox: () => postboxSVG(),
  'letter-blocks': () =>
    `<svg viewBox="-118 -120 236 240">${block(-56, 58, 'a', '#ff6b6b', -6)}${block(56, 58, 'b', '#5eaaff', 5)}${block(0, -56, 'c', '#7fd35b', -3)}</svg>`,
};
