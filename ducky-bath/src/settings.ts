// Grown-up settings (shared/settings.ts), with what this game's collection
// is called.
import { initSettings as initShared } from '../../shared/settings';
import { ICONS } from './art';
import { sound } from './audio';
import { ITEMS, resetDucks, save, setName } from './data';
import { voice } from './voice';

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
      title: 'Ducks',
      summary: () => `${save.items.length} of ${ITEMS.length} ducks found, ${save.baths} baths.`,
      button: 'Start again',
      confirm: 'Put every duck back and start again?',
      done: 'Done: all the ducks are back',
      reset: resetDucks,
    },
  });
}
