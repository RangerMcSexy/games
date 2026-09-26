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
  { id: 'title', text: "{name}'s Butterfly Garden!", when: 'Title screen' },
  { id: 'letsGo', text: "Let's grow a butterfly, {name}!", when: 'Pressing play' },
  { id: 'pickEgg', text: 'Pick an egg!', when: 'Choosing an egg' },
  { id: 'tapEgg', text: 'Tap, tap, tap the egg!', when: 'Egg is ready to hatch' },
  { id: 'achoo', text: 'Achoo! Bless you, egg!', when: 'Silly: the egg sneezes' },
  { id: 'hello', text: 'Hello, little caterpillar!', when: 'Caterpillar hatches' },
  { id: 'hungry', text: 'The caterpillar is hungry! Tap some yummy food!', when: 'Feeding starts' },
  { id: 'sparkly', text: 'Ooh, sparkly!', when: 'Eating the rare golden leaf' },
  { id: 'full', text: "I'm so full! Time for a nap.", when: 'Done eating' },
  { id: 'burp', text: 'Excuse me!', when: 'Silly: the caterpillar burps' },
  { id: 'wrap', text: 'Tap to wrap it up!', when: 'Making the chrysalis' },
  { id: 'sticker', text: 'Pick a sticker!', when: 'Decorating the chrysalis' },
  { id: 'night', text: 'Shh. Night night! Tap the stars.', when: 'Night time' },
  { id: 'shootingStar', text: 'A shooting star! Make a wish!', when: 'Silly: shooting star at night' },
  { id: 'morning', text: 'Good morning! Something is wiggling! Tap, tap, tap!', when: 'Morning, ready to hatch' },
  { id: 'wow', text: 'Wow! A beautiful butterfly!', when: 'Butterfly appears' },
  { id: 'goodJob', text: 'Great job, {name}!', when: 'After the butterfly appears' },
  { id: 'newOne', text: 'A new one for your book!', when: 'A new kind of butterfly' },
  { id: 'bookDone', text: 'You filled your whole butterfly book! Hooray, {name}!', when: 'Book complete' },
  { id: 'garden', text: 'Your butterfly garden!', when: 'Opening the garden' },
  { id: 'gardenEmpty', text: "Your garden is empty. Let's grow a butterfly!", when: 'Garden with no butterflies' },
  { id: 'gardenNew', text: 'Look! Something new in the garden!', when: 'A garden surprise unlocked' },
  { id: 'nectar', text: 'Mmm, yummy nectar!', when: 'Feeding a butterfly a flower' },
  { id: 'dragFlower', text: 'Drag a flower to feed the butterflies!', when: 'Garden tip' },
  { id: 'nightGarden', text: 'Night night, garden!', when: 'Garden switched to night' },
  { id: 'dayGarden', text: 'Good morning, garden!', when: 'Garden switched to day' },
  { id: 'book', text: 'Your butterfly book!', when: 'Opening the book' },
  { id: 'yay', text: 'Yay!', when: 'Dot the ladybug cheering' },
  { id: 'n1', text: 'One!', when: 'Counting' },
  { id: 'n2', text: 'Two!', when: 'Counting' },
  { id: 'n3', text: 'Three!', when: 'Counting' },
  { id: 'n4', text: 'Four!', when: 'Counting' },
  { id: 'n5', text: 'Five!', when: 'Counting' },
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
const OWN_DB = 'butterfly-garden-voice';
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

export function stopSpeaking() {
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
  stopSpeaking();
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
export async function say(id: string): Promise<void> {
  const line = byId.get(id);
  if (!line) return;
  if (!save.sound || document.hidden) return;
  if (blobs.has(id)) {
    stopSpeaking();
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

/** Play a recording directly (for the grown-up screen's preview button). */
export function previewLine(id: string) {
  return say(id);
}

export const lineText = (l: Line) => fill(l.text);
