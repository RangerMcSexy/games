// The title screen and your pond, where the friends met on each trip live.
import { ICONS, flowerSVG, flySVG, friendSVG, friendSilhouetteSVG, frogFrontSVG, frogSVG, padSVG, reedClumpSVG } from './art';
import { sound } from './audio';
import { COLOURS, FRIENDS, markFriendsSeen, playerName, save, unseenFriends } from './data';
import { Scene, burst, burstAt, el, rand, replay } from './ui';
import { say } from './voice';

export interface Host {
  stage: HTMLElement;
  setScene(s: Scene): void;
}

const LOGO_COLORS = ['#ff6b6b', '#ffae5c', '#f5c542', '#6fcf6a', '#4ea8f5', '#a57ff0', '#ff8fc4'];

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

// ---------------------------------------------------------------------------
// Title

export async function titleScreen(host: Host): Promise<'play' | 'pond'> {
  const sc = new Scene(host.stage, 'title-scene');
  host.setScene(sc);

  const bg = el('div', 'title-bg', sc.root);
  el('div', 'water-pattern', bg);
  // A few pads and reeds around the edges.
  const deco: [number, number, number, boolean][] = [
    [8, 30, 12, false],
    [92, 22, 10, true],
    [86, 70, 14, false],
    [4, 86, 11, false],
    [60, 92, 9, true],
  ];
  deco.forEach(([x, y, s, flower], i) => {
    const d = el('div', 't-pad', bg, padSVG(i, rand(0, 360)));
    d.style.left = `${x}%`;
    d.style.top = `${y}%`;
    d.style.width = `${s}vmin`;
    if (flower) el('div', 'flower tiny', d, flowerSVG(COLOURS[i % COLOURS.length]));
  });
  const reeds = el('div', 't-reeds', bg, reedClumpSVG());
  reeds.style.left = '96%';
  reeds.style.top = '50%';

  // Hoppy on a big pad, with a fly buzzing about.
  const home = el('div', 't-home', bg, padSVG(1, 200, true));
  const frog = el('div', 't-frog', home, frogSVG());
  const fly = el('div', 't-fly', bg, flySVG());

  const logo = el('h1', 'logo', sc.root);
  const name = playerName();
  if (name) el('span', 'logo-name', logo, `${escapeHtml(name)}'s`);
  const words = el('span', 'logo-words', logo);
  let k = 0;
  for (const w of ['Leapy', 'Pond']) {
    const word = el('span', 'logo-word', words);
    for (const ch of w) {
      const s = el('span', 'logo-letter', word, ch);
      s.style.color = LOGO_COLORS[k % LOGO_COLORS.length];
      s.style.animationDelay = `${k * 0.08}s`;
      k++;
    }
  }

  const buttons = el('div', 'title-buttons', sc.root);
  const play = el('button', 'big-btn green play-btn', buttons, ICONS.play);
  play.setAttribute('aria-label', 'Start hopping');
  const pond = el('button', 'big-btn blue pond-btn', buttons, `${ICONS.pond}<span class="new-star">★</span>`);
  pond.setAttribute('aria-label', 'Your pond');
  if (save.friends.length) el('span', 'count-badge', pond, String(save.friends.length));
  if (unseenFriends().length) pond.classList.add('has-new');

  // Hoppy hops on the spot every so often, and when tapped.
  const hop = () => {
    replay(frog, 'hop');
    sound.hop();
    setTimeout(() => sc.alive && sound.land(), 520);
  };
  const hopT = window.setInterval(() => sc.alive && Math.random() < 0.5 && hop(), 5000);
  sc.addCleanup(() => clearInterval(hopT));
  sc.on(frog, 'pointerdown', (e) => {
    e.preventDefault();
    hop();
    sound.ribbit();
    void say('hoppy');
  });
  sc.on(fly, 'pointerdown', (e) => {
    e.preventDefault();
    sound.buzz();
    replay(fly, 'zoom');
  });

  // Greet once audio is available (after the first tap anywhere).
  let greeted = false;
  sc.on(document, 'pointerdown', () => {
    if (greeted) return;
    greeted = true;
    setTimeout(() => sc.alive && void say('title'), 150);
  });

  const i = await sc.tapAny([play, pond], 8000, play);
  greeted = true;
  sound.pop();
  sc.destroy();
  return i === 0 ? 'play' : 'pond';
}

// ---------------------------------------------------------------------------
// Your pond

type Spot = { x: number; y: number; kind: 'fly' | 'pad' | 'swim' };

/** Where each friend lives in the pond (per cent of the pond). */
const SPOTS: Record<string, Spot> = {
  dragonfly: { x: 16, y: 16, kind: 'fly' },
  bee: { x: 40, y: 12, kind: 'fly' },
  butterfly: { x: 64, y: 14, kind: 'fly' },
  turtle: { x: 86, y: 30, kind: 'pad' },
  otter: { x: 12, y: 44, kind: 'swim' },
  fish: { x: 36, y: 40, kind: 'swim' },
  swan: { x: 62, y: 40, kind: 'swim' },
  duck: { x: 86, y: 60, kind: 'swim' },
  ladybird: { x: 26, y: 72, kind: 'pad' },
  snail: { x: 72, y: 78, kind: 'pad' },
  tadpoles: { x: 8, y: 82, kind: 'swim' },
  babyfrog: { x: 92, y: 86, kind: 'pad' },
};

