// Game data: foods, wing shapes, patterns, and the saved butterfly collection.

export type Shape = 'round' | 'pointy' | 'swallow' | 'heart';
export type Pattern = 'dots' | 'stripes' | 'hearts' | 'stars';
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
  strawberry: { id: 'strawberry', name: 'Strawberry', color: '#ff5d73' },
  orange: { id: 'orange', name: 'Orange', color: '#ff9f1c' },
  banana: { id: 'banana', name: 'Banana', color: '#ffd23f' },
  pear: { id: 'pear', name: 'Pear', color: '#7fd35b' },
  blueberry: { id: 'blueberry', name: 'Blueberry', color: '#4ea8ff' },
  grape: { id: 'grape', name: 'Grape', color: '#a86cf0' },
  melon: { id: 'melon', name: 'Watermelon', color: '#ff8fcf' },
  golden: { id: 'golden', name: 'Golden', color: '#f7c948' },
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

export const SHAPES: Shape[] = ['round', 'pointy', 'swallow', 'heart'];
export const PATTERNS: Pattern[] = ['dots', 'stripes', 'hearts', 'stars'];

export const SHAPE_NAMES: Record<Shape, string> = {
  round: 'Puffwing',
  pointy: 'Zipwing',
  swallow: 'Swallowtail',
  heart: 'Sweetheart',
};

export const PATTERN_NAMES: Record<Pattern, string> = {
  dots: 'Dotty',
  stripes: 'Stripy',
  hearts: 'Lovey',
  stars: 'Starry',
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
}

function load(): SaveData {
  const fresh: SaveData = { butterflies: [], music: true, sound: true };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      butterflies: Array.isArray(parsed.butterflies) ? parsed.butterflies : [],
      music: parsed.music ?? true,
      sound: parsed.sound ?? true,
    };
  } catch {
    return fresh;
  }
}

export const save: SaveData = load();

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
  persist();
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
