// Grown-up settings (shared/settings.ts), with what this game's collection
// is called and how each letter is coming along.
import { initSettings as initShared } from '../../shared/settings';
import { ICONS } from './art';
import { sound } from './audio';
import { FRIENDS, resetLetters, save, scoreOf, setName } from './data';
import { voice } from './voice';

/** A letter's score (see `record` in data.ts) from which it counts as known well. */
const SURE = 3;

function summary() {
  const n = save.letters.length;
  let out = `${n} of ${FRIENDS.length} letters learned, ${save.rounds} rounds.`;
  const sure = save.letters.filter((l) => scoreOf(l) >= SURE);
  const practising = save.letters.filter((l) => scoreOf(l) < SURE);
  if (sure.length) out += ` Knows well: ${sure.join(', ')}.`;
  if (practising.length) out += ` Still practising: ${practising.join(', ')} (these come round more often).`;
  return out;
}

/** Adds the hold-to-open gear to the top bar. */
export function initSettings(bar: HTMLElement, before: Element, onChange: () => void) {
  initShared(bar, before, onChange, {
    icons: { gear: ICONS.gear, close: ICONS.close },
    sound,
    voice,
    name: () => save.name,
    setName,
    nameHelp: 'Used on the title screen and in cheers like “Well done, Sam!”.',
    collection: {
      title: 'Letters',
      summary,
      button: 'Start again',
      confirm: 'Start the letters again from the beginning?',
      done: 'Done: back to the first letter',
      reset: resetLetters,
    },
  });
}