const FRIEND_SOUND: Record<string, () => void> = {
  duck: () => sound.quack(),
  swan: () => sound.quack(),
  babyfrog: () => sound.ribbit(),
  bee: () => sound.buzz(),
  dragonfly: () => sound.whoosh(),
  fish: () => sound.splash(),
  otter: () => sound.splash(),
  tadpoles: () => sound.bubble(1.3),
  butterfly: () => sound.sparkle(),
  snail: () => sound.boing(),
  ladybird: () => sound.giggle(),
  turtle: () => sound.pop(0.8),
};

export async function pondScreen(host: Host): Promise<'play'> {
  const sc = new Scene(host.stage, 'pond-scene');
  host.setScene(sc);

  const fresh = new Set(unseenFriends());
  const area = el('div', 'my-pond', sc.root);
  el('div', 'water-pattern', area);

  // Hoppy's own pad in the middle.
  const hoppyPad = el('div', 'p-spot pad-spot hoppy', area);
  hoppyPad.style.left = '48%';
  hoppyPad.style.top = '64%';
  el('div', 'p-pad', hoppyPad, padSVG(0, 160, true));
  const hoppy = el('div', 'p-friend', hoppyPad, frogFrontSVG());

  const friends = new Map<string, HTMLElement>();
  for (const id of save.friends) {
    const spot = SPOTS[id];
    const s = el('div', `p-spot ${spot.kind}-spot${fresh.has(id) ? ' new' : ''}`, area);
    s.style.left = `${spot.x}%`;
    s.style.top = `${spot.y}%`;
    s.style.animationDelay = `${-rand(0, 6)}s`;
    if (spot.kind === 'pad') el('div', 'p-pad', s, padSVG(FRIENDS.findIndex((f) => f.id === id), rand(0, 360)));
    if (spot.kind === 'swim') el('div', 'p-ring', s);
    const f = el('div', `p-friend f-${id}`, s, friendSVG(id));
    f.style.animationDelay = `${-rand(0, 3)}s`;
    friends.set(id, s);
  }

  const cheer = (id: string) => {
    const s = friends.get(id);
    if (!s) return;
    FRIEND_SOUND[id]?.();
    replay(s, 'wiggle');
    void say(`m-${id}`);
  };
  friends.forEach((s, id) =>
    sc.on(s, 'pointerdown', (e) => {
      e.preventDefault();
      cheer(id);
    }),
  );
  sc.on(hoppyPad, 'pointerdown', (e) => {
    e.preventDefault();
    sound.ribbit();
    replay(hoppy, 'hop');
    void say('ribbit');
  });
  // Tapping the water: a ripple.
  sc.on(area, 'pointerdown', (e) => {
    if ((e.target as Element).closest('.p-spot')) return;
    const r = area.getBoundingClientRect();
    const rip = el('div', 'ripple', area);
    rip.style.left = `${e.clientX - r.left}px`;
    rip.style.top = `${e.clientY - r.top}px`;
    sound.ripple();
    setTimeout(() => rip.remove(), 1300);
  });

  // Everyone there is to meet, one slot each.
  const bottom = el('div', 'p-bottom', sc.root);
  const strip = el('div', 'collection', bottom);
  FRIENDS.forEach((f) => {
    const got = save.friends.includes(f.id);
    const s = el('button', `slot${got ? ' got' : ''}`, strip, got ? friendSVG(f.id) : friendSilhouetteSVG(f.id));
    s.setAttribute('aria-label', got ? f.name : 'Not met yet');
    sc.on(s, 'pointerdown', (e) => {
      e.preventDefault();
      if (!got) {
        sound.tapSoft();
        replay(s, 'shake');
        return;
      }
      sound.pop();
      replay(s, 'wiggle');
      cheer(f.id);
    });
  });
  const play = el('button', `big-btn green play-btn-small${save.friends.length ? '' : ' nudge'}`, bottom, ICONS.play);
  play.setAttribute('aria-label', 'Start hopping');

  // --- Greeting and new friends ----------------------------------------------------
  await sc.wait(400);
  if (!save.friends.length) {
    await sc.until(say('pondEmpty'), 4000);
  } else if (fresh.size) {
    await sc.wait(500);
    sound.fanfare();
    area.querySelectorAll('.new').forEach((n) => {
      n.classList.add('show-new');
      burstAt(n, { kind: 'sparkle', count: 14 });
    });
    await sc.until(say('pondNew'), 3500);
    markFriendsSeen();
  } else {
    void say('myPond');
    if (save.friends.length === FRIENDS.length) {
      const r = strip.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top, { kind: 'sparkle', count: 16, spread: 1.2 });
    }
  }

  await sc.tap(play, 0);
  sound.pop();
  sc.destroy();
  return 'play';
}
