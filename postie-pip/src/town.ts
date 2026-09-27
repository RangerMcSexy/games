// The street: sky, pavement, a row of houses with doors that open, Pip the
// postie, and the parcel she's carrying. Used by the title screen and the
// post round; the houses are also used on the "your street" screen.
import { HOUSE_DOOR, HOUSE_H, HOUSE_W, cloudSVG, friendSVG, houseSVG, letterSVG, mysterySVG, parcelSVG, pipSVG } from './art';
import { friendOf } from './data';
import { Scene, center, el, rand, replay } from '../../shared/ui';

/** The look of a house nobody has moved into yet. */
const EMPTY = { wall: '#efe9f6', roof: '#c9bddd', door: '#ddd3ea' };

/** A house with a letter on its door (or a question mark if `letter` is null). */
export class House {
  readonly el: HTMLElement;
  readonly door: HTMLElement;
  readonly animal: HTMLElement;
  private shut = 0;

  constructor(
    parent: HTMLElement,
    readonly letter: string | null,
  ) {
    const f = letter ? friendOf(letter) : undefined;
    const look = f ?? EMPTY;
    this.el = el('div', `house${f ? '' : ' empty'}`, parent, houseSVG(look));
    if (letter) this.el.dataset.letter = letter;
    this.el.setAttribute('aria-label', letter ? `The ${letter} house` : 'An empty house');
    const { x, y, w, h } = HOUSE_DOOR;
    const way = el('div', 'doorway', this.el);
    way.style.left = `${(x / HOUSE_W) * 100}%`;
    way.style.top = `${(y / HOUSE_H) * 100}%`;
    way.style.width = `${(w / HOUSE_W) * 100}%`;
    way.style.height = `${(h / HOUSE_H) * 100}%`;
    el('div', 'inside', way);
    this.animal = el('div', 'animal', way, f ? friendSVG(f) : '');
    this.door = el('div', 'door', way);
    this.door.style.setProperty('--door', look.door);
    el('div', 'plaque', this.door, letter ? letterSVG(letter) : mysterySVG());
    el('span', 'knob', this.door);
  }

  /** Door wide open, and whoever lives here pops out. */
  open() {
    clearTimeout(this.shut);
    this.el.classList.remove('peek');
    this.el.classList.add('open');
  }

  /** Door open a crack, and whoever lives here peeps out. */
  peek() {
    clearTimeout(this.shut);
    this.el.classList.remove('open');
    this.el.classList.add('peek');
  }

  close(after = 0) {
    clearTimeout(this.shut);
    this.shut = window.setTimeout(() => this.el.classList.remove('open', 'peek'), after);
  }

  /** Knock knock: the door jiggles. */
  knock() {
    replay(this.door, 'knocked');
  }
}

export interface TownOptions {
  /** How much of the screen (0 to 1) above the houses to keep free for the parcel or the title. */
  zone: number;
  /** Houses in a full row (the size is worked out for this many). */
  slots: number;
}

/** The sky, clouds and pavement behind everything. */
export function backdrop(parent: HTMLElement) {
  const bg = el('div', 'backdrop', parent);
  el('div', 'hill hill-back', bg);
  el('div', 'hill hill-front', bg);
  for (let i = 0; i < 3; i++) {
    const c = el('div', 'cloud', bg, cloudSVG());
    c.style.top = `${rand(6, 26)}%`;
    c.style.animationDuration = `${rand(60, 90)}s`;
    c.style.animationDelay = `${-rand(0, 80)}s`;
    c.style.setProperty('--s', String(rand(0.7, 1.2)));
  }
  el('div', 'ground', bg);
  return bg;
}

export class Town {
  readonly pip: HTMLElement;
  readonly root: HTMLElement;
  row: HTMLElement;
  houses: House[] = [];
  parcel: HTMLElement | null = null;

  constructor(
    private sc: Scene,
    parent: HTMLElement,
    private opts: TownOptions,
  ) {
    this.root = parent;
    backdrop(parent);
    this.row = el('div', 'row', parent);
    this.pip = el('div', 'pip', parent, pipSVG());
    this.pip.setAttribute('aria-label', 'Pip the postie');
    this.layout();
    sc.on(window, 'resize', () => this.layout());
  }

