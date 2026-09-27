// Synthesized sound effects and a bubbly music-box waltz.
// Everything is generated with Web Audio: there are no audio files.
import { NOTE, SoundBase } from '../../shared/audio';
import { persist, save } from './data';

// An original bubbly waltz for bath time, in 3/4: [midi note, beats] per bar.
const R = 0;
const MELODY: [number, number][][] = [
  [[72, 1], [76, 1], [79, 1]],
  [[81, 2], [79, 1]],
  [[77, 1], [76, 1], [74, 1]],
  [[76, 2], [R, 1]],
  [[74, 1], [77, 1], [81, 1]],
  [[79, 2], [77, 1]],
  [[76, 1], [74, 0.5], [76, 0.5], [74, 1]],
  [[72, 2], [R, 1]],
];
const BASS = [48, 48, 41, 48, 43, 43, 43, 48];
// Chord tones (relative to bass) for the accompaniment.
const THIRD = [4, 4, 4, 4, 4, 4, 4, 4];
const BEATS = 3;

class Sound extends SoundBase {
  constructor() {
    super(save, persist);
  }

  // -------------------------------------------------------------------------
  // Sound effects

  pop(pitch = 1) {
    this.tone(520 * pitch, 0.14, { vol: 0.45, slide: 500 * pitch });
  }
  tapSoft() {
    this.tone(880, 0.08, { type: 'triangle', vol: 0.22, slide: 200 });
  }
  /** A rubber duck being squeezed: squeee-ak. */
  squeak(p = 1) {
    const ctx = this.context;
    if (!ctx || this.sleeping) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    const base = 950 * p;
    o.type = 'square';
    o.frequency.setValueAtTime(base, t);
    o.frequency.linearRampToValueAtTime(base * 1.7, t + 0.07);
    o.frequency.linearRampToValueAtTime(base * 1.3, t + 0.24);
    lfo.frequency.value = 36;
    lg.gain.value = base * 0.05;
    lfo.connect(lg).connect(o.frequency);
    f.type = 'bandpass';
    f.frequency.value = 2300 * p;
    f.Q.value = 1.6;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
    g.gain.setValueAtTime(0.3, t + 0.17);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.27);
    o.connect(f).connect(g).connect(this.sfx);
    o.start(t);
    lfo.start(t);
    o.stop(t + 0.3);
    lfo.stop(t + 0.3);
  }
  /** Ducky says hello: quack quack. */
  quack() {
    const ctx = this.context;
    if (!ctx || this.sleeping) return;
    [0, 0.24].forEach((d, i) => {
      const t = ctx.currentTime + d;
      const o = ctx.createOscillator();
      const f = ctx.createBiquadFilter();
      const g = ctx.createGain();
      const f0 = i ? 0.92 : 1;
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(560 * f0, t);
      o.frequency.exponentialRampToValueAtTime(360 * f0, t + 0.17);
      f.type = 'bandpass';
      f.frequency.value = 1250;
      f.Q.value = 2.4;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.32, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.19);
      o.connect(f).connect(g).connect(this.sfx);
      o.start(t);
      o.stop(t + 0.22);
    });
  }
  /** Water running from the tap, with a few bubbly blips. */
  pour(sec = 1.4) {
    this.noise(sec, { freq: 1500, q: 0.6, vol: 0.28, attack: 0.08 });
    this.noise(sec, { freq: 380, q: 0.8, vol: 0.22, attack: 0.1, type: 'lowpass' });
    for (let i = 0; i < 6; i++) this.blip(0.1 + Math.random() * (sec - 0.2), 0.12);
  }
  /** One little bubble. */
  blip(delay = 0, vol = 0.22) {
    this.tone(300 + Math.random() * 400, 0.09, { vol, slide: 700, delay });
  }
  /** Something small dropping into the water. */
  plop() {
    this.tone(720, 0.13, { vol: 0.32, slide: -520 });
    this.noise(0.18, { freq: 900, q: 0.8, vol: 0.12, sweep: -500 });
  }
  /** Squeezing the bubble bath bottle. */
  squirt() {
    this.noise(0.28, { freq: 800, q: 1.2, vol: 0.28, sweep: 1600 });
    this.tone(200, 0.16, { type: 'triangle', vol: 0.18, slide: 160 });
    for (let i = 0; i < 4; i++) this.blip(0.1 + i * 0.06, 0.14);
  }
  /** A sponge going scrub-scrub. */
  scrub() {
    for (let i = 0; i < 4; i++) this.noise(0.08, { freq: 2600 + (i % 2) * 700, q: 1.4, vol: 0.22, delay: i * 0.11 });
    this.blip(0.4, 0.14);
  }
  /** A squelchy splodge of mud. */
  splat() {
    this.noise(0.22, { freq: 500, q: 0.9, vol: 0.35, type: 'lowpass', sweep: -200 });
    this.tone(150, 0.16, { type: 'triangle', vol: 0.25, slide: -70 });
  }
  /** Down the plughole. */
  glug() {
    for (let i = 0; i < 8; i++) this.tone(230 - i * 14, 0.13, { vol: 0.26, slide: 140, delay: i * 0.3 });
    this.noise(2.6, { freq: 300, q: 0.7, vol: 0.18, type: 'lowpass', sweep: -150, attack: 0.2 });
  }
  /** The count goes up: a bell, higher each time. */
  knock(i = 0) {
    this.tine(NOTE(72 + [0, 2, 4, 5, 7, 9][i % 6]), 0, 0.26, this.sfx);
  }
  /** Not that one: a soft, friendly "uh-uh". */
  nope() {
    this.tone(330, 0.14, { type: 'triangle', vol: 0.2, slide: -40 });
    this.tone(262, 0.2, { type: 'triangle', vol: 0.2, slide: -30, delay: 0.16 });
  }
  /** A splash in the water. */
  splash() {
    this.noise(0.5, { freq: 1100, q: 0.7, vol: 0.4, sweep: -700 });
    this.noise(0.25, { freq: 3500, q: 1, vol: 0.12, delay: 0.05 });
    this.tone(320, 0.18, { vol: 0.18, slide: 300 });
  }
  /** The big bubble popping. */
  bang() {
    this.noise(0.18, { freq: 2000, q: 0.5, vol: 0.5, sweep: -1400 });
    this.tone(180, 0.12, { vol: 0.3, slide: -100 });
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

  // -------------------------------------------------------------------------
  // Music: a bubbly music-box waltz.

  protected startMusic() {
    const ctx = this.context!;
    this.nextBeat = ctx.currentTime + 0.4;
    this.applyMusicLevel();
    // Counted in half beats, so the tune can skip.
    const half = 0.24;
    window.setInterval(() => {
      if (ctx.state !== 'running') return;
      // After a pause, pick the tune up from now rather than rushing to catch up.
      if (this.nextBeat < ctx.currentTime) this.nextBeat = ctx.currentTime + 0.05;
      while (this.nextBeat < ctx.currentTime + 0.3) {
        const t = this.nextBeat - ctx.currentTime;
        const step = this.beatInBar;
        // Melody notes that start on this half beat.
        let pos = 0;
        for (const [n, len] of MELODY[this.bar]) {
          if (pos * 2 === step && n !== R) this.tine(NOTE(n), t, 0.26, this.music);
          pos += len;
        }
        // Oom-pah-pah: bass on 1, chord tones on 2 and 3.
        const b = BASS[this.bar];
        if (step === 0) this.tone(NOTE(b), half * 4, { vol: 0.17, delay: t, attack: 0.02, out: this.music });
        else if (step === 2 || step === 4) {
          this.tine(NOTE(b + 12 + THIRD[this.bar]), t, 0.06, this.music);
          this.tine(NOTE(b + 19), t, 0.05, this.music);
        }

        this.nextBeat += half;
        if (++this.beatInBar === BEATS * 2) {
          this.beatInBar = 0;
          this.bar = (this.bar + 1) % MELODY.length;
          if (this.bar === 0) this.nextBeat += half * BEATS * 2; // breathe between loops
        }
      }
    }, 60);
  }
}

export const sound = new Sound();
