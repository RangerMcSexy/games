// Game data: the paint colours and the saved gallery of finished pictures.

export type PaintId = 'pink' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'brown' | 'rainbow';

export const PAINTS: PaintId[] = ['pink', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'brown', 'rainbow'];

/** Rainbow isn't a flat colour: it paints with a stripy gradient (see `paintFill`). */
export const PAINT: Record<PaintId, { name: string; hex: string }> = {
  pink: { name: 'Pink', hex: '#ff9fcc' },
  red: { name: 'Red', hex: '#ff6b6b' },
  orange: { name: 'Orange', hex: '#ffae5c' },
  yellow: { name: 'Yellow', hex: '#ffe066' },
  green: { name: 'Green', hex: '#86d07a' },
  blue: { name: 'Blue', hex: '#74bdfa' },
  purple: { name: 'Purple', hex: '#b995f2' },
  brown: { name: 'Brown', hex: '#b9835c' },
  rainbow: { name: 'Rainbow', hex: '#ff9fcc' },
};

export const RAINBOW_STOPS = ['#ff6b6b', '#ffae5c', '#ffe066', '#86d07a', '#74bdfa', '#b995f2'];

/** A finished picture on the gallery wall: which colour went in each region. */
export interface Painting {
  id: string;
  pic: string;
  fills: Record<string, PaintId>;
  created: number;
}

// ---------------------------------------------------------------------------
// Persistence

const STORAGE_KEY = 'colour-splash.v1';

interface SaveData {
  paintings: Painting[];
  music: boolean;
  sound: boolean;
  /** The player's name, used in cheers and on the title. */
  name: string;
  /** Gallery unlocks the player has already seen (so new ones can sparkle). */
  seenUnlocks: string[];
}

function load(): SaveData {
  const fresh: SaveData = { paintings: [], music: true, sound: true, name: 'Mia', seenUnlocks: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      paintings: Array.isArray(parsed.paintings) ? parsed.paintings.filter(validPainting) : [],
      music: parsed.music ?? true,
      sound: parsed.sound ?? true,
      name: typeof parsed.name === 'string' ? parsed.name : 'Mia',
      seenUnlocks: Array.isArray(parsed.seenUnlocks) ? parsed.seenUnlocks : [],
    };
  } catch {
    return fresh;
  }
}

function validPainting(p: Painting) {
  return (
    !!p &&
    typeof p.id === 'string' &&
    typeof p.pic === 'string' &&
    !!p.fills &&
    typeof p.fills === 'object' &&
    Object.values(p.fills).every((c) => PAINTS.includes(c))
  );
}

export const save: SaveData = load();

// The child's name is shared by every game opened from the same address (the
// games home page), so it only has to be typed once.
const NAME_KEY = 'mia-games.name';
try {
  const shared = localStorage.getItem(NAME_KEY);
  if (shared !== null) save.name = shared;
  // A name set here before names were shared becomes the shared one.
  else if (save.name !== 'Mia') localStorage.setItem(NAME_KEY, save.name);
} catch {
  // Storage disabled: this game keeps its own name.
}

export function setName(name: string) {
  save.name = name;
  persist();
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // Storage disabled.
  }
}

export function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    // Private mode or storage disabled: the game still works for this visit.
  }
}

export function addPainting(p: Painting) {
  save.paintings.push(p);
  persist();
}

export function resetCollection() {
  save.paintings = [];
  save.seenUnlocks = [];
  persist();
}

// ---------------------------------------------------------------------------
// Gallery unlocks: every finished picture makes the gallery a little fancier.

export type UnlockId = 'bunting' | 'easel' | 'rug' | 'lights' | 'rainbow' | 'balloons' | 'sign';

export const UNLOCKS: { id: UnlockId; at: number }[] = [
  { id: 'bunting', at: 2 },
  { id: 'easel', at: 4 },
  { id: 'rug', at: 6 },
  { id: 'lights', at: 9 },
  { id: 'rainbow', at: 12 },
  { id: 'balloons', at: 16 },
  { id: 'sign', at: 20 },
];

export function unlocked(): UnlockId[] {
  const n = save.paintings.length;
  return UNLOCKS.filter((u) => n >= u.at).map((u) => u.id);
}

/** Unlocks earned but not yet shown in the gallery. */
export function unseenUnlocks(): UnlockId[] {
  return unlocked().filter((u) => !save.seenUnlocks.includes(u));
}

export function markUnlocksSeen() {
  save.seenUnlocks = unlocked();
  persist();
}

export const playerName = () => save.name.trim();

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
