// This game's four stickers for the sticker book (shared/stickers.ts).
import { fishSVG, turtleSVG } from './art';
import { fishById } from './data';

const fish = (id: string) => fishSVG(fishById(id)!);

export const STICKER_ART: Record<string, () => string> = {
  goldfish: () => fish('gold'),
  turtle: turtleSVG,
  crab: () => fish('crab'),
  'rainbow-fish': () => fish('rainbow'),
};
