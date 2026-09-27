// The sticker book's stickers with their pictures, drawn by each game's
// src/stickers.ts. Turned into plain SVG when the site is built
// (scripts/build-site.mjs), so the home page needs none of the games' code.
import { BOOK } from '../shared/stickers';
import { STICKER_ART as bakery } from '../bakery/src/stickers';
import { STICKER_ART as butterflies } from '../butterfly-garden/src/stickers';
import { STICKER_ART as colours } from '../colour-splash/src/stickers';
import { STICKER_ART as ducks } from '../ducky-bath/src/stickers';
import { STICKER_ART as fish } from '../fishing-pond/src/stickers';
import { STICKER_ART as pond } from '../leapy-pond/src/stickers';
import { STICKER_ART as unicorn } from '../unicorn-dash/src/stickers';

const ART: Record<string, Record<string, () => string>> = {
  'butterfly-garden': butterflies,
  bakery,
  'colour-splash': colours,
  'fishing-pond': fish,
  'leapy-pond': pond,
  'unicorn-dash': unicorn,
  'ducky-bath': ducks,
};

export const PAGES = BOOK.map((p) => ({ ...p, stickers: p.stickers.map((s) => ({ ...s, svg: ART[p.game][s.id] })) }));
