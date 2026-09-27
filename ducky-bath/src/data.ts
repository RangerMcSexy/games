// Game data: the twelve rubber ducks found at the end of each bath, the
// colours of the little ducks, and the saved game.

import { storeName, storedName } from '../../shared/ask-name';

export interface Item {
  id: string;
  name: string;
}

/** Found in this order, one new duck at the end of each bath. */
export const ITEMS: Item[] = [
  { id: 'rainbow', name: 'Rainbow Duck' },
  { id: 'princess', name: 'Princess Duck' },
  { id: 'pirate', name: 'Pirate Duck' },
  { id: 'fire', name: 'Firefighter Duck' },
  { id: 'chef', name: 'Chef Duck' },
  { id: 'frog', name: 'Froggy Duck' },
  { id: 'super', name: 'Super Duck' },
  { id: 'space', name: 'Space Duck' },
  { id: 'unicorn', name: 'Unicorn Duck' },
  { id: 'wizard', name: 'Wizard Duck' },
  { id: 'dino', name: 'Dino Duck' },
  { id: 'golden', name: 'Golden Duck' },
];

export const itemById = (id: string) => ITEMS.find((f) => f.id === id);

export interface Colour {
  id: string;
  petal: string;
  dark: string;
}

export const COLOURS: Colour[] = [
  { id: 'red', petal: '#ff5d6c', dark: '#d93a4d' },
  { id: 'orange', petal: '#ffa24a', dark: '#e57d22' },
  { id: 'yellow', petal: '#ffd84a', dark: '#e8b21c' },
  { id: 'blue', petal: '#5eaaff', dark: '#3a82dc' },
  { id: 'purple', petal: '#b184f5', dark: '#8a5bd6' },
  { id: 'pink', petal: '#ff94c8', dark: '#e46aa6' },
];

// ---------------------------------------------------------------------------
// Persistence

const STORAGE_KEY = 'ducky-bath.v1';

interface SaveData {
  /** Ducks found, in the order they were found. */
  items: string[];
  /** Ducks the player has already seen on the shelf (so new ones sparkle). */
  seen: string[];
  /** Baths finished. */
  baths: number;
  music: boolean;
  sound: boolean;
  /** The player's name, used in cheers and on the title. */
  name: string;
}

function load(): SaveData {
  const fresh: SaveData = { items: [], seen: [], baths: 0, music: true, sound: true, name: '' };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const p = JSON.parse(raw) as Partial<SaveData>;
    const ids = ITEMS.map((f) => f.id);
    const items = (Array.isArray(p.items) ? p.items : []).filter((id, i, a) => ids.includes(id) && a.indexOf(id) === i);
    return {
      items,
      seen: (Array.isArray(p.seen) ? p.seen : []).filter((id) => items.includes(id)),
      baths: typeof p.baths === 'number' ? p.baths : 0,
      music: p.music ?? true,
      sound: p.sound ?? true,
      name: '',
    };
  } catch {
    return fresh;
  }
}

export const save: SaveData = load();

// The child's name is shared by every game on this device (and the games
// home page), so it only has to be typed once.
save.name = storedName() ?? '';

/** Nobody has been asked for the player's name on this device yet. */
export const needsName = () => storedName() === null;

export function setName(name: string) {
  save.name = name.trim();
  persist();
  storeName(name);
}

export function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    // Private mode or storage disabled: the game still works for this visit.
  }
}

/** Who floats up at the end of the next bath: someone new while there is anyone left. */
export function nextItem(): { item: Item; isNew: boolean } {
  const fresh = ITEMS.find((f) => !save.items.includes(f.id));
  if (fresh) return { item: fresh, isNew: true };
  return { item: ITEMS[Math.floor(Math.random() * ITEMS.length)], isNew: false };
}

/** A bath is done: the duck is the player's to keep. */
export function finishBath(item: Item) {
  save.baths++;
  if (!save.items.includes(item.id)) save.items.push(item.id);
  persist();
}

/** Ducks found but not yet seen on the shelf. */
export const unseenItems = () => save.items.filter((id) => !save.seen.includes(id));

export function markItemsSeen() {
  save.seen = save.items.slice();
  persist();
}

export function resetDucks() {
  save.items = [];
  save.seen = [];
  save.baths = 0;
  persist();
}

export const playerName = () => save.name.trim();
