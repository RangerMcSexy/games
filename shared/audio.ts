// The sound engine every game builds on: one Web Audio context, the sound
// and music switches, music that ducks under the voice, and the primitive
// voices (tone, noise, tine) each game makes its own effects and tune from.
// There are no audio files.

export const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

export abstract class SoundBase {
  context?: AudioContext;
  /** Recorded voice clips play through here (ducks the music). */
  voiceOut?: GainNode;
  protected master!: GainNode;
  protected sfx!: GainNode;
  protected music!: GainNode;
  protected noiseBuf?: AudioBuffer;
  /** Where the music has got to: the game's startMusic moves these along. */
  protected nextBeat = 0;
  protected bar = 0;
  protected beatInBar = 0;
  protected sleeping = false;
  private ducked = false;
  private paused = false;

  /** `switches` is the game's saved data, where the two on/off buttons live. */
  constructor(
    private switches: { sound: boolean; music: boolean },
    private persist: () => void,
  ) {}

  /** Starts the game's own tune (once, when the sound is first unlocked). */
  protected abstract startMusic(): void;

  /** Must be called from a user gesture (iOS/Safari requirement). */
  unlock() {
    if (!this.context) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = (this.context = new Ctx());
      this.master = ctx.createGain();
      this.master.gain.value = this.switches.sound ? 1 : 0;
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
    if (this.context.state !== 'running' && !this.sleeping) {
      this.context.resume().catch(() => {});
      // Older iPhones and iPads only really start once something has been
      // played during a tap: a moment of silence will do.
      try {
        const src = this.context.createBufferSource();
        src.buffer = this.context.createBuffer(1, 1, this.context.sampleRate);
        src.connect(this.context.destination);
        src.start(0);
      } catch {
        /* nothing to do */
      }
    }
  }

  /** Go quiet while the game is hidden (another app, or the screen is off). */
  sleep(on: boolean) {
    this.sleeping = on;
    if (!this.context) return;
    (on ? this.context.suspend() : this.context.resume()).catch(() => {});
  }

  get soundOn() {
    return this.switches.sound;
  }
  get musicOn() {
    return this.switches.music;
  }

  toggleSound() {
    this.switches.sound = !this.switches.sound;
    this.persist();
    if (this.context) this.master.gain.setTargetAtTime(this.switches.sound ? 1 : 0, this.context.currentTime, 0.05);
    return this.switches.sound;
  }

  toggleMusic() {
    this.switches.music = !this.switches.music;
    this.persist();
    this.applyMusicLevel();
    return this.switches.music;
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

  /** How loud the music plays when nobody is talking. */
  protected musicBase() {
    return 0.22;
  }

  protected applyMusicLevel() {
    if (!this.context) return;
    const base = this.musicBase();
    const level = this.switches.music && !this.paused ? (this.ducked ? base * 0.35 : base) : 0;
    this.music.gain.setTargetAtTime(level, this.context.currentTime, 0.3);
  }

  // -------------------------------------------------------------------------
  // Primitive voices

  protected tone(
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

  protected noise(dur: number, { freq = 1200, q = 1, vol = 0.4, delay = 0, type = 'bandpass' as BiquadFilterType, sweep = 0, attack = 0 } = {}) {
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
  protected tine(freq: number, delay: number, vol: number, out: AudioNode) {
    this.tone(freq, 1.6, { type: 'sine', vol, delay, out });
    this.tone(freq * 2, 0.7, { type: 'sine', vol: vol * 0.25, delay, out });
    this.tone(freq * 4.02, 0.18, { type: 'sine', vol: vol * 0.12, delay, out });
  }
}
