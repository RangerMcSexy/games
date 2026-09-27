// Game data: the 26 letter friends who live on the street, and the
// saved game, including how sure the child is of each letter.

import { storeName, storedName } from '../../shared/ask-name';

export interface Friend {
  /** The letter on the door, lower case. */
  letter: string;
  /** Who lives behind it. */
  animal: string;
  name: string;
  /** The house's colours. */
  wall: string;
  roof: string;
  door: string;
}

/**
 * The whole alphabet, met in this order, a new one every round or so.
 * Common, different-looking letters come first and rare ones (q, x) last;
 * letters that are easy to mix up are kept well apart.
 */
export const FRIENDS: Friend[] = [
  { letter: 's', animal: 'snake', name: 'Snake', wall: '#d4f3c4', roof: '#5fbf6a', door: '#ffd84a' },
  { letter: 'a', animal: 'ant', name: 'Ant', wall: '#ffdcdc', roof: '#ff6b6b', door: '#5eaaff' },
  { letter: 't', animal: 'tiger', name: 'Tiger', wall: '#ffe6bf', roof: '#ff9f43', door: '#7fd35b' },
  { letter: 'm', animal: 'mouse', name: 'Mouse', wall: '#e9e1ff', roof: '#9b7df0', door: '#ff94c8' },
  { letter: 'p', animal: 'pig', name: 'Pig', wall: '#ffdcec', roof: '#ff7ab0', door: '#4fc4bb' },
  { letter: 'o', animal: 'octopus', name: 'Octopus', wall: '#d9eeff', roof: '#4ea8f5', door: '#ffa24a' },
  { letter: 'c', animal: 'cat', name: 'Cat', wall: '#fff2bd', roof: '#f0b12a', door: '#b184f5' },
  { letter: 'h', animal: 'hen', name: 'Hen', wall: '#ffe2cf', roof: '#e8744f', door: '#6fcf6a' },
  { letter: 'd', animal: 'dog', name: 'Dog', wall: '#dcf5e7', roof: '#3fb58a', door: '#ff6b6b' },
  { letter: 'f', animal: 'fox', name: 'Fox', wall: '#ffe9d4', roof: '#d9703a', door: '#4ea8f5' },
  { letter: 'e', animal: 'elephant', name: 'Elephant', wall: '#e4ebf6', roof: '#7d8fb3', door: '#ffd84a' },
  { letter: 'b', animal: 'bear', name: 'Bear', wall: '#f3e4d3', roof: '#a8703f', door: '#7fd35b' },
  { letter: 'r', animal: 'rabbit', name: 'Rabbit', wall: '#ffe4ef', roof: '#e85d8a', door: '#7fd35b' },
  { letter: 'n', animal: 'narwhal', name: 'Narwhal', wall: '#dff1fb', roof: '#3f8fd1', door: '#ffd84a' },
  { letter: 'g', animal: 'goat', name: 'Goat', wall: '#f1f6d8', roof: '#8cb33f', door: '#ff94c8' },
  { letter: 'i', animal: 'iguana', name: 'Iguana', wall: '#e2f7d9', roof: '#4fae5a', door: '#ffa24a' },
  { letter: 'l', animal: 'lion', name: 'Lion', wall: '#fff0cc', roof: '#e89a2c', door: '#5eaaff' },
  { letter: 'k', animal: 'koala', name: 'Koala', wall: '#e8ecf2', roof: '#8a98ad', door: '#ff6b6b' },
  { letter: 'u', animal: 'unicorn', name: 'Unicorn', wall: '#fbe6ff', roof: '#c77ce8', door: '#ffd84a' },
  { letter: 'j', animal: 'jellyfish', name: 'Jellyfish', wall: '#ffe6f4', roof: '#f26bb5', door: '#4fc4bb' },
  { letter: 'w', animal: 'walrus', name: 'Walrus', wall: '#efe3da', roof: '#9c6b52', door: '#5eaaff' },
  { letter: 'z', animal: 'zebra', name: 'Zebra', wall: '#eeeef4', roof: '#5b5f7a', door: '#ff94c8' },
  { letter: 'y', animal: 'yak', name: 'Yak', wall: '#f6eadf', roof: '#b3753e', door: '#6fcf6a' },
  { letter: 'v', animal: 'vulture', name: 'Vulture', wall: '#ffe8e0', roof: '#d0603f', door: '#b184f5' },
  { letter: 'q', animal: 'quail', name: 'Quail', wall: '#f7ecd9', roof: '#c28a3c', door: '#4ea8f5' },
  { letter: 'x', animal: 'xrayfish', name: 'X-ray Fish', wall: '#dcf3f7', roof: '#36a9bf', door: '#ffa24a' },
];

