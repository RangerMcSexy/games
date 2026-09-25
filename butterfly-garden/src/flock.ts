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
  /** Angle of this butterfly's place in the swarm around a flower. */
  slot: number;
}

export class Flock {
  private flyers: Flyer[] = [];
  private raf = 0;
  private last = 0;
  private attractor: { x: number; y: number } | null = null;
  private fedAt = new Map<Flyer, number>();

  constructor(
    private box: HTMLElement,
    butterflies: Butterfly[],
    private opts: {
      size: number;
      area?: { top: number; bottom: number };
      onTap?: (b: Butterfly, el: HTMLElement) => void;
      /** Called when a butterfly reaches the dragged flower. */
      onFeed?: (b: Butterfly, el: HTMLElement) => void;
    },
  ) {
    const { w, h } = this.bounds();
    for (const b of butterflies) {
      const wrap = el('div', 'flyer', box);
      const inner = el('div', 'flyer-inner', wrap, butterflySVG(b, { flap: true, speed: rand(0.28, 0.42) }));
      wrap.style.width = wrap.style.height = `${opts.size}px`;
      const f: Flyer = { b, el: wrap, inner, x: rand(0, w), y: rand(0, h), vx: 0, vy: 0, tx: rand(0, w), ty: rand(0, h), phase: rand(0, 6), slot: rand(0, Math.PI * 2) };
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

  /** Butterflies flock toward this point (page coordinates) while it is set. */
  setAttractor(p: { x: number; y: number } | null) {
    this.attractor = p;
  }

  start() {
    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - (this.last || t)) / 1000);
      this.last = t;
      const { w, h, top } = this.bounds();
      const box = this.box.getBoundingClientRect();
      const s = this.opts.size;
      for (const f of this.flyers) {
        if (this.attractor) {
          // Aim so the butterfly's middle lands on the flower.
          // Each butterfly circles its own spot around the flower.
          const ring = s * 0.35;
          f.tx = this.attractor.x - box.left - s / 2 + Math.cos(f.slot + t / 900) * ring;
          f.ty = this.attractor.y - box.top - top - s / 2 + Math.sin(f.slot + t / 900) * ring * 0.6;
          const d = Math.hypot(f.tx - f.x, f.ty - f.y);
          const fed = this.fedAt.get(f) ?? 0;
          if (d < s * 0.5 && t - fed > 2500) {
            this.fedAt.set(f, t);
            replay(f.inner, 'spin');
            this.opts.onFeed?.(f.b, f.el);
          }
        }
        const dx = f.tx - f.x;
        const dy = f.ty - f.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 30 && !this.attractor) {
          f.tx = rand(0, w);
          f.ty = rand(0, h);
        }
        const pull = this.attractor ? 420 : 140;
        f.vx += (dx / (dist || 1)) * pull * dt;
        f.vy += (dy / (dist || 1)) * pull * dt;
        if (this.attractor && dist < s) {
          f.vx *= 0.9;
          f.vy *= 0.9;
        }
        const sp = Math.hypot(f.vx, f.vy);
        const max = this.attractor ? 260 : 110;
        if (sp > max) {
          f.vx = (f.vx / sp) * max;
          f.vy = (f.vy / sp) * max;
        }
        f.vx *= 0.995;
        f.vy *= 0.995;
        if (!this.attractor && (f.x > w || f.y > h || f.x < 0 || f.y < 0) && (f.tx > w || f.ty > h || f.tx < 0 || f.ty < 0)) {
          f.tx = rand(0, w);
          f.ty = rand(0, h);
        }
        // Soft bounds: steering brings strays back without any snapping.
        f.x = Math.min(w + s, Math.max(-s, f.x + f.vx * dt));
        f.y = Math.min(h + s * 2, Math.max(-s, f.y + f.vy * dt));
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
