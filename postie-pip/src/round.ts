// The post round. Pip walks down the street with a bag of parcels, each
// with a letter on its label: find the door with the same letter and the
// friend who lives there comes out for it ("S is for snake!").
//
// Each round is eight moves (the dots along the bottom):
// - meet a new letter, when it's time for one (knock on its door),
// - deliver parcels (two doors to choose from at first, then three), the
//   new letter coming round often and the letters found hard more often
//   than the ones known well; later on some parcels show the friend's
//   picture instead of the letter,
// - draw a letter by tapping its dots,
// - and at the end, a parcel for the child: the letter friend just learned.
//
// A new letter comes along every round or so, until the whole alphabet has
// moved into the street.
//
// Nothing can go wrong: a wrong door opens a crack, its friend peeps out and
// says their own letter, and steps aside. The helping hand never gives the
// answer away: it visits every door until only the right one is left.
import { ICONS, LETTER_BOX, STROKES, friendSVG, letterSVG } from './art';
import { sound } from './audio';
import { FRIENDS, MAX_SCORE, finishRound, friendOf, lookAlike, nextNew, record, save, scoreOf, unseenLetters, type Friend } from './data';
import { type Host } from '../../shared/shell';
import { House, Town } from './town';
import { HINT_MS, Scene, burst, burstAt, center, el, hint, pick, replay, shuffle } from '../../shared/ui';
import { say, sayAll } from './voice';
import { stickerMoment } from '../../shared/sticker-moment';
import { STICKER_ART } from './stickers';

type Move = 'meet' | 'deliver' | 'picture' | 'trace' | 'goal';

/** Picture parcels start once this many letters have been learned. */
const PICTURES_FROM = 4;

/** The moves of one round: eight in all, the goal last. */
export function planRound(meet: boolean, pictures: boolean): Move[] {
  const mid: Move[] = Array.from({ length: meet ? 5 : 6 }, () => 'deliver');
  // Picture parcels, never first (the first move is always an easy one).
  if (pictures) for (const i of shuffle([1, 2, 3, 4]).slice(0, 2)) mid[i] = 'picture';
  mid.splice(3, 0, 'trace');
  return [...(meet ? (['meet'] as Move[]) : []), ...mid, 'goal'];
}

/** A weighted pick: letters found hard come round more often. */
function weighted(letters: string[], fresh: string | null): string {
  const w = letters.map((l) => (l === fresh ? 4 : 1 + (MAX_SCORE - scoreOf(l))));
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < letters.length; i++) if ((r -= w[i]) < 0) return letters[i];
  return letters[letters.length - 1];
}

