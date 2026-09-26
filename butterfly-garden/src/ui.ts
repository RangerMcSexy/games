// Small DOM, scene and effects helpers shared by every screen.
import { sparkleSVG } from './art';

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls = '',
  parent?: Element | null,
  html = '',
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  if (parent) parent.append(e);
  return e;
}

export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
export const shuffle = <T>(arr: T[]): T[] => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export function center(e: Element) {
  const r = e.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
}

/** Restart a one-shot CSS animation class. */
export function replay(e: Element, cls: string) {
  e.classList.remove(cls);
  void (e as HTMLElement).offsetWidth;
  e.classList.add(cls);
}

// ---------------------------------------------------------------------------
// Scenes

export class Aborted extends Error {}

/**
 * A screen of the game. All waits reject with `Aborted` once the scene is
 * destroyed (e.g. the home button is pressed), unwinding the flow cleanly.
 */
export class Scene {
  readonly root: HTMLElement;
  private dead = false;
  private rejects = new Set<(e: Aborted) => void>();
  private cleanups: (() => void)[] = [];

  constructor(parent: HTMLElement, cls: string) {
    this.root = el('div', `scene ${cls}`, parent);
    requestAnimationFrame(() => requestAnimationFrame(() => this.root.classList.add('in')));
  }

  get alive() {
    return !this.dead;
  }

  private guard<T>(executor: (resolve: (v: T) => void) => (() => void) | void): Promise<T> {
    if (this.dead) return Promise.reject(new Aborted());
    return new Promise<T>((resolve, reject) => {
      let cleanup: (() => void) | void;
      const rej = (e: Aborted) => {
        cleanup?.();
        reject(e);
      };
      this.rejects.add(rej);
      let settled = false;
      cleanup = executor((v) => {
        // Only the first resolve counts: a stray late one (e.g. a timer the
        // executor forgot to clear) must not re-run the cleanup, which could
        // undo whatever the next step has set up since.
        if (settled) return;
        settled = true;
        this.rejects.delete(rej);
        cleanup?.();
        if (this.dead) reject(new Aborted());
        else resolve(v);
      });
    });
  }

  wait(ms: number): Promise<void> {
    return this.guard<void>((resolve) => {
      const t = window.setTimeout(() => resolve(), ms);
      return () => clearTimeout(t);
    });
  }

  /** Resolves when one of the targets is tapped; shows the hint hand if idle. */
  tapAny(targets: Element[], hintAfter = 5000): Promise<number> {
    return this.guard<number>((resolve) => {
      const offs: (() => void)[] = [];
      targets.forEach((t, i) => {
        const fn = (e: Event) => {
          e.preventDefault();
          resolve(i);
        };
        t.addEventListener('pointerdown', fn);
        offs.push(() => t.removeEventListener('pointerdown', fn));
      });
      const stopHint = hintAfter > 0 ? hint.schedule(() => targets[Math.floor(Math.random() * targets.length)], hintAfter) : () => {};
      return () => {
        offs.forEach((f) => f());
        stopHint();
      };
    });
  }

  /** Wait for a promise (e.g. a spoken line), capped so nothing can stall. */
  until<T>(p: Promise<T>, maxMs = 8000): Promise<void> {
    return this.guard<void>((resolve) => {
      const t = window.setTimeout(() => resolve(), maxMs);
      p.then(
        () => resolve(),
        () => resolve(),
      );
      return () => clearTimeout(t);
    });
  }

  tap(target: Element, hintAfter = 5000) {
    return this.tapAny([target], hintAfter);
  }

  on<K extends keyof HTMLElementEventMap>(target: EventTarget, type: K, fn: (e: HTMLElementEventMap[K]) => void) {
    target.addEventListener(type, fn as EventListener);
    this.cleanups.push(() => target.removeEventListener(type, fn as EventListener));
  }

  addCleanup(fn: () => void) {
    this.cleanups.push(fn);
  }

  destroy() {
    if (this.dead) return;
    this.dead = true;
    this.rejects.forEach((r) => r(new Aborted()));
    this.rejects.clear();
    this.cleanups.forEach((f) => f());
    hint.hide();
    const root = this.root;
    root.classList.remove('in');
    root.classList.add('out');
    root.style.pointerEvents = 'none';
    setTimeout(() => root.remove(), 450);
  }
}

// ---------------------------------------------------------------------------
// Idle hint: a friendly hand that points at what to tap.

class Hint {
  /** Hooks so Dot the ladybug can fly over to whatever the hand points at. */
  onShow?: (target: Element) => void;
  onHide?: () => void;
  private hand?: HTMLElement;
  private timer = 0;
  private follow = 0;

  schedule(target: () => Element, delay: number): () => void {
    this.hide();
    const token = ++this.follow;
    this.timer = window.setTimeout(() => {
      if (token !== this.follow) return;
      this.showAt(target());
      this.timer = window.setInterval(() => token === this.follow && this.showAt(target()), 4000);
    }, delay);
    return () => {
      if (token === this.follow) this.hide();
    };
  }

