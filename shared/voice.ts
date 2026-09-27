// Spoken prompts, shared by every game. Every line can be recorded by a
// grown-up in their own voice (stored on the device in IndexedDB); anything
// not recorded uses a natural-voice clip (made by scripts/voice) or, failing
// that, the browser's text-to-speech. Each game lists its own lines in
// src/voice.ts and gets the functions below from `makeVoice`.

export interface Line {
  id: string;
  /** What the robot voice says ({name} is replaced by the player's name). */
  text: string;
  /** Short hint shown to the grown-up recording it. */
  when: string;
}

/** What the voice needs from the game. */
export interface VoiceSetup {
  lines: Line[];
  /** The game's old, per-game store of recordings (moved to the shared one). */
  db: string;
  sound: { context?: AudioContext; voiceOut?: GainNode; duck(on: boolean): void };
  playerName(): string;
  /** Whether the game's sound is on. */
  soundOn(): boolean;
}

// ---------------------------------------------------------------------------
// Storage (IndexedDB: blobs are too big for localStorage)
//
// Recordings are filed under what the line says ("Yay!", "Blue!"), in a store
// shared by all the games opened from the same address, so a line only has
// to be recorded once. Older recordings, filed by line in each game's own
// store, move across the first time they're loaded.

const SHARED_DB = 'games-voice';
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

/** A line with the name left out: "{name}'s Bakery!" → "Bakery!". */
export const unnamed = (text: string) => text.replace(/\{name\}'s\s*/g, '').replace(/,?\s*\{name\}/g, '');

// ---------------------------------------------------------------------------
// One game's voice

export function makeVoice({ lines: LINES, db: OWN_DB, sound, playerName, soundOn }: VoiceSetup) {
  const byId = new Map(LINES.map((l) => [l.id, l]));
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

  async function loadRecordings() {
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

  const hasRecording = (id: string) => blobs.has(id);
  const recordingCount = () => blobs.size;

  async function saveRecording(id: string, blob: Blob) {
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

  async function deleteRecording(id: string) {
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

  // Speaking -----------------------------------------------------------------

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
  function stopSpeaking() {
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
    return name ? text.replace(/\{name\}/g, name) : unnamed(text);
  }

  /** Robot voice for arbitrary text. Resolves when finished (or cut off). */
  function sayText(text: string): Promise<void> {
    cut();
    if (!soundOn() || document.hidden || !('speechSynthesis' in window)) return Promise.resolve();
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
  function say(id: string): Promise<void> {
    chain++;
    return sayOne(id);
  }

  async function sayOne(id: string): Promise<void> {
    const line = byId.get(id);
    if (!line) return;
    if (!soundOn() || document.hidden) return;
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
  async function sayAll(ids: string[], gap = 120): Promise<void> {
    const mine = ++chain;
    for (const id of ids) {
      await sayOne(id);
      if (mine !== chain) return;
      await new Promise((r) => setTimeout(r, gap));
      if (mine !== chain) return;
    }
  }

  /** Play a recording directly (for the grown-up screen's preview button). */
  function previewLine(id: string) {
    return say(id);
  }

  const lineText = (l: Line) => fill(l.text);

  return {
    lines: LINES,
    loadRecordings,
    hasRecording,
    recordingCount,
    saveRecording,
    deleteRecording,
    stopSpeaking,
    sayText,
    say,
    sayAll,
    previewLine,
    lineText,
  };
}

export type Voice = ReturnType<typeof makeVoice>;
