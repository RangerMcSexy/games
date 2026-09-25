# 🧁 Mia's Little Bakery

A gentle browser game for toddlers (about age 2 to 3). Bake a cake, a cupcake or
a cookie for a silly animal customer. No reading needed, and nothing to fail. It
works with a finger on a tablet or with a mouse.

## How to play

1. **Ding-a-ling! A customer comes in** through the serving hatch. A thought
   bubble shows what they'd like, e.g. "Pink! Heart! Cupcake!".
2. **What shall we bake?** Pick a cake, a cupcake or a cookie.
3. **Crack 3 eggs.** The game counts along: "One! Two! Three!"
4. **Tap the flour**, then **pick a colour** for the batter.
5. **Stir.** Rub round the bowl or just tap it.
6. **Pick a shape**: circle, heart or star.
7. **Into the oven.** Tap the door shut. It goes *tick-tock… DING!* Tap to
   open it.
8. **Decorate.** Pick the icing, shake on sprinkles, and choose what goes on
   top: a cherry, a strawberry, or **candles** (count them on, then blow them
   out).
9. **Serve!** Tap the treat and watch the customer gobble it up.
10. A twin treat goes into the **shop window**.

**Pip the mouse chef** helps out. If Mia is stuck for 3 seconds, a hand and
Pip hop over to show what to tap. Tickle Pip and he giggles.

### Made for little ones

- There are never more than 3 choices at once, all big buttons, and each
  button's tap area reaches a bit past its edge.
- No dragging is needed anywhere. Stirring works with taps too.
- Voice lines are 1 to 4 words. Colours, shapes and treats are named every time
  one is chosen.
- **Wishes are gentle.** The option that matches the customer's wish sparkles,
  and the hint hand points at it. If Mia picks something else, the customer
  still loves it ("Mmm! Yummy!"). Matching everything gets an extra "Just what
  I wanted!" and confetti.

### What each choice changes

| What you pick   | What it changes                                                        |
| --------------- | ---------------------------------------------------------------------- |
| Cake / cupcake / cookie | The whole treat                                                |
| The batter colour | The cake, muffin or cookie itself                                    |
| The shape       | The cake tin or cookie cutter (cupcakes get a little shaped cookie on top) |
| The icing       | The icing colour, with drips on cakes                                  |
| Sprinkle shakes | More shakes, more sprinkles                                            |
| On top          | A cherry, a strawberry or three candles                                |

### The customers

Bear, Hippo, Bunny, Piggy, Elephant, Dino, Owl and Kitty each eat in their own
way:

- Hippo gulps it in one enormous bite.
- Bunny nibbles.
- Elephant slurps it up with her trunk.
- Dino ROARS happily.
- Piggy ends up with icing on her snout.
- Owl spins round.
- Kitty licks her lips.
- Bear gets crumbs everywhere.

You can tap a customer at any time to hear their voice.

### Silly surprises

Sometimes an egg rolls away and Pip fetches it back. The flour can go *poof*
and make Pip sneeze, Pip sneaks a taste of the batter, and the oven can puff a
cake up extra big, *boing*!

### The shop window

- Every treat baked goes on the shelves. Tap one to hear its name ("Blue! Star!
  Cookie!").
- Animals who have visited stroll past and wave. Tap them to say hello.
- Tap the bell to play a tune, and the moon button to switch to night: the
  window glows and the shop cat curls up to sleep.
- **The shop grows** as more treats are baked. At 2, 3, 5, 7, 10, 13, 16 and
  20 treats you get bunting, a flower box, a shop cat, fairy lights, a cake
  stand showing the newest treat, a striped awning, balloons and a golden
  sign.

## Grown-up settings

**Hold the small gear (top right) for 3 seconds.** In there you can:

- Change the child's name, which is shown on the title, on the shop sign and
  in "Thank you, Mia!". It defaults to Mia.
- **Record your own voice** for every spoken line: tap ● to record, tap again
  to stop. Anything you don't record uses the device's built-in voice.
  Recordings stay on the device. Colours, shapes and treat names are separate
  words, so "Pink! Heart! Cupcake!" uses your voice too.
- Start a new shop window.

Microphone access needs the page to be served from a web address (`https://`
or `localhost`), not opened as a file.

## Running it

```bash
cd bakery
npm install
npm run dev      # dev server, also reachable from a tablet on the same Wi-Fi
npm run build    # production build
```

`npm run build` produces a **single self-contained file**, `dist/index.html`,
with all the code, art and sound built in. It works offline, except for the
rounded font, which falls back to a system font.

On a tablet, open it in the browser and use **Add to Home Screen** so it opens
full-screen like an app.

## Tech notes

- Vite + TypeScript, no framework, no runtime dependencies. It has the same
  structure as Butterfly Garden. `ui.ts`, `voice.ts`, `settings.ts` and the
  audio engine started as copies of that game's, so each game stays standalone.
- Everything in the scenes is SVG drawn in code (`src/art.ts`). The treats are
  built in layers (tin, body, icing and drips, sprinkles, topper). Cake and
  cookie shapes are stacked outlines, which makes a heart or star look 3D.
- The icons in the recipe strip and on the topping buttons are
  [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (MIT
  licence). `npm run sprites` copies them into `src/sprites.ts`.
- All sound is generated with the Web Audio API (`src/audio.ts`), including
  the bouncy music-box tune and each animal's voice.
- The bake is one scene from start to finish (`src/bake.ts`).
- Progress is saved in `localStorage` under `little-bakery.v1`, and
  recordings in IndexedDB.
