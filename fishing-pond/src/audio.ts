// Synthesized sound effects, pond ambience and a gentle music-box waltz.
// Everything is generated with Web Audio: there are no audio files.
import { persist, save, type Weather } from './data';

const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

// An original lilting tune in 3/4, like a boat rocking: [midi note, beats] per bar.
const R = 0;
const MELODY: [number, number][][] = [
  [[76, 2], [79, 1]],
  [[77, 1], [76, 1], [74, 1]],
  [[72, 2], [67, 1]],
  [[69, 3]],
  [[71, 2], [74, 1]],
  [[72, 1], [71, 1], [69, 1]],
  [[67, 2], [71, 1]],
  [[72, 2], [R, 1]],
  [[76, 2], [79, 1]],
  [[81, 1], [79, 1], [77, 1]],
  [[76, 2], [72, 1]],
  [[74, 3]],
  [[77, 2], [76, 1]],
  [[74, 1], [72, 1], [71, 1]],
  [[74, 1], [71, 1], [67, 1]],
  [[72, 2], [R, 1]],
];
const BASS = [48, 43, 48, 41, 43, 45, 43, 48, 48, 41, 48, 43, 41, 43, 43, 48];
// Chord tones (relative to bass) for the accompaniment.
const THIRD = [4, 4, 4, 4, 4, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];
const BEATS = 3;

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
  private rainGain?: GainNode;
  private crickets = 0;

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
  /** Swishing the rod and the reel spinning out. */
  cast() {
    this.noise(0.45, { freq: 700, q: 0.8, vol: 0.28, sweep: 2400 });
    for (let i = 0; i < 7; i++) this.tone(1800 - i * 90, 0.03, { type: 'square', vol: 0.04, delay: 0.05 + i * 0.05 });
  }
  /** The float landing on the water. */
  plop() {
    this.tone(700, 0.16, { vol: 0.45, slide: -450 });
    this.noise(0.18, { freq: 1400, q: 1.5, vol: 0.18, sweep: -900, delay: 0.02 });
  }
  /** A gentle water tap (tapping the pond while waiting). */
  ripple() {
    this.tone(480 + Math.random() * 120, 0.12, { vol: 0.22, slide: -260 });
    this.noise(0.12, { freq: 1600, q: 2, vol: 0.08, sweep: -900 });
  }
  /** One nibble on the float. */
  blip(i = 0) {
    this.tone(620 + i * 140, 0.09, { vol: 0.3, slide: 300 });
  }
  /** Something bites! A dunk and an excited little run of notes. */
  bite() {
    this.noise(0.35, { freq: 900, q: 1, vol: 0.4, sweep: -600 });
    this.tone(260, 0.2, { vol: 0.35, slide: -120 });
    [72, 76, 79, 84].forEach((n, i) => this.tone(NOTE(n), 0.14, { type: 'triangle', vol: 0.2, delay: 0.12 + i * 0.07 }));
  }
  /** Clicks of the reel winding in over `sec` seconds. */
  reel(sec = 1) {
    const n = Math.round(sec * 14);
    for (let i = 0; i < n; i++) this.tone(1300 + (i % 2) * 180, 0.025, { type: 'square', vol: 0.05, delay: i / 14 });
  }
  /** A big splash as something leaves the water. */
  splash() {
    this.noise(0.6, { freq: 1100, q: 0.7, vol: 0.45, sweep: -700 });
    this.noise(0.3, { freq: 3500, q: 1, vol: 0.12, delay: 0.05 });
    this.tone(320, 0.2, { vol: 0.2, slide: 300 });
  }
  bubble(pitch = 1) {
    this.tone(300 * pitch, 0.1, { vol: 0.25, slide: 500 * pitch });
  }
  ribbit() {
    for (let i = 0; i < 2; i++) {
      this.tone(170, 0.13, { type: 'sawtooth', vol: 0.1, slide: 60, delay: i * 0.2 });
      this.noise(0.13, { freq: 500, q: 6, vol: 0.4, delay: i * 0.2 });
    }
  }
  quack() {
    for (let i = 0; i < 2; i++) {
      this.noise(0.14, { freq: 900, q: 5, vol: 0.4, delay: i * 0.26 });
      this.tone(360, 0.14, { type: 'sawtooth', vol: 0.08, slide: -120, delay: i * 0.26 });
    }
  }
  /** Pip the penguin: a happy little honk. */
  honk() {
    this.tone(640, 0.12, { type: 'triangle', vol: 0.3, slide: 380 });
    this.tone(900, 0.18, { type: 'triangle', vol: 0.26, slide: -300, delay: 0.13 });
    this.noise(0.1, { freq: 1500, q: 2, vol: 0.1 });
  }
  /** The turtle peeks out. */
  peek() {
    this.tone(260, 0.22, { vol: 0.3, slide: 380 });
    this.tine(NOTE(84), 0.18, 0.18, this.sfx);
  }
  munch() {
    for (let i = 0; i < 3; i++) this.noise(0.06, { freq: 1800, q: 2, vol: 0.2, delay: i * 0.1 });
  }
  /** Food flakes sprinkling into the tank. */
  sprinkle() {
    for (let i = 0; i < 5; i++) this.tone(2400 + Math.random() * 800, 0.05, { type: 'triangle', vol: 0.06, delay: i * 0.05 });
  }
  /** A springy wobble for silly catches. */
  boing() {
    const ctx = this.context;
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(520, t + 0.12);
    for (let i = 0; i < 6; i++) o.frequency.setValueAtTime(i % 2 ? 380 : 460, t + 0.14 + i * 0.06);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    o.connect(g).connect(this.sfx);
    o.start(t);
    o.stop(t + 0.6);
  }
  magic() {
    [0, 4, 7, 11, 14, 19].forEach((n, i) => this.tine(NOTE(79 + n), i * 0.06, 0.16, this.sfx));
    this.noise(0.6, { freq: 5000, q: 0.8, vol: 0.08, type: 'highpass', attack: 0.1 });
  }
  giggle() {
    const base = 900 + Math.random() * 200;
    for (let i = 0; i < 5; i++) this.tone(base + (i % 2) * 200 - i * 30, 0.08, { type: 'triangle', vol: 0.2, slide: 140, delay: i * 0.08 });
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
  /** A firefly glowing. */
  twinkle() {
    this.tine(NOTE(91 + Math.floor(Math.random() * 5)), 0, 0.12, this.sfx);
  }

  // -------------------------------------------------------------------------
  // Pond ambience: soft rain, and crickets at night.

  ambience(w: Weather | 'none') {
    const ctx = this.context;
    if (!ctx || !this.noiseBuf) return;
    if (!this.rainGain) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      const lo = ctx.createBiquadFilter();
      lo.type = 'lowpass';
      lo.frequency.value = 2600;
      const hi = ctx.createBiquadFilter();
      hi.type = 'highpass';
      hi.frequency.value = 500;
      this.rainGain = ctx.createGain();
      this.rainGain.gain.value = 0;
      src.connect(lo).connect(hi).connect(this.rainGain).connect(this.sfx);
      src.start();
    }
    this.rainGain.gain.setTargetAtTime(w === 'rain' ? 0.1 : 0, ctx.currentTime, 0.8);
    clearInterval(this.crickets);
    if (w === 'night') {
      this.crickets = window.setInterval(() => {
        if (Math.random() < 0.5) return;
        for (let i = 0; i < 3; i++) this.tone(4200, 0.04, { type: 'triangle', vol: 0.025, delay: i * 0.07 });
      }, 1400);
    }
  }

  // -------------------------------------------------------------------------
  // Music: a lilting music-box waltz.

  private startMusic() {
    const ctx = this.context!;
    this.nextBeat = ctx.currentTime + 0.4;
    this.applyMusicLevel();
    window.setInterval(() => {
      if (ctx.state !== 'running') return;
      const beat = 0.5;
      while (this.nextBeat < ctx.currentTime + 0.3) {
        const bars = MELODY[this.bar];
        const t = this.nextBeat - ctx.currentTime;
        // Melody notes that start on this beat.
        let pos = 0;
        for (const [n, len] of bars) {
          if (pos === this.beatInBar && n !== R) this.tine(NOTE(n), t, 0.28, this.music);
          pos += len;
        }
        // Oom-pah-pah: bass on 1, chord tones on 2 and 3.
        const b = BASS[this.bar];
        if (this.beatInBar === 0) this.tone(NOTE(b), beat * 2.4, { vol: 0.18, delay: t, attack: 0.02, out: this.music });
        else {
          this.tine(NOTE(b + 12 + THIRD[this.bar]), t, 0.06, this.music);
          this.tine(NOTE(b + 19), t, 0.05, this.music);
        }

        this.nextBeat += beat;
        if (++this.beatInBar === BEATS) {
          this.beatInBar = 0;
          this.bar = (this.bar + 1) % MELODY.length;
          if (this.bar === 0) this.nextBeat += beat * BEATS; // breathe between loops
        }
      }
    }, 60);
  }
}

export const sound = new Sound();
