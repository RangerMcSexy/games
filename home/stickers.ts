// The sticker book's stickers: four for each game, earned as that game's
// collection grows. Drawn with the games' own art, turned into plain SVG
// when the site is built (scripts/build-site.mjs), so the home page stays
// small and needs none of the games' code.
import { butterflySVG, caterpillarSVG, ladybugSVG } from '../butterfly-garden/src/art';
import { mouseSVG, treatSVG } from '../bakery/src/art';
import { balloonsSVG, potSVG, puppySVG, rainbowSVG as paintRainbowSVG } from '../colour-splash/src/art';
import { fishSVG, turtleSVG } from '../fishing-pond/src/art';
import { FISH } from '../fishing-pond/src/data';
import { frogSVG, friendSVG } from '../leapy-pond/src/art';
import { itemSVG, unicornSVG } from '../unicorn-dash/src/art';
import { duckSVG } from '../ducky-bath/src/art';

export interface Sticker {
  id: string;
  /** Said when the sticker is tapped. */
  name: string;
  /** How many of the game's things it takes to earn it. */
  at: number;
  svg: () => string;
}

export interface Page {
  game: string;
  title: string;
  /** Said when the page is turned to. */
  hello: string;
  /** Where the game keeps its save, and how to count its collection. */
  key: string;
  count: string;
  stickers: Sticker[];
}

const fish = (id: string) => fishSVG(FISH.find((f) => f.id === id)!);

export const PAGES: Page[] = [
  {
    game: 'butterfly-garden',
    title: 'Butterfly Garden',
    hello: 'Butterfly Garden!',
    key: 'butterfly-garden.v1',
    count: 'butterflies',
    stickers: [
      { id: 'caterpillar', name: 'A hungry caterpillar!', at: 1, svg: () => caterpillarSVG(['strawberry', 'banana', 'blueberry']) },
      { id: 'ladybug', name: 'A ladybird!', at: 3, svg: ladybugSVG },
      { id: 'butterfly', name: 'A butterfly!', at: 6, svg: () => butterflySVG({ shape: 'heart', pattern: 'hearts', foods: ['strawberry', 'orange', 'blueberry', 'banana', 'strawberry'], golden: false }) },
      { id: 'golden-butterfly', name: 'A golden butterfly!', at: 10, svg: () => butterflySVG({ shape: 'frilly', pattern: 'stars', foods: ['golden', 'banana', 'golden', 'orange', 'golden'], golden: true }) },
    ],
  },
  {
    game: 'bakery',
    title: 'Little Bakery',
    hello: 'Little Bakery!',
    key: 'little-bakery.v1',
    count: 'treats',
    stickers: [
      { id: 'cupcake', name: 'A cupcake!', at: 1, svg: () => treatSVG({ kind: 'cupcake', shape: 'round', batter: 'yellow', icing: 'pink', sprinkles: 4, topper: 'cherry' }) },
      { id: 'mouse', name: 'A little mouse!', at: 3, svg: mouseSVG },
      { id: 'cookie', name: 'A star cookie!', at: 6, svg: () => treatSVG({ kind: 'cookie', shape: 'star', batter: 'yellow', icing: 'blue', sprinkles: 3 }) },
      { id: 'cake', name: 'A birthday cake!', at: 10, svg: () => treatSVG({ kind: 'cake', shape: 'heart', batter: 'pink', icing: 'purple', sprinkles: 5, topper: 'candles', candles: 3, lit: true }) },
    ],
  },
  {
    game: 'colour-splash',
    title: 'Colour Splash',
    hello: 'Colour Splash!',
    key: 'colour-splash.v1',
    count: 'paintings',
    stickers: [
      { id: 'paint', name: 'Red paint!', at: 1, svg: () => potSVG('red') },
      { id: 'puppy', name: 'A puppy!', at: 3, svg: puppySVG },
      { id: 'balloons', name: 'Balloons!', at: 6, svg: balloonsSVG },
      { id: 'rainbow', name: 'A rainbow!', at: 10, svg: paintRainbowSVG },
    ],
  },
  {
    game: 'fishing-pond',
    title: 'Fishing Pond',
    hello: 'Fishing Pond!',
    key: 'fishing-pond.v1',
    count: 'caught',
    stickers: [
      { id: 'goldfish', name: 'A goldfish!', at: 1, svg: () => fish('gold') },
      { id: 'turtle', name: 'A turtle!', at: 3, svg: turtleSVG },
      { id: 'crab', name: 'A crab!', at: 6, svg: () => fish('crab') },
      { id: 'rainbow-fish', name: 'A rainbow fish!', at: 12, svg: () => fish('rainbow') },
    ],
  },
  {
    game: 'leapy-pond',
    title: 'Leapy Pond',
    hello: 'Leapy Pond!',
    key: 'leapy-pond.v1',
    count: 'friends',
    stickers: [
      { id: 'hoppy', name: 'Hoppy the frog!', at: 1, svg: frogSVG },
      { id: 'bee', name: 'A buzzy bee!', at: 3, svg: () => friendSVG('bee') },
      { id: 'otter', name: 'An otter!', at: 6, svg: () => friendSVG('otter') },
      { id: 'swan', name: 'A swan!', at: 12, svg: () => friendSVG('swan') },
    ],
  },
  {
    game: 'unicorn-dash',
    title: 'Unicorn Dash',
    hello: 'Unicorn Dash!',
    key: 'unicorn-dash.v1',
    count: 'items',
    stickers: [
      { id: 'sparkle', name: 'Sparkle the unicorn!', at: 1, svg: () => unicornSVG() },
      { id: 'party-hat', name: 'A party hat!', at: 3, svg: () => itemSVG('partyhat') },
      { id: 'wings', name: 'A unicorn with wings!', at: 6, svg: () => unicornSVG(['wings', 'flowers']) },
      { id: 'royal', name: 'A royal unicorn!', at: 12, svg: () => unicornSVG(['goldhorn', 'crown', 'cape']) },
    ],
  },
  {
    game: 'ducky-bath',
    title: 'Ducky Bath',
    hello: 'Ducky Bath!',
    key: 'ducky-bath.v1',
    count: 'items',
    stickers: [
      { id: 'ducky', name: 'Ducky!', at: 1, svg: () => duckSVG('ducky') },
      { id: 'pirate-duck', name: 'Pirate Duck!', at: 3, svg: () => duckSVG('pirate') },
      { id: 'unicorn-duck', name: 'Unicorn Duck!', at: 6, svg: () => duckSVG('unicorn') },
      { id: 'golden-duck', name: 'Golden Duck!', at: 12, svg: () => duckSVG('golden') },
    ],
  },
];
