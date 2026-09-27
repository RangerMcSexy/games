// Synthesized sound effects and a jaunty walking tune for the post round.
// Everything is generated with Web Audio: there are no audio files.
import { NOTE, SoundBase } from '../../shared/audio';
import { persist, save } from './data';

// An original bouncy walking tune in 4/4: [midi note, beats] per bar.
const R = 0;
const MELODY: [number, number][][] = [
  [[67, 1], [72, 1], [72, 0.5], [74, 0.5], [76, 1]],
  [[74, 1], [72, 1], [69, 2]],
  [[67, 1], [69, 0.5], [71, 0.5], [72, 1], [74, 1]],
  [[76, 2], [R, 1], [67, 1]],
  [[65, 1], [69, 1], [72, 0.5], [71, 0.5], [69, 1]],
  [[67, 1], [72, 1], [76, 2]],
  [[74, 1], [72, 0.5], [74, 0.5], [71, 1], [67, 1]],
  [[72, 2], [R, 2]],
];
const BASS = [48, 45, 43, 48, 41, 48, 43, 48];
const THIRD = [4, 3, 4, 4, 4, 4, 4, 4];
const BEATS = 4;

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
  /** Knock knock on a front door. */
  knock() {
    [0, 0.2].forEach((d) => {
      this.tone(150, 0.1, { type: 'triangle', vol: 0.45, slide: -40, delay: d });
      this.noise(0.06, { freq: 700, q: 1.2, vol: 0.3, delay: d, type: 'lowpass' });
    });
  }
  /** A door swinging open. */
  creak() {
    this.tone(420, 0.35, { type: 'triangle', vol: 0.1, slide: 180 });
    this.tone(640, 0.25, { type: 'sine', vol: 0.06, slide: -120, delay: 0.12 });
  }
  /** Someone pops out: boing! */
  boing(p = 1) {
    this.tone(220 * p, 0.35, { type: 'triangle', vol: 0.3, slide: 520 * p });
    this.tone(330 * p, 0.25, { type: 'sine', vol: 0.12, slide: 400 * p, delay: 0.05 });
  }
  /** Pip's bicycle bell: ring ring. */
  bell() {
    [0, 0.22].forEach((d) => {
      this.tone(2090, 0.5, { vol: 0.14, delay: d });
      this.tone(2630, 0.4, { vol: 0.08, delay: d });
      this.tone(3140, 0.2, { vol: 0.05, delay: d });
    });
  }
  /** Pip says hello: a happy little honk. */
  honk() {
    [0, 0.16].forEach((d, i) => this.tone(i ? 520 : 440, 0.14, { type: 'square', vol: 0.09, slide: 60, delay: d }));
  }
  /** Brown paper rustling. */
  rustle() {
    for (let i = 0; i < 4; i++) this.noise(0.09, { freq: 3000 + i * 400, q: 0.9, vol: 0.14, delay: i * 0.07 });
  }
  /** Pip's feet: pit-pat. */
  steps(n = 4) {
    for (let i = 0; i < n; i++) this.tone(i % 2 ? 300 : 260, 0.06, { type: 'triangle', vol: 0.12, slide: -60, delay: i * 0.17 });
  }
  /** Drawing the letter: a note higher at every dot. */
  note(i = 0) {
    this.tine(NOTE(72 + [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19][i % 12]), 0, 0.26, this.sfx);
  }
  /** Not that one: a soft, friendly "uh-uh". */
  nope() {
    this.tone(330, 0.14, { type: 'triangle', vol: 0.2, slide: -40 });
    this.tone(262, 0.2, { type: 'triangle', vol: 0.2, slide: -30, delay: 0.16 });
  }
  whoosh() {
    this.noise(0.5, { freq: 400, q: 0.7, vol: 0.3, sweep: 2600 });
  }
  giggle() {
    const base = 900 + Math.random() * 200;
    for (let i = 0; i < 5; i++) this.tone(base + (i % 2) * 200 - i * 30, 0.08, { type: 'triangle', vol: 0.2, slide: 140, delay: i * 0.08 });
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
  // Music: a bouncy walking tune.

  protected startMusic() {
    const ctx = this.context!;
    this.nextBeat = ctx.currentTime + 0.4;
    this.applyMusicLevel();
    // Counted in half beats.
    const half = 0.25;
    window.setInterval(() => {
      if (ctx.state !== 'running') return;
      // After a pause, pick the tune up from now rather than rushing to catch up.
      if (this.nextBeat < ctx.currentTime) this.nextBeat = ctx.currentTime + 0.05;
      while (this.nextBeat < ctx.currentTime + 0.3) {
        const t = this.nextBeat - ctx.currentTime;
        const step = this.beatInBar;
        let pos = 0;
        for (const [n, len] of MELODY[this.bar]) {
          if (pos * 2 === step && n !== R) this.tine(NOTE(n), t, 0.24, this.music);
          pos += len;
        }
        // Walking bass on 1 and 3, chord tones on 2 and 4.
        const b = BASS[this.bar];
        if (step === 0) this.tone(NOTE(b), half * 3, { vol: 0.16, delay: t, attack: 0.02, out: this.music });
        else if (step === 4) this.tone(NOTE(b + 7), half * 3, { vol: 0.13, delay: t, attack: 0.02, out: this.music });
        else if (step === 2 || step === 6) {
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
