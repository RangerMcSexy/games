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
    nameHelp: 'Used on the title screen, the gallery sign and in cheers like “You did it, Sam!”.',
    collection: {
      title: 'Gallery',
      summary: () => `${save.paintings.length} pictures painted so far.`,
      button: 'Start a new gallery',
      confirm: 'Clear every picture and start with an empty gallery?',
      done: 'Done: the gallery is empty',
      reset: resetCollection,
    },
  });
}
