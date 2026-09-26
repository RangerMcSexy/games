// A finished picture you can hold up to the light: press and move (or just
// hover with a mouse) and it tilts towards you with a soft shine that
// follows the finger. It eases back when let go.
import { el } from './ui';

/** Degrees at the very edge of the picture. */
const MAX_TILT = 14;
/** How far a finger moves before a press becomes a tilt, so taps still tap. */
const SLOP = 6;

export function tiltable(card: HTMLElement) {
  card.classList.add('tilt');
  el('i', 'shine', card);
  // The pop-in animation holds the transform; once it's done, let go of it.
  // (Only the entrance: a picture that bobs about keeps bobbing.)
  card.addEventListener('animationend', (e) => {
    if (e.target === card && (e.animationName === 'popIn' || e.animationName === 'newestIn')) card.classList.add('settled');
  });

  let pressed: { x: number; y: number } | null = null;

  const aim = (e: PointerEvent) => {
    const r = card.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    card.style.setProperty('--rx', `${(0.5 - y) * 2 * MAX_TILT}deg`);
    card.style.setProperty('--ry', `${(x - 0.5) * 2 * MAX_TILT}deg`);
    card.style.setProperty('--sx', `${x * 100}%`);
    card.style.setProperty('--sy', `${y * 100}%`);
    card.classList.add('tilting');
  };
  const rest = () => {
    pressed = null;
    card.classList.remove('tilting');
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  };

  card.addEventListener('pointerdown', (e) => {
    pressed = { x: e.clientX, y: e.clientY };
    // Keep following the finger even if it slides off the picture.
    try {
      card.setPointerCapture(e.pointerId);
    } catch {
      /* not supported */
    }
  });
  card.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse' && !pressed) return aim(e);
    if (!pressed) return;
    if (card.classList.contains('tilting') || Math.hypot(e.clientX - pressed.x, e.clientY - pressed.y) > SLOP) aim(e);
  });
  card.addEventListener('pointerup', rest);
  card.addEventListener('pointercancel', rest);
  card.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && rest());
}