  private showAt(t: Element) {
    if (!t.isConnected) return;
    if (!this.hand) {
      this.hand = el('div', 'hint-hand', document.body, '<span>👆</span>');
    }
    const c = center(t);
    this.hand.style.left = `${c.x}px`;
    this.hand.style.top = `${c.y + c.h * 0.25}px`;
    replay(this.hand, 'show');
    this.onShow?.(t);
  }

  hide() {
    this.follow++;
    clearTimeout(this.timer);
    clearInterval(this.timer);
    this.hand?.classList.remove('show');
    this.onHide?.();
  }
}

export const hint = new Hint();

// ---------------------------------------------------------------------------
// Particles

let fxLayer: HTMLElement;
export function initFx() {
  fxLayer = el('div', 'fx-layer', document.body);
}

type BurstKind = 'confetti' | 'sparkle' | 'heart' | 'bits';

export function burst(x: number, y: number, opts: { count?: number; colors?: string[]; kind?: BurstKind; spread?: number; size?: number } = {}) {
  const { count = 18, colors = ['#ff5d73', '#ffd23f', '#4ea8ff', '#7fd35b', '#a86cf0', '#ff9f1c'], kind = 'confetti', spread = 1, size = 1 } = opts;
  for (let i = 0; i < count; i++) {
    const p = el('div', `particle p-${kind}`, fxLayer);
    const color = colors[i % colors.length];
    const s = rand(10, 20) * size;
    p.style.width = p.style.height = `${s}px`;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    if (kind === 'sparkle') p.innerHTML = sparkleSVG(color);
    else if (kind === 'heart') {
      p.textContent = '❤';
      p.style.color = color;
      p.style.fontSize = `${s * 1.4}px`;
    } else {
      p.style.background = color;
      if (kind === 'confetti' && i % 3 === 0) p.style.borderRadius = '50%';
    }
    const ang = kind === 'heart' ? rand(-Math.PI * 0.8, -Math.PI * 0.2) : rand(0, Math.PI * 2);
    const dist = rand(60, 180) * spread;
    const dx = Math.cos(ang) * dist;
    const dy = Math.sin(ang) * dist;
    const fall = kind === 'confetti' || kind === 'bits' ? rand(80, 200) * spread : kind === 'heart' ? -40 : 0;
    const rot = rand(-360, 360);
    const dur = rand(700, 1300);
    const anim = p.animate(
      [
        { transform: 'translate(-50%,-50%) scale(.2) rotate(0deg)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1) rotate(${rot / 2}deg)`, opacity: 1, offset: 0.45 },
        { transform: `translate(calc(-50% + ${dx * 1.2}px), calc(-50% + ${dy * 1.2 + fall}px)) scale(.8) rotate(${rot}deg)`, opacity: 0 },
      ],
      { duration: dur, easing: 'cubic-bezier(.2,.7,.4,1)' },
    );
    anim.onfinish = () => p.remove();
  }
}

export function burstAt(e: Element, opts: Parameters<typeof burst>[2] = {}) {
  const c = center(e);
  burst(c.x, c.y, opts);
}

/** Flies a copy of `source` (by markup) from one point to another. */
export function flyClone(html: string, from: DOMRect, to: { x: number; y: number }, duration = 600, endScale = 0.4) {
  const c = el('div', 'fly-clone', fxLayer, html);
  c.style.left = `${from.left}px`;
  c.style.top = `${from.top}px`;
  c.style.width = `${from.width}px`;
  c.style.height = `${from.height}px`;
  const dx = to.x - (from.left + from.width / 2);
  const dy = to.y - (from.top + from.height / 2);
  const anim = c.animate(
    [
      { transform: 'translate(0,0) scale(1) rotate(0deg)' },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 80}px) scale(${(1 + endScale) / 2 + 0.15}) rotate(-15deg)`, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(${endScale}) rotate(10deg)` },
    ],
    { duration, easing: 'cubic-bezier(.45,.05,.4,1)', fill: 'forwards' },
  );
  return anim.finished.then(() => c.remove());
}

/** FLIP helper: animate an element from its old box to its new one. */
export function flip(e: HTMLElement, mutate: () => void, duration = 600) {
  const a = e.getBoundingClientRect();
  mutate();
  const b = e.getBoundingClientRect();
  const dx = a.left + a.width / 2 - (b.left + b.width / 2);
  const dy = a.top + a.height / 2 - (b.top + b.height / 2);
  const s = a.width / (b.width || 1);
  return e.animate(
    [{ transform: `translate(${dx}px, ${dy}px) scale(${s})` }, { transform: 'translate(0,0) scale(1)' }],
    { duration, easing: 'cubic-bezier(.3,1.4,.5,1)' },
  ).finished;
}
