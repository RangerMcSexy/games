# 🦆 Ducky Bath

A gentle bath-time game for toddlers (about age 2 to 4). Ducky the rubber
duck is waiting in an empty bath. **Tap the tap to fill it**, and bath time
begins. At the end, pull the plug: a big bubble floats up with a new rubber
duck inside. Nothing can go wrong and there's no reading needed. It works
with a finger on a tablet or with a mouse.

## How to play

Each bath is eight moves (the dots along the bottom). The first is always
filling the bath; the last is always pulling the plug. In between, in a
different order every time:

- **Fill the bath:** "Turn on the tap!" Three taps and the bath is full, and
  Ducky floats up with the water.
- **Bubbles:** "Bubble time! Squeeze the bottle!" Three squeezes of the
  bubble bath fill the bath with foam, then bubbles float up: "Pop the
  bubbles!"
- **Squeak a duck by colour:** little ducks plop into the water. "Squeak
  the red duck!" The right one squeaks and hops. A wrong one wobbles ("That
  one's blue!") and the question is asked again, and after a wrong pick the
  hand points at the right duck. Two ducks at first, three after a couple of
  baths.
- **Count the little ducks:** "Let's count the ducks!" Tap each one: "One!
  Two! Three!" It starts at three and grows to five over more baths.
- **Scrub the mud:** "Oh no! Ducky's all muddy!" Tap each splodge and the
  sponge scrubs it off. "Squeaky clean!"
- **Hide and seek:** Baby Duck hides under one of three piles of foam.
  "Where's Baby Duck?" A wrong pile just puffs away ("Not in there!").
  "Peekaboo!"
- **Splashing:** "Splash the water!" Six splashes anywhere on the water.
- **Pull the plug:** "All clean! Pull the plug!" Tap the red ring on the
  chain and the water glugs away. A big bubble floats up with a duck shape
  inside. Tap it and it pops, and the duck goes and sits on the rim of the
  bath.

**Any time:** tap Ducky or any duck to make it squeak, tap the tap for a
splash of water, squeeze the bottle, or splash the water.

### The 12 ducks

Rainbow Duck, Princess Duck, Pirate Duck, Firefighter Duck, Chef Duck,
Froggy Duck, Super Duck, Space Duck, Unicorn Duck, Wizard Duck, Dino Duck and
Golden Duck. There's a new one at the end of every bath until they've all
been found. After that, old friends come round again. The six found most
recently sit along the back of the bath.

### The duck shelf

- The duck button (on the title and after a bath) opens the shelf, with a
  place for all 12 ducks. Tap a duck to hear it squeak and say its name.
  Ducks not found yet are grey shapes.
- A new duck sparkles, and the duck button shows a star until it's been
  seen.

### Made for little ones

- Only taps, no dragging. Every tap does something.
- Nothing can fail: wrong ducks wobble, wrong piles of foam puff away.
- A hand points at what to tap if nothing's been tapped for a few seconds.
- Tapping fast can't break anything.

## Grown-up settings

**Hold the small gear (top right) for 3 seconds.** In there you can:

- Change the child's name, which is shown on the title and in "Well done,
  Sam!". The games ask for it the first time they are opened on a device, and
  all the games share it.
- **Record your own voice** for every spoken line: tap ● to record, tap again
  to stop. Anything you don't record uses the built-in voice. Recordings stay
  on the device.
- Start again, putting every duck back.

Microphone access needs the page to be served from a web address (`https://`
or `localhost`), not opened as a file.

## Running it

```bash
cd ducky-bath
npm install
npm run dev      # dev server, also reachable from a tablet on the same Wi-Fi
npm run build    # production build
```

`npm run build` produces a **single self-contained file**, `dist/index.html`,
with all the code, art and sound built in. It works offline,
rounded font included.

## Tech notes

- Vite + TypeScript, no framework, no runtime dependencies. It has the same
  structure as the other games. `ui.ts`, `voice.ts`, `settings.ts` and the
  audio engine started as copies of Unicorn Dash's, so each game stays
  standalone.
- All the art is SVG drawn in code (`src/art.ts`): the rubber ducks side on,
  the clawfoot bath, the tap, plug, bottle and sponge, foam and bubbles.
- `src/tub.ts` is the bathroom and the bath. Everything in the bath is
  placed in the bath's own units (1000 across), and things floating on the
  water have a depth from the back of the bath to the front, so the water
  level carries them up and down. On a tall phone the bath is wider than the
  screen, and the tap, plug, sponge and bottle move in to stay on it.
- `src/bath.ts` runs a bath, one move after another.
- All sound is generated with the Web Audio API (`src/audio.ts`): squeaks,
  quacks, running water, plops, glugs and a bubbly music-box waltz.
- Progress is saved in `localStorage` under `ducky-bath.v1`, and recordings
  in IndexedDB.
