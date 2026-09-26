// A fish that swims about: used in the pond and in the fish tank. Movement is
// driven by the scene's animation loop through `step`.
import { fishSVG, sillySVG } from './art';
import type { Fish } from './data';
import { el, replay } from './ui';

/** Fish art is 144×104; the mouth is near the right-hand edge. */
export const FISH_ASPECT = 104 / 144;
export const MOUTH = 0.44;

export class Swimmer {
  readonly el: HTMLElement;
  private readonly body: HTMLElement;
  fish: Fish;
  x = 0;
  y = 0;
  baseY = 0;
  dir: 1 | -1 = 1;
  speed = 40;
  phase = Math.random() * 6;
  /** Width in px for a normal-sized fish. */
  private unit = 100;
  /** When set, the fish swims straight to this point instead of wandering. */
  target: { x: number; y: number } | null = null;
  /** Extra rotation (e.g. while being reeled up). */
  tilt = 0;
  held = false;

  constructor(parent: HTMLElement, fish: Fish, unit: number) {
    this.el = el('div', 'swimmer', parent);
    this.body = el('div', 'swimmer-body', this.el);
    this.fish = fish;
    this.setFish(fish, unit);
  }

  get w() {
    return this.unit * this.fish.size;
  }
  get h() {
    return this.w * FISH_ASPECT;
  }

  setFish(fish: Fish, unit = this.unit) {
    this.fish = fish;
    this.unit = unit;
    this.body.innerHTML = fishSVG(fish);
    this.el.style.width = `${this.w}px`;
    this.el.style.height = `${this.h}px`;
    this.el.classList.toggle('is-glow', fish.kind === 'glow');
  }

  /** Where the fish's mouth is. */
  mouth() {
    return { x: this.x + this.dir * this.w * MOUTH, y: this.y };
  }

  /** Advance by `dt` seconds. Returns true once a target has been reached. */
  step(dt: number, amp = 8): boolean {
    this.phase += dt * 1.6;
    if (this.held) return false;
    if (this.target) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const d = Math.hypot(dx, dy);
      if (Math.abs(dx) > 6) this.dir = dx > 0 ? 1 : -1;
      const v = this.speed * 1.8 * dt;
      if (d <= v) {
        this.x = this.target.x;
        this.y = this.target.y;
        return true;
      }
      this.x += (dx / d) * v;
      this.y += (dy / d) * v;
      this.baseY = this.y;
      return false;
    }
    this.x += this.dir * this.speed * dt;
    this.y += (this.baseY + Math.sin(this.phase) * amp - this.y) * Math.min(1, dt * 4);
    return false;
  }

  render() {
    const wob = this.held ? 0 : Math.sin(this.phase * 2.2) * 3;
    this.el.style.transform = `translate(${this.x - this.w / 2}px, ${this.y - this.h / 2}px) rotate(${this.tilt + wob}deg)`;
    this.body.style.transform = `scaleX(${this.dir})`;
  }

  wiggle() {
    replay(this.body, 'wiggle');
  }

  remove() {
    this.el.remove();
  }
}

/** Markup for a caught thing, big (fish or silly). */
export function catchArt(kind: 'fish' | 'silly', fish: Fish | undefined, sillyId: string) {
  return kind === 'fish' && fish ? fishSVG(fish) : sillySVG(sillyId);
}
