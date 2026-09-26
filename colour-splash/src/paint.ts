// The colouring scene: pick a paint pot, tap a part of the picture, and a
// splash of colour spreads out from the finger. When every part is painted,
// the picture comes alive and goes into the gallery.
import { ICONS, potSVG } from './art';
import { sound } from './audio';
import { PAINT, PAINTS, RAINBOW_STOPS, addPainting, save, uid, type PaintId } from './data';
import { guide } from './guide';
import { paintFill, pictureSVG, regionsOf, type Picture } from './pictures';
import type { Host } from './screens';
import { Scene, burst, center, el, hint, pick, replay } from './ui';
import { say } from './voice';

export type PaintEnd = 'gallery' | 'next';

/** Painting has lots of little pauses, so the hand waits a little longer than elsewhere. */
const PAINT_HINT_MS = 4500;
const SPLASH_MS = 430;

export async function paint(host: Host, pic: Picture): Promise<PaintEnd> {
  const sc = new Scene(host.stage, 'paint-scene');
  host.setScene(sc);
  guide.show();

  // --- The picture ------------------------------------------------------------
  const area = el('div', 'pic-area', sc.root);
  const box = el('div', 'pic-box', area);
  const { svg: markup, uid: u } = pictureSVG(pic);
  box.innerHTML = markup;
  const svg = box.querySelector('svg')!;
  const regions = regionsOf(pic);
  const fills: Record<string, PaintId> = {};
  const regionEl = (id: string) => svg.querySelector<SVGPathElement>(`.rg[data-r="${id}"]`)!;
  const empty = () => regions.filter((g) => !(g.r in fills));

  // --- The paint pots -----------------------------------------------------------
  const tray = el('div', 'paint-tray', sc.root);
  const pots = PAINTS.map((c) => {
    const b = el('button', `pot pot-${c}`, tray, potSVG(c));
    b.setAttribute('aria-label', PAINT[c].name);
    return b;
  });
  const magicBtn = el('button', 'round-btn magic-btn', tray, ICONS.magic);
  magicBtn.setAttribute('aria-label', 'Magic paint');

  let current: PaintId = pick(PAINTS.slice(0, 8));
  const select = (c: PaintId) => {
    current = c;
    pots.forEach((p, i) => p.classList.toggle('selected', PAINTS[i] === c));
  };
  select(current);

  // Dot sits just above the pots so she never covers them.
  const liftGuide = () => guide.setLift(Math.max(0, innerHeight - tray.getBoundingClientRect().top));
  requestAnimationFrame(liftGuide);
  sc.on(window, 'resize', liftGuide);
  sc.addCleanup(() => guide.setLift(0));

  // --- Splashing paint ----------------------------------------------------------
  let clipN = 0;
  const NS = 'http://www.w3.org/2000/svg';

  /** A circle of colour grows from the finger, clipped to the region, then the region takes the colour. */
  function splash(id: string, c: PaintId, clientX: number, clientY: number) {
    const target = regionEl(id);
    // The region's own screen transform, so shapes inside scaled groups splash in the right place.
    const ctm = target.getScreenCTM();
    if (!ctm) return void target.setAttribute('fill', paintFill(c, u));
    const pt = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    const bb = target.getBBox();
    const reach =
      Math.max(
        Math.hypot(pt.x - bb.x, pt.y - bb.y),
        Math.hypot(pt.x - bb.x - bb.width, pt.y - bb.y),
        Math.hypot(pt.x - bb.x, pt.y - bb.y - bb.height),
        Math.hypot(pt.x - bb.x - bb.width, pt.y - bb.y - bb.height),
      ) + 8;
    const d = target.getAttribute('d')!;
    const clipId = `${u}-clip${++clipN}`;
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('pointer-events', 'none');
    g.innerHTML = `<clipPath id="${clipId}"><path d="${d}"/></clipPath>
      <g clip-path="url(#${clipId})"><circle class="splash-dot" cx="${pt.x}" cy="${pt.y}" r="${reach}" fill="${paintFill(c, u)}"/></g>
      <path d="${d}" fill="none" stroke="${target.getAttribute('stroke')}" stroke-width="6" stroke-linejoin="round"/>`;
    target.after(g);
    const dot = g.querySelector('circle')!;
    dot.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: SPLASH_MS, easing: 'cubic-bezier(.2,.8,.3,1)' }).finished.then(
      () => {
        target.setAttribute('fill', paintFill(c, u));
        g.remove();
      },
      () => {},
    );
  }

  const dropColours = (c: PaintId) => (c === 'rainbow' ? RAINBOW_STOPS : [PAINT[c].hex]);

  /** A point well inside a region, in screen coordinates (for the hint and the magic star). */
  function pointIn(id: string) {
    const target = regionEl(id);
    const b = target.getBoundingClientRect();
    const cx = b.left + b.width / 2;
    const cy = b.top + b.height / 2;
    let best: { x: number; y: number } | null = null;
    let bestD = Infinity;
    const N = 12;
    for (let i = 1; i < N; i++) {
      for (let j = 1; j < N; j++) {
        const x = b.left + (b.width * i) / N;
        const y = b.top + (b.height * j) / N;
        if (document.elementFromPoint(x, y) !== target) continue;
        const dist = Math.hypot(x - cx, y - cy);
        if (dist < bestD) {
          bestD = dist;
          best = { x, y };
        }
      }
    }
    return best ?? { x: cx, y: cy };
  }

  // --- The idle hint: point at a part that's still white ------------------------
  const marker = el('div', 'hint-marker', sc.root);
  let hintRegion: string | null = null;
  const hintTarget = () => {
    if (!hintRegion || hintRegion in fills) {
      const left = empty();
      // Point at the picture itself before the background.
      const pool = left.filter((g) => g.r !== 'bg');
      hintRegion = pick(pool.length ? pool : left).r;
    }
    const p = pointIn(hintRegion);
    marker.style.left = `${p.x}px`;
    marker.style.top = `${p.y}px`;
    return marker;
  };
  let stopHint = () => {};
  let done = false;
  const idle = () => {
    stopHint();
    if (!done) stopHint = hint.schedule(hintTarget, PAINT_HINT_MS);
  };
  sc.addCleanup(() => stopHint());

  // --- Taps ---------------------------------------------------------------------
  let finish: () => void = () => {};
  const completed = sc.when<void>((resolve) => {
    finish = resolve;
  });
  let painted = 0;

  const fillRegion = (id: string, c: PaintId, x: number, y: number) => {
    const fresh = !(id in fills);
    fills[id] = c;
    splash(id, c, x, y);
    if (!fresh) return;
    painted++;
    if (!empty().length) finish();
    else if (painted % 4 === 0) {
      guide.hop();
      void say(pick(['wow', 'pretty', 'lovely']));
    }
  };

  sc.on(svg, 'pointerdown', (e) => {
    e.preventDefault();
    const target = (e.target as Element).closest?.('.rg');
    if (done) {
      // A finished picture just giggles and sparkles.
      sound.picture(pic.id);
      replay(box, 'wiggle');
      burst(e.clientX, e.clientY, { kind: 'sparkle', count: 8, spread: 0.6 });
      return;
    }
    if (!target) return;
    const id = (target as HTMLElement).dataset.r!;
    sound.splash(PAINTS.indexOf(current));
    burst(e.clientX, e.clientY, { kind: 'drop', count: 8, colors: dropColours(current), spread: 0.45, size: 0.9 });
    fillRegion(id, current, e.clientX, e.clientY);
    idle();
  });

  pots.forEach((p, i) =>
    p.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (done) return;
      const c = PAINTS[i];
      select(c);
      replay(p, 'pick');
      sound.bloop(i);
      void say(`c-${c}`);
      idle();
    }),
  );

  magicBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (done) return;
    const left = empty();
    if (!left.length) return;
    // The magic star paints a part in the colour it "should" be.
    const g = pick(left);
    const p = pointIn(g.r);
    replay(magicBtn, 'pick');
    sound.magic();
    burst(p.x, p.y, { kind: 'sparkle', count: 12, spread: 0.7 });
    if (Math.random() < 0.35) void say('magic');
    fillRegion(g.r, g.c, p.x, p.y);
    idle();
  });

  // --- Play ---------------------------------------------------------------------
  idle();
  if (save.paintings.length < 3) {
    await sc.wait(900);
    void say('tapToPaint');
  }

  await completed;
  done = true;
  stopHint();
  hint.hide();
  await sc.wait(SPLASH_MS + 150);

  addPainting({ id: uid(), pic: pic.id, fills: { ...fills }, created: Date.now() });
  sound.fanfare();
  const c = center(box);
  burst(c.x, c.y, { count: 40, spread: 1.8 });
  burst(c.x, c.y, { kind: 'sparkle', count: 16, spread: 1.4 });
  replay(box, 'shine');
  guide.cheer();
  await sc.until(say('done'), 3500);

  svg.classList.add('alive');
  sound.picture(pic.id);
  void say('alive');
  tray.classList.add('away');
  const end = el('div', 'end-buttons', sc.root);
  const galleryBtn = el('button', 'big-btn orange', end, ICONS.gallery);
  galleryBtn.setAttribute('aria-label', 'Gallery');
  el('span', 'count-badge', galleryBtn, String(save.paintings.length));
  const nextBtn = el('button', 'big-btn green nudge', end, ICONS.play);
  nextBtn.setAttribute('aria-label', 'Paint another');
  const i = await sc.tapAny([galleryBtn, nextBtn], 7000, nextBtn);
  sound.pop();
  sc.destroy();
  return i === 0 ? 'gallery' : 'next';
}
