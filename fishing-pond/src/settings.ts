// Grown-up settings (shared/settings.ts), with what this game's collection
// is called.
import { initSettings as initShared } from '../../shared/settings';
import { ICONS } from './art';
import { sound } from './audio';
import { resetCollection, save, setName, speciesCount } from './data';
import { voice } from './voice';

/** Adds the hold-to-open gear to the top bar. */
export function initSettings(bar: HTMLElement, before: Element, onChange: () => void) {
  initShared(bar, before, onChange, {
    icons: { gear: ICONS.gear, close: ICONS.close },
    sound,
    voice,
    name: () => save.name,
    setName,
    nameHelp: 'Used on the title screen, the fish tank sign and in cheers like “Well done, Sam!”.',
    collection: {
      title: 'Fish tank',
      summary: () => `${speciesCount()} of 12 fish found, ${save.total} catches so far.`,
      button: 'Start a new fish tank',
      confirm: 'Let every fish go and start with an empty tank?',
      done: 'Done: the tank is empty',
      reset: resetCollection,
    },
  });
}
