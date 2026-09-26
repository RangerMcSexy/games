// Game data: treats, colours, shapes, animal customers, and the saved shop window.

import { storeName, storedName } from '../../shared/ask-name';

export type Kind = 'cake' | 'cupcake' | 'cookie';
export type ShapeId = 'round' | 'heart' | 'star';
export type ColorId = 'pink' | 'yellow' | 'blue' | 'green' | 'purple' | 'choc';
export type Topper = 'cherry' | 'strawberry' | 'candles';
export type AnimalId = 'bear' | 'hippo' | 'bunny' | 'piggy' | 'elephant' | 'dino' | 'owl' | 'cat';

export const KINDS: Kind[] = ['cake', 'cupcake', 'cookie'];
export const SHAPES: ShapeId[] = ['round', 'heart', 'star'];
export const COLORS: ColorId[] = ['pink', 'yellow', 'blue', 'green', 'purple', 'choc'];
export const TOPPERS: Topper[] = ['cherry', 'strawberry', 'candles'];
export const ANIMALS: AnimalId[] = ['bear', 'hippo', 'bunny', 'piggy', 'elephant', 'dino', 'owl', 'cat'];

/** Batter colour (raw), and the icing made in the same colour. */
export const PALETTE: Record<ColorId, { name: string; batter: string; icing: string }> = {
  pink: { name: 'Pink', batter: '#ffb0cf', icing: '#ff8fc0' },
  yellow: { name: 'Yellow', batter: '#ffe07a', icing: '#ffd84d' },
  blue: { name: 'Blue', batter: '#9fd2ff', icing: '#74bdfa' },
  green: { name: 'Green', batter: '#aee89c', icing: '#8edb7a' },
  purple: { name: 'Purple', batter: '#d2b6fa', icing: '#b995f2' },
  choc: { name: 'Chocolate', batter: '#b9835c', icing: '#8a5638' },
};

export const KIND_NAMES: Record<Kind, string> = { cake: 'cake', cupcake: 'cupcake', cookie: 'cookie' };
export const SHAPE_NAMES: Record<ShapeId, string> = { round: 'circle', heart: 'heart', star: 'star' };

export const ANIMAL_NAMES: Record<AnimalId, string> = {
  bear: 'Bear',
  hippo: 'Hippo',
  bunny: 'Bunny',
  piggy: 'Piggy',
  elephant: 'Elephant',
  dino: 'Dino',
  owl: 'Owl',
  cat: 'Kitty',
};

/** What a customer hopes for. Nothing the child makes is ever wrong. */
export interface Wish {
  kind: Kind;
  shape: ShapeId;
  color: ColorId;
}

export interface Treat {
  id: string;
  kind: Kind;
  shape: ShapeId;
  batter: ColorId;
  icing: ColorId;
  /** How many shakes of sprinkles went on. */
  sprinkles: number;
  topper: Topper;
  customer: AnimalId;
  /** It was exactly what the customer wished for. */
  wished: boolean;
  created: number;
}

export function matchesWish(t: Pick<Treat, 'kind' | 'shape' | 'batter' | 'icing'>, w: Wish) {
  return t.kind === w.kind && t.shape === w.shape && (t.icing === w.color || t.batter === w.color);
}

export function nameOf(t: Pick<Treat, 'kind' | 'shape' | 'icing'>): string {
  return `${PALETTE[t.icing].name} ${SHAPE_NAMES[t.shape]} ${KIND_NAMES[t.kind]}`;
}

/** A small deterministic random generator, so a treat always looks the same. */
export function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Persistence

const STORAGE_KEY = 'little-bakery.v1';

interface SaveData {
  treats: Treat[];
  music: boolean;
  sound: boolean;
  /** The player's name, used in cheers and on the title. */
  name: string;
  /** Shop unlocks the player has already seen (so new ones can sparkle). */
  seenUnlocks: string[];
}

function load(): SaveData {
  const fresh: SaveData = { treats: [], music: true, sound: true, name: '', seenUnlocks: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      treats: Array.isArray(parsed.treats) ? parsed.treats.filter(validTreat) : [],
      music: parsed.music ?? true,
      sound: parsed.sound ?? true,
      name: typeof parsed.name === 'string' ? parsed.name : '',
      seenUnlocks: Array.isArray(parsed.seenUnlocks) ? parsed.seenUnlocks : [],
    };
  } catch {
    return fresh;
  }
}

function validTreat(t: Treat) {
  return (
    !!t &&
    KINDS.includes(t.kind) &&
    SHAPES.includes(t.shape) &&
    COLORS.includes(t.batter) &&
    COLORS.includes(t.icing) &&
    TOPPERS.includes(t.topper) &&
    ANIMALS.includes(t.customer)
  );
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

export function addTreat(t: Treat) {
  save.treats.push(t);
  persist();
}

export function resetCollection() {
  save.treats = [];
  save.seenUnlocks = [];
  persist();
}

/** Animals who have visited, most recent first. */
export function visitors(): AnimalId[] {
  const seen: AnimalId[] = [];
  for (let i = save.treats.length - 1; i >= 0; i--) {
    const a = save.treats[i].customer;
    if (!seen.includes(a)) seen.push(a);
  }
  return seen;
}

// ---------------------------------------------------------------------------
// Shop unlocks: every treat baked makes the shop a little fancier.

export type UnlockId = 'bunting' | 'flowers' | 'cat' | 'lights' | 'stand' | 'stripes' | 'balloons' | 'sign';

export const UNLOCKS: { id: UnlockId; at: number }[] = [
  { id: 'bunting', at: 2 },
  { id: 'flowers', at: 3 },
  { id: 'cat', at: 5 },
  { id: 'lights', at: 7 },
  { id: 'stand', at: 10 },
  { id: 'stripes', at: 13 },
  { id: 'balloons', at: 16 },
  { id: 'sign', at: 20 },
];

export function unlocked(): UnlockId[] {
  const n = save.treats.length;
  return UNLOCKS.filter((u) => n >= u.at).map((u) => u.id);
}

/** Unlocks earned but not yet shown in the shop. */
export function unseenUnlocks(): UnlockId[] {
  return unlocked().filter((u) => !save.seenUnlocks.includes(u));
}

export function markUnlocksSeen() {
  save.seenUnlocks = unlocked();
  persist();
}

export const playerName = () => save.name.trim();

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
