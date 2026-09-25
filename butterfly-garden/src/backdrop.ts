// The living sky behind every screen: day, night and dawn, with drifting clouds.
import { sound } from './audio';
import { el, rand } from './ui';

let root: HTMLElement;

export function initBackdrop(parent: HTMLElement) {
  root = el('div', 'backdrop', parent);
  root.dataset.time = 'day';
  el('div', 'sky sky-day', root);
  el('div', 'sky sky-dawn', root);
  el('div', 'sky sky-night', root);

  const tw = el('div', 'twinkles', root);
  for (let i = 0; i < 40; i++) {
    const s = el('div', 'twinkle', tw);
    s.style.left = `${rand(0, 100)}%`;
    s.style.top = `${rand(0, 70)}%`;
    s.style.animationDelay = `${rand(-3, 0)}s`;
    const size = rand(2, 5);
    s.style.width = s.style.height = `${size}px`;
  }

  el('div', 'sun', root, '<div class="sun-face"><i></i><i></i><b></b></div>');
  el('div', 'moon', root);
  for (let i = 0; i < 4; i++) {
    const c = el('div', `cloud c${i}`, root);
    c.style.top = `${[8, 20, 13, 30][i]}%`;
    c.style.animationDuration = `${[70, 95, 120, 85][i]}s`;
    c.style.animationDelay = `${[-10, -50, -80, -30][i]}s`;
    c.style.setProperty('--s', String([1, 0.7, 1.2, 0.8][i]));
  }

  el(
    'div',
    'hills',
    root,
    `<svg viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true">
      <path class="hill-back" d="M0,140 C150,60 300,70 450,130 C600,190 780,70 1000,110 L1000,300 L0,300 Z"/>
      <path class="hill-front" d="M0,210 C200,150 380,170 520,200 C700,240 850,160 1000,190 L1000,300 L0,300 Z"/>
    </svg>`,
  );

  // Little meadow flowers and grass tufts dotted over the hills.
  const meadow = el('div', 'meadow', root);
  const petals = ['#ffffff', '#ffc2dc', '#ffe89a', '#d9c6fa', '#c6e4ff'];
  for (let i = 0; i < 26; i++) {
    const bottom = rand(1, 19);
    const tuft = i % 3 === 0;
    const d = el('div', tuft ? 'tuft' : 'mini-flower', meadow);
    d.style.left = `${rand(0, 98)}%`;
    d.style.bottom = `${bottom}%`;
    // Things further back (higher up) are a little smaller.
    d.style.setProperty('--k', String(1.2 - bottom / 30));
    if (!tuft) d.style.setProperty('--c', petals[i % petals.length]);
  }

  // A whisper of paper grain for a storybook feel.
  el('div', 'grain', root);
}

export type TimeOfDay = 'day' | 'night' | 'dawn';

export function setTime(t: TimeOfDay) {
  root.dataset.time = t;
  document.documentElement.dataset.time = t;
  sound.setNight(t === 'night');
}
