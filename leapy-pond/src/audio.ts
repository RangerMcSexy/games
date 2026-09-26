// Synthesized sound effects and a bouncy music-box tune.
// Everything is generated with Web Audio: there are no audio files.
import { persist, save } from './data';

const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

// An original hoppy tune in 4/4, like a frog skipping across the pads:
// [midi note, beats] per bar.
const R = 0;
const MELODY: [number, number][][] = [
  [[72, 1], [76, 1], [79, 1.5], [76, 0.5]],
  [[77, 1], [74, 1], [71, 2]],
  [[72, 1], [76, 1], [79, 1], [84, 1]],
  [[81, 1.5], [79, 0.5], [76, 2]],
  [[77, 1], [81, 1], [79, 1], [77, 1]],
  [[76, 1], [79, 1], [72, 2]],
  [[74, 1], [76, 0.5], [77, 0.5], [79, 1], [71, 1]],
  [[72, 3], [R, 1]],
];
const BASS = [48, 43, 48, 45, 41, 48, 43, 48];
// Chord tones (relative to bass) for the accompaniment.
const THIRD = [4, 4, 4, 3, 4, 4, 4, 4];
const BEATS = 4;

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
  private sleeping = false;

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
    // Safari says 'interrupted' (not 'suspended') after a call or an app switch.
    if (this.context.state !== 'running' && !this.sleeping) this.context.resume().catch(() => {});
  }

  /** Go quiet while the game is hidden (another app, or the screen is off). */
  sleep(on: boolean) {
    this.sleeping = on;
    if (!this.context) return;
    (on ? this.context.suspend() : this.context.resume()).catch(() => {});
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
    if (!ctx || this.sleeping) return;
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
    if (!ctx || !this.noiseBuf || this.sleeping) return;
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
  /** Hoppy springs up: a rising, springy boing. */
  hop() {
    this.tone(220, 0.28, { type: 'triangle', vol: 0.32, slide: 520 });
    this.tone(440, 0.2, { vol: 0.12, slide: 700, delay: 0.03 });
    this.noise(0.18, { freq: 900, q: 1.2, vol: 0.08, sweep: 1800 });
  }
  /** Landing on a lily pad: a soft, wet pat. */
  land() {
    this.tone(260, 0.14, { vol: 0.4, slide: -140 });
    this.noise(0.14, { freq: 700, q: 1.4, vol: 0.2, sweep: -400 });
  }
  /** A gentle water tap. */
  ripple() {
    this.tone(480 + Math.random() * 120, 0.12, { vol: 0.22, slide: -260 });
    this.noise(0.12, { freq: 1600, q: 2, vol: 0.08, sweep: -900 });
  }
  /** The tongue flicking out for a fly. */
  slurp() {
    this.noise(0.16, { freq: 600, q: 3, vol: 0.3, sweep: 2400 });
    this.tone(300, 0.14, { type: 'triangle', vol: 0.18, slide: 700, delay: 0.04 });
    this.tone(900, 0.1, { vol: 0.14, slide: -400, delay: 0.2 });
  }
  /** A little fly buzzing about. */
  buzz() {
    const ctx = this.context;
    if (!ctx || this.sleeping) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.value = 210;
    lfo.frequency.value = 22;
    lg.gain.value = 30;
    lfo.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.035, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    o.connect(g).connect(this.sfx);
    o.start(t);
    lfo.start(t);
    o.stop(t + 0.75);
    lfo.stop(t + 0.75);
  }
  /** A stepping stone: a hollow little knock, higher each time. */
  knock(i = 0) {
    this.tone(NOTE(67 + [0, 2, 4, 5, 7, 9][i % 6]), 0.18, { type: 'triangle', vol: 0.3 });
    this.noise(0.05, { freq: 2400, q: 3, vol: 0.1 });
  }
  /** Not that one: a soft, friendly "uh-uh". */
  nope() {
    this.tone(330, 0.14, { type: 'triangle', vol: 0.2, slide: -40 });
    this.tone(262, 0.2, { type: 'triangle', vol: 0.2, slide: -30, delay: 0.16 });
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
  /** A springy wobble for silly catches. */
  boing() {
    const ctx = this.context;
    if (!ctx || this.sleeping) return;
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
  // Music: a lilting music-box waltz.

  private startMusic() {
    const ctx = this.context!;
    this.nextBeat = ctx.currentTime + 0.4;
    this.applyMusicLevel();
    // Counted in half beats, so the tune can skip.
    const half = 0.21;
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
        // Oom-pah: bass on 1 and 3, chord tones on 2 and 4.
        const b = BASS[this.bar];
        if (step === 0 || step === 4) this.tone(NOTE(b + (step ? 7 : 0)), half * 3, { vol: 0.17, delay: t, attack: 0.02, out: this.music });
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
