# Games

Little browser games for Mia.

| Game | Description |
| ---- | ----------- |
| [🦋 Butterfly Garden](butterfly-garden/) | Grow a caterpillar into a butterfly, collect all 25 in the book, and play in a garden that grows. |
| [🧁 Little Bakery](bakery/) | Bake cakes, cupcakes and cookies for silly animal customers, and fill a shop window that grows. Made extra simple for ages 2 to 3. |
| [🌈 Colour Splash](colour-splash/) | Tap to splash colour onto 12 pictures that come alive when they're finished, and fill a gallery wall that grows. For ages 2 to 3. |

## How to run a game

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
