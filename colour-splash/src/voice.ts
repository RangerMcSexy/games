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
  { id: 'title', text: "{name}'s Colour Splash!", when: 'Title screen' },
  { id: 'letsPaint', text: "Let's paint, {name}!", when: 'Pressing play' },
  { id: 'pickPicture', text: 'Pick a picture!', when: 'Choosing a picture' },
  { id: 'more', text: 'More pictures!', when: 'Showing the next pictures' },
  { id: 'p-sun', text: 'Sunshine!', when: 'Naming pictures' },
  { id: 'p-fish', text: 'Fishy!', when: 'Naming pictures' },
  { id: 'p-butterfly', text: 'Butterfly!', when: 'Naming pictures' },
  { id: 'p-house', text: 'House!', when: 'Naming pictures' },
  { id: 'p-car', text: 'Car! Beep beep!', when: 'Naming pictures' },
  { id: 'p-flower', text: 'Flower!', when: 'Naming pictures' },
  { id: 'p-cat', text: 'Kitty!', when: 'Naming pictures' },
  { id: 'p-icecream', text: 'Ice cream!', when: 'Naming pictures' },
  { id: 'p-rainbow', text: 'Rainbow!', when: 'Naming pictures' },
  { id: 'p-rocket', text: 'Rocket!', when: 'Naming pictures' },
  { id: 'p-duck', text: 'Duckie! Quack!', when: 'Naming pictures' },
  { id: 'p-dino', text: 'Dino! Roar!', when: 'Naming pictures' },
  { id: 'tapToPaint', text: 'Tap to paint!', when: 'Starting a picture' },
  { id: 'c-pink', text: 'Pink!', when: 'Naming colours' },
  { id: 'c-red', text: 'Red!', when: 'Naming colours' },
  { id: 'c-orange', text: 'Orange!', when: 'Naming colours' },
  { id: 'c-yellow', text: 'Yellow!', when: 'Naming colours' },
  { id: 'c-green', text: 'Green!', when: 'Naming colours' },
  { id: 'c-blue', text: 'Blue!', when: 'Naming colours' },
  { id: 'c-purple', text: 'Purple!', when: 'Naming colours' },
  { id: 'c-brown', text: 'Brown!', when: 'Naming colours' },
  { id: 'c-rainbow', text: 'Rainbow colours!', when: 'Naming colours' },
  { id: 'wow', text: 'Wow!', when: 'Cheering while painting' },
  { id: 'pretty', text: 'So pretty!', when: 'Cheering while painting' },
  { id: 'lovely', text: 'Lovely colours!', when: 'Cheering while painting' },
  { id: 'magic', text: 'Magic!', when: 'The magic star paints for you' },
  { id: 'done', text: 'You did it, {name}!', when: 'A picture is finished' },
  { id: 'alive', text: "Look! It's moving!", when: 'The picture comes alive' },
  { id: 'gallery', text: 'Your pictures!', when: 'Opening the gallery' },
  { id: 'galleryEmpty', text: "No pictures yet. Let's paint!", when: 'Gallery with no pictures yet' },
  { id: 'galleryNew', text: 'Look! Something new!', when: 'A gallery surprise unlocked' },
  { id: 'splat', text: 'Splat!', when: 'Tapping the gallery wall' },
  { id: 'yay', text: 'Yay!', when: 'Cheering' },
];

const byId = new Map(LINES.map((l) => [l.id, l]));

// ---------------------------------------------------------------------------
// Storage (IndexedDB: blobs are too big for localStorage)

const DB = 'colour-splash-voice';
const STORE = 'clips';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const r = fn(db.transaction(STORE, mode).objectStore(STORE));
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

const blobs = new Map<string, Blob>();
const buffers = new Map<string, AudioBuffer>();

export async function loadRecordings() {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).openCursor();
      req.onsuccess = () => {
        const c = req.result;
        if (!c) return resolve();
        blobs.set(String(c.key), c.value as Blob);
        c.continue();
      };
      req.onerror = () => resolve();
    });
  } catch {
    // No IndexedDB (e.g. some private modes): robot voice only.
  }
}

export const hasRecording = (id: string) => blobs.has(id);
export const recordingCount = () => blobs.size;

export async function saveRecording(id: string, blob: Blob) {
  blobs.set(id, blob);
  buffers.delete(id);
  try {
    await tx('readwrite', (s) => s.put(blob, id));
  } catch {
    /* kept in memory for this visit */
  }
}

export async function deleteRecording(id: string) {
  blobs.delete(id);
  buffers.delete(id);
  try {
    await tx('readwrite', (s) => s.delete(id));
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

/** Say a few catalogued lines one after another. */
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
