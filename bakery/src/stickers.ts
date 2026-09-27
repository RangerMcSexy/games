// This game's four stickers for the sticker book (shared/stickers.ts).
import { mouseSVG, treatSVG } from './art';

export const STICKER_ART: Record<string, () => string> = {
  cupcake: () => treatSVG({ kind: 'cupcake', shape: 'round', batter: 'yellow', icing: 'pink', sprinkles: 4, topper: 'cherry' }),
  mouse: mouseSVG,
  cookie: () => treatSVG({ kind: 'cookie', shape: 'star', batter: 'yellow', icing: 'blue', sprinkles: 3 }),
  cake: () => treatSVG({ kind: 'cake', shape: 'heart', batter: 'pink', icing: 'purple', sprinkles: 5, topper: 'candles', candles: 3, lit: true }),
};
