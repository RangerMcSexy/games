// Synthesized sound effects and a gentle music-box tune. Everything is
// generated with Web Audio: there are no audio files.
import { persist, save } from './data';

const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

// An original gentle tune in 4/4: [midi note, beats] per bar, with a chord per bar.
const R = 0;
const MELODY: [number, number][][] = [
  [[67, 1], [72, 1], [76, 1], [74, 1]],
  [[72, 2], [67, 2]],
  [[69, 1], [72, 1], [77, 1], [76, 1]],
  [[74, 3], [R, 1]],
  [[64, 1], [67, 1], [72, 1], [71, 1]],
  [[69, 2], [64, 2]],
  [[65, 1], [69, 1], [74, 1], [72, 1]],
  [[71, 3], [R, 1]],
  [[72, 1], [69, 1], [65, 1], [69, 1]],
  [[72, 1], [76, 1], [79, 2]],
  [[77, 1], [76, 1], [74, 1], [72, 1]],
  [[74, 3], [R, 1]],
  [[76, 1], [74, 1], [72, 1], [67, 1]],
  [[69, 1], [72, 1], [77, 2]],
  [[76, 1], [74, 1], [71, 1], [74, 1]],
  [[72, 3], [R, 1]],
];
const BASS = [48, 48, 53, 43, 48, 45, 50, 43, 53, 48, 53, 43, 48, 53, 43, 48];
// Chord tones (relative to bass) for the accompaniment.
const THIRD = [4, 4, 4, 4, 4, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4];

// A rising scale: each paint colour splashes on its own note.
const SPLASH_NOTES = [72, 74, 76, 77, 79, 81, 83, 84, 88];

class Sound {
  context?: AudioContext;
  /** Recorded voice clips play through here (ducks the music). */
  voiceOut?: GainNode;
  private master!: GainNode;
  private sfx!: GainNode;
  private music!: GainNode;
  private noiseBuf?: AudioBuffer;
  private nextBeat = 0;
  private bar = 0;
  private beatInBar = 0;
  private ducked = false;
  private paused = false;

