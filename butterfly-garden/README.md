# 🦋 Mia's Butterfly Garden

A gentle browser game for little ones (about age 4) about how a caterpillar
becomes a butterfly. No reading needed, and nothing to fail. It works with a
finger on a tablet or with a mouse.

## How to play

1. **Pick an egg**, then tap it until it hatches. The game counts along:
   "One! Two! Three!"
2. **Feed the hungry caterpillar** 5 yummy foods. Each bite adds a coloured
   stripe to its body.
3. **Wrap it up** into a chrysalis, then **pick a sticker** to decorate it.
4. **Night time**: tap the stars and they play *Twinkle Twinkle Little Star*.
5. **Good morning!** Tap the wiggling chrysalis to help the butterfly out.
6. The new butterfly flies off to your **garden**.

**Dot the ladybug** comes along for the ride. She cheers, flies over to show
what to tap if Mia gets stuck, and giggles when tickled. Silly surprises pop
up now and then: a sneezing egg, a burping caterpillar, a passing snail, a
shooting star.

### What decides the butterfly

| What you do           | What it changes                                                              |
| --------------------- | ---------------------------------------------------------------------------- |
| The egg you pick      | Wing **shape**: Puffwing, Zipwing, Swallowtail, Sweetheart or Frillywing      |
| The 5 foods you feed  | Wing **colours**: the caterpillar's stripes become the wings                  |
| The sticker you pick  | Wing **pattern**: dots, stripes, hearts, stars or rainbows                    |
| A rare golden leaf ✨ | A **golden** shimmering butterfly (and a gold star in the book)               |

### The garden

- Tap a butterfly to tickle it and hear its name.
- **Drag a flower**: every butterfly follows it and stops for a sip of nectar.
- Tap the flowers to play notes.
- The moon button switches to **night**: the butterflies glow and fireflies
  come out.
- **The garden grows**: new things unlock as more butterflies are grown. At 2,
  3, 5, 7, 9, 12, 15 and 20 butterflies you get a mushroom, a frog pond, a
  rainbow, a bunny, a swing tree, a birdbath, a hot-air balloon and a fairy
  house. Each one does something when tapped.

### The Butterfly Book

The book has 25 spaces, one for each egg and sticker pair. The spaces you
haven't found yet show a grey outline of that butterfly. Tap an empty space
and the game says which egg and sticker will fill it. Fill all 25 for a crown.

## Grown-up settings

**Hold the small gear (top right) for 3 seconds.** In there you can:

- Change the child's name, which is shown on the title and used in cheers. It
  defaults to Mia.
- **Record your own voice** for every spoken line: tap ● to record, tap again
  to stop. Anything you don't record uses the device's built-in voice.
  Recordings stay on the device.
- Start a new butterfly book.

Microphone access needs the page to be served from a web address (`https://`
or `localhost`), not opened as a file. In Chrome the file version works too.

## Running it

```bash
cd butterfly-garden
npm install
npm run dev      # dev server, also reachable from a tablet on the same Wi-Fi
npm run build    # production build
```

`npm run build` produces a **single self-contained file**, `dist/index.html`,
with all the code, art and sound built in. You can put it on any static host
or open it directly. It works offline, except for the rounded font, which
falls back to a system font.

On a tablet, open it in the browser and use **Add to Home Screen** so it opens
full-screen like an app.

## Tech notes

- Vite + TypeScript, no framework, no runtime dependencies.
- All artwork is SVG generated in code (`src/art.ts`); there are no image files.
- All sound is generated with the Web Audio API (`src/audio.ts`), including
  the music-box lullaby.
- Voice lines live in `src/voice.ts`. Recordings are kept in IndexedDB.
- Progress is saved in `localStorage`.
