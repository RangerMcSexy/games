# 🦄 Unicorn Dash

A gentle running game for toddlers (about age 2 to 4). Sparkle the unicorn
gallops across a sunny meadow, seen from the side. **Tap anywhere and she
jumps.** At the end of every dash there's a present with something new for
her to wear. Nothing can go wrong and there's no reading needed. It works
with a finger on a tablet or with a mouse.

## How to play

Each dash is eight moves (the dots along the bottom). The stars caught so far
are counted at the left. The first move is always a jump.

- **Jump over it:** a log, a rock or a bush. If she hasn't jumped by the time
  she gets there, Sparkle stops and waits in front of it ("Tap to jump!"),
  and a hand points at her. Any tap from there takes her right over it, and
  there's a star to catch on the way.
- **Catch the stars:** a row of stars up in the sky, shaped like a jump. Jump
  at the right moment to catch them all ("You got every star!"). The low
  stars along the way are caught just by running.
- **Pop the balloon:** Sparkle stops and balloons float up. "Pop the red
  balloon!" The right one pops with confetti. A wrong one wobbles ("That
  one's blue!") and the question is asked again. After a wrong pick the hand
  points at the right balloon. Two balloons at first, three after a couple
  of dashes.
- **Count the fences:** "Fences! Let's count!" A row of little fences to jump
  one at a time, "One! Two! Three!". It starts at three and grows to five as
  she plays more.
- **The puddle:** run through it for a big splash and a giggle, or jump over
  it.
- **The present:** under a rainbow at the end. Tap it and it opens, and
  Sparkle puts on what was inside straight away.

**Tap a bunny or a butterfly** to say hello. A tap while Sparkle is coming
down jumps again as soon as she lands, so tapping fast can't break anything.

### The 12 presents

Rainbow mane, Flower crown, Wings, Pretty bow, Party hat, Star glasses,
Sparkly boots, Golden horn, Super cape, Heart necklace, Sky blue mane and
Royal crown. There's a new one at the end of every dash until she has them
all. After that, old ones come round again.

### Dressing up

- The crown button (on the title and after a dash) opens dressing up. Sparkle
  stands under a rainbow wearing her things.
- The row along the bottom shows all 12. Tap one she has found to put it on,
  and tap again to take it off. A new hat takes the place of the old one, and
  the same goes for manes, and for the wings and the cape. Presents not found yet are pale shapes.
- Something new sparkles, and the crown button shows a star until she's been
  to see it.

### Made for little ones

- Only taps, no dragging. Every tap does something.
- Nothing can fail: Sparkle waits at anything she has to jump, wrong balloons
  wobble, puddles only splash.
- A hand points at what to tap if she hasn't tapped for a few seconds.

## Grown-up settings

**Hold the small gear (top right) for 3 seconds.** In there you can:

- Change the child's name, which is shown on the title and in "Well done,
  Sam!". The games ask for it the first time they are opened on a device, and
  all the games share it.
- **Record your own voice** for every spoken line: tap ● to record, tap again
  to stop. Anything you don't record uses the built-in voice. Recordings stay
  on the device.
- Start again, putting every present back.

Microphone access needs the page to be served from a web address (`https://`
or `localhost`), not opened as a file.

## Running it

```bash
cd unicorn-dash
npm install
npm run dev      # dev server, also reachable from a tablet on the same Wi-Fi
npm run build    # production build
```

`npm run build` produces a **single self-contained file**, `dist/index.html`,
with all the code, art and sound built in. It works offline,
rounded font included.

## Tech notes

- Vite + TypeScript, no framework, no runtime dependencies. It has the same
  structure as the other games. The code and
  look every game has in common (`ui.ts`, `voice.ts`, `settings.ts`, the audio
  engine, the start-up and top bar in `shell.ts`, and `base.css`) live in
  `../shared/`; each game still builds into its own single, offline file.
- All the art is SVG drawn in code (`src/art.ts`): Sparkle side on, with legs
  that gallop and everything she can wear, and the meadow, the things in the
  way, the balloons and the presents.
- `src/dash.ts` runs a dash. Everything in the meadow has a place measured in
  unicorn lengths, and one camera value scrolls it, with the hills behind
  moving slower. Each frame moves Sparkle: she runs, slows down in good time
  for anything she has to jump, and jumps on an arc. A jump near something in
  the way is stretched so that it always clears it.
- All sound is generated with the Web Audio API (`src/audio.ts`), including
  the galloping music-box tune.
- Progress is saved in `localStorage` under `unicorn-dash.v1`, and recordings
  in IndexedDB.
