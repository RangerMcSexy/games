// Synthesized sound effects and a bouncy music-box tune. Everything is
// generated with Web Audio: there are no audio files.
import { NOTE, SoundBase } from '../../shared/audio';
import { persist, save, type AnimalId } from './data';

// An original bouncy tune in 4/4: [midi note, beats] per bar, with a chord per bar.
const R = 0;
const MELODY: [number, number][][] = [
  [[64, 1], [67, 1], [72, 1], [67, 1]],
  [[69, 1], [67, 1], [64, 2]],
  [[65, 1], [69, 1], [74, 1], [69, 1]],
  [[67, 3], [R, 1]],
  [[64, 1], [67, 1], [72, 1], [76, 1]],
  [[74, 1], [72, 1], [69, 1], [67, 1]],
  [[65, 1], [64, 1], [62, 1], [67, 1]],
  [[60, 3], [R, 1]],
  [[72, 1], [71, 1], [72, 1], [67, 1]],
  [[69, 1], [72, 1], [67, 2]],
  [[65, 1], [67, 1], [69, 1], [72, 1]],
  [[74, 3], [R, 1]],
  [[76, 1], [74, 1], [72, 1], [69, 1]],
  [[67, 1], [72, 1], [69, 1], [65, 1]],
  [[64, 1], [67, 1], [62, 1], [71, 1]],
  [[72, 3], [R, 1]],
];
const BASS = [48, 45, 50, 43, 48, 53, 43, 48, 48, 53, 53, 43, 48, 53, 43, 48];
// Chord tones (relative to bass) for the oom-pah accompaniment.
const THIRD = [4, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];

// Door bell tune for the shop window: one note per tap.
export const BELL_TUNE = [72, 76, 79, 76, 72, 74, 77, 74, 72, 67, 72].map(NOTE);

class Sound extends SoundBase {
  private night = false;

  constructor() {
    super(save, persist);
  }

  /** Night time plays the tune slower and softer. */
  setNight(on: boolean) {
    this.night = on;
    this.applyMusicLevel();
  }

  protected override musicBase() {
    return this.night ? 0.2 : 0.26;
  }

  // -------------------------------------------------------------------------
  // Sound effects

