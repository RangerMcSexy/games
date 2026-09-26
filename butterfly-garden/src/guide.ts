// Dot the ladybug: a little friend who cheers, points at what to tap, and
// giggles when tickled.
import { ladybugSVG } from './art';
import { sound } from './audio';
import { burst, el, rand, replay } from './ui';

class Guide {
  private root!: HTMLElement;
  private body!: HTMLElement;
  private x = 0;
  private y = 0;
  private away = false;
  private flight?: Animation;
  private visible = false;

  init(parent: HTMLElement) {
    this.root = el('div', 'guide hidden', parent);
    this.body = el('div', 'guide-body', this.root, ladybugSVG());
    this.root.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      sound.giggle();
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

  private home(): [number, number] {
    const s = this.size();
    const m = Math.min(innerWidth, innerHeight);
    return [innerWidth - s - m * 0.03, innerHeight - s - m * 0.03];
  }

  private place(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.root.style.transform = `translate(${x}px, ${y}px)`;
  }

  show() {
    if (this.visible) return;
    this.visible = true;
    this.root.classList.remove('hidden');
    this.away = false;
    const [hx, hy] = this.home();
    // Fly in from the side.
    this.place(innerWidth + 40, hy - 120);
    void this.flyTo(hx, hy, 1100);
  }

  hide() {
    this.visible = false;
    this.root.classList.add('hidden');
  }

  flyTo(x: number, y: number, ms = 800): Promise<void> {
    this.flight?.cancel();
    const fromX = this.x;
    const fromY = this.y;
    const midY = Math.min(fromY, y) - rand(40, 90);
    this.root.classList.add('flying');
    this.flight = this.root.animate(
      [
        { transform: `translate(${fromX}px, ${fromY}px)` },
        { transform: `translate(${(fromX + x) / 2}px, ${midY}px)`, offset: 0.5 },
        { transform: `translate(${x}px, ${y}px)` },
      ],
      { duration: ms, easing: 'ease-in-out' },
    );
    this.place(x, y);
    return this.flight.finished.then(
      () => this.root.classList.remove('flying'),
      () => {},
    );
  }

  /** Fly next to an element to show where to tap. */
  pointAt(target: Element) {
    if (!this.visible || !target.isConnected) return;
    const r = target.getBoundingClientRect();
    const s = this.size();
    // Sit beside the target, on whichever side has more room.
    const right = r.right + s * 0.1 + s < innerWidth;
    const x = right ? r.right - s * 0.15 : r.left - s * 0.85;
    const y = Math.max(8, Math.min(innerHeight - s, r.top + r.height / 2 - s * 0.8));
    this.away = true;
    void this.flyTo(x, y, 700).then(() => replay(this.body, 'wave'));
  }

  goHome() {
    if (!this.away) return;
    this.away = false;
    const [x, y] = this.home();
    void this.flyTo(x, y, 800);
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
