// Dot the paint-splodge puppy: a little friend who cheers, hops over to show
// what to tap, and giggles when tickled.
import { puppySVG } from './art';
import { sound } from './audio';
import { burst, el, rand, replay } from './ui';

class Guide {
  private root!: HTMLElement;
  private body!: HTMLElement;
  private x = 0;
  private y = 0;
  private away = false;
  private hopAnim?: Animation;
  private visible = false;
  /** How far above the bottom edge Dot sits (e.g. to stay clear of the paint pots). */
  private lift = 0;

  init(parent: HTMLElement) {
    this.root = el('div', 'guide hidden', parent);
    this.body = el('div', 'guide-body', this.root, puppySVG());
    this.root.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      sound.woof();
      replay(this.body, 'tickle');
      const r = this.root.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 3, { kind: 'heart', count: 4, colors: ['#ff8595', '#ffa3d2'], spread: 0.5 });
    });
    addEventListener('resize', () => !this.away && this.place(...this.home()));
    this.place(...this.home());
  }

  private size() {
    return this.root.getBoundingClientRect().width || 90;
  }

  /** Dot lives in the bottom-left corner. */
  private home(): [number, number] {
    const s = this.size();
    const m = Math.min(innerWidth, innerHeight);
    return [m * 0.02, innerHeight - s * 1.12 - m * 0.02 - this.lift];
  }

  private place(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.root.style.transform = `translate(${x}px, ${y}px)`;
  }

  setLift(px: number) {
    if (px === this.lift) return;
    this.lift = px;
    if (!this.away && this.visible) void this.hopTo(...this.home(), 500);
    else if (!this.visible) this.place(...this.home());
  }

  show() {
    if (this.visible) return;
    this.visible = true;
    this.root.classList.remove('hidden');
    this.away = false;
    const [hx, hy] = this.home();
    // Bound in from the side.
    this.place(-this.size() * 1.5, hy);
    void this.hopTo(hx, hy, 900);
  }

  hide() {
    this.visible = false;
    this.root.classList.add('hidden');
  }

  /** Hop along in little bounces. */
  hopTo(x: number, y: number, ms = 700): Promise<void> {
    this.hopAnim?.cancel();
    const fromX = this.x;
    const fromY = this.y;
    const hops = Math.max(1, Math.min(4, Math.round(Math.hypot(x - fromX, y - fromY) / 160)));
    const frames: Keyframe[] = [];
    const N = hops * 6;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const bx = fromX + (x - fromX) * e;
      const by = fromY + (y - fromY) * e - Math.abs(Math.sin(t * hops * Math.PI)) * rand(26, 34);
      frames.push({ transform: `translate(${bx}px, ${by}px)` });
    }
    this.root.classList.add('walking');
    if (x < fromX) this.root.classList.add('face-left');
    else this.root.classList.remove('face-left');
    this.hopAnim = this.root.animate(frames, { duration: ms, easing: 'linear' });
    this.place(x, y);
    return this.hopAnim.finished.then(
      () => this.root.classList.remove('walking', 'face-left'),
      () => {},
    );
  }

  /** Hop next to an element to show where to tap. */
  pointAt(target: Element) {
    if (!this.visible || !target.isConnected) return;
    const r = target.getBoundingClientRect();
    const s = this.size();
    // Stand beside the target, on whichever side has more room.
    const right = r.right + s * 1.05 < innerWidth;
    const x = right ? r.right + s * 0.2 : r.left - s * 1.2;
    const y = Math.max(8, Math.min(innerHeight - s * 1.15, r.top + r.height / 2 - s * 0.6));
    this.away = true;
    void this.hopTo(x, y, 650).then(() => replay(this.body, 'wave'));
  }

  goHome() {
    if (!this.away) return;
    this.away = false;
    const [x, y] = this.home();
    void this.hopTo(x, y, 750);
  }

  cheer() {
    if (!this.visible) return;
    replay(this.body, 'cheer');
  }

  hop() {
    if (!this.visible) return;
    replay(this.body, 'hop-small');
  }
}

export const guide = new Guide();
