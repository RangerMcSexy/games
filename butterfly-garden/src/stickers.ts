// This game's four stickers for the sticker book (shared/stickers.ts).
import { butterflySVG, caterpillarSVG, ladybugSVG } from './art';

export const STICKER_ART: Record<string, () => string> = {
  caterpillar: () => caterpillarSVG(['strawberry', 'banana', 'blueberry']),
  ladybug: ladybugSVG,
  butterfly: () => butterflySVG({ shape: 'heart', pattern: 'hearts', foods: ['strawberry', 'orange', 'blueberry', 'banana', 'strawberry'], golden: false }),
  'golden-butterfly': () => butterflySVG({ shape: 'frilly', pattern: 'stars', foods: ['golden', 'banana', 'golden', 'orange', 'golden'], golden: true }),
};