export async function roundScreen(host: Host): Promise<'again' | 'street'> {
  const sc = new Scene(host.stage, 'round-scene');
  host.setScene(sc);

  const fresh = nextNew();
  const known = save.letters.slice();
  /** Every letter that can come up this round. */
  const pool = fresh ? [...known, fresh.letter] : known.length ? known : [FRIENDS[0].letter];
  const doorCount = save.rounds < 2 ? 2 : 3;

  const town = new Town(sc, sc.root, { zone: sc.root.clientHeight > sc.root.clientWidth * 1.05 ? 0.27 : 0.3, slots: 3 });
  const trail = el('div', 'trail', sc.root);

  // Words: the game's own lines always get said; the odd happy word only
  // when nothing else is being said.
  let quietUntil = 0;
  const talk = (id: string | string[]) => {
    quietUntil = performance.now() + 2600;
    const p = typeof id === 'string' ? say(id) : sayAll(id, 200);
    void p.then(() => (quietUntil = Math.min(quietUntil, performance.now() + 400)));
    return p;
  };
  const speak = (id: string | string[], ms = 5000) => sc.until(talk(id), ms);
  /** Speak, and give it at least `min` ms (so there's time to see, even with the sound off). */
  const speakFor = (id: string | string[], min: number, ms = 5000) => sc.until(Promise.all([talk(id), new Promise((r) => setTimeout(r, min))]), ms);
  let lastChirp = 0;
  const chirp = (id: string, every = 3500) => {
    const now = performance.now();
    if (now < quietUntil || now - lastChirp < every) return;
    lastChirp = now;
    void say(id);
  };

  // Pip says hello any time she's tapped.
  sc.on(sc.root, 'pointerdown', (e) => {
    const t = e.target as Element;
    if (t.closest('.pip')) {
      e.preventDefault();
      town.wave();
      sound.honk();
      chirp('hiPip', 6000);
    }
  });

  /** Someone comes out to say hello: door open, boing, sparkles. */
  const comeOut = (h: House) => {
    h.open();
    sound.creak();
    setTimeout(() => sc.alive && sound.boing(), 150);
    burstAt(h.door, { kind: 'sparkle', count: 12, spread: 0.7 });
  };

  // --- Meet a new letter ----------------------------------------------------------------

  async function meetMove(f: Friend) {
    const [h] = await town.walkTo([f.letter]);
    sound.chime();
    burstAt(h.door, { kind: 'sparkle', count: 16, spread: 1 });
    replay(h.door, 'hello-plaque');
    await speak(['newLetter', `l-${f.letter}`], 5000);
    h.el.classList.add('live');
    void talk('knock');
    await sc.tapAny([h.el], HINT_MS, h.door);
    h.el.classList.remove('live');
    h.knock();
    sound.knock();
    await sc.wait(450);
    comeOut(h);
    await sc.wait(300);
    await speakFor(`is-${f.letter}`, 1500, 4000);
    replay(h.door.querySelector('.plaque')!, 'hello-plaque');
    await speak(`l-${f.letter}`, 2500);
    h.close(400);
    await sc.wait(700);
  }

  // --- Deliver a parcel -----------------------------------------------------------------

  let last = '';
  let freshTimes = 0;
  let deliveriesLeft = 0;

  function pickTarget(picture: boolean): string {
    const f = fresh?.letter ?? null;
    if (f && !picture && (freshTimes === 0 || (freshTimes < 2 && deliveriesLeft <= 2))) return f;
    // A picture parcel is always for someone already met in an earlier round.
    const from = picture ? known : pool;
    const cands = from.length > 1 ? from.filter((l) => l !== last) : from;
    return weighted(cands, picture ? null : f);
  }

  /** The doors to choose from: the right one, and others that don't look like it (or each other). */
  function doorsFor(target: string, picture: boolean): string[] {
    const chosen = [target];
    const ok = (l: string) => !chosen.includes(l) && !chosen.some((c) => lookAlike(c, l));
    // Letters met so far first; for a letter parcel, ones still to come can fill in.
    const later = picture ? [] : shuffle(FRIENDS.map((f) => f.letter).filter((l) => !pool.includes(l)));
    for (const l of [...shuffle(pool), ...later]) if (chosen.length < doorCount && ok(l)) chosen.push(l);
    return shuffle(chosen);
  }

  async function deliverMove(picture: boolean) {
    const target = pickTarget(picture);
    if (!picture) deliveriesLeft--;
    if (target === fresh?.letter) freshTimes++;
    last = target;
    const houses = await town.walkTo(doorsFor(target, picture));
    const right = houses.find((h) => h.letter === target)!;
    sound.rustle();
    const parcel = await town.showParcel(picture ? { animal: friendOf(target)!.animal } : { letter: target });
    parcel.dataset.for = target;
    const ask = picture ? `pic-${target}` : `find-${target}`;
    houses.forEach((h) => h.el.classList.add('live'));
    void talk(ask);
    const misses = await sc.ask(
      houses.map((h) => h.el),
      houses.indexOf(right),
      async (i) => {
        // Not this one: the friend inside peeps out and says their letter.
        const h = houses[i];
        h.el.classList.remove('live');
        sound.nope();
        h.knock();
        h.peek();
        await speakFor(`is-${h.letter}`, 1600, 4000);
        h.close();
        await speak(ask, 4000);
      },
      HINT_MS + 1500,
    );
    record(target, misses === 0);
    houses.forEach((h) => h.el.classList.remove('live'));
    right.knock();
    sound.whoosh();
    await town.sendParcel(right);
    sound.knock();
    await sc.wait(350);
    comeOut(right);
    const c = center(right.door);
    burst(c.x, c.y, { count: 22, spread: 1 });
    await sc.wait(250);
    await speakFor(`is-${target}`, 1200, 4000);
    if (misses) chirp('yay', 0);
    else if (Math.random() < 0.35) chirp('thankYou', 0);
    else chirp(pick(['yay', 'wow']), 0);
    await sc.wait(900);
    right.close();
    await sc.wait(300);
  }

  // --- Draw the letter ------------------------------------------------------------------

  async function traceMove(letter: string) {
    const layer = el('div', 'trace', sc.root);
    const card = el('div', 'trace-card', layer);
    const f = friendOf(letter)!;
    card.style.setProperty('--ink', f.roof);
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', LETTER_BOX);
    card.append(svg);
    const mk = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent: Element = svg) => {
      const e = document.createElementNS(ns, tag);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
      parent.append(e);
      return e;
    };
    const strokes = STROKES[letter];
    const guides = strokes.map((d) => mk('path', { d, class: 'guide' }));
    const inks = strokes.map((d) => mk('path', { d, class: 'ink' }));
    // The dots to tap, spaced along each stroke, in writing order.
    const dots: { stroke: number; at: number; x: number; y: number; el: SVGCircleElement }[] = [];
    const lengths = guides.map((g) => g.getTotalLength());
    // Zoom in on the letter, whatever its shape, with room round it for the dots.
    const bb = svg.getBBox();
    const pad = 14;
    svg.setAttribute('viewBox', `${bb.x - pad} ${bb.y - pad} ${bb.width + pad * 2} ${bb.height + pad * 2}`);
    lengths.forEach((len, s) => {
      inks[s].style.strokeDasharray = `${len} ${len}`;
      inks[s].style.strokeDashoffset = String(len);
      const start = guides[s].getPointAtLength(0);
      mk('circle', { cx: start.x, cy: start.y, r: 4.5, class: 'start' });
      // (The dot on an i or a j is a single tap.)
      const k = len < 8 ? 1 : Math.max(2, Math.round(len / 34));
      for (let j = 1; j <= k; j++) {
        const at = (len * j) / k;
        const p = guides[s].getPointAtLength(at);
        dots.push({ stroke: s, at, x: p.x, y: p.y, el: mk('circle', { cx: p.x, cy: p.y, r: 6.5, class: 'dot' }) });
      }
    });
    requestAnimationFrame(() => layer.classList.add('open'));
    sound.whoosh();
    await sc.wait(350);
    void talk([`l-${letter}`, 'draw']);

    let next = 0;
    dots[0].el.classList.add('next');
    await sc.when<void>((done) => {
      let stopHint = hint.schedule(() => dots[next].el, HINT_MS);
      const near = (e: PointerEvent) => {
        const d = dots[next];
        const m = svg.getScreenCTM();
        if (!m) return false;
        const p = new DOMPoint(d.x, d.y).matrixTransform(m);
        return Math.hypot(e.clientX - p.x, e.clientY - p.y) < Math.max(34, 16 * m.a);
      };
      const reach = () => {
        const d = dots[next];
        d.el.classList.remove('next');
        d.el.classList.add('done');
        inks[d.stroke].style.strokeDashoffset = String(lengths[d.stroke] - d.at);
        sound.note(next);
        next++;
        stopHint();
        if (next >= dots.length) return done();
        dots[next].el.classList.add('next');
        stopHint = hint.schedule(() => dots[next].el, HINT_MS);
      };
      // A tap on (or a finger sliding over) the next dot.
      const down = (e: PointerEvent) => {
        e.preventDefault();
        if (near(e)) reach();
        else replay(dots[next].el, 'nudge');
      };
      const move = (e: PointerEvent) => {
        if ((e.buttons || e.pointerType === 'touch') && near(e)) reach();
      };
      layer.addEventListener('pointerdown', down);
      layer.addEventListener('pointermove', move);
      return () => {
        layer.removeEventListener('pointerdown', down);
        layer.removeEventListener('pointermove', move);
        stopHint();
      };
    });
    card.classList.add('drawn');
    sound.sparkle();
    burstAt(svg, { kind: 'sparkle', count: 20, spread: 1.2 });
    await sc.wait(300);
    await speak([`l-${letter}`, pick(['yay', 'youDidIt'])], 4000);
    layer.classList.remove('open');
    await sc.wait(350);
    layer.remove();
  }

  // --- The last parcel: for the child ----------------------------------------------------

  const gift = fresh ?? friendOf(known.length ? weighted(known, null) : FRIENDS[0].letter)!;

  async function goalMove() {
    await town.walkTo([]);
    sound.bell();
    const p = await town.showParcel({ gift: true });
    await speak('lastParcel', 4000);
    void talk('whatInside');
    await sc.tap(p);
    p.classList.remove('bob');
    replay(p, 'unwrap');
    sound.rustle();
    await sc.wait(350);
    const c = center(p);
    burst(c.x, c.y, { count: 26, spread: 1.2 });
    p.remove();
    town.parcel = null;
    await reveal(gift, !!fresh);
    await sc.wait(300);
    // A sticker for the sticker book, now and then.
    await stickerMoment('postie-pip', { sc, art: STICKER_ART, chime: () => sound.chime(), say: () => say('sticker') });
  }

  async function reveal(f: Friend, isNew: boolean) {
    finishRound(fresh);
    const allNow = isNew && save.letters.length === FRIENDS.length;
    const box = el('div', 'reveal', sc.root);
    const card = el('div', 'reveal-card', box);
    el('div', 'reveal-rays', card);
    const art = el('div', 'reveal-art', card);
    el('div', 'reveal-letter', art, letterSVG(f.letter, f.roof, 12));
    el('div', 'reveal-friend', art, friendSVG(f));
    el('div', 'reveal-name', card, f.name);
    if (isNew) el('div', 'reveal-new', card, '<span>★</span>');
    requestAnimationFrame(() => box.classList.add('open'));
    sound.fanfare();
    setTimeout(() => sc.alive && sound.boing(1.2), 700);
    const rc = center(card);
    burst(rc.x, rc.y, { count: 30, spread: 1.4 });
    setTimeout(() => sc.alive && burst(rc.x, rc.y, { kind: 'sparkle', count: 16, spread: 1.2 }), 400);
    await speak(isNew ? ['newFriend', `is-${f.letter}`] : [`is-${f.letter}`], 6000);
    if (allNow) {
      sound.fanfare();
      burst(rc.x, rc.y, { count: 40, spread: 1.8 });
      await speak('allFriends', 4000);
    }
    // Stay a moment (or until tapped), then back to the street.
    await sc.when<void>((done) => {
      const t = window.setTimeout(done, 1800);
      box.addEventListener('pointerdown', () => done(), { once: true });
      return () => clearTimeout(t);
    });
    box.classList.add('closing');
    await sc.wait(350);
    box.remove();
  }

  // --- The round ------------------------------------------------------------------------

  const moves = planRound(!!fresh, known.length >= PICTURES_FROM);
  deliveriesLeft = moves.filter((m) => m === 'deliver').length;
  const traceLetter = fresh?.letter ?? known.reduce((a, b) => (scoreOf(b) < scoreOf(a) ? b : a), pool[0]);
  const dots = moves.map((m) => el('span', m === 'goal' ? 'dot goal' : 'dot', trail, m === 'goal' ? '★' : ''));
  sound.steps(6);
  await sc.wait(700);
  for (let i = 0; i < moves.length; i++) {
    dots[i].classList.add('now');
    const m = moves[i];
    if (m === 'meet') await meetMove(fresh!);
    else if (m === 'deliver') await deliverMove(false);
    else if (m === 'picture') await deliverMove(true);
    else if (m === 'trace') await traceMove(traceLetter);
    else await goalMove();
    dots[i].classList.remove('now');
    dots[i].classList.add('done');
    if (m !== 'goal') sound.steps();
  }

  // Another round, or go and see the street.
  const buttons = el('div', 'end-buttons', sc.root);
  const again = el('button', 'big-btn green play-btn', buttons, ICONS.play);
  again.setAttribute('aria-label', 'Another round');
  const street = el('button', 'big-btn orange street-btn', buttons, `${ICONS.street}<span class="new-star">★</span>`);
  street.setAttribute('aria-label', 'Your street');
  if (unseenLetters().length) street.classList.add('has-new');
  void talk(fresh ? 'goStreet' : 'wellDone');
  const i = await sc.tapAny([again, street], 8000, fresh ? street : again);
  sound.pop();
  sc.destroy();
  return i === 0 ? 'again' : 'street';
}
