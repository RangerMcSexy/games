# 🦋 Butterfly Garden

A gentle, no-reading-required browser game for little ones (about age 4) about
how a caterpillar becomes a butterfly. It works with a finger on a tablet or
with a mouse.

## How to play

1. **Pick an egg**, then tap, tap, tap until it hatches.
2. **Feed the hungry caterpillar** 5 yummy foods. Each bite adds a coloured
   stripe to its body.
3. **Wrap it up** into a chrysalis, then **pick a sticker** to decorate it.
4. **Night time**: tap the stars and they play *Twinkle Twinkle Little Star*.
5. **Good morning!** Tap the wiggling chrysalis to help the butterfly out.
6. The new butterfly flies off to your **garden**. You can tap it there to
   hear its name.

### What decides the butterfly

| What you do           | What it changes                                                   |
| --------------------- | ----------------------------------------------------------------- |
| The egg you pick      | Wing **shape**: Puffwing, Zipwing, Swallowtail or Sweetheart       |
| The 5 foods you feed  | Wing **colours**: the caterpillar's stripes become the wings       |
| The sticker you pick  | Wing **pattern**: dots, stripes, hearts or stars                   |
| A rare golden leaf ✨ | A **golden** shimmering butterfly (and a gold star in the book)    |

### The collection

The **Butterfly Book** (the blue book button in the garden) has 16 spaces: one
for each egg and sticker pair. The spaces you haven't found yet show a grey
outline of that butterfly. Tap an empty space and the game says which egg and
sticker will fill it. Fill all 16 for a special celebration.

Grown-ups: to start a fresh book, open it and **hold the little bin icon for
3 seconds**. Progress is saved in the browser (`localStorage`).

## Running it

```bash
cd butterfly-garden
npm install
npm run dev      # dev server (also reachable from a tablet on the same Wi-Fi)
npm run build    # production build
```

`npm run build` produces a **single self-contained file**, `dist/index.html`,
with all the code, art and sound built in. You can double-click it, AirDrop it
to an iPad, or put it on any static host. It works offline, except for the
rounded font, which falls back to a system font.

For the best experience on a tablet, open it in the browser and use **Add to
Home Screen**. It then opens full-screen like an app.

## Tech notes

- Vite + TypeScript, no framework, no runtime dependencies.
- All artwork is SVG generated in code (`src/art.ts`); there are no image files.
- All sound is generated live with the Web Audio API (`src/audio.ts`),
  including a soft lullaby music loop. Spoken prompts use the browser's speech
  synthesis. Music and sound each have their own toggle at the top right.
- Built for toddlers: large touch targets, no fail states, and no text needed.
  A pointing-hand hint appears when the child hasn't tapped anything for a few
  seconds. Zoom, scrolling, text selection and long-press menus are disabled.
