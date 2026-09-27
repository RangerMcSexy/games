// This game's four stickers for the sticker book (shared/stickers.ts).
import { balloonsSVG, potSVG, puppySVG, rainbowSVG } from './art';

export const STICKER_ART: Record<string, () => string> = {
  paint: () => potSVG('red'),
  puppy: puppySVG,
  balloons: balloonsSVG,
  rainbow: rainbowSVG,
};
