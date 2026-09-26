# 🐸 Leapy Pond

A gentle hopping game for toddlers (about age 2 to 4). Hoppy the frog sits on
a lily pad in a big pond, seen from above. Tap a glowing pad and Hoppy leaps
onto it, and the pond scrolls along. At the far side a pond friend is waiting
to be met. Nothing can go wrong and there's no reading needed. It works with
a finger on a tablet or with a mouse.

## How to play

Each trip across the pond is eight moves (the dots along the bottom), and the
first is always an easy one.

- **Pick a pad:** two or three pads glow. Tap any of them and Hoppy hops
  there. Some pads have a **fly** buzzing over them. Land there and Hoppy's
  tongue flicks out ("Slurp! A yummy fly!"). Others have a **flower**, and the
  voice names its colour.
- **Find the colour:** "Find the red flower!" Each pad has a different
  flower. The right one gets a sparkle and a cheer. A wrong one wobbles
  ("That one's blue!") and the question is asked again. After a wrong pick
  the hand points at the right flower. Two flowers to choose from at first,
  three after a couple of trips.
- **Stepping stones:** "Let's count!" A row of stones to hop along one at a
  time, "One! Two! Three!". It starts at three stones and grows to five as she
  plays more.
- **The friend:** a big glowing pad with a mystery shape on it ("Who's
  that?"). Hop over and meet a new friend, who comes to live in your pond.

**Tap the water** anywhere for a ripple, and now and then a fish leaps out.
**Tap Hoppy** for a ribbit.

### The 12 pond friends

Duckling, Turtle, Dragonfly, Snail, Goldfish, Ladybird, Tadpoles, Butterfly,
Bee, Swan, Otter and Baby Frog. There's a new one at the end of every trip
until she's met them all. After that, old friends take turns to wait at the
end.

### Your pond

- Every friend she has met lives in the pond: flyers hover, swimmers drift and
  the rest sit on their own pads. Tap one to hear it.
- The row along the bottom shows all 12. Ones not met yet are grey shapes.
- A newly met friend sparkles, and the pond button on the title shows a star
  until she's been to see them.

### Made for little ones

- Only taps, no dragging. Every tap does something.
- Nothing can fail: wrong answers wobble, the water only splashes.
- A hand points at a pad if she hasn't tapped for a few seconds.

## Grown-up settings

**Hold the small gear (top right) for 3 seconds.** In there you can:

- Change the child's name, which is shown on the title and in "Well done,
  Sam!". The games ask for it the first time they are opened on a device, and
  all the games share it.
- **Record your own voice** for every spoken line: tap ● to record, tap again
  to stop. Anything you don't record uses the built-in voice. Recordings stay
  on the device.
- Start a new pond.

Microphone access needs the page to be served from a web address (`https://`
or `localhost`), not opened as a file.

## Running it

```bash
cd leapy-pond
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
  audio engine started as copies of Little Fishing Pond's, so each game stays
  standalone.
- All the art is SVG drawn in code (`src/art.ts`): Hoppy seen from above
  (sitting and mid-leap), pads, flowers, flies, stones and the friends.
- `src/leap.ts` runs a trip. Everything in the pond has a place measured in
  hops, and one camera value scrolls the whole pond. A hop moves Hoppy and the
  camera together, and Hoppy grows and lifts off its shadow in mid-air.
- All sound is generated with the Web Audio API (`src/audio.ts`), including
  the bouncy music-box tune.
- Progress is saved in `localStorage` under `leapy-pond.v1`, and recordings
  in IndexedDB.
