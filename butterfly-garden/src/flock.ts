// Butterflies that wander gently around a container and react to taps.
import { butterflySVG } from './art';
import type { Butterfly } from './data';
import { el, rand, replay } from './ui';

interface Flyer {
  b: Butterfly;
  el: HTMLElement;
  inner: HTMLElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  phase: number;
}

export class Flock {
  private flyers: Flyer[] = [];
  private raf = 0;
  private last = 0;

  constructor(
    private box: HTMLElement,
    butterflies: Butterfly[],
    private opts: { size: number; area?: { top: number; bottom: number }; onTap?: (b: Butterfly, el: HTMLElement) => void } ,
  ) {
    const { w, h } = this.bounds();
    for (const b of butterflies) {
      const wrap = el('div', 'flyer', box);
      const inner = el('div', 'flyer-inner', wrap, butterflySVG(b, { flap: true, speed: rand(0.28, 0.42) }));
      wrap.style.width = wrap.style.height = `${opts.size}px`;
      const f: Flyer = { b, el: wrap, inner, x: rand(0, w), y: rand(0, h), vx: 0, vy: 0, tx: rand(0, w), ty: rand(0, h), phase: rand(0, 6) };
      this.flyers.push(f);
      if (opts.onTap) {
        wrap.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          replay(inner, 'spin');
          // Give it a little hop away.
          f.vy -= 180;
          f.vx += rand(-120, 120);
          opts.onTap!(b, wrap);
        });
      }
    }
  }

  private bounds() {
    const r = this.box.getBoundingClientRect();
    const s = this.opts.size;
    const top = (this.opts.area?.top ?? 0) * r.height;
    const bottom = (this.opts.area?.bottom ?? 1) * r.height;
    return { w: Math.max(10, r.width - s), top, h: Math.max(10, bottom - top - s) };
  }

  start() {
    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - (this.last || t)) / 1000);
      this.last = t;
      const { w, h, top } = this.bounds();
      for (const f of this.flyers) {
        const dx = f.tx - f.x;
        const dy = f.ty - f.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 30) {
          f.tx = rand(0, w);
          f.ty = rand(0, h);
        }
        f.vx += (dx / (dist || 1)) * 140 * dt;
        f.vy += (dy / (dist || 1)) * 140 * dt;
        const sp = Math.hypot(f.vx, f.vy);
        const max = 110;
        if (sp > max) {
          f.vx = (f.vx / sp) * max;
          f.vy = (f.vy / sp) * max;
        }
        f.vx *= 0.995;
        f.vy *= 0.995;
        f.x = Math.min(w, Math.max(0, f.x + f.vx * dt));
        f.y = Math.min(h, Math.max(0, f.y + f.vy * dt));
        f.phase += dt * 5;
        const bob = Math.sin(f.phase) * 8;
        const tilt = Math.max(-25, Math.min(25, f.vx * 0.22));
        f.el.style.transform = `translate3d(${f.x}px, ${f.y + top + bob}px, 0) rotate(${tilt}deg)`;
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
    return this;
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }
}
