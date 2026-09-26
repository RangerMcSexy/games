// Game data: the twelve presents Sparkle finds at the end of each dash (all
// things to wear), the balloon colours, and the saved game.

import { storeName, storedName } from '../../shared/ask-name';
import { WEAR_SPOT } from './art';

export interface Item {
  id: string;
  name: string;
}

/** Found in this order, one new present at the end of each dash. */
export const ITEMS: Item[] = [
  { id: 'rainbow', name: 'Rainbow mane' },
  { id: 'flowers', name: 'Flower crown' },
  { id: 'wings', name: 'Wings' },
  { id: 'bow', name: 'Pretty bow' },
  { id: 'partyhat', name: 'Party hat' },
  { id: 'glasses', name: 'Star glasses' },
  { id: 'boots', name: 'Sparkly boots' },
  { id: 'goldhorn', name: 'Golden horn' },
  { id: 'cape', name: 'Super cape' },
  { id: 'necklace', name: 'Heart necklace' },
  { id: 'bluemane', name: 'Sky blue mane' },
  { id: 'crown', name: 'Royal crown' },
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

const STORAGE_KEY = 'unicorn-dash.v1';

interface SaveData {
  /** Presents found, in the order they were found. */
  items: string[];
  /** Presents the player has already seen when dressing up (so new ones sparkle). */
  seen: string[];
  /** What Sparkle is wearing. */
  wearing: string[];
  /** Dashes finished. */
  dashes: number;
  /** Stars caught, ever. */
  stars: number;
  music: boolean;
  sound: boolean;
  /** The player's name, used in cheers and on the title. */
  name: string;
}

function load(): SaveData {
  const fresh: SaveData = { items: [], seen: [], wearing: [], dashes: 0, stars: 0, music: true, sound: true, name: '' };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const p = JSON.parse(raw) as Partial<SaveData>;
    const ids = ITEMS.map((f) => f.id);
    const items = (Array.isArray(p.items) ? p.items : []).filter((id, i, a) => ids.includes(id) && a.indexOf(id) === i);
    // One thing per slot, and only things that have been found.
    const wearing: string[] = [];
    for (const id of Array.isArray(p.wearing) ? p.wearing : []) {
      if (items.includes(id) && !wearing.some((w) => WEAR_SPOT[w].slot === WEAR_SPOT[id].slot)) wearing.push(id);
    }
    return {
      items,
      seen: (Array.isArray(p.seen) ? p.seen : []).filter((id) => items.includes(id)),
      wearing,
      dashes: typeof p.dashes === 'number' ? p.dashes : 0,
      stars: typeof p.stars === 'number' ? p.stars : 0,
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

/** What's in the present at the end of the next dash: something new while there is anything left. */
export function nextItem(): { item: Item; isNew: boolean } {
  const fresh = ITEMS.find((f) => !save.items.includes(f.id));
  if (fresh) return { item: fresh, isNew: true };
  return { item: ITEMS[Math.floor(Math.random() * ITEMS.length)], isNew: false };
}

/** Put something on (taking off whatever was in the same place), or take it off. */
export function toggleWear(id: string, on = !save.wearing.includes(id)) {
  const slot = WEAR_SPOT[id].slot;
  save.wearing = save.wearing.filter((w) => w !== id && WEAR_SPOT[w].slot !== slot);
  if (on) save.wearing.push(id);
  persist();
  return on;
}

/** A dash is done: the present is Sparkle's to keep, and she puts it on straight away. */
export function finishDash(item: Item) {
  save.dashes++;
  if (!save.items.includes(item.id)) save.items.push(item.id);
  toggleWear(item.id, true);
}

export function addStar() {
  save.stars++;
  persist();
}

/** Presents found but not yet seen when dressing up. */
export const unseenItems = () => save.items.filter((id) => !save.seen.includes(id));

export function markItemsSeen() {
  save.seen = save.items.slice();
  persist();
}

export function resetStable() {
  save.items = [];
  save.seen = [];
  save.wearing = [];
  save.dashes = 0;
  save.stars = 0;
  persist();
}

export const playerName = () => save.name.trim();
