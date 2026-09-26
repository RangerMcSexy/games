// Game data: everything that can be caught, the weather, and the saved
// aquarium.

import { storeName, storedName } from '../../shared/ask-name';

export type Weather = 'day' | 'rain' | 'sunset' | 'night';
export const WEATHERS: Weather[] = ['day', 'rain', 'sunset', 'night'];

export type FishKind = 'fish' | 'fancy' | 'puffer' | 'catfish' | 'crab' | 'glow';
export type Pattern = 'plain' | 'spots' | 'stripes' | 'rainbow';

export interface Fish {
  id: string;
  name: string;
  kind: FishKind;
  body: string;
  fin: string;
  belly: string;
  pattern: Pattern;
  /** Colour of the spots or stripes. */
  mark?: string;
  /** Drawn size relative to a normal fish. */
  size: number;
  /** Only swims about at night. */
  night?: boolean;
}

export const FISH: Fish[] = [
  { id: 'gold', name: 'Goldfish', kind: 'fancy', body: '#ffa34d', fin: '#ff7b3a', belly: '#ffd08a', pattern: 'plain', size: 1 },
  { id: 'blue', name: 'Blue Fish', kind: 'fish', body: '#6fb6ff', fin: '#3d8fe6', belly: '#c4e4ff', pattern: 'plain', size: 1 },
  { id: 'red', name: 'Red Fish', kind: 'fish', body: '#ff6b6b', fin: '#e04848', belly: '#ffb8b8', pattern: 'plain', size: 1 },
  { id: 'purple', name: 'Purple Fish', kind: 'fish', body: '#b58cf5', fin: '#8e62db', belly: '#e4d6ff', pattern: 'plain', size: 1 },
  { id: 'spotty', name: 'Spotty Fish', kind: 'fish', body: '#ffd84d', fin: '#f5a623', belly: '#fff0a8', pattern: 'spots', mark: '#ff8a3d', size: 1 },
  { id: 'stripy', name: 'Stripy Fish', kind: 'fish', body: '#7fd66b', fin: '#4fb24a', belly: '#d2f5c4', pattern: 'stripes', mark: '#fff27a', size: 1 },
  { id: 'rainbow', name: 'Rainbow Fish', kind: 'fish', body: '#ff9fcc', fin: '#b995f2', belly: '#ffffff', pattern: 'rainbow', size: 1.1 },
  { id: 'puffer', name: 'Puffer Fish', kind: 'puffer', body: '#ff9fcc', fin: '#e86aa6', belly: '#ffd6ea', pattern: 'plain', size: 1 },
  { id: 'cat', name: 'Whisker Fish', kind: 'catfish', body: '#79b8ae', fin: '#4f948a', belly: '#c8e8e2', pattern: 'spots', mark: '#5a9e94', size: 1.25 },
  { id: 'tiny', name: 'Tiny Fish', kind: 'fish', body: '#4fd3c4', fin: '#22ab9d', belly: '#c2f5ee', pattern: 'plain', size: 0.6 },
  { id: 'crab', name: 'Crab', kind: 'crab', body: '#ff7a59', fin: '#e0553a', belly: '#ffb89f', pattern: 'plain', size: 0.9 },
  { id: 'glow', name: 'Glow Fish', kind: 'glow', body: '#3f4f9c', fin: '#2d3a7a', belly: '#6d7fd0', pattern: 'spots', mark: '#fff27a', size: 1, night: true },
];

export const fishById = (id: string) => FISH.find((f) => f.id === id);

/** Silly things that sometimes end up on the hook. */
export interface Silly {
  id: string;
  name: string;
}

export const SILLY: Silly[] = [
  { id: 'boot', name: 'Old Boot' },
  { id: 'duck', name: 'Rubber Duck' },
  { id: 'teapot', name: 'Teapot' },
  { id: 'sock', name: 'Stinky Sock' },
  { id: 'crown', name: 'Crown' },
  { id: 'hat', name: 'Funny Hat' },
];

export const sillyById = (id: string) => SILLY.find((s) => s.id === id);

// ---------------------------------------------------------------------------
// Persistence

const STORAGE_KEY = 'fishing-pond.v1';

interface SaveData {
  /** How many of each fish have been caught. */
  caught: Record<string, number>;
  /** Species in the order they were first caught. */
  order: string[];
  silly: Record<string, number>;
  /** Everything ever reeled in: fish and silly things. */
  total: number;
  weather: Weather;
  music: boolean;
  sound: boolean;
  /** The player's name, used in cheers and on the title. */
  name: string;
  /** Aquarium unlocks the player has already seen (so new ones can sparkle). */
  seenUnlocks: string[];
}

const counts = (v: unknown, ids: string[]): Record<string, number> => {
  const out: Record<string, number> = {};
  if (v && typeof v === 'object')
    for (const [k, n] of Object.entries(v)) if (ids.includes(k) && typeof n === 'number' && n > 0) out[k] = Math.floor(n);
  return out;
};

function load(): SaveData {
  const fresh: SaveData = { caught: {}, order: [], silly: {}, total: 0, weather: 'day', music: true, sound: true, name: '', seenUnlocks: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const p = JSON.parse(raw) as Partial<SaveData>;
    const caught = counts(p.caught, FISH.map((f) => f.id));
    const order = (Array.isArray(p.order) ? p.order : []).filter((id, i, a) => caught[id] && a.indexOf(id) === i);
    for (const id of Object.keys(caught)) if (!order.includes(id)) order.push(id);
    return {
      caught,
      order,
      silly: counts(p.silly, SILLY.map((s) => s.id)),
      total: typeof p.total === 'number' ? p.total : 0,
      weather: WEATHERS.includes(p.weather as Weather) ? (p.weather as Weather) : 'day',
      music: p.music ?? true,
      sound: p.sound ?? true,
      name: typeof p.name === 'string' ? p.name : '',
      seenUnlocks: Array.isArray(p.seenUnlocks) ? p.seenUnlocks : [],
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

/** Record a catch. Returns true if it's the first one of its kind. */
export function addCatch(kind: 'fish' | 'silly', id: string): boolean {
  const book = kind === 'fish' ? save.caught : save.silly;
  const isNew = !book[id];
  book[id] = (book[id] ?? 0) + 1;
  if (kind === 'fish' && isNew) save.order.push(id);
  save.total++;
  persist();
  return isNew;
}

export const speciesCount = () => Object.keys(save.caught).length;

export function setWeather(w: Weather) {
  save.weather = w;
  persist();
}

export function resetCollection() {
  save.caught = {};
  save.order = [];
  save.silly = {};
  save.total = 0;
  save.seenUnlocks = [];
  persist();
}

// ---------------------------------------------------------------------------
// Aquarium unlocks: every catch makes the fish tank a little fancier.

export type UnlockId = 'plants' | 'chest' | 'castle' | 'snail' | 'coral' | 'sign';

export const UNLOCKS: { id: UnlockId; at: number }[] = [
  { id: 'plants', at: 2 },
  { id: 'chest', at: 4 },
  { id: 'castle', at: 7 },
  { id: 'snail', at: 10 },
  { id: 'coral', at: 14 },
  { id: 'sign', at: 20 },
];

export function unlocked(): UnlockId[] {
  return UNLOCKS.filter((u) => save.total >= u.at).map((u) => u.id);
}

/** Unlocks earned but not yet shown in the aquarium. */
export function unseenUnlocks(): UnlockId[] {
  return unlocked().filter((u) => !save.seenUnlocks.includes(u));
}

export function markUnlocksSeen() {
  save.seenUnlocks = unlocked();
  persist();
}

export const playerName = () => save.name.trim();
