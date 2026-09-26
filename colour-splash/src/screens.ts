// The title screen, the picture picker and the gallery wall (the collection).
import { ICONS, balloonsSVG, buntingSVG, easelSVG, lightsSVG, rainbowSVG, rugSVG, splatPath } from './art';
import { sound } from './audio';
import { PAINT, PAINTS, markUnlocksSeen, playerName, save, unlocked, unseenUnlocks, type Painting, type UnlockId } from './data';
import { guide } from './guide';
import { PICTURES, naturalFills, pictureById, pictureSVG, type Picture } from './pictures';
import { HINT_MS, Scene, burst, burstAt, el, pick, rand, replay } from './ui';
import { say } from './voice';

export interface Host {
  stage: HTMLElement;
  setScene(s: Scene): void;
}

const LOGO_COLORS = ['#ff6b6b', '#ffae5c', '#f5c542', '#86d07a', '#6fb2f2', '#b38ff0', '#ff9fcc'];

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** The newest painting of a picture, if Mia has painted it before. */
const lastPaintingOf = (id: string) => [...save.paintings].reverse().find((p) => p.pic === id);

/** A picture that plays its "alive" animation for a few seconds when tapped. */
function makeLively(holder: HTMLElement, pic: Picture) {
  let t = 0;
  holder.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const svg = holder.querySelector('svg.pic');
    if (!svg) return;
    svg.classList.add('alive');
    clearTimeout(t);
    t = window.setTimeout(() => svg.classList.remove('alive'), 3600);
    sound.picture(pic.id);
    replay(holder, 'wiggle');
    burstAt(holder, { kind: 'sparkle', count: 8, spread: 0.6 });
    void say(pic.line);
  });
}

// ---------------------------------------------------------------------------
// Title

export async function titleScreen(host: Host): Promise<'play' | 'gallery'> {
  const sc = new Scene(host.stage, 'title-scene');
  host.setScene(sc);
  guide.show();

  const logo = el('h1', 'logo', sc.root);
  const name = playerName();
  if (name) el('span', 'logo-name', logo, `${escapeHtml(name)}'s`);
  const words = el('span', 'logo-words', logo);
  let k = 0;
  for (const w of ['Colour', 'Splash']) {
    const word = el('span', 'logo-word', words);
    for (const ch of w) {
      const s = el('span', 'logo-letter', word, ch);
      s.style.color = LOGO_COLORS[k % LOGO_COLORS.length];
      s.style.animationDelay = `${k * 0.08}s`;
      k++;
    }
  }

  // Three pictures on the wall: the newest paintings, or some to get started.
  const mine = save.paintings
    .slice(-3)
    .map((p) => ({ pic: pictureById(p.pic), fills: p.fills }))
    .filter((x): x is { pic: Picture; fills: Painting['fills'] } => !!x.pic);
  const demo = ['sun', 'fish', 'butterfly'].map((id) => {
    const pic = pictureById(id)!;
    return { pic, fills: naturalFills(pic) };
  });
  const shown = [...mine, ...demo].slice(0, 3);
  const row = el('div', 'title-pics', sc.root);
  shown.forEach(({ pic, fills }, i) => {
    const b = el('div', 'title-pic', row, pictureSVG(pic, fills).svg);
    b.style.setProperty('--d', `${i * 0.35}s`);
    b.style.setProperty('--tilt', `${[-5, 2, 6][i]}deg`);
    makeLively(b, pic);
  });

  const buttons = el('div', 'title-buttons', sc.root);
  const play = el('button', 'big-btn green play-btn', buttons, ICONS.play);
  play.setAttribute('aria-label', 'Paint');
  const gallery = el('button', 'big-btn orange', buttons, ICONS.gallery);
  gallery.setAttribute('aria-label', 'Gallery');
  if (save.paintings.length) el('span', 'count-badge', gallery, String(save.paintings.length));

  // Greet once audio is available (after the first tap anywhere).
  let greeted = false;
  sc.on(document, 'pointerdown', () => {
    if (greeted) return;
    greeted = true;
    setTimeout(() => sc.alive && void say('title'), 150);
  });

  const i = await sc.tapAny([play, gallery], 8000, play);
  greeted = true;
  sound.pop();
  sc.destroy();
  return i === 0 ? 'play' : 'gallery';
}

// ---------------------------------------------------------------------------
// Picture picker: three at a time, never more.

const PER_PAGE = 3;
let pickerPage = 0;

