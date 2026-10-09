# 🌈 Colour Splash

A gentle colouring game for little ones (about age 3 to 4). Tap a paint pot, tap
part of the picture, and colour splashes across it. When every part is painted,
the picture comes alive and goes up in the gallery. No reading needed, and
nothing to fail. It works with a finger on a tablet or with a mouse.

## How to play

1. **Pick a picture.** Three big pictures are shown at a time. Tap the blue
   arrow for the next three. Pictures painted before show their own
   colours and a gold star.
2. **Mix a colour** (from the second picture on): two pots and a bowl pop
   up. Tap each pot to pour it in, tap the bowl three times to stir, and
   "Red and yellow make orange!" (or blue and yellow, green; red and blue,
   purple). The new colour is picked, ready to paint with.
3. **Tap a paint pot.** The pot hops up and the colour is named ("Blue!"). One
   pot is already picked, so tapping the picture straight away works too.
4. **Tap the picture.** A splash of colour spreads out from her finger to fill
   that part, with a *splosh* and a little musical note (each colour has its
   own note). Tapping a part again paints over it.
5. **The rainbow pot** paints in stripy rainbow colours.
6. **The magic star** (next to the pots) paints one of the white parts in the
   colour it "should" be. It's handy when a part is hard to find, or when she
   just wants to tap.
7. **All done!** Fanfare, confetti and "You did it!" Then the picture
   **comes alive**, and she can tap the gallery button or the play button to
   paint another.

**Dot the puppy** helps out. If the child hasn't tapped anything for a few seconds, a
hand and Dot hop over to a part that's still white. Tickle Dot and she yaps.

### Made for little ones

- There are never more than 3 pictures to choose from, all big buttons. Every
  pot's tap area reaches a bit past its edge.
- No dragging needed anywhere, only taps.
- The parts to paint are big. Small details (eyes, smiles, whiskers) aren't
  paintable, so a tap on them paints the part underneath.
- There's no wrong colour. A green sun or a purple duck is just as good.
- On tall phones the pots sit in two rows so each one is bigger.

### The pictures

| Picture   | When it comes alive                      |
| --------- | ---------------------------------------- |
| Sunshine  | The rays spin and the face squishes      |
| Fish      | Swims back and forth, bubbles rise       |
| Butterfly | Flaps its wings and flutters about       |
| House     | Wobbles happily, smoke puffs out         |
| Car       | Drives off one side, back from the other |
| Flower    | Sways on its stem                        |
| Kitty     | Wags her tail and tilts her head         |
| Ice cream | The scoops wobble                        |
| Rainbow   | Glows, and the clouds bob                |
| Rocket    | Rumbles, blasts off and comes back       |
| Duck      | Paddles on the pond                      |
| Dino      | Stomps, and the egg rocks                |

Each one also makes its own sound (beep beep, quack, roar, meow…).

### The gallery

- Every finished picture is framed on the wall, newest first. If there are too
  many to fit, the blue arrow shows the next wall. Tap a picture to make it
  come alive again and hear its name.
- Tap the empty wall to make a paint splat.
- **The gallery grows** as more pictures are painted. At 2, 4, 6, 9, 12, 16 and
  20 pictures you get bunting, an easel showing the newest picture, a paint
  splat rug, fairy lights, a rainbow on the wall, balloons and a golden sign.

## Grown-up settings

**Hold the small gear (top right) for 3 seconds.** In there you can:

- Change the child's name, which is shown on the title, on the gallery sign and
  in "You did it, Sam!". The games ask for it the first time they are opened on a
  device, and all the games share it.
- **Record your own voice** for every spoken line: tap ● to record, tap again
  to stop. Anything you don't record uses the device's built-in voice.
  Recordings stay on the device.
- Start a new gallery.

Microphone access needs the page to be served from a web address (`https://`
or `localhost`), not opened as a file.

## Running it

```bash
cd colour-splash
npm install
npm run dev      # dev server, also reachable from a tablet on the same Wi-Fi
npm run build    # production build
```

`npm run build` produces a **single self-contained file**, `dist/index.html`,
with all the code, art and sound built in. It works offline,
rounded font included.

On a tablet, open it in the browser and use **Add to Home Screen** so it opens
full-screen like an app.

## Tech notes

- Vite + TypeScript, no framework, no runtime dependencies. It has the same
  structure as Little Bakery. The code and
  look every game has in common (`ui.ts`, `voice.ts`, `settings.ts`, the audio
  engine, the start-up and top bar in `shell.ts`, and `base.css`) live in
  `../shared/`; each game still builds into its own single, offline file.
- The pictures are data (`src/pictures.ts`): layers of SVG paths in a 400×400
  box. **Regions** are the paintable shapes, and **details** sit on top with
  `pointer-events: none`. Layers can be grouped (`g`) so parts can move when
  the picture comes alive (the animations are CSS in `style.css`, under
  "Pictures coming alive"). A layer can also carry a fixed transform (`t`) to
  make a small drawing bigger. To add a picture, add it there, give it a voice
  line in `voice.ts`, and optionally an animation and a sound.
- A splash is a circle clipped to the region's own shape that scales up from
  the tap point (`src/paint.ts`). When it finishes, the region takes the
  colour. Rainbow paint is a repeating gradient in picture units, so the
  splash and the final fill match.
- All sound is generated with the Web Audio API (`src/audio.ts`), including the
  music-box tune.
- Progress is saved in `localStorage` under `colour-splash.v1`, and recordings
  in IndexedDB.
