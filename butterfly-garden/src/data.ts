// Game data: foods, wing shapes, patterns, and the saved butterfly collection.

import { storeName, storedName } from '../../shared/ask-name';

export type Shape = 'round' | 'pointy' | 'swallow' | 'heart' | 'frilly';
export type Pattern = 'dots' | 'stripes' | 'hearts' | 'stars' | 'rainbow';
export type FoodId =
  | 'strawberry'
  | 'orange'
  | 'banana'
  | 'pear'
  | 'blueberry'
  | 'grape'
  | 'melon'
  | 'golden';

export interface Food {
  id: FoodId;
  name: string;
  color: string;
}

export const FOODS: Record<FoodId, Food> = {
  strawberry: { id: 'strawberry', name: 'Strawberry', color: '#ff7b8e' },
  orange: { id: 'orange', name: 'Orange', color: '#ffae5c' },
  banana: { id: 'banana', name: 'Banana', color: '#ffdb6e' },
  pear: { id: 'pear', name: 'Pear', color: '#9fdc7c' },
  blueberry: { id: 'blueberry', name: 'Blueberry', color: '#7cb9f7' },
  grape: { id: 'grape', name: 'Grape', color: '#bb97f2' },
  melon: { id: 'melon', name: 'Watermelon', color: '#ffa3d2' },
  golden: { id: 'golden', name: 'Golden', color: '#f7cf55' },
};

export const EVERYDAY_FOODS: FoodId[] = [
  'strawberry',
  'orange',
  'banana',
  'pear',
  'blueberry',
  'grape',
  'melon',
];

export const SHAPES: Shape[] = ['round', 'pointy', 'swallow', 'heart', 'frilly'];
export const PATTERNS: Pattern[] = ['dots', 'stripes', 'hearts', 'stars', 'rainbow'];

export const SHAPE_NAMES: Record<Shape, string> = {
  round: 'Puffwing',
  pointy: 'Zipwing',
  swallow: 'Swallowtail',
  heart: 'Sweetheart',
  frilly: 'Frillywing',
};

export const PATTERN_NAMES: Record<Pattern, string> = {
  dots: 'Dotty',
  stripes: 'Stripy',
  hearts: 'Lovey',
  stars: 'Starry',
  rainbow: 'Rainbow',
};

/** How many foods the caterpillar eats before it is full. */
export const MEALS = 5;

export interface Butterfly {
  id: string;
  shape: Shape;
  pattern: Pattern;
  foods: FoodId[];
  golden: boolean;
  created: number;
}

export const slotKey = (shape: Shape, pattern: Pattern) => `${shape}-${pattern}`;

export function colorsOf(b: Pick<Butterfly, 'foods'>): string[] {
  return b.foods.map((f) => FOODS[f].color);
}

/** Most-eaten everyday food (ties go to the one eaten first). */
export function favoriteFood(foods: FoodId[]): FoodId {
  const counts = new Map<FoodId, number>();
  for (const f of foods) if (f !== 'golden') counts.set(f, (counts.get(f) ?? 0) + 1);
  let best: FoodId = foods.find((f) => f !== 'golden') ?? 'golden';
  for (const f of foods) {
    if (f === 'golden') continue;
    if ((counts.get(f) ?? 0) > (counts.get(best) ?? 0)) best = f;
  }
  return best;
}

export function nameOf(b: Butterfly): string {
  const fav = FOODS[favoriteFood(b.foods)].name;
  const prefix = b.golden ? `Golden ${fav}` : fav;
  return `${prefix} ${PATTERN_NAMES[b.pattern]} ${SHAPE_NAMES[b.shape]}`;
}

// ---------------------------------------------------------------------------
// Persistence

const STORAGE_KEY = 'butterfly-garden.v1';

interface SaveData {
  butterflies: Butterfly[];
  music: boolean;
  sound: boolean;
  /** The player's name, used in cheers and on the title. */
  name: string;
  /** Garden unlocks the player has already seen (so new ones can sparkle). */
  seenUnlocks: string[];
}

function load(): SaveData {
  const fresh: SaveData = { butterflies: [], music: true, sound: true, name: '', seenUnlocks: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      butterflies: Array.isArray(parsed.butterflies) ? parsed.butterflies : [],
      music: parsed.music ?? true,
      sound: parsed.sound ?? true,
      name: typeof parsed.name === 'string' ? parsed.name : '',
      seenUnlocks: Array.isArray(parsed.seenUnlocks) ? parsed.seenUnlocks : [],
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

export function discovered(): Set<string> {
  return new Set(save.butterflies.map((b) => slotKey(b.shape, b.pattern)));
}

export function goldenSlots(): Set<string> {
  return new Set(save.butterflies.filter((b) => b.golden).map((b) => slotKey(b.shape, b.pattern)));
}

/** Adds a butterfly; returns whether it filled a new slot in the book. */
export function addButterfly(b: Butterfly): { isNew: boolean; isNewGolden: boolean } {
  const key = slotKey(b.shape, b.pattern);
  const isNew = !discovered().has(key);
  const isNewGolden = b.golden && !goldenSlots().has(key);
  save.butterflies.push(b);
  persist();
  return { isNew, isNewGolden };
}

/** Latest butterfly made for a given book slot, if any. */
export function latestFor(shape: Shape, pattern: Pattern): Butterfly | undefined {
  for (let i = save.butterflies.length - 1; i >= 0; i--) {
    const b = save.butterflies[i];
    if (b.shape === shape && b.pattern === pattern) return b;
  }
  return undefined;
}

export function resetCollection() {
  save.butterflies = [];
  save.seenUnlocks = [];
  persist();
}

// ---------------------------------------------------------------------------
// Garden unlocks: every butterfly grown makes the garden a little richer.

export type UnlockId = 'mushroom' | 'pond' | 'rainbow' | 'bunny' | 'tree' | 'birdbath' | 'balloon' | 'fairyhouse';

export const UNLOCKS: { id: UnlockId; at: number }[] = [
  { id: 'mushroom', at: 2 },
  { id: 'pond', at: 3 },
  { id: 'rainbow', at: 5 },
  { id: 'bunny', at: 7 },
  { id: 'tree', at: 9 },
  { id: 'birdbath', at: 12 },
  { id: 'balloon', at: 15 },
  { id: 'fairyhouse', at: 20 },
];

export function unlocked(): UnlockId[] {
  const n = save.butterflies.length;
  return UNLOCKS.filter((u) => n >= u.at).map((u) => u.id);
}

/** Unlocks earned but not yet shown in the garden. */
export function unseenUnlocks(): UnlockId[] {
  return unlocked().filter((u) => !save.seenUnlocks.includes(u));
}

export function markUnlocksSeen() {
  save.seenUnlocks = unlocked();
  persist();
}

export const playerName = () => save.name.trim();

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