export async function pickerScreen(host: Host): Promise<Picture> {
  const sc = new Scene(host.stage, 'picker-scene');
  host.setScene(sc);
  guide.show();

  const pages = Math.ceil(PICTURES.length / PER_PAGE);
  const cardsBox = el('div', 'pick-cards', sc.root);
  const controls = el('div', 'pick-buttons', sc.root);
  const more = el('button', 'big-btn blue more-btn', controls, ICONS.more);
  more.setAttribute('aria-label', 'More pictures');

  let cards: HTMLElement[] = [];
  let shown: Picture[] = [];
  const render = () => {
    cardsBox.innerHTML = '';
    shown = PICTURES.slice(pickerPage * PER_PAGE, pickerPage * PER_PAGE + PER_PAGE);
    cards = shown.map((pic, i) => {
      // Show Mia's own colours if she has painted it before.
      const last = lastPaintingOf(pic.id);
      const b = el('button', 'pick-card', cardsBox, pictureSVG(pic, last?.fills ?? naturalFills(pic)).svg);
      b.setAttribute('aria-label', pic.id);
      b.style.setProperty('--d', `${i * 0.08}s`);
      b.style.setProperty('--tilt', `${[-3, 2, -1][i]}deg`);
      if (last) el('span', 'done-star', b, '★');
      return b;
    });
  };
  render();

  void say('pickPicture');
  for (;;) {
    const i = await sc.tapAny([...cards, more], HINT_MS);
    if (i === cards.length) {
      pickerPage = (pickerPage + 1) % pages;
      sound.whoosh();
      replay(more, 'pick');
      cardsBox.classList.add('flip');
      await sc.wait(220);
      render();
      cardsBox.classList.remove('flip');
      void say('more');
      continue;
    }
    const pic = shown[i];
    const card = cards[i];
    sound.pop();
    card.classList.add('chosen');
    burstAt(card, { kind: 'sparkle', count: 14, spread: 0.9 });
    void say(pic.line);
    await sc.wait(800);
    sc.destroy();
    return pic;
  }
}

// ---------------------------------------------------------------------------
// Gallery wall

let galleryPage = 0;
const FRAME_COLOURS = ['#ffb3c6', '#ffd68a', '#a8d8ff', '#b8e6a8', '#d6c2fa', '#ffc49b'];

