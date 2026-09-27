// The title screen (Ducky in a bubbly bath) and the duck shelf, where every
// duck found so far sits in a row.
import { ICONS, bubbleSVG, duckSVG } from './art';
import { sound } from './audio';
import { ITEMS, markItemsSeen, playerName, save, unseenItems } from './data';
import { Tub, roomBg } from './tub';
import { Scene, burst, burstAt, center, el, rand, replay } from '../../shared/ui';
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

export async function titleScreen(host: Host): Promise<'play' | 'shelf'> {
  const sc = new Scene(host.stage, 'title-scene');
  host.setScene(sc);

  // The bath sits low down, under the title; on tall screens the buttons
  // stand on the floor below it, otherwise in front of it.
  const bg = el('div', 'title-bg', sc.root);
  const tub = new Tub(
    sc,
    bg,
    (W, H, t) => {
      const btn = Math.min(180, Math.max(100, Math.min(W, H) * 0.22));
      const w = t.tall ? Math.min(W * 0.98, H * 0.55) : Math.min(W * 0.8, H * 1.05);
      const below = t.tall ? btn + 34 : H * 0.02;
      return { w, left: (W - w) / 2, top: H - below - (t.th / t.tw) * w };
    },
    { full: true, shelf: false },
  );
  tub.setRim(save.items.slice(-5));
  const ducky = tub.duck('ducky', 'hero', { x: tub.mid, d: 0.45, w: 210 });
  tub.foam(tub.span(0.1), 0.3, 200, 1);
  tub.foam(tub.span(0.85), 0.2, 220, 2);
  tub.foam(tub.span(1), 0.85, 170, 3);
  tub.foam(tub.span(0), 0.9, 150, 4);

  const logo = el('h1', 'logo', sc.root);
  const name = playerName();
  if (name) el('span', 'logo-name', logo, `${escapeHtml(name)}'s`);
  const words = el('span', 'logo-words', logo);
  let k = 0;
  for (const w of ['Ducky', 'Bath']) {
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
  play.setAttribute('aria-label', 'Bath time');
  const shelf = el('button', 'big-btn orange shelf-btn', buttons, `${ICONS.duck}<span class="new-star">★</span>`);
  shelf.setAttribute('aria-label', 'Your ducks');
  if (save.items.length) el('span', 'count-badge', shelf, String(save.items.length));
  if (unseenItems().length) shelf.classList.add('has-new');

  // Bubbles drift up out of the bath now and then; tap one and it pops.
  const blow = () => {
    if (!sc.alive || tub.air.childElementCount > 5) return;
    const b = el('div', 'bubble drift', tub.air, bubbleSVG());
    b.style.left = `${rand(15, 85)}%`;
    b.style.top = `${rand(20, 40)}%`;
    b.style.setProperty('--s', String(rand(0.7, 1.2)));
    b.addEventListener('animationend', () => b.remove());
  };
  const blowT = window.setInterval(blow, 1400);
  sc.addCleanup(() => clearInterval(blowT));
  blow();

  sc.on(sc.root, 'pointerdown', (e) => {
    const t = e.target as Element;
    const bub = t.closest('.bubble') as HTMLElement | null;
    if (bub) {
      e.preventDefault();
      const c = center(bub);
      sound.pop(rand(0.9, 1.3));
      burst(c.x, c.y, { kind: 'drop', count: 8, spread: 0.45, colors: ['#dff3ff', '#ffffff', '#ffb3e0'] });
      bub.remove();
      return;
    }
    const duck = t.closest('.floater.duck, .rim-duck') as HTMLElement | null;
    if (!duck) return;
    e.preventDefault();
    replay(duck.querySelector('.fl-art')!, 'hop');
    if (duck === ducky.el) {
      sound.squeak(0.85);
      setTimeout(() => sc.alive && sound.quack(), 280);
      void say('hello');
    } else sound.squeak();
  });

  // Greet once audio is available (after the first tap anywhere).
  let greeted = false;
  sc.on(document, 'pointerdown', () => {
    if (greeted) return;
    greeted = true;
    setTimeout(() => sc.alive && void say('title'), 150);
  });

  const i = await sc.tapAny([play, shelf], 8000, play);
  greeted = true;
  sound.pop();
  sc.destroy();
  return i === 0 ? 'play' : 'shelf';
}

// ---------------------------------------------------------------------------
// The duck shelf

export async function shelfScreen(host: Host): Promise<'play'> {
  const sc = new Scene(host.stage, 'shelf-scene');
  host.setScene(sc);

  const fresh = new Set(unseenItems());
  roomBg(sc.root);
  const wall = el('div', 'shelves', sc.root);
  const slots = ITEMS.map((f) => {
    const got = save.items.includes(f.id);
    const s = el('button', `shelf-duck${got ? ' got' : ''}${fresh.has(f.id) ? ' new' : ''}`, null, `<div class="fl-art">${duckSVG(f.id)}</div>`);
    s.setAttribute('aria-label', got ? f.name : 'Not found yet');
    sc.on(s, 'pointerdown', (e) => {
      e.preventDefault();
      if (!got) {
        sound.tapSoft();
        replay(s, 'shake');
        return;
      }
      replay(s.firstElementChild!, 'hop');
      sound.squeak(f.id === 'golden' ? 0.8 : 1);
      burstAt(s, { kind: 'sparkle', count: 8, spread: 0.6 });
      void say(`d-${f.id}`);
    });
    return s;
  });

  // Rows of ducks on wooden shelves: two rows of six, or four of three
  // on a tall screen.
  const arrange = () => {
    const W = sc.root.clientWidth || innerWidth;
    const H = sc.root.clientHeight || innerHeight;
    const cols = H > W ? 3 : 6;
    const rows = 12 / cols;
    wall.innerHTML = '';
    for (let r = 0; r < rows; r++) {
      const row = el('div', 'shelf-row', wall);
      slots.slice(r * cols, (r + 1) * cols).forEach((s) => row.append(s));
    }
    const box = wall.getBoundingClientRect();
    const size = Math.min((box.width / cols) * 0.8, (box.height / rows) * 0.72, 190);
    wall.style.setProperty('--duck', `${Math.floor(size)}px`);
  };
  arrange();
  sc.on(window, 'resize', arrange);

  const bottom = el('div', 's-bottom', sc.root);
  const play = el('button', `big-btn green play-btn-small${save.items.length ? '' : ' nudge'}`, bottom, ICONS.play);
  play.setAttribute('aria-label', 'Bath time');

  // --- Greeting and new ducks -----------------------------------------------------
  await sc.wait(400);
  if (!save.items.length) {
    await sc.until(say('shelfEmpty'), 4000);
  } else if (fresh.size) {
    await sc.wait(400);
    sound.fanfare();
    slots.forEach((s, i) => fresh.has(ITEMS[i].id) && burstAt(s, { kind: 'sparkle', count: 12 }));
    await sc.until(say('shelfNew'), 3500);
    markItemsSeen();
  } else {
    void say('shelf');
    if (save.items.length === ITEMS.length) {
      const r = wall.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, { kind: 'sparkle', count: 16, spread: 1.2 });
    }
  }

  await sc.tap(play, 0);
  sound.pop();
  sc.destroy();
  return 'play';
}
