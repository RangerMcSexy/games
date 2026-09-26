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
  { id: 'title', text: "{name}'s Little Fishing Pond!", when: 'Title screen' },
  { id: 'letsFish', text: "Let's go fishing, {name}!", when: 'Pressing play' },
  { id: 'tapWater', text: 'Tap the water!', when: 'Waiting to cast' },
  { id: 'wait', text: 'Wait for a nibble…', when: 'The line is in the water' },
  { id: 'nibble', text: 'Nibble nibble!', when: 'Something is nibbling' },
  { id: 'bite', text: 'You got one! Tap tap!', when: 'A fish is on the hook' },
  { id: 'tapTap', text: 'Tap tap!', when: 'Reminder to reel in' },
  { id: 'f-gold', text: 'A goldfish!', when: 'Naming the fish' },
  { id: 'f-blue', text: 'A blue fish!', when: 'Naming the fish' },
  { id: 'f-red', text: 'A red fish!', when: 'Naming the fish' },
  { id: 'f-purple', text: 'A purple fish!', when: 'Naming the fish' },
  { id: 'f-spotty', text: 'A spotty fish!', when: 'Naming the fish' },
  { id: 'f-stripy', text: 'A stripy fish!', when: 'Naming the fish' },
  { id: 'f-rainbow', text: 'A rainbow fish!', when: 'Naming the fish' },
  { id: 'f-puffer', text: 'A puffer fish! Puff!', when: 'Naming the fish' },
  { id: 'f-cat', text: 'A whiskery catfish!', when: 'Naming the fish' },
  { id: 'f-tiny', text: 'A teeny tiny fish!', when: 'Naming the fish' },
  { id: 'f-crab', text: 'A crab! Snap snap!', when: 'Naming the fish' },
  { id: 'f-glow', text: 'A glowing fish!', when: 'Naming the fish (night only)' },
  { id: 's-boot', text: 'Oh! An old boot!', when: 'Silly catches' },
  { id: 's-duck', text: 'A rubber duckie! Squeak!', when: 'Silly catches' },
  { id: 's-teapot', text: 'A teapot! How silly!', when: 'Silly catches' },
  { id: 's-sock', text: 'A stinky sock! Pee-yoo!', when: 'Silly catches' },
  { id: 's-crown', text: 'A shiny crown!', when: 'Silly catches' },
  { id: 's-hat', text: 'A funny hat!', when: 'Silly catches' },
  { id: 'newFish', text: 'A new one!', when: 'Catching a fish for the first time' },
  { id: 'allFish', text: 'You found every fish, {name}!', when: 'All 12 fish caught' },
  { id: 'yay', text: 'Yay!', when: 'Cheering' },
  { id: 'wow', text: 'Wow!', when: 'Cheering' },
  { id: 'wellDone', text: 'Well done, {name}!', when: 'Cheering' },
  { id: 'w-day', text: 'Good morning, sunshine!', when: 'The sun comes out' },
  { id: 'w-rain', text: 'Pitter patter! It\'s raining!', when: 'It starts to rain' },
  { id: 'w-sunset', text: 'The sun is going down.', when: 'Sunset' },
  { id: 'w-night', text: 'Night night! Look at the moon!', when: 'Night time' },
  { id: 'frog', text: 'Ribbit!', when: 'Tapping the frog' },
  { id: 'duck', text: 'Quack quack!', when: 'Tapping the duck' },
  { id: 'turtle', text: 'Hello, turtle!', when: 'Tapping the turtle' },
  { id: 'pip', text: "Hi! I'm Pip!", when: 'Tapping Pip the penguin' },
  { id: 'aquarium', text: 'Your fish!', when: 'Opening the fish tank' },
  { id: 'aquariumEmpty', text: "No fish yet. Let's go fishing!", when: 'Fish tank with no fish yet' },
  { id: 'aquariumNew', text: 'Look! Something new!', when: 'A fish tank surprise unlocked' },
  { id: 'yum', text: 'Yum yum!', when: 'Feeding the fish' },
];

const byId = new Map(LINES.map((l) => [l.id, l]));

// ---------------------------------------------------------------------------
// Storage (IndexedDB: blobs are too big for localStorage)

const DB = 'fishing-pond-voice';
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
  if (!save.sound || !('speechSynthesis' in window)) return Promise.resolve();
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
  if (!save.sound) return;
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
