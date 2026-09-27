// Grown-up settings (shared/settings.ts), with what this game's collection
// is called.
import { initSettings as initShared } from '../../shared/settings';
import { ICONS } from './art';
import { sound } from './audio';
import { ITEMS, resetStable, save, setName } from './data';
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
      title: 'Presents',
      summary: () => `${save.items.length} of ${ITEMS.length} presents found, ${save.dashes} dashes, ${save.stars} stars caught.`,
      button: 'Start again',
      confirm: 'Put every present back and start again?',
      done: 'Done: all the presents are back',
      reset: resetStable,
    },
  });
}
