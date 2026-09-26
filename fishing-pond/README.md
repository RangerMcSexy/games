# 🎣 Mia's Little Fishing Pond

A gentle fishing game for toddlers (about age 2 to 3). Tap the water and Pip
the penguin rows over in her little red boat and casts. A fish swims up,
nibbles, and bites. One more tap reels it in, and it goes in the fish tank.
Nothing ever gets away, and there's no reading needed. It works with a finger
on a tablet or with a mouse.

## How to play

1. **Tap the water.** Pip rows over and casts. The float plops down and the
   hook sinks to where Mia tapped. Tapping right on a fish means that fish is
   the one that bites.
2. **Wait for a nibble.** The nearest fish turns and swims over. The float
   bobs twice (*nibble nibble!*).
3. **It bites!** The float dunks under, a big red **!** pops up over Pip, and
   the voice says "You got one! Tap tap!".
4. **Tap anywhere** to reel it in. If Mia doesn't tap, a hand shows her
   where, and after 10 seconds it reels itself in.
5. **Look what you caught!** The catch is shown big with its name
   ("A spotty fish!"). A new kind of fish gets a gold star and a fanfare. Then
   it flies into the fish tank button.

Sometimes something **silly** is on the hook instead: an old boot, a rubber
duck, a teapot, a stinky sock, a crown or a funny hat. The first two catches
are always fish.

### Around the pond

- **The sun** (or cloud, or moon): tap it to change the weather. It also
  changes by itself every 3 catches: sunny, then rain (with raindrops and
  pitter-patter), then sunset, then night (stars, fireflies and crickets).
- **The frog** jumps and ribbits, **the turtle** peeks out, **the duck**
  quacks and dives, and **Pip** honks and waves. At night, tap the
  **fireflies** to make them glow.
- The **Glow Fish** only comes out at night.

### The 12 fish

Goldfish, Blue Fish, Red Fish, Purple Fish, Spotty Fish, Stripy Fish,
Rainbow Fish, Puffer Fish (it puffs up), Whisker Fish, Tiny Fish, Crab, and
Glow Fish (night only). Fish she hasn't caught yet swim by more often, so the
tank fills up in a few sessions.

### The fish tank

- Every fish she has caught swims in the tank. Tap one to hear its name.
- **Tap the water to sprinkle food**, and the fish swim over to eat it.
- Silly catches sit on the sand. Tap them for a giggle.
- The row along the bottom shows all 12 fish. Ones not found yet are grey.
- **The tank grows** with every catch. At 2, 4, 7, 10, 14 and 20 catches you
  get plants, a treasure chest that blows bubbles, a castle, a snail on the
  glass, coral and a golden sign.

### Made for little ones

- Only taps, no dragging. Every tap on the water does something.
- Nothing can fail or get away, and it reels itself in if she's slow.
- A hand points at a fish if she hasn't tapped for a few seconds.

## Grown-up settings

**Hold the small gear (top right) for 3 seconds.** In there you can:

- Change the child's name, which is shown on the title, on the tank sign and
  in "Well done, Mia!". It defaults to Mia.
- **Record your own voice** for every spoken line: tap ● to record, tap again
  to stop. Anything you don't record uses the device's built-in voice.
  Recordings stay on the device.
- Start a new fish tank.

Microphone access needs the page to be served from a web address (`https://`
or `localhost`), not opened as a file.

## Running it

```bash
cd fishing-pond
npm install
npm run dev      # dev server, also reachable from a tablet on the same Wi-Fi
npm run build    # production build
```

`npm run build` produces a **single self-contained file**, `dist/index.html`,
with all the code, art and sound built in. It works offline, except for the
rounded font, which falls back to a system font.

## Tech notes

- Vite + TypeScript, no framework, no runtime dependencies. It has the same
  structure as the other games. `ui.ts`, `voice.ts`, `settings.ts` and the
  audio engine started as copies of Colour Splash's, so each game stays
  standalone.
- All the art is SVG drawn in code (`src/art.ts`). Most fish share one body
  shape with different colours and patterns (spots, stripes, rainbow). The
  puffer and the crab are drawn separately.
- `src/pond.ts` runs the pond: one animation loop moves the boat, fish, duck
  and fishing line, and an async flow runs each round (cast → approach →
  bite → reel → reveal). `src/swim.ts` is the swimming fish, shared with the
  tank.
- All sound is generated with the Web Audio API (`src/audio.ts`), including
  the music-box waltz, the rain and the crickets.
- Progress is saved in `localStorage` under `fishing-pond.v1`, and recordings
  in IndexedDB.
