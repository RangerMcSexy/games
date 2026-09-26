// The art room behind everything: a soft wall with faded paint splats and a
// wooden floor.
import { splatPath } from './art';
import { PAINT, PAINTS } from './data';
import { el, rand } from './ui';

export function initBackdrop(parent: HTMLElement) {
  const root = el('div', 'backdrop', parent);
  const wall = el('div', 'wall', root);
  const spots = [
    [6, 12],
    [88, 18],
    [18, 58],
    [80, 62],
    [50, 8],
    [34, 34],
    [66, 40],
    [94, 86],
    [4, 88],
  ];
  spots.forEach(([x, y], i) => {
    const c = PAINT[PAINTS[i % 8]].hex;
    const s = el(
      'div',
      'wall-splat',
      wall,
      `<svg viewBox="-50 -50 100 100"><path d="${splatPath(i + 11, 40, 8 + (i % 4))}" fill="${c}"/><circle cx="${rand(30, 44)}" cy="${rand(-30, 30)}" r="${rand(4, 7)}" fill="${c}"/><circle cx="${rand(-44, -30)}" cy="${rand(-30, 30)}" r="${rand(3, 6)}" fill="${c}"/></svg>`,
    );
    s.style.left = `${x}%`;
    s.style.top = `${y}%`;
    s.style.setProperty('--s', `${rand(0.7, 1.3)}`);
    s.style.setProperty('--r', `${rand(0, 360)}deg`);
  });
  el('div', 'floor', root, '<i></i><i></i><i></i>');
  // A whisper of paper grain for a storybook feel.
  el('div', 'grain', root);
}
