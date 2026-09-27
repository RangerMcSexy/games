// The title screen (Pip on her street) and "your street", where every
// letter friend met so far has a house.
import { ICONS, postboxSVG } from './art';
import { sound } from './audio';
import { FRIENDS, markLettersSeen, playerName, save, unseenLetters } from './data';
import { type Host } from '../../shared/shell';
import { House, Town, backdrop } from './town';
import { Scene, burst, burstAt, el, replay } from '../../shared/ui';
import { say } from './voice';

const LOGO_COLORS = ['#ff6b6b', '#ffae5c', '#f5c542', '#6fcf6a', '#4ea8f5', '#a57ff0', '#ff8fc4'];

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** Tapping a house: its friend comes out and says their letter; an empty one just wobbles. */
function visit(sc: Scene, h: House) {
  h.knock();
  if (!h.letter) {
    sound.knock();
    return;
  }
  sound.knock();
  setTimeout(() => {
    if (!sc.alive) return;
    h.open();
    sound.creak();
    sound.boing();
    burstAt(h.door, { kind: 'sparkle', count: 8, spread: 0.6 });
    void say(`is-${h.letter}`);
    h.close(2200);
  }, 350);
}

// ---------------------------------------------------------------------------
// Title

export async function titleScreen(host: Host): Promise<'play' | 'street'> {
  const sc = new Scene(host.stage, 'title-scene');
  host.setScene(sc);

  const bg = el('div', 'title-bg', sc.root);
  const tall = innerHeight > innerWidth * 1.05;
  const town = new Town(sc, bg, { zone: tall ? 0.42 : 0.4, slots: 3 });
  // The latest friends met, or empty houses waiting for someone.
  const latest = save.letters.slice(-3);
  town.setHouses([...latest, ...Array<null>(3 - latest.length).fill(null)]);
  el('div', 'postbox', bg, postboxSVG());

  const logo = el('h1', 'logo', sc.root);
  const name = playerName();
  if (name) el('span', 'logo-name', logo, `${escapeHtml(name)}'s`);
  const words = el('span', 'logo-words', logo);
  let k = 0;
  for (const w of ['Postie', 'Pip']) {
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
  play.setAttribute('aria-label', 'Take the post');
  const street = el('button', 'big-btn orange street-btn', buttons, `${ICONS.street}<span class="new-star">★</span>`);
  street.setAttribute('aria-label', 'Your street');
  if (save.letters.length) el('span', 'count-badge', street, String(save.letters.length));
  if (unseenLetters().length) street.classList.add('has-new');

  sc.on(sc.root, 'pointerdown', (e) => {
    const t = e.target as Element;
    if (t.closest('.pip')) {
      e.preventDefault();
      town.wave();
      sound.honk();
      void say('hello');
      return;
    }
    const hEl = t.closest('.house');
    const h = town.houses.find((x) => x.el === hEl);
    if (h) {
      e.preventDefault();
      visit(sc, h);
    }
  });

  // Greet once audio is available (after the first tap anywhere).
  let greeted = false;
  sc.on(document, 'pointerdown', () => {
    if (greeted) return;
    greeted = true;
    setTimeout(() => sc.alive && void say('title'), 150);
  });

  const i = await sc.tapAny([play, street], 8000, play);
  greeted = true;
  sound.pop();
  sc.destroy();
  return i === 0 ? 'play' : 'street';
}

// ---------------------------------------------------------------------------
// Your street

export async function streetScreen(host: Host): Promise<'play'> {
  const sc = new Scene(host.stage, 'street-scene');
  host.setScene(sc);

  const fresh = new Set(unseenLetters());
  backdrop(sc.root);
  const wall = el('div', 'streets', sc.root);
  const houses = FRIENDS.map((f) => {
    const got = save.letters.includes(f.letter);
    const h = new House(wall, got ? f.letter : null);
    if (fresh.has(f.letter)) h.el.classList.add('new');
    sc.on(h.el, 'pointerdown', (e) => {
      e.preventDefault();
      if (!got) {
        sound.tapSoft();
        replay(h.el, 'shake');
        return;
      }
      visit(sc, h);
    });
    return h;
  });

  // Rows of houses along little streets: two rows of six, or four of three
  // on a tall screen.
  const arrange = () => {
    const W = sc.root.clientWidth || innerWidth;
    const H = sc.root.clientHeight || innerHeight;
    const cols = H > W ? 3 : 6;
    const rows = 12 / cols;
    wall.innerHTML = '';
    for (let r = 0; r < rows; r++) {
      const row = el('div', 'street-row', wall);
      houses.slice(r * cols, (r + 1) * cols).forEach((h) => row.append(h.el));
    }
    const box = wall.getBoundingClientRect();
    const size = Math.min((box.width / cols) * 0.86, (box.height / rows / 1.25) * 0.86, 200);
    wall.style.setProperty('--house', `${Math.floor(size)}px`);
  };
  arrange();
  sc.on(window, 'resize', arrange);

  const bottom = el('div', 's-bottom', sc.root);
  const play = el('button', `big-btn green play-btn-small${save.letters.length ? '' : ' nudge'}`, bottom, ICONS.play);
  play.setAttribute('aria-label', 'Take the post');

  // --- Greeting and new friends ---------------------------------------------------
  await sc.wait(400);
  if (!save.letters.length) {
    await sc.until(say('streetEmpty'), 4000);
  } else if (fresh.size) {
    await sc.wait(400);
    sound.fanfare();
    for (const h of houses) if (h.letter && fresh.has(h.letter)) burstAt(h.el, { kind: 'sparkle', count: 12 });
    await sc.until(say('streetNew'), 3500);
    // The newest friend comes out to say hello.
    const newest = houses.find((h) => h.letter === save.letters[save.letters.length - 1]);
    if (newest && fresh.has(newest.letter!)) visit(sc, newest);
    markLettersSeen();
  } else {
    void say('street');
    if (save.letters.length === FRIENDS.length) {
      const r = wall.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, { kind: 'sparkle', count: 16, spread: 1.2 });
    }
  }

  await sc.tap(play, 0);
  sound.pop();
  sc.destroy();
  return 'play';
}