  /** Sizes everything to the screen: the houses, the pavement, Pip and the parcel. */
  layout() {
    const W = this.root.clientWidth || innerWidth;
    const H = this.root.clientHeight || innerHeight;
    const tall = H > W * 1.05;
    const bar = (document.querySelector('.top-bar')?.getBoundingClientRect().bottom ?? 70) + 6;
    const ground = Math.round(H * (tall ? 0.2 : 0.16));
    const zone = Math.round(H * this.opts.zone);
    const gap = Math.max(8, W * (tall ? 0.02 : 0.03));
    const n = this.opts.slots;
    const across = (W * (tall ? 0.97 : 0.8) - gap * (n - 1)) / n;
    const up = (H - ground - bar - zone + ground * (tall ? 0 : 0.15)) / (HOUSE_H / HOUSE_W);
    const house = Math.floor(Math.max(70, Math.min(across, up, 300)));
    // On a tall screen Pip walks along the pavement below the houses; on a
    // wide one there's room beside them, so she stands taller.
    const rowBottom = Math.round(ground * (tall ? 0.94 : 0.72));
    const pip = Math.round(tall ? ground * 0.88 : Math.min(ground * 1.35, house * 1.05));
    const parcel = Math.round(Math.max(90, Math.min(zone * 1.05, W * (tall ? 0.5 : 0.42), 290)));
    const s = this.root.style;
    s.setProperty('--house', `${house}px`);
    s.setProperty('--gap', `${Math.round(gap)}px`);
    s.setProperty('--ground', `${ground}px`);
    s.setProperty('--row-bottom', `${rowBottom}px`);
    s.setProperty('--pip', `${pip}px`);
    s.setProperty('--parcel', `${parcel}px`);
    s.setProperty('--parcel-top', `${Math.round(bar + Math.max(0, (zone - parcel * 0.88) / 2))}px`);
  }

  /** Puts houses on the street straight away. */
  setHouses(letters: (string | null)[]) {
    this.row.innerHTML = '';
    this.houses = letters.map((l) => new House(this.row, l));
    return this.houses;
  }

  /** Pip walks along the street to the next houses (the old ones go by). */
  async walkTo(letters: (string | null)[], ms = 900): Promise<House[]> {
    const W = this.root.clientWidth || innerWidth;
    const old = this.row;
    const row = el('div', 'row', null);
    old.after(row);
    this.row = row;
    this.houses = letters.map((l) => new House(row, l));
    this.root.classList.add('walking');
    const ease = 'cubic-bezier(.45,.05,.4,1)';
    if (old.childElementCount) old.animate([{ transform: 'none' }, { transform: `translateX(${-W * 1.1}px)` }], { duration: ms, easing: ease, fill: 'forwards' });
    const arrive = row.animate([{ transform: `translateX(${W * 1.1}px)` }, { transform: 'none' }], { duration: ms, easing: ease });
    this.sc.addCleanup(() => old.remove());
    try {
      await this.sc.until(arrive.finished, ms + 400);
    } finally {
      old.remove();
      this.root.classList.remove('walking');
    }
    return this.houses;
  }

  /** Where Pip's postbag is on screen. */
  bag() {
    const r = this.pip.getBoundingClientRect();
    return { x: r.left + r.width * 0.78, y: r.top + r.height * 0.7 };
  }

  /** A parcel comes out of Pip's bag and floats up where it can be seen. */
  async showParcel(label: { letter?: string; animal?: string; gift?: boolean }) {
    this.parcel?.remove();
    const p = el('div', `parcel${label.gift ? ' gift' : ''}`, this.root, parcelSVG(label.gift));
    if (!label.gift) el('div', 'label', p, label.letter ? letterSVG(label.letter) : friendSVG(label.animal ?? ''));
    this.parcel = p;
    replay(this.pip, 'hand-over');
    const to = center(p);
    const from = this.bag();
    const anim = p.animate(
      [
        { transform: `translate(${from.x - to.x}px, ${from.y - to.y}px) scale(.15)`, opacity: 0.3 },
        { transform: `translate(${(from.x - to.x) * 0.4}px, ${(from.y - to.y) * 0.4 - 60}px) scale(.8)`, opacity: 1, offset: 0.55 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 700, easing: 'cubic-bezier(.3,.8,.4,1)' },
    );
    await this.sc.until(anim.finished, 1200);
    p.classList.add('bob');
    return p;
  }

  /** The parcel flies to a house's door. */
  async sendParcel(h: House) {
    const p = this.parcel;
    if (!p) return;
    this.parcel = null;
    p.classList.remove('bob');
    const a = center(p);
    const b = center(h.door);
    const anim = p.animate(
      [
        { transform: 'none' },
        { transform: `translate(${(b.x - a.x) * 0.5}px, ${(b.y - a.y) * 0.5 - 50}px) scale(.7) rotate(-8deg)`, offset: 0.5 },
        { transform: `translate(${b.x - a.x}px, ${b.y - a.y}px) scale(.3) rotate(6deg)`, opacity: 0.9 },
      ],
      { duration: 650, easing: 'cubic-bezier(.45,.05,.4,1)', fill: 'forwards' },
    );
    this.sc.addCleanup(() => p.remove());
    await this.sc.until(anim.finished, 1000);
    p.remove();
  }

  /** Pip waves (and the caller makes her honk). */
  wave() {
    replay(this.pip, 'waving');
  }
}
