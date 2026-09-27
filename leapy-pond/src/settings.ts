// Grown-up settings (shared/settings.ts), with what this game's collection
// is called.
import { initSettings as initShared } from '../../shared/settings';
import { ICONS } from './art';
import { sound } from './audio';
import { FRIENDS, resetPond, save, setName } from './data';
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
      title: 'Pond friends',
      summary: () => `${save.friends.length} of ${FRIENDS.length} friends met, ${save.trips} trips across the pond, ${save.flies} flies caught.`,
      button: 'Start a new pond',
      confirm: 'Say goodbye to every pond friend and start again?',
      done: 'Done: a new, empty pond',
      reset: resetPond,
    },
  });
}