  pop(pitch = 1) {
    this.tone(520 * pitch, 0.14, { vol: 0.45, slide: 500 * pitch });
  }
  tapSoft() {
    this.tone(880, 0.08, { type: 'triangle', vol: 0.22, slide: 200 });
  }
  /** Shop door bell: ding-a-ling! */
  doorBell() {
    [88, 84, 88, 84].forEach((n, i) => this.tine(NOTE(n), i * 0.11, 0.22, this.sfx));
  }
  crack(level = 0) {
    this.noise(0.07, { freq: 2600 - level * 300, q: 3, vol: 0.7 });
    this.tone(1300 - level * 120, 0.05, { type: 'square', vol: 0.04 });
  }
  plop() {
    this.tone(260, 0.16, { vol: 0.4, slide: 380 });
    this.noise(0.06, { freq: 500, q: 2, vol: 0.25, delay: 0.03 });
  }
  poof() {
    this.noise(0.6, { freq: 900, q: 0.4, vol: 0.45, sweep: -600, attack: 0.02 });
  }
  /** A gloopy stir; `i` makes each one a little different. */
  stir(i = 0) {
    const f = 180 + (i % 4) * 30;
    this.tone(f, 0.22, { vol: 0.3, slide: 160 });
    this.noise(0.18, { freq: 400 + (i % 3) * 120, q: 5, vol: 0.18, delay: 0.05 });
  }
  pour() {
    this.noise(0.9, { freq: 1400, q: 1.2, vol: 0.18, sweep: -700, attack: 0.1 });
    for (let i = 0; i < 4; i++) this.tone(300 + i * 40, 0.1, { vol: 0.12, slide: 200, delay: 0.2 + i * 0.14 });
  }
  squish() {
    this.noise(0.18, { freq: 700, q: 3, vol: 0.35, sweep: -400 });
    this.tone(220, 0.14, { vol: 0.2, slide: -80 });
  }
  tick(high = false) {
    this.tone(high ? 2100 : 1600, 0.035, { type: 'square', vol: 0.05 });
  }
  ding() {
    this.tone(NOTE(96), 1.6, { vol: 0.35 });
    this.tone(NOTE(96) * 2.76, 0.6, { vol: 0.08 });
    this.tone(NOTE(96) * 5.4, 0.25, { vol: 0.03 });
  }
  ovenDoor(open: boolean) {
    this.noise(0.12, { freq: open ? 500 : 350, q: 1, vol: 0.35 });
    this.tone(open ? 140 : 110, 0.12, { type: 'triangle', vol: 0.25, slide: open ? 40 : -30 });
  }
  shake() {
    for (let i = 0; i < 6; i++) this.noise(0.05, { freq: 5000 + Math.random() * 2000, q: 2, vol: 0.28, delay: i * 0.035 });
  }
  drip() {
    this.tone(700, 0.12, { vol: 0.2, slide: -350 });
  }
  blow() {
    this.noise(0.6, { freq: 1100, q: 0.6, vol: 0.32, sweep: -500, attack: 0.06 });
  }
  flame() {
    this.noise(0.12, { freq: 3000, q: 1, vol: 0.15, type: 'highpass' });
    this.tone(900, 0.1, { vol: 0.1, slide: 300 });
  }
  chomp() {
    this.noise(0.09, { freq: 900, q: 0.8, vol: 0.6 });
    this.tone(180, 0.08, { type: 'square', vol: 0.08, slide: -80 });
  }
  munch(times = 3, gap = 0.18) {
    for (let i = 0; i < times; i++) {
      this.noise(0.08, { freq: 800 + (i % 2) * 250, q: 0.8, vol: 0.55, delay: i * gap });
      this.tone(170 - i * 8, 0.07, { type: 'square', vol: 0.06, slide: -60, delay: i * gap });
    }
  }
  gulp() {
    this.tone(300, 0.22, { vol: 0.4, slide: -180 });
  }
  squeak() {
    this.tone(900, 0.12, { vol: 0.3, slide: 700 });
    this.tone(1300, 0.14, { vol: 0.26, slide: 500, delay: 0.12 });
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
  bloop(i = 0) {
    const n = NOTE(72 + [0, 2, 4, 7, 9, 12, 14, 16, 19][i % 9]);
    this.tine(n, 0, 0.35, this.sfx);
  }
  bell(freq: number) {
    this.tone(freq, 1.4, { vol: 0.4 });
    this.tone(freq * 2, 0.8, { vol: 0.1 });
    this.tone(freq * 3.01, 0.5, { vol: 0.04 });
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
  tada() {
    [72, 76, 79, 84].forEach((n, i) => this.tone(NOTE(n), 0.5, { type: 'triangle', vol: 0.22, delay: i * 0.07 }));
  }
  /** Counting up: each number a step higher. */
  count(n: number) {
    this.tine(NOTE([72, 76, 79, 84, 88][Math.max(0, Math.min(4, n - 1))]), 0, 0.3, this.sfx);
  }
  sneeze() {
    this.tone(500, 0.35, { vol: 0.2, slide: 300, attack: 0.25 });
    this.noise(0.25, { freq: 2400, q: 0.6, vol: 0.7, delay: 0.38 });
  }
  slurp() {
    this.noise(0.35, { freq: 600, q: 4, vol: 0.3, sweep: 1400 });
    this.tone(400, 0.3, { vol: 0.12, slide: 500, delay: 0.05 });
  }
  boing() {
    this.tone(220, 0.4, { type: 'triangle', vol: 0.3, slide: 500 });
  }
  roll() {
    for (let i = 0; i < 6; i++) this.tone(420 - i * 20, 0.06, { type: 'triangle', vol: 0.12, delay: i * 0.09 });
  }
  hop() {
    this.tone(300, 0.15, { vol: 0.25, slide: 400 });
  }
  chime() {
    [79, 83, 86, 91].forEach((n, i) => this.tine(NOTE(n), i * 0.09, 0.2, this.sfx));
  }
  swoosh() {
    this.noise(0.8, { freq: 1800, q: 0.8, vol: 0.18, sweep: -1400, attack: 0.2 });
  }

  /** Each customer has their own voice. */
  animal(a: AnimalId) {
    switch (a) {
      case 'bear':
        this.tone(140, 0.5, { type: 'sawtooth', vol: 0.08, slide: 40, attack: 0.06 });
        this.tone(180, 0.35, { vol: 0.2, slide: -50, delay: 0.3, attack: 0.04 });
        break;
      case 'hippo':
        this.tone(95, 0.6, { type: 'sawtooth', vol: 0.1, slide: 30, attack: 0.05 });
        this.noise(0.4, { freq: 200, q: 2, vol: 0.3, delay: 0.1 });
        break;
      case 'bunny':
        this.squeak();
        break;
      case 'piggy':
        for (let i = 0; i < 2; i++) {
          this.noise(0.14, { freq: 450, q: 6, vol: 0.5, delay: i * 0.22 });
          this.tone(200, 0.14, { type: 'sawtooth', vol: 0.07, slide: 60, delay: i * 0.22 });
        }
        break;
      case 'elephant':
        this.tone(330, 0.7, { type: 'sawtooth', vol: 0.1, slide: 380, attack: 0.08 });
        this.tone(335, 0.7, { type: 'square', vol: 0.04, slide: 390, attack: 0.08 });
        break;
      case 'dino':
        this.roar();
        break;
      case 'owl':
        this.tone(NOTE(67), 0.3, { vol: 0.3, attack: 0.05 });
        this.tone(NOTE(64), 0.45, { vol: 0.3, attack: 0.05, delay: 0.35 });
        break;
      case 'cat':
        this.tone(600, 0.45, { type: 'triangle', vol: 0.22, slide: 350, attack: 0.05 });
        this.tone(950, 0.35, { type: 'triangle', vol: 0.18, slide: -420, delay: 0.3 });
        break;
    }
  }
  roar() {
    this.noise(0.9, { freq: 260, q: 1.2, vol: 0.5, sweep: 200, attack: 0.1 });
    this.tone(110, 0.9, { type: 'sawtooth', vol: 0.09, slide: 60, attack: 0.1 });
  }

  // -------------------------------------------------------------------------
  // Music: a bouncy music-box tune.

  protected startMusic() {
    const ctx = this.context!;
    this.nextBeat = ctx.currentTime + 0.4;
    this.applyMusicLevel();
    window.setInterval(() => {
      if (ctx.state !== 'running') return;
      const beat = this.night ? 0.56 : 0.4;
      // After a pause, pick the tune up from now rather than rushing to catch up.
      if (this.nextBeat < ctx.currentTime) this.nextBeat = ctx.currentTime + 0.05;
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
