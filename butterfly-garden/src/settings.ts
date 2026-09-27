// Grown-up settings (shared/settings.ts), with what this game's collection
// is called.
import { initSettings as initShared } from '../../shared/settings';
import { ICONS, ICONS_EXTRA } from './art';
import { sound } from './audio';
import { resetCollection, save, setName } from './data';
import { voice } from './voice';

/** Adds the hold-to-open gear to the top bar. */
export function initSettings(bar: HTMLElement, before: Element, onChange: () => void) {
  initShared(bar, before, onChange, {
    icons: { gear: ICONS_EXTRA.gear, close: ICONS.close },
    sound,
    voice,
    name: () => save.name,
    setName,
    nameHelp: 'Used on the title screen and in cheers like “Great job, Sam!”.',
    collection: {
      title: 'Butterfly collection',
      summary: () => `${save.butterflies.length} butterflies grown so far.`,
      button: 'Start a new butterfly book',
      confirm: 'Clear every butterfly and start a brand new book?',
      done: 'Done: the book is empty',
      reset: resetCollection,
    },
  });
}
