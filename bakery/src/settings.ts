// Grown-up settings (shared/settings.ts), with what this game's collection
// is called.
import { initSettings as initShared } from '../../shared/settings';
import { ICONS } from './art';
import { sound } from './audio';
import { resetCollection, save, setName } from './data';
import { voice } from './voice';

/** Adds the hold-to-open gear to the top bar. */
export function initSettings(bar: HTMLElement, before: Element, onChange: () => void) {
  initShared(bar, before, onChange, {
    icons: { gear: ICONS.gear, close: ICONS.close },
    sound,
    voice,
    name: () => save.name,
    setName,
    nameHelp: 'Used on the title screen, the shop sign and in cheers like “Thank you, Sam!”.',
    collection: {
      title: 'Shop window',
      summary: () => `${save.treats.length} treats baked so far.`,
      button: 'Start a new shop window',
      confirm: 'Clear every treat and start with an empty shop?',
      done: 'Done: the shelves are empty',
      reset: resetCollection,
    },
  });
}
