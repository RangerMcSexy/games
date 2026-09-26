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
  { id: 'title', text: "{name}'s Leapy Pond!", when: 'Title screen' },
  { id: 'letsHop', text: "Let's hop, {name}!", when: 'Pressing play' },
  { id: 'tapPad', text: 'Tap a lily pad!', when: 'Waiting for a hop' },
  { id: 'hop', text: 'Hop!', when: 'Hoppy jumps' },
  { id: 'wheee', text: 'Wheee!', when: 'Hoppy jumps' },
  { id: 'boing', text: 'Boing!', when: 'Hoppy jumps' },
  { id: 'fly', text: 'Slurp! A yummy fly!', when: 'Hoppy catches a fly' },
  { id: 'splash', text: 'Splish splash!', when: 'Tapping the water' },
  { id: 'fishy', text: 'Fishy!', when: 'A fish jumps' },
  { id: 'findRed', text: 'Find the red flower!', when: 'Pick a colour' },
  { id: 'findOrange', text: 'Find the orange flower!', when: 'Pick a colour' },
  { id: 'findYellow', text: 'Find the yellow flower!', when: 'Pick a colour' },
  { id: 'findBlue', text: 'Find the blue flower!', when: 'Pick a colour' },
  { id: 'findPurple', text: 'Find the purple flower!', when: 'Pick a colour' },
  { id: 'findPink', text: 'Find the pink flower!', when: 'Pick a colour' },
  { id: 'red', text: 'Red!', when: 'Naming the colour' },
  { id: 'orange', text: 'Orange!', when: 'Naming the colour' },
  { id: 'yellow', text: 'Yellow!', when: 'Naming the colour' },
  { id: 'blue', text: 'Blue!', when: 'Naming the colour' },
  { id: 'purple', text: 'Purple!', when: 'Naming the colour' },
  { id: 'pink', text: 'Pink!', when: 'Naming the colour' },
  { id: 'thatRed', text: "That one's red!", when: 'Tapping another colour' },
  { id: 'thatOrange', text: "That one's orange!", when: 'Tapping another colour' },
  { id: 'thatYellow', text: "That one's yellow!", when: 'Tapping another colour' },
  { id: 'thatBlue', text: "That one's blue!", when: 'Tapping another colour' },
  { id: 'thatPurple', text: "That one's purple!", when: 'Tapping another colour' },
  { id: 'thatPink', text: "That one's pink!", when: 'Tapping another colour' },
  { id: 'count', text: "Stepping stones! Let's count!", when: 'A row of little hops' },
  { id: 'n1', text: 'One!', when: 'Counting hops' },
  { id: 'n2', text: 'Two!', when: 'Counting hops' },
  { id: 'n3', text: 'Three!', when: 'Counting hops' },
  { id: 'n4', text: 'Four!', when: 'Counting hops' },
  { id: 'n5', text: 'Five!', when: 'Counting hops' },
  { id: 'nearly', text: 'Nearly there!', when: 'One hop to go' },
  { id: 'whoIs', text: "Who's that?", when: 'Someone waits at the end' },
  { id: 'newFriend', text: 'A new friend!', when: 'Meeting someone new' },
  { id: 'm-duck', text: 'A duckling! Quack quack!', when: 'Pond friends' },
  { id: 'm-turtle', text: 'Hello, turtle!', when: 'Pond friends' },
  { id: 'm-dragonfly', text: 'A dragonfly! Zoom zoom!', when: 'Pond friends' },
  { id: 'm-snail', text: 'A snail! Slowly, slowly!', when: 'Pond friends' },
  { id: 'm-fish', text: 'A goldfish! Blub blub!', when: 'Pond friends' },
  { id: 'm-ladybird', text: 'A spotty ladybird!', when: 'Pond friends' },
  { id: 'm-tadpoles', text: 'Tadpoles! Wiggle wiggle!', when: 'Pond friends' },
  { id: 'm-butterfly', text: 'A butterfly! Flutter flutter!', when: 'Pond friends' },
  { id: 'm-bee', text: 'A bumblebee! Buzz buzz!', when: 'Pond friends' },
  { id: 'm-swan', text: 'A beautiful swan!', when: 'Pond friends' },
  { id: 'm-otter', text: 'An otter! Splish splosh!', when: 'Pond friends' },
  { id: 'm-babyfrog', text: 'A baby frog! Ribbit!', when: 'Pond friends' },
  { id: 'comeHome', text: "Let's take them home!", when: 'After meeting a friend' },
  { id: 'allFriends', text: 'You found every friend, {name}!', when: 'All 12 friends met' },
  { id: 'yay', text: 'Yay!', when: 'Cheering' },
  { id: 'wow', text: 'Wow!', when: 'Cheering' },
  { id: 'wellDone', text: 'Well done, {name}!', when: 'Cheering' },
  { id: 'youDidIt', text: 'You did it!', when: 'Cheering' },
  { id: 'ribbit', text: 'Ribbit!', when: 'Tapping Hoppy' },
  { id: 'hoppy', text: "Hi! I'm Hoppy!", when: 'Tapping Hoppy on the title' },
  { id: 'myPond', text: 'Your pond friends!', when: 'Opening your pond' },
  { id: 'pondEmpty', text: "No friends yet. Let's hop!", when: 'Your pond with nobody in it yet' },
  { id: 'pondNew', text: 'Look! Someone new!', when: 'A new friend in your pond' },
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
const OWN_DB = 'leapy-pond-voice';
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

// Clips of every line in a natural voice, made once by scripts/voice and
// served next to the games (../voice/). A parent's recording still comes
// first; the device's own voice is the last resort. Lines with the child's
// name use the version without it ("Well done!").
let clips: Record<string, string> = {};
const clipBuffers = new Map<string, Promise<AudioBuffer | null>>();

async function loadClips() {
  if (!location.protocol.startsWith('http')) return;
  try {
    const res = await fetch('../voice/manifest.json');
    if (res.ok) clips = ((await res.json()) as { clips?: Record<string, string> }).clips ?? {};
  } catch {
    // No clips (e.g. a single game run on its own): the device voice it is.
  }
}

function clipBuffer(file: string): Promise<AudioBuffer | null> {
  let p = clipBuffers.get(file);
  if (!p) {
    p = (async () => {
      const ctx = sound.context;
      if (!ctx) return null;
      try {
        const res = await fetch(`../voice/${file}`);
        const data = await res.arrayBuffer();
        return await new Promise<AudioBuffer>((ok, fail) => ctx.decodeAudioData(data, ok, fail));
      } catch {
        return null;
      }
    })();
    clipBuffers.set(file, p);
    // Try again next time if it failed (e.g. no audio context yet).
    void p.then((b) => b || clipBuffers.delete(file));
  }
  return p;
}

export async function loadRecordings() {
  void loadClips();
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

/** A line with the name left out: "{name}'s Bakery!" → "Bakery!". */
const unnamed = (text: string) => text.replace(/\{name\}'s\s*/g, '').replace(/,?\s*\{name\}/g, '');

function fill(text: string) {
  const name = playerName();
  return name ? text.replace(/\{name\}/g, name) : unnamed(text);
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
  const clip = clips[unnamed(line.text)];
  if (blobs.has(id) || clip) {
    cut();
    const my = token;
    const buf = blobs.has(id) ? await bufferFor(id) : await clipBuffer(clip);
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
