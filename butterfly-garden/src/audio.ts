// Synthesized sound effects and a music-box lullaby. Everything is generated
// with Web Audio: there are no audio files.
import { NOTE, SoundBase } from '../../shared/audio';
import { persist, save } from './data';

// Twinkle Twinkle Little Star (first line), played one note per star tap.
export const TWINKLE = [60, 60, 67, 67, 69, 69, 67].map(NOTE);

// An original lullaby in 3/4: [midi note, beats] per bar, with a bass note per bar.
const R = 0;
const MELODY: [number, number][][] = [
  [[67, 1], [76, 1], [74, 1]],
  [[72, 2], [67, 1]],
  [[69, 1], [72, 1], [76, 1]],
  [[74, 3]],
  [[67, 1], [76, 1], [74, 1]],
  [[72, 2], [76, 1]],
  [[74, 1], [72, 1], [71, 1]],
  [[72, 3]],
  [[76, 1], [79, 1], [77, 1]],
  [[76, 2], [72, 1]],
  [[74, 1], [76, 1], [77, 1]],
  [[76, 1], [74, 2]],
  [[72, 1], [76, 1], [74, 1]],
  [[72, 1], [69, 2]],
  [[71, 1], [72, 1], [74, 1]],
  [[72, 2], [R, 1]],
];
const BASS = [48, 52, 53, 55, 48, 45, 55, 48, 48, 45, 50, 55, 53, 53, 55, 48];
// Chord tones (relative to bass) for the soft broken-chord accompaniment.
const THIRD = [4, 3, 4, 4, 4, 3, 4, 4, 4, 3, 3, 4, 4, 4, 4, 4];

class Sound extends SoundBase {
  private night = false;

  constructor() {
    super(save, persist);
  }

  /** Night time plays the lullaby slower and softer. */
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
  chomp() {
    this.noise(0.09, { freq: 900, q: 0.8, vol: 0.6 });
    this.tone(180, 0.08, { type: 'square', vol: 0.08, slide: -80 });
    this.noise(0.09, { freq: 700, q: 0.8, vol: 0.5, delay: 0.16 });
    this.tone(160, 0.08, { type: 'square', vol: 0.07, slide: -70, delay: 0.16 });
  }
  gulp() {
    this.tone(300, 0.22, { vol: 0.4, slide: -180 });
  }
  crack(level = 0) {
    this.noise(0.07, { freq: 2600 - level * 300, q: 3, vol: 0.7 });
    this.tone(1300 - level * 120, 0.05, { type: 'square', vol: 0.04 });
  }
  squeak() {
    this.tone(900, 0.12, { vol: 0.3, slide: 700 });
    this.tone(1300, 0.14, { vol: 0.26, slide: 500, delay: 0.12 });
  }
  giggle() {
    const base = 700 + Math.random() * 200;
    for (let i = 0; i < 5; i++) this.tone(base + (i % 2) * 180 - i * 30, 0.09, { type: 'triangle', vol: 0.22, slide: 120, delay: i * 0.09 });
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
  wrap() {
    this.noise(0.35, { freq: 3000, q: 0.5, vol: 0.2, type: 'highpass' });
    this.tone(600, 0.3, { vol: 0.12, slide: 400 });
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
  yawn() {
    this.tone(500, 0.7, { vol: 0.18, slide: -260, attack: 0.1 });
  }
  sneeze() {
    this.tone(500, 0.35, { vol: 0.2, slide: 300, attack: 0.25 });
    this.noise(0.25, { freq: 2400, q: 0.6, vol: 0.7, delay: 0.38 });
  }
  burp() {
    this.tone(110, 0.35, { type: 'sawtooth', vol: 0.12, slide: -30, attack: 0.02 });
    this.noise(0.3, { freq: 300, q: 2, vol: 0.3 });
  }
  snore() {
    this.noise(0.9, { freq: 250, q: 3, vol: 0.25, attack: 0.5 });
    this.tone(1200, 0.25, { vol: 0.08, slide: 800, delay: 1.0 });
  }
  slurp() {
    this.noise(0.35, { freq: 600, q: 4, vol: 0.3, sweep: 1400 });
    this.tone(400, 0.3, { vol: 0.12, slide: 500, delay: 0.05 });
  }
  boing() {
    this.tone(220, 0.4, { type: 'triangle', vol: 0.3, slide: 500 });
  }
  ribbit() {
    for (let i = 0; i < 2; i++) this.tone(170, 0.12, { type: 'square', vol: 0.08, slide: 60, delay: i * 0.16 });
  }
  tweet() {
    for (let i = 0; i < 3; i++) this.tone(2200 + i * 150, 0.1, { vol: 0.15, slide: 900, delay: i * 0.12 });
  }
  chime() {
    [79, 83, 86, 91].forEach((n, i) => this.tine(NOTE(n), i * 0.09, 0.2, this.sfx));
  }
  swoosh() {
    this.noise(0.8, { freq: 1800, q: 0.8, vol: 0.18, sweep: -1400, attack: 0.2 });
  }
  buzz() {
    const ctx = this.context;
    if (!ctx || this.sleeping) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.value = 180;
    lfo.frequency.value = 26;
    lg.gain.value = 30;
    lfo.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.connect(g).connect(this.sfx);
    o.start(t);
    lfo.start(t);
    o.stop(t + 1);
    lfo.stop(t + 1);
  }
  hop() {
    this.tone(300, 0.15, { vol: 0.25, slide: 400 });
  }

  // -------------------------------------------------------------------------
  // Music: a gentle music-box lullaby.

  protected startMusic() {
    const ctx = this.context!;
    this.nextBeat = ctx.currentTime + 0.4;
    this.applyMusicLevel();
    window.setInterval(() => {
      if (ctx.state !== 'running') return;
      const beat = this.night ? 0.72 : 0.56;
      // After a pause, pick the tune up from now rather than rushing to catch up.
      if (this.nextBeat < ctx.currentTime) this.nextBeat = ctx.currentTime + 0.05;
      while (this.nextBeat < ctx.currentTime + 0.3) {
        const bars = MELODY[this.bar];
        const t = this.nextBeat - ctx.currentTime;
        // Melody notes that start on this beat.
        let pos = 0;
        for (const [n, len] of bars) {
          if (pos === this.beatInBar && n !== R) this.tine(NOTE(n), t, 0.3, this.music);
          pos += len;
        }
        // Accompaniment: bass on 1, chord tones on 2 and 3.
        const b = BASS[this.bar];
        if (this.beatInBar === 0) this.tone(NOTE(b), beat * 3, { vol: 0.2, delay: t, attack: 0.03, out: this.music });
        else this.tine(NOTE(b + 12 + (this.beatInBar === 1 ? THIRD[this.bar] : 7)), t, 0.09, this.music);

        this.nextBeat += beat;
        if (++this.beatInBar === 3) {
          this.beatInBar = 0;
          this.bar = (this.bar + 1) % MELODY.length;
          if (this.bar === 0) this.nextBeat += beat * 3; // breathe between loops
        }
      }
    }, 60);
  }
}

export const sound = new Sound();
