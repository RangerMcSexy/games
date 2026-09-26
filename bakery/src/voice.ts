// Spoken prompts. Every line can be recorded by a grown-up in their own voice
// (stored on the device in IndexedDB); anything not recorded falls back to the
// browser's text-to-speech.
import { sound } from './audio';
import { playerName, save } from './data';

export interface Line {
  id: string;
  /** What the robot voice says ({name} is replaced by the player's name). */
  text: string;
  /** Short hint shown to the grown-up recording it. */
  when: string;
}

export const LINES: Line[] = [
  { id: 'title', text: "{name}'s Bakery!", when: 'Title screen' },
  { id: 'letsBake', text: "Let's bake, {name}!", when: 'Pressing play' },
  { id: 'bear', text: 'Hello, Bear!', when: 'Bear comes in' },
  { id: 'hippo', text: 'Hello, Hippo!', when: 'Hippo comes in' },
  { id: 'bunny', text: 'Hello, Bunny!', when: 'Bunny comes in' },
  { id: 'piggy', text: 'Hello, Piggy!', when: 'Piggy comes in' },
  { id: 'elephant', text: 'Hello, Elephant!', when: 'Elephant comes in' },
  { id: 'dino', text: 'Hello, Dino!', when: 'Dino comes in' },
  { id: 'owl', text: 'Hello, Owl!', when: 'Owl comes in' },
  { id: 'cat', text: 'Hello, Kitty!', when: 'Kitty comes in' },
  { id: 'wish', text: 'I would like…', when: 'A customer says what they want' },
  { id: 'please', text: 'Please!', when: 'After the customer’s wish' },
  { id: 'whatBake', text: 'What shall we bake?', when: 'Choosing cake, cupcake or cookie' },
  { id: 'cake', text: 'Cake!', when: 'Naming things' },
  { id: 'cupcake', text: 'Cupcake!', when: 'Naming things' },
  { id: 'cookie', text: 'Cookie!', when: 'Naming things' },
  { id: 'eggs', text: 'Crack the eggs!', when: 'Three eggs to tap' },
  { id: 'rollAway', text: 'Whoops! Come back, egg!', when: 'Silly: an egg rolls away' },
  { id: 'flour', text: 'Tap the flour!', when: 'Pouring the flour' },
  { id: 'achoo', text: 'Achoo! Bless you!', when: 'Silly: the mouse sneezes' },
  { id: 'pickColour', text: 'Pick a colour!', when: 'Choosing a colour' },
  { id: 'pink', text: 'Pink!', when: 'Naming colours' },
  { id: 'yellow', text: 'Yellow!', when: 'Naming colours' },
  { id: 'blue', text: 'Blue!', when: 'Naming colours' },
  { id: 'green', text: 'Green!', when: 'Naming colours' },
  { id: 'purple', text: 'Purple!', when: 'Naming colours' },
  { id: 'choc', text: 'Chocolate!', when: 'Naming colours' },
  { id: 'stir', text: 'Stir, stir, stir!', when: 'Stirring the bowl' },
  { id: 'yumBatter', text: 'Mmm! Tasty!', when: 'Silly: the mouse tastes the batter' },
  { id: 'pickShape', text: 'Pick a shape!', when: 'Choosing a shape' },
  { id: 'round', text: 'Circle!', when: 'Naming shapes' },
  { id: 'heart', text: 'Heart!', when: 'Naming shapes' },
  { id: 'star', text: 'Star!', when: 'Naming shapes' },
  { id: 'oven', text: 'Close the oven!', when: 'Putting it in the oven' },
  { id: 'waiting', text: 'Tick, tock…', when: 'Waiting for the oven' },
  { id: 'ding', text: 'Ding! Open the oven!', when: 'The oven is done' },
  { id: 'puffy', text: 'Whoa! So big!', when: 'Silly: it puffs up too much' },
  { id: 'icing', text: 'Pick the icing!', when: 'Choosing icing' },
  { id: 'sprinkles', text: 'Shake the sprinkles!', when: 'Sprinkles' },
  { id: 'onTop', text: 'What goes on top?', when: 'Choosing a topping' },
  { id: 'cherry', text: 'A cherry!', when: 'Cherry on top' },
  { id: 'strawberry', text: 'A strawberry!', when: 'Strawberry on top' },
  { id: 'candles', text: "Candles! Let's count!", when: 'Candles on top' },
  { id: 'blow', text: 'Blow out the candles!', when: 'After three candles' },
  { id: 'serve', text: 'Tap to give it!', when: 'Serving the customer' },
  { id: 'yummy', text: 'Mmm! Yummy!', when: 'A customer eats' },
  { id: 'justRight', text: 'Just what I wanted!', when: 'It matched the wish' },
  { id: 'thankYou', text: 'Thank you, {name}!', when: 'The customer says thanks' },
  { id: 'byeBye', text: 'Bye-bye!', when: 'The customer leaves' },
  { id: 'shop', text: 'Your bakery shop!', when: 'Opening the shop window' },
  { id: 'shopEmpty', text: "The shelves are empty. Let's bake!", when: 'Shop with no treats yet' },
  { id: 'shopNew', text: 'Look! Something new!', when: 'A shop surprise unlocked' },
  { id: 'nightShop', text: 'Night night, bakery!', when: 'Shop switched to night' },
  { id: 'dayShop', text: 'Good morning, bakery!', when: 'Shop switched to day' },
  { id: 'yay', text: 'Yay!', when: 'Cheering' },
  { id: 'n1', text: 'One!', when: 'Counting' },
  { id: 'n2', text: 'Two!', when: 'Counting' },
  { id: 'n3', text: 'Three!', when: 'Counting' },
];