export const friendOf = (letter: string) => FRIENDS.find((f) => f.letter === letter);

/** Letters that look alike (turned round or upside down), never on doors side by side. */
const LOOKALIKES = [['b', 'd', 'p', 'q'], ['g', 'q'], ['n', 'u'], ['m', 'w'], ['i', 'j']];
export const lookAlike = (a: string, b: string) => a !== b && LOOKALIKES.some((g) => g.includes(a) && g.includes(b));

/** How sure the child is of a letter: 0 (new) to 5 (knows it well). */
export const MAX_SCORE = 5;

// ---------------------------------------------------------------------------
// Persistence

const STORAGE_KEY = 'postie-pip.v1';

interface SaveData {
  /** Letters learned, in the order they were learned. */
  letters: string[];
  /** Letters the player has already seen on the street (so new ones sparkle). */
  seen: string[];
  /** How sure the child is of each letter (see `record`). */
  scores: Record<string, number>;
  /** Rounds finished. */
  rounds: number;
  /** Rounds since a new letter was learned. */
  sinceNew: number;
  music: boolean;
  sound: boolean;
  /** The player's name, used in cheers and on the title. */
  name: string;
}

function load(): SaveData {
  const fresh: SaveData = { letters: [], seen: [], scores: {}, rounds: 0, sinceNew: 0, music: true, sound: true, name: '' };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const p = JSON.parse(raw) as Partial<SaveData>;
    const ids = FRIENDS.map((f) => f.letter);
    const letters = (Array.isArray(p.letters) ? p.letters : []).filter((id, i, a) => ids.includes(id) && a.indexOf(id) === i);
    const scores: Record<string, number> = {};
    if (p.scores && typeof p.scores === 'object')
      for (const [l, n] of Object.entries(p.scores)) if (ids.includes(l) && typeof n === 'number' && n >= 0) scores[l] = Math.min(MAX_SCORE, Math.round(n));
    const count = (n: unknown) => (typeof n === 'number' && n >= 0 ? Math.floor(n) : 0);
    return {
      letters,
      seen: (Array.isArray(p.seen) ? p.seen : []).filter((id) => letters.includes(id)),
      scores,
      rounds: count(p.rounds),
      sinceNew: count(p.sinceNew),
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

export const scoreOf = (letter: string) => save.scores[letter] ?? 0;

/**
 * The letter to meet this round, if it's time for a new one: once every
 * letter learned so far has been got right first time a couple of times
 * (or after two rounds without one, so nobody gets stuck).
 */
export function nextNew(): Friend | null {
  const next = FRIENDS.find((f) => !save.letters.includes(f.letter));
  if (!next) return null;
  const ready = save.letters.length < 2 || save.sinceNew >= 2 || save.letters.every((l) => scoreOf(l) >= 2);
  return ready ? next : null;
}

/**
 * A parcel was delivered: right first time makes the letter a bit surer,
 * a wrong door first makes it come round more often.
 */
export function record(letter: string, firstTime: boolean) {
  const s = scoreOf(letter);
  save.scores[letter] = firstTime ? Math.min(MAX_SCORE, s + 1) : Math.max(0, s - 2);
  persist();
}

/** A round is done; `learned` is the new letter met in it, if there was one. */
export function finishRound(learned: Friend | null) {
  save.rounds++;
  if (learned && !save.letters.includes(learned.letter)) {
    save.letters.push(learned.letter);
    save.sinceNew = 0;
  } else save.sinceNew++;
  persist();
}

/** Letters learned but not yet seen on the street. */
export const unseenLetters = () => save.letters.filter((id) => !save.seen.includes(id));

export function markLettersSeen() {
  save.seen = save.letters.slice();
  persist();
}

export function resetLetters() {
  save.letters = [];
  save.seen = [];
  save.scores = {};
  save.rounds = 0;
  save.sinceNew = 0;
  persist();
}

export const playerName = () => save.name.trim();
