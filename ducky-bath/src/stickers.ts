// This game's four stickers for the sticker book (shared/stickers.ts).
import { duckSVG } from './art';

export const STICKER_ART: Record<string, () => string> = {
  ducky: () => duckSVG('ducky'),
  'pirate-duck': () => duckSVG('pirate'),
  'unicorn-duck': () => duckSVG('unicorn'),
  'golden-duck': () => duckSVG('golden'),
};