const byId = new Map(LINES.map((l) => [l.id, l]));

// ---------------------------------------------------------------------------
// Storage (IndexedDB: blobs are too big for localStorage)
//
// Recordings are filed under what the line says ("Yay!", "Blue!"), in a store
// shared by all the games opened from the same address, so a line only has
// to be recorded once. Older recordings, filed by line in this game's own
// store, move across the first time they're loaded.

const SHARED_DB = 'games-voice';
const OWN_DB = 'little-bakery-voice';
const STORE = 'clips';

function openDb(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(name: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb(name);
  return new Promise<T>((resolve, reject) => {
    const r = fn(db.transaction(STORE, mode).objectStore(STORE));
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

async function readAll(name: string): Promise<Map<string, Blob>> {
  const out = new Map<string, Blob>();
  try {
    const db = await openDb(name);
    await new Promise<void>((resolve) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).openCursor();
      req.onsuccess = () => {
        const c = req.result;
        if (!c) return resolve();
        out.set(String(c.key), c.value as Blob);
        c.continue();
      };
      req.onerror = () => resolve();
    });
  } catch {
    // No IndexedDB (e.g. some private modes): robot voice only.
  }
  return out;
}

const blobs = new Map<string, Blob>();
const buffers = new Map<string, AudioBuffer>();

/** Every line in this game that says the same words as `id`. */
const sameWords = (id: string) => {
  const text = byId.get(id)?.text;
  return text === undefined ? [id] : LINES.filter((l) => l.text === text).map((l) => l.id);
};

export async function loadRecordings() {
  const [shared, own] = await Promise.all([readAll(SHARED_DB), readAll(OWN_DB)]);
  for (const line of LINES) {
    let blob = shared.get(line.text);
    const old = own.get(line.id);
    if (old) {
      if (!blob) {
        blob = old;
        shared.set(line.text, old);
        await tx(SHARED_DB, 'readwrite', (s) => s.put(old, line.text)).catch(() => {});
      }
      await tx(OWN_DB, 'readwrite', (s) => s.delete(line.id)).catch(() => {});
    }
    if (blob) blobs.set(line.id, blob);
  }
}

export const hasRecording = (id: string) => blobs.has(id);
export const recordingCount = () => blobs.size;

export async function saveRecording(id: string, blob: Blob) {
  for (const same of sameWords(id)) {
    blobs.set(same, blob);
    buffers.delete(same);
  }
  const text = byId.get(id)?.text ?? id;
  try {
    await tx(SHARED_DB, 'readwrite', (s) => s.put(blob, text));
  } catch {
    /* kept in memory for this visit */
  }
}

export async function deleteRecording(id: string) {
  for (const same of sameWords(id)) {
    blobs.delete(same);
    buffers.delete(same);
  }
  const text = byId.get(id)?.text ?? id;
  try {
    await tx(SHARED_DB, 'readwrite', (s) => s.delete(text));
  } catch {
    /* ignore */
  }
}

async function bufferFor(id: string): Promise<AudioBuffer | null> {
  const cached = buffers.get(id);
  if (cached) return cached;
  const blob = blobs.get(id);
  const ctx = sound.context;
  if (!blob || !ctx) return null;
  try {
    const data = await blob.arrayBuffer();
    const buf = await new Promise<AudioBuffer>((res, rej) => ctx.decodeAudioData(data, res, rej));
    buffers.set(id, buf);
    return buf;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Recording

export class Recorder {
  private rec?: MediaRecorder;
  private stream?: MediaStream;
  private chunks: Blob[] = [];

  static supported() {
    return !!navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function' && typeof MediaRecorder !== 'undefined';
  }

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    const types = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg'];
    const mimeType = types.find((t) => MediaRecorder.isTypeSupported?.(t));
    this.rec = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined);
    this.chunks = [];
    this.rec.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
    this.rec.start();
  }

  stop(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const rec = this.rec;
      if (!rec || rec.state === 'inactive') return resolve(null);
      rec.onstop = () => {
        this.stream?.getTracks().forEach((t) => t.stop());
        const blob = new Blob(this.chunks, { type: rec.mimeType || 'audio/webm' });
        resolve(blob.size > 800 ? blob : null);
      };
      rec.stop();
    });
  }
}