  /** Must be called from a user gesture (iOS/Safari requirement). */
  unlock() {
    if (!this.context) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = (this.context = new Ctx());
      this.master = ctx.createGain();
      this.master.gain.value = save.sound ? 1 : 0;
      // A gentle compressor keeps sudden sounds from being harsh on little ears.
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      this.master.connect(comp).connect(ctx.destination);
      this.sfx = ctx.createGain();
      this.sfx.gain.value = 0.5;
      this.sfx.connect(this.master);
      this.music = ctx.createGain();
      this.music.gain.value = 0;
      this.music.connect(this.master);
      this.voiceOut = ctx.createGain();
      this.voiceOut.gain.value = 1.4;
      this.voiceOut.connect(this.master);
      const len = ctx.sampleRate;
      this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.startMusic();
    }
    if (this.context.state === 'suspended') void this.context.resume();
  }

  get soundOn() {
    return save.sound;
  }
  get musicOn() {
    return save.music;
  }

  toggleSound() {
    save.sound = !save.sound;
    persist();
    if (this.context) this.master.gain.setTargetAtTime(save.sound ? 1 : 0, this.context.currentTime, 0.05);
    return save.sound;
  }

  toggleMusic() {
    save.music = !save.music;
    persist();
    this.applyMusicLevel();
    return save.music;
  }

  /** Lower the music while someone is talking. */
  duck(on: boolean) {
    this.ducked = on;
    this.applyMusicLevel();
  }

  /** Silence the music (e.g. while a grown-up records their voice). */
  pauseMusic(on: boolean) {
    this.paused = on;
    this.applyMusicLevel();
  }

  private applyMusicLevel() {
    if (!this.context) return;
    const base = 0.22;
    const level = save.music && !this.paused ? (this.ducked ? base * 0.35 : base) : 0;
    this.music.gain.setTargetAtTime(level, this.context.currentTime, 0.3);
  }

  // -------------------------------------------------------------------------
  // Primitive voices

  private tone(
    freq: number,
    dur: number,
    { type = 'sine' as OscillatorType, vol = 0.5, slide = 0, delay = 0, attack = 0.005, out = this.sfx as AudioNode } = {},
  ) {
    const ctx = this.context;
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private noise(dur: number, { freq = 1200, q = 1, vol = 0.4, delay = 0, type = 'bandpass' as BiquadFilterType, sweep = 0, attack = 0 } = {}) {
    const ctx = this.context;
    if (!ctx || !this.noiseBuf) return;
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(60, freq + sweep), t + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    if (attack) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + attack);
    } else g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.sfx);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  /** A music-box tine: bright attack, soft ring. */
  private tine(freq: number, delay: number, vol: number, out: AudioNode) {
    this.tone(freq, 1.6, { type: 'sine', vol, delay, out });
    this.tone(freq * 2, 0.7, { type: 'sine', vol: vol * 0.25, delay, out });
    this.tone(freq * 4.02, 0.18, { type: 'sine', vol: vol * 0.12, delay, out });
  }

  // -------------------------------------------------------------------------
  // Sound effects

  pop(pitch = 1) {
    this.tone(520 * pitch, 0.14, { vol: 0.45, slide: 500 * pitch });
  }
  tapSoft() {
    this.tone(880, 0.08, { type: 'triangle', vol: 0.22, slide: 200 });
  }
  /** A wet paint splosh with a little musical note for colour `i`. */
  splash(i = 0) {
    this.noise(0.22, { freq: 900, q: 1.4, vol: 0.4, sweep: -600 });
    this.tone(240, 0.16, { vol: 0.3, slide: 260 });
    this.tine(NOTE(SPLASH_NOTES[i % SPLASH_NOTES.length]), 0.04, 0.22, this.sfx);
  }
  splat() {
    this.noise(0.16, { freq: 600, q: 1.2, vol: 0.5, sweep: -350 });
    this.tone(180, 0.12, { vol: 0.3, slide: -60 });
  }
  /** Choosing a paint pot. */
  bloop(i = 0) {
    this.tone(300 + i * 30, 0.14, { vol: 0.3, slide: 380 });
    this.tine(NOTE(SPLASH_NOTES[i % SPLASH_NOTES.length]), 0.02, 0.18, this.sfx);
  }
  magic() {
    [0, 4, 7, 11, 14, 19].forEach((n, i) => this.tine(NOTE(79 + n), i * 0.06, 0.16, this.sfx));
    this.noise(0.6, { freq: 5000, q: 0.8, vol: 0.08, type: 'highpass', attack: 0.1 });
  }
  giggle() {
    const base = 900 + Math.random() * 200;
    for (let i = 0; i < 5; i++) this.tone(base + (i % 2) * 200 - i * 30, 0.08, { type: 'triangle', vol: 0.2, slide: 140, delay: i * 0.08 });
  }
  /** Dot the puppy: a small happy yap. */
  woof() {
    this.tone(520, 0.12, { type: 'triangle', vol: 0.3, slide: 260 });
    this.tone(700, 0.14, { type: 'triangle', vol: 0.26, slide: -220, delay: 0.14 });
    this.noise(0.08, { freq: 1200, q: 1, vol: 0.12 });
  }
  whoosh() {
    this.noise(0.5, { freq: 400, q: 0.7, vol: 0.3, sweep: 2600 });
  }
  sparkle() {
    [0, 4, 7, 12, 16].forEach((n, i) => this.tone(NOTE(84 + n), 0.3, { type: 'triangle', vol: 0.15, delay: i * 0.05 }));
  }
  fanfare() {
    const seq = [60, 64, 67, 72, 67, 72, 76];
    const times = [0, 0.12, 0.24, 0.36, 0.56, 0.68, 0.8];
    seq.forEach((n, i) => {
      this.tone(NOTE(n), 0.4, { type: 'triangle', vol: 0.26, delay: times[i] });
      this.tone(NOTE(n + 12), 0.3, { vol: 0.07, delay: times[i] });
    });
    [60, 64, 67, 72].forEach((n) => this.tone(NOTE(n), 1.4, { vol: 0.1, delay: 0.8, attack: 0.05 }));
  }
  chime() {
    [79, 83, 86, 91].forEach((n, i) => this.tine(NOTE(n), i * 0.09, 0.2, this.sfx));
  }
  swoosh() {
    this.noise(0.8, { freq: 1800, q: 0.8, vol: 0.18, sweep: -1400, attack: 0.2 });
  }

  /** Each picture makes its own noise when it comes alive. */
  picture(id: string) {
    switch (id) {
      case 'sun':
      case 'flower':
        this.chime();
        break;
      case 'rainbow':
      case 'butterfly':
        this.sparkle();
        break;
      case 'fish':
        for (let i = 0; i < 4; i++) this.tone(500 + i * 120, 0.1, { vol: 0.25, slide: 400, delay: i * 0.13 });
        break;
      case 'house':
        [76, 72].forEach((n, i) => this.tine(NOTE(n), i * 0.35, 0.3, this.sfx));
        break;
      case 'car':
        for (let i = 0; i < 2; i++) {
          this.tone(440, 0.16, { type: 'square', vol: 0.07, delay: i * 0.24 });
          this.tone(554, 0.16, { type: 'square', vol: 0.05, delay: i * 0.24 });
        }
        break;
      case 'cat':
        this.tone(600, 0.45, { type: 'triangle', vol: 0.22, slide: 350, attack: 0.05 });
        this.tone(950, 0.35, { type: 'triangle', vol: 0.18, slide: -420, delay: 0.3 });
        break;
      case 'icecream':
        this.noise(0.35, { freq: 600, q: 4, vol: 0.3, sweep: 1400 });
        this.tone(400, 0.3, { vol: 0.12, slide: 500, delay: 0.05 });
        break;
      case 'rocket':
        this.noise(1.4, { freq: 300, q: 0.6, vol: 0.4, sweep: 1600, attack: 0.3 });
        this.tone(90, 1.2, { type: 'sawtooth', vol: 0.06, slide: 200, attack: 0.3 });
        break;
      case 'duck':
        for (let i = 0; i < 2; i++) {
          this.noise(0.14, { freq: 900, q: 5, vol: 0.4, delay: i * 0.26 });
          this.tone(360, 0.14, { type: 'sawtooth', vol: 0.08, slide: -120, delay: i * 0.26 });
        }
        break;
      case 'dino':
        this.noise(0.9, { freq: 260, q: 1.2, vol: 0.5, sweep: 200, attack: 0.1 });
        this.tone(110, 0.9, { type: 'sawtooth', vol: 0.09, slide: 60, attack: 0.1 });
        break;
    }
  }

  // -------------------------------------------------------------------------
  // Music: a bouncy music-box tune.

  private startMusic() {
    const ctx = this.context!;
    this.nextBeat = ctx.currentTime + 0.4;
    this.applyMusicLevel();
    window.setInterval(() => {
      if (ctx.state !== 'running') return;
      const beat = 0.46;
      while (this.nextBeat < ctx.currentTime + 0.3) {
        const bars = MELODY[this.bar];
        const t = this.nextBeat - ctx.currentTime;
        // Melody notes that start on this beat.
        let pos = 0;
        for (const [n, len] of bars) {
          if (pos === this.beatInBar && n !== R) this.tine(NOTE(n), t, 0.28, this.music);
          pos += len;
        }
        // Oom-pah: bass on 1 and 3, chord tones on 2 and 4.
        const b = BASS[this.bar];
        if (this.beatInBar % 2 === 0) this.tone(NOTE(b + (this.beatInBar === 2 ? 7 : 0)), beat * 1.6, { vol: 0.18, delay: t, attack: 0.02, out: this.music });
        else {
          this.tine(NOTE(b + 12 + THIRD[this.bar]), t, 0.07, this.music);
          this.tine(NOTE(b + 19), t, 0.06, this.music);
        }

        this.nextBeat += beat;
        if (++this.beatInBar === 4) {
          this.beatInBar = 0;
          this.bar = (this.bar + 1) % MELODY.length;
          if (this.bar === 0) this.nextBeat += beat * 4; // breathe between loops
        }
      }
    }, 60);
  }
}

export const sound = new Sound();
