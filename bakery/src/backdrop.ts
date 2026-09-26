// The kitchen behind the bake: a striped wall, a window onto the sky (day or
// night), a shelf of jars and a wooden counter to bake on.
import { INK } from './art';
import { sound } from './audio';
import { el } from './ui';

let root: HTMLElement;

export function initBackdrop(parent: HTMLElement) {
  root = el('div', 'backdrop', parent);
  root.dataset.time = 'day';
  el('div', 'wall', root);

  el(
    'div',
    'kitchen-window',
    root,
    `<svg viewBox="0 0 300 250" aria-hidden="true">
      <defs>
        <linearGradient id="skyDay" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#8fd3ff"/><stop offset="1" stop-color="#d9f1ff"/></linearGradient>
        <linearGradient id="skyNight" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#2d2a5c"/><stop offset="1" stop-color="#5a4a8a"/></linearGradient>
        <clipPath id="pane"><rect x="40" y="30" width="220" height="170" rx="10"/></clipPath>
      </defs>
      <rect x="28" y="18" width="244" height="194" rx="18" fill="#fff" stroke="${INK}" stroke-width="5"/>
      <g clip-path="url(#pane)">
        <rect class="win-day" x="40" y="30" width="220" height="170" fill="url(#skyDay)"/>
        <rect class="win-night" x="40" y="30" width="220" height="170" fill="url(#skyNight)"/>
        <g class="win-sun"><circle cx="200" cy="80" r="26" fill="#ffe066" stroke="#f4b400" stroke-width="3"/></g>
        <g class="win-moon"><path d="M206,56 A28,28 0 1 0 226,100 A22,22 0 1 1 206,56 Z" fill="#fff6c8"/>
          <circle cx="90" cy="60" r="2.5" fill="#fff"/><circle cx="130" cy="96" r="2" fill="#fff"/><circle cx="70" cy="120" r="2" fill="#fff"/><circle cx="160" cy="50" r="1.8" fill="#fff"/></g>
        <g class="win-cloud"><ellipse cx="0" cy="0" rx="34" ry="14" fill="#fff"/><ellipse cx="-16" cy="-8" rx="16" ry="14" fill="#fff"/><ellipse cx="12" cy="-10" rx="18" ry="16" fill="#fff"/></g>
        <path d="M40,200 C80,168 130,176 170,190 C210,170 240,172 260,180 L260,200 Z" fill="#8fdb8a"/>
      </g>
      <path d="M150,30 L150,200 M40,115 L260,115" stroke="#fff" stroke-width="10"/>
      <path d="M150,30 L150,200 M40,115 L260,115" stroke="${INK}" stroke-width="3" opacity=".25"/>
      <rect x="40" y="30" width="220" height="170" rx="10" fill="none" stroke="${INK}" stroke-width="4"/>
      <path d="M18,206 L282,206 L276,226 L24,226 Z" fill="#fff4e0" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
      <g class="curtain">
        <path d="M20,10 C40,10 70,12 80,14 C72,60 50,120 64,196 C44,200 30,198 18,194 Z" fill="#ffb3c6" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M280,10 C260,10 230,12 220,14 C228,60 250,120 236,196 C256,200 270,198 282,194 Z" fill="#ffb3c6" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <g fill="#fff" opacity=".7"><circle cx="40" cy="40" r="5"/><circle cx="60" cy="80" r="5"/><circle cx="36" cy="120" r="5"/><circle cx="52" cy="164" r="5"/>
          <circle cx="260" cy="40" r="5"/><circle cx="240" cy="80" r="5"/><circle cx="264" cy="120" r="5"/><circle cx="248" cy="164" r="5"/></g>
      </g>
      <rect x="10" y="0" width="280" height="14" rx="7" fill="#c98f6a" stroke="${INK}" stroke-width="4"/>
      <g transform="translate(110,190)">
        <path d="M-18,0 L18,0 L14,20 L-14,20 Z" fill="#ff9f7a" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M0,0 C-4,-14 -18,-18 -22,-26 C-10,-28 -2,-18 0,-6 C2,-20 10,-30 22,-28 C18,-18 6,-14 0,0" fill="#8fdb8a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      </g>
    </svg>`,
  );

  el(
    'div',
    'kitchen-shelf',
    root,
    `<svg viewBox="0 0 260 150" aria-hidden="true">
      <g stroke="${INK}" stroke-width="3.5" stroke-linejoin="round">
        <rect x="20" y="40" width="46" height="62" rx="10" fill="#fff4e0"/><rect x="16" y="30" width="54" height="14" rx="5" fill="#ff8fb1"/>
        <rect x="80" y="54" width="42" height="48" rx="10" fill="#e8f6ff"/><rect x="76" y="44" width="50" height="14" rx="5" fill="#74bdfa"/>
        <rect x="136" y="34" width="44" height="68" rx="10" fill="#fff9e0"/><rect x="132" y="24" width="52" height="14" rx="5" fill="#ffd84d"/>
        <circle cx="216" cy="84" r="18" fill="#ff8595"/><path d="M216,66 L218,58" fill="none"/>
      </g>
      <g opacity=".9"><circle cx="34" cy="74" r="6" fill="#c98f6a"/><circle cx="50" cy="84" r="6" fill="#c98f6a"/><circle cx="40" cy="92" r="5" fill="#c98f6a"/>
        <rect x="88" y="70" width="26" height="24" rx="6" fill="#ffffff"/><circle cx="158" cy="74" r="12" fill="#ffd84d"/></g>
      <path d="M210,72 C212,64 222,62 224,70" stroke="#7fd35b" stroke-width="5" fill="none" stroke-linecap="round"/>
      <rect x="4" y="102" width="252" height="14" rx="6" fill="#c98f6a" stroke="${INK}" stroke-width="4"/>
      <path d="M40,116 L50,138 M220,116 L210,138" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    </svg>`,
  );

  el('div', 'backsplash', root);
  el(
    'div',
    'counter',
    root,
    `<div class="counter-top"></div><div class="counter-front">${'<i></i>'.repeat(4)}</div>`,
  );

  // A whisper of paper grain for a storybook feel.
  el('div', 'grain', root);
}

export type TimeOfDay = 'day' | 'night';

export function setTime(t: TimeOfDay) {
  root.dataset.time = t;
  document.documentElement.dataset.time = t;
  sound.setNight(t === 'night');
}
