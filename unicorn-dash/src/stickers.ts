// This game's four stickers for the sticker book (shared/stickers.ts).
import { itemSVG, unicornSVG } from './art';

export const STICKER_ART: Record<string, () => string> = {
  sparkle: () => unicornSVG(),
  'party-hat': () => itemSVG('partyhat'),
  wings: () => unicornSVG(['wings', 'flowers']),
  royal: () => unicornSVG(['goldhorn', 'crown', 'cape']),
};
