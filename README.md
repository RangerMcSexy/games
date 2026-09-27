# Games

Little browser games for little ones (about ages 2 to 4).

| Game | Description |
| ---- | ----------- |
| [🦋 Butterfly Garden](butterfly-garden/) | Grow a caterpillar into a butterfly, collect all 25 in the book, and play in a garden that grows. |
| [🧁 Little Bakery](bakery/) | Bake cakes, cupcakes and cookies for silly animal customers, and fill a shop window that grows. Made extra simple for ages 2 to 3. |
| [🌈 Colour Splash](colour-splash/) | Tap to splash colour onto 12 pictures that come alive when they're finished, and fill a gallery wall that grows. For ages 2 to 3. |
| [🎣 Little Fishing Pond](fishing-pond/) | Go fishing with Pip the penguin: tap the water, wait for a nibble, reel in 12 kinds of fish (and some silly surprises), and fill a fish tank that grows. For ages 2 to 3. |
| [🐸 Leapy Pond](leapy-pond/) | Hop across a big pond with Hoppy the frog: catch flies, find flowers by colour, count stepping stones, and meet 12 pond friends who come to live in your pond. For ages 2 to 4. |
| [🦄 Unicorn Dash](unicorn-dash/) | Dash across a sunny meadow with Sparkle the unicorn: tap to jump logs and fences, catch stars, pop balloons by colour, count jumps, and open a present at the end of every dash to find 12 things to dress her up in. For ages 2 to 4. |
| [🦆 Ducky Bath](ducky-bath/) | Bath time with Ducky: turn on the tap, squeeze in the bubbles, squeak ducks by colour, count the little ducks, scrub off the mud and find Baby Duck hiding in the foam. Pull the plug at the end, and a big bubble floats up with one of 12 rubber ducks to line up on the shelf. For ages 2 to 4. |

## Play them all (recommended)

You need [Node.js](https://nodejs.org) 18 or newer. From this folder:

```bash
npm run build            # builds every game (the first time takes a minute)
npm start                # serves them all
```

Open the `On a tablet:` address it prints (e.g. `http://192.168.1.20:8080`) on
a tablet or phone on the same Wi-Fi, and use **Add to Home Screen**. The icon
opens the **games home page** with a big button for each game. In a game,
the button at the top left of the title screen goes back to it.

Played this way, the games share a few things:

- **The child's name:** change it in any game's grown-up settings and every
  game (and the home page) uses it.
- **Voice recordings:** a line that's the same in several games, like "Yay!"
  or "Blue!", only needs recording once.
- **Progress:** the home page shows a badge on each game: butterflies grown,
  treats baked, pictures painted, kinds of fish found, pond friends met,
  presents found, rubber ducks found.

After the first visit the games are saved on the device, so they also work
**offline** (in the car, on a plane).

## The voice

Every spoken line has a clip in a natural, free AI voice
([Kokoro](https://github.com/hexgrad/kokoro), Apache 2.0, or
[Chatterbox](https://github.com/resemble-ai/chatterbox), MIT), made once and
bundled with the site. On each device the games play, in order of preference:

1. a grown-up's own recording of that line (grown-up settings: hold the gear),
2. the bundled clip (lines with the child's name use the version without it),
3. the device's built-in voice.

To remake the clips, e.g. after adding lines or to change voice, go to the
**Actions** tab, pick **Make voice clips** and **Run workflow**:
`audition` makes sample lines in several voices at `<site>/voice/audition/`,
`full` makes every line in the voice you name. The clips are saved to `main`
and the site is republished.

## Put them online (GitHub Pages)

Every change to `main` is built and published automatically by
`.github/workflows/pages.yml`. To switch it on, once: in the repository go to
**Settings → Pages**, and under **Build and deployment** set **Source** to
**GitHub Actions**. The games then appear at
`https://<your-user-name>.github.io/games/`.

GitHub Pages on a free account needs the repository to be public (private
repositories need a paid plan).

## How to run one game

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
cd bakery                # or whichever game folder
npm install              # first time only
npm run dev              # starts the game
```

- **On this computer:** open the `Local:` address it prints (e.g. `http://localhost:5173`).
- **On a tablet or phone:** make sure it's on the same Wi-Fi and open the
  `Network:` address it prints (e.g. `http://192.168.1.20:5173`).
  Then use **Add to Home Screen** so it opens full screen like an app.

### Make a single file to share

```bash
npm run build
```

This creates `dist/index.html`, the whole game in one file. Open it directly in
a browser, AirDrop or email it, or put it on any web host.

> Recording your own voice (grown-up settings: hold the gear for 3 seconds)
> needs the game to be opened from a web address, i.e. `npm run dev` or a
> hosted copy. Safari won't allow the microphone on a file opened directly.