// ---------------------------------------------------------------------------
// Speaking

let ttsVoice: SpeechSynthesisVoice | undefined;
let current: AudioBufferSourceNode | null = null;
let token = 0;
let chain = 0;

function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const choose = () => {
    const voices = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en'));
    const liked = ['Samantha', 'Google US English', 'Karen', 'Moira', 'Tessa', 'Aria', 'Jenny', 'Zira', 'Female'];
    for (const name of liked) {
      const v = voices.find((x) => x.name.includes(name));
      if (v) return (ttsVoice = v);
    }
    ttsVoice = voices.find((v) => v.lang === 'en-US') ?? voices[0];
  };
  choose();
  if (!ttsVoice) speechSynthesis.addEventListener('voiceschanged', choose, { once: true });
}
pickVoice();

/** Stop everything, including a sequence from `sayAll`. */
export function stopSpeaking() {
  chain++;
  cut();
}

function cut() {
  token++;
  try {
    current?.stop();
  } catch {
    /* already stopped */
  }
  current = null;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  sound.duck(false);
}

function fill(text: string) {
  const name = playerName();
  return name ? text.replace(/\{name\}/g, name) : text.replace(/,?\s*\{name\}/g, '').replace(/\{name\}'s\s*/g, '');
}

/** Robot voice for arbitrary text. Resolves when finished (or cut off). */
export function sayText(text: string): Promise<void> {
  cut();
  if (!save.sound || document.hidden || !('speechSynthesis' in window)) return Promise.resolve();
  const my = token;
  return new Promise((resolve) => {
    try {
      const u = new SpeechSynthesisUtterance(fill(text));
      if (ttsVoice) u.voice = ttsVoice;
      u.lang = ttsVoice?.lang ?? 'en-US';
      u.rate = 0.92;
      u.pitch = 1.2;
      u.onstart = () => sound.duck(true);
      const done = () => {
        if (my === token) sound.duck(false);
        resolve();
      };
      u.onend = done;
      u.onerror = done;
      speechSynthesis.speak(u);
      // Safety net: some browsers never fire onend.
      setTimeout(done, 1500 + text.length * 90);
    } catch {
      resolve();
    }
  });
}

/** Say a catalogued line: the grown-up's recording if there is one. */
export function say(id: string): Promise<void> {
  chain++;
  return sayOne(id);
}

async function sayOne(id: string): Promise<void> {
  const line = byId.get(id);
  if (!line) return;
  if (!save.sound || document.hidden) return;
  if (blobs.has(id)) {
    cut();
    const my = token;
    const buf = await bufferFor(id);
    if (my !== token) return;
    if (buf && sound.context) {
      return new Promise((resolve) => {
        const src = sound.context!.createBufferSource();
        src.buffer = buf;
        src.connect(sound.voiceOut!);
        current = src;
        sound.duck(true);
        src.onended = () => {
          if (current === src) {
            current = null;
            sound.duck(false);
          }
          resolve();
        };
        src.start();
      });
    }
  }
  return sayText(line.text);
}

/** Say a few catalogued lines one after another ("Pink!" "Heart!" "Cupcake!"). */
export async function sayAll(ids: string[], gap = 120): Promise<void> {
  const mine = ++chain;
  for (const id of ids) {
    await sayOne(id);
    if (mine !== chain) return;
    await new Promise((r) => setTimeout(r, gap));
    if (mine !== chain) return;
  }
}

/** Play a recording directly (for the grown-up screen's preview button). */
export function previewLine(id: string) {
  return say(id);
}

export const lineText = (l: Line) => fill(l.text);
