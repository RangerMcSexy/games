// This game's four stickers for the sticker book (shared/stickers.ts).
import { friendSVG, frogSVG } from './art';

export const STICKER_ART: Record<string, () => string> = {
  hoppy: frogSVG,
  bee: () => friendSVG('bee'),
  otter: () => friendSVG('otter'),
  swan: () => friendSVG('swan'),
};