export async function galleryScreen(host: Host): Promise<'play'> {
  const sc = new Scene(host.stage, 'gallery-scene');
  host.setScene(sc);
  guide.hide();

  const have = new Set<UnlockId>(unlocked());
  const fresh = new Set<UnlockId>(unseenUnlocks());
  const cls = (id: UnlockId, extra = '') => `unlock u-${id}${fresh.has(id) ? ' new' : ''}${extra}`;
  const paintings = save.paintings.filter((p) => pictureById(p.pic)).reverse();

  const wall = el('div', 'g-wall', sc.root);
  if (have.has('rainbow')) el('div', cls('rainbow'), sc.root, rainbowSVG());
  if (have.has('bunting')) el('div', cls('bunting'), sc.root, buntingSVG());
  if (have.has('lights')) el('div', cls('lights'), sc.root, lightsSVG());
  const signText = playerName() ? `${escapeHtml(playerName())}'s Pictures` : 'My Pictures';
  el('div', `g-sign${have.has('sign') ? ' golden' : ''}${fresh.has('sign') ? ' unlock new' : ''}`, sc.root, `<span>${signText}</span>`);
  el('div', 'g-floor', sc.root);
  if (have.has('rug')) el('div', cls('rug'), sc.root, rugSVG());
  if (have.has('balloons')) el('div', cls('balloons'), sc.root, balloonsSVG());
  if (have.has('easel') && paintings.length) {
    const newest = paintings[0];
    const pic = pictureById(newest.pic)!;
    const easel = el('div', cls('easel'), sc.root, `<div class="easel-pic">${pictureSVG(pic, newest.fills).svg}</div>${easelSVG()}`);
    makeLively(easel, pic);
  }

  const framesBox = el('div', 'g-frames', sc.root);
  const controls = el('div', 'gallery-buttons', sc.root);
  const more = el('button', 'big-btn blue more-btn', controls, ICONS.more);
  more.setAttribute('aria-label', 'More pictures');
  const play = el('button', `big-btn green${paintings.length ? '' : ' nudge'}`, controls, ICONS.play);
  play.setAttribute('aria-label', 'Paint');

  // --- The frames: as many as fit, newest first -------------------------------
  const justPainted = paintings.length > 0 && Date.now() - paintings[0].created < 60_000;
  let perPage = 1;
  const layout = () => {
    framesBox.innerHTML = '';
    const w = framesBox.clientWidth || innerWidth * 0.8;
    const h = framesBox.clientHeight || innerHeight * 0.5;
    const gap = Math.min(w, h) * 0.06;
    const minSize = Math.max(96, Math.min(innerWidth, innerHeight) * 0.2);
    const cols = Math.max(1, Math.floor((w + gap) / (minSize + gap)));
    const rows = Math.max(1, Math.floor((h + gap) / (minSize + gap)));
    perPage = Math.min(12, cols * rows);
    const pages = Math.max(1, Math.ceil(paintings.length / perPage));
    galleryPage %= pages;
    more.classList.toggle('hidden', pages < 2);
    const items = paintings.slice(galleryPage * perPage, galleryPage * perPage + perPage);
    // Use as few rows as possible, and make the frames as big as they can be.
    const useCols = Math.min(cols, Math.max(1, items.length));
    const useRows = Math.max(1, Math.ceil(items.length / useCols));
    const size = Math.min((w - gap * (useCols - 1)) / useCols, (h - gap * (useRows - 1)) / useRows);
    framesBox.style.gridTemplateColumns = `repeat(${useCols}, ${size}px)`;
    framesBox.style.gap = `${gap}px`;
    items.forEach((p, i) => {
      const pic = pictureById(p.pic)!;
      const newest = galleryPage === 0 && i === 0 && justPainted;
      const b = el('button', `g-frame${newest ? ' newest' : ''}`, framesBox, pictureSVG(pic, p.fills).svg);
      b.style.width = b.style.height = `${size}px`;
      b.style.setProperty('--frame', FRAME_COLOURS[(paintings.length - galleryPage * perPage - i) % FRAME_COLOURS.length]);
      b.style.setProperty('--tilt', `${((i * 37) % 7) - 3}deg`);
      b.style.setProperty('--d', `${i * 0.05}s`);
      b.setAttribute('aria-label', pic.id);
      makeLively(b, pic);
    });
  };
  requestAnimationFrame(layout);
  let resizeT = 0;
  sc.on(window, 'resize', () => {
    clearTimeout(resizeT);
    resizeT = window.setTimeout(layout, 150);
  });

  // --- Tap the wall for a paint splat -----------------------------------------
  let splats = 0;
  let saidSplat = false;
  sc.on(wall, 'pointerdown', (e) => {
    e.preventDefault();
    if (splats > 14) return;
    splats++;
    const c = PAINT[pick(PAINTS.slice(0, 8))].hex;
    const s = el('div', 'g-splat', sc.root, `<svg viewBox="-50 -50 100 100"><path d="${splatPath(Math.floor(rand(1, 999)), 36, 9)}" fill="${c}"/></svg>`);
    s.style.left = `${e.clientX}px`;
    s.style.top = `${e.clientY}px`;
    s.style.setProperty('--r', `${rand(0, 360)}deg`);
    sound.splat();
    burst(e.clientX, e.clientY, { kind: 'drop', count: 6, colors: [c], spread: 0.4, size: 0.8 });
    if (!saidSplat || Math.random() < 0.15) {
      saidSplat = true;
      void say('splat');
    }
    window.setTimeout(() => {
      s.classList.add('fade');
      window.setTimeout(() => {
        s.remove();
        splats--;
      }, 900);
    }, 3200);
  });

  // --- Greeting and new surprises ----------------------------------------------
  await sc.wait(400);
  if (!paintings.length) {
    await sc.until(say('galleryEmpty'), 4000);
  } else if (fresh.size) {
    await sc.wait(600);
    sound.fanfare();
    sc.root.querySelectorAll('.new').forEach((n) => {
      n.classList.add('show-new');
      burstAt(n, { kind: 'sparkle', count: 14 });
    });
    await sc.until(say('galleryNew'), 3500);
    markUnlocksSeen();
  } else {
    void say('gallery');
  }

  for (;;) {
    const i = await sc.tapAny([play, more], 0);
    if (i === 1) {
      galleryPage++;
      sound.whoosh();
      replay(more, 'pick');
      layout();
      continue;
    }
    sound.pop();
    sc.destroy();
    return 'play';
  }
}
