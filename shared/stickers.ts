// The sticker book's stickers: four for each game, earned as that game's
// collection grows. Shared by the games (which show a sticker the moment
// it's earned, see sticker-moment.ts) and the home page's sticker book.
// Each game draws its own stickers in its src/stickers.ts.

export interface StickerInfo {
  id: string;
  /** Said when the sticker is tapped. */
  name: string;
  /** How many of the game's things it takes to earn it. */
  at: number;
}

export interface BookPage {
  game: string;
  title: string;
  /** Said when the page is turned to. */
  hello: string;
  /** Where the game keeps its save, and what in it to count. */
  key: string;
  count: string;
  stickers: StickerInfo[];
}

export const BOOK: BookPage[] = [
  {
    game: 'butterfly-garden',
    title: 'Butterfly Garden',
    hello: 'Butterfly Garden!',
    key: 'butterfly-garden.v1',
    count: 'butterflies',
    stickers: [
      { id: 'caterpillar', name: 'A hungry caterpillar!', at: 1 },
      { id: 'ladybug', name: 'A ladybird!', at: 3 },
      { id: 'butterfly', name: 'A butterfly!', at: 6 },
      { id: 'golden-butterfly', name: 'A golden butterfly!', at: 10 },
    ],
  },
  {
    game: 'bakery',
    title: 'Little Bakery',
    hello: 'Little Bakery!',
    key: 'little-bakery.v1',
    count: 'treats',
    stickers: [
      { id: 'cupcake', name: 'A cupcake!', at: 1 },
      { id: 'mouse', name: 'A little mouse!', at: 3 },
      { id: 'cookie', name: 'A star cookie!', at: 6 },
      { id: 'cake', name: 'A birthday cake!', at: 10 },
    ],
  },
  {
    game: 'colour-splash',
    title: 'Colour Splash',
    hello: 'Colour Splash!',
    key: 'colour-splash.v1',
    count: 'paintings',
    stickers: [
      { id: 'paint', name: 'Red paint!', at: 1 },
      { id: 'puppy', name: 'A puppy!', at: 3 },
      { id: 'balloons', name: 'Balloons!', at: 6 },
      { id: 'rainbow', name: 'A rainbow!', at: 10 },
    ],
  },
  {
    game: 'fishing-pond',
    title: 'Fishing Pond',
    hello: 'Fishing Pond!',
    key: 'fishing-pond.v1',
    count: 'caught',
    stickers: [
      { id: 'goldfish', name: 'A goldfish!', at: 1 },
      { id: 'turtle', name: 'A turtle!', at: 3 },
      { id: 'crab', name: 'A crab!', at: 6 },
      { id: 'rainbow-fish', name: 'A rainbow fish!', at: 12 },
    ],
  },
  {
    game: 'leapy-pond',
    title: 'Leapy Pond',
    hello: 'Leapy Pond!',
    key: 'leapy-pond.v1',
    count: 'friends',
    stickers: [
      { id: 'hoppy', name: 'Hoppy the frog!', at: 1 },
      { id: 'bee', name: 'A buzzy bee!', at: 3 },
      { id: 'otter', name: 'An otter!', at: 6 },
      { id: 'swan', name: 'A swan!', at: 12 },
    ],
  },
  {
    game: 'unicorn-dash',
    title: 'Unicorn Dash',
    hello: 'Unicorn Dash!',
    key: 'unicorn-dash.v1',
    count: 'items',
    stickers: [
      { id: 'sparkle', name: 'Sparkle the unicorn!', at: 1 },
      { id: 'party-hat', name: 'A party hat!', at: 3 },
      { id: 'wings', name: 'A unicorn with wings!', at: 6 },
      { id: 'royal', name: 'A royal unicorn!', at: 12 },
    ],
  },
  {
    game: 'ducky-bath',
    title: 'Ducky Bath',
    hello: 'Ducky Bath!',
    key: 'ducky-bath.v1',
    count: 'items',
    stickers: [
      { id: 'ducky', name: 'Ducky!', at: 1 },
      { id: 'pirate-duck', name: 'Pirate Duck!', at: 3 },
      { id: 'unicorn-duck', name: 'Unicorn Duck!', at: 6 },
      { id: 'golden-duck', name: 'Golden Duck!', at: 12 },
    ],
  },
  {
    game: 'postie-pip',
    title: 'Postie Pip',
    hello: 'Postie Pip!',
    key: 'postie-pip.v1',
    count: 'letters',
    stickers: [
      { id: 'pip-postie', name: 'Pip the postie!', at: 1 },
      { id: 'parcel', name: 'A parcel!', at: 3 },
      { id: 'postbox', name: 'A post box!', at: 6 },
      { id: 'letter-blocks', name: 'Letter blocks!', at: 12 },
    ],
  },
];

/** Where the sticker book keeps which stickers are stuck in (and shown). */
export const BOOK_KEY = 'sticker-book.v1';
