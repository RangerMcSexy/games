// Game data: the pond friends met at the end of each hop across the pond,
// the flower colours, and the saved game.

import { storeName, storedName } from '../../shared/ask-name';

export interface Friend {
  id: string;
  name: string;
}

/** Met in this order, one new friend at the end of each trip. */
export const FRIENDS: Friend[] = [
  { id: 'duck', name: 'Duckling' },
  { id: 'turtle', name: 'Turtle' },
  { id: 'dragonfly', name: 'Dragonfly' },
  { id: 'snail', name: 'Snail' },
  { id: 'fish', name: 'Goldfish' },
  { id: 'ladybird', name: 'Ladybird' },
  { id: 'tadpoles', name: 'Tadpoles' },
  { id: 'butterfly', name: 'Butterfly' },
  { id: 'bee', name: 'Bee' },
  { id: 'swan', name: 'Swan' },
  { id: 'otter', name: 'Otter' },
  { id: 'babyfrog', name: 'Baby Frog' },
];

export const friendById = (id: string) => FRIENDS.find((f) => f.id === id);

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

export const colourById = (id: string) => COLOURS.find((c) => c.id === id)!;

// ---------------------------------------------------------------------------
// Persistence

const STORAGE_KEY = 'leapy-pond.v1';

interface SaveData {
  /** Friends met, in the order they were met. */
  friends: string[];
  /** Friends the player has already seen in their pond (so new ones sparkle). */
  seen: string[];
  /** Trips across the pond. */
  trips: number;
  /** Flies Hoppy has caught. */
  flies: number;
  music: boolean;
  sound: boolean;
  /** The player's name, used in cheers and on the title. */
  name: string;
}

function load(): SaveData {
  const fresh: SaveData = { friends: [], seen: [], trips: 0, flies: 0, music: true, sound: true, name: '' };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const p = JSON.parse(raw) as Partial<SaveData>;
    const ids = FRIENDS.map((f) => f.id);
    const friends = (Array.isArray(p.friends) ? p.friends : []).filter((id, i, a) => ids.includes(id) && a.indexOf(id) === i);
    return {
      friends,
      seen: (Array.isArray(p.seen) ? p.seen : []).filter((id) => friends.includes(id)),
      trips: typeof p.trips === 'number' ? p.trips : 0,
      flies: typeof p.flies === 'number' ? p.flies : 0,
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

/** Who waits at the end of the next trip: someone new while there is anyone left to meet. */
export function nextFriend(): { friend: Friend; isNew: boolean } {
  const fresh = FRIENDS.find((f) => !save.friends.includes(f.id));
  if (fresh) return { friend: fresh, isNew: true };
  return { friend: FRIENDS[Math.floor(Math.random() * FRIENDS.length)], isNew: false };
}

/** A trip across the pond is done: `friend` comes to live in the player's pond. */
export function finishTrip(friend: Friend) {
  save.trips++;
  if (!save.friends.includes(friend.id)) save.friends.push(friend.id);
  persist();
}

export function addFly() {
  save.flies++;
  persist();
}

/** Friends met but not yet seen in the pond. */
export const unseenFriends = () => save.friends.filter((id) => !save.seen.includes(id));

export function markFriendsSeen() {
  save.seen = save.friends.slice();
  persist();
}

export function resetPond() {
  save.friends = [];
  save.seen = [];
  save.trips = 0;
  save.flies = 0;
  persist();
}

export const playerName = () => save.name.trim();
