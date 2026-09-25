// Synthesized sound effects, gentle background music and spoken prompts.
// Everything is generated with Web Audio / Speech Synthesis: no audio files.
import { persist, save } from './data';

const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

// Twinkle Twinkle Little Star (first line), played one note per star tap.
export const TWINKLE = [60, 60, 67, 67, 69, 69, 67].map(NOTE);

class Sound {
  private ctx?: AudioContext;
  private master!: GainNode;
  private sfx!: GainNode;
  private music!: GainNode;
  private noiseBuf?: AudioBuffer;
  private musicTimer?: number;
  private nextBeat = 0;
  private step = 0;
  private voice?: SpeechSynthesisVoice;

  /** Must be called from a user gesture (iOS/Safari requirement). */
  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = save.sound ? 1 : 0;
      this.master.connect(this.ctx.destination);
      this.sfx = this.ctx.createGain();
      this.sfx.gain.value = 0.55;
      this.sfx.connect(this.master);
      this.music = this.ctx.createGain();
      this.music.gain.value = 0;
      this.music.connect(this.master);
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.startMusic();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    this.loadVoice();
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
    if (this.ctx) this.master.gain.setTargetAtTime(save.sound ? 1 : 0, this.ctx.currentTime, 0.05);
    if (!save.sound && 'speechSynthesis' in window) speechSynthesis.cancel();
    return save.sound;
  }

  toggleMusic() {
    save.music = !save.music;
    persist();
    this.applyMusicLevel();
    return save.music;
  }

  private applyMusicLevel(duck = false) {
    if (!this.ctx) return;
    const level = save.music ? (duck ? 0.07 : 0.16) : 0;
    this.music.gain.setTargetAtTime(level, this.ctx.currentTime, 0.4);
  }

  // -------------------------------------------------------------------------
  // Primitive voices

  private tone(
    freq: number,
    dur: number,
    { type = 'sine' as OscillatorType, vol = 0.5, slide = 0, delay = 0, attack = 0.005, out = this.sfx } = {},
  ) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
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

  private noise(dur: number, { freq = 1200, q = 1, vol = 0.4, delay = 0, type = 'bandpass' as BiquadFilterType, sweep = 0 } = {}) {
    if (!this.ctx || !this.noiseBuf) return;
    const t = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (sweep) f.frequency.exponentialRampToValueAtTime(freq + sweep, t + dur);
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.sfx);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  // -------------------------------------------------------------------------
  // Sound effects

  pop(pitch = 1) {
    this.tone(520 * pitch, 0.14, { type: 'sine', vol: 0.5, slide: 500 * pitch });
  }
  tapSoft() {
    this.tone(880, 0.08, { type: 'triangle', vol: 0.25, slide: 200 });
  }
  chomp() {
    this.noise(0.09, { freq: 900, q: 0.8, vol: 0.7 });
    this.tone(180, 0.08, { type: 'square', vol: 0.12, slide: -80 });
    this.noise(0.09, { freq: 700, q: 0.8, vol: 0.6, delay: 0.16 });
    this.tone(160, 0.08, { type: 'square', vol: 0.1, slide: -70, delay: 0.16 });
  }
  gulp() {
    this.tone(300, 0.22, { type: 'sine', vol: 0.45, slide: -180 });
  }
  crack(level = 0) {
    this.noise(0.07, { freq: 2600 - level * 300, q: 3, vol: 0.8 });
    this.tone(1300 - level * 120, 0.05, { type: 'square', vol: 0.06 });
  }
  wobble() {
    this.tone(330, 0.25, { type: 'sine', vol: 0.3, slide: 60 });
  }
  squeak() {
    this.tone(900, 0.12, { type: 'sine', vol: 0.35, slide: 700 });
    this.tone(1300, 0.14, { type: 'sine', vol: 0.3, slide: 500, delay: 0.12 });
  }
  whoosh() {
    this.noise(0.5, { freq: 400, q: 0.7, vol: 0.35, sweep: 2600 });
  }
  sparkle() {
    [0, 4, 7, 12, 16].forEach((n, i) =>
      this.tone(NOTE(84 + n), 0.3, { type: 'triangle', vol: 0.18, delay: i * 0.05 }),
    );
  }
  bloop(i = 0) {
    this.tone(NOTE(72 + [0, 2, 4, 7, 9, 12, 14][i % 7]), 0.25, { type: 'sine', vol: 0.35, slide: 40 });
  }
  wrap() {
    this.noise(0.35, { freq: 3000, q: 0.5, vol: 0.25, type: 'highpass' });
    this.tone(600, 0.3, { type: 'sine', vol: 0.15, slide: 400 });
  }
  bell(freq: number) {
    this.tone(freq, 1.4, { type: 'sine', vol: 0.45 });
    this.tone(freq * 2, 0.8, { type: 'sine', vol: 0.12 });
    this.tone(freq * 3.01, 0.5, { type: 'sine', vol: 0.05 });
  }
  fanfare() {
    const seq = [60, 64, 67, 72, 67, 72, 76];
    const times = [0, 0.12, 0.24, 0.36, 0.56, 0.68, 0.8];
    seq.forEach((n, i) => {
      this.tone(NOTE(n), 0.4, { type: 'triangle', vol: 0.3, delay: times[i] });
      this.tone(NOTE(n + 12), 0.3, { type: 'sine', vol: 0.08, delay: times[i] });
    });
    [60, 64, 67, 72].forEach((n) => this.tone(NOTE(n), 1.4, { type: 'sine', vol: 0.12, delay: 0.8, attack: 0.05 }));
  }
  tada() {
    [72, 76, 79, 84].forEach((n, i) => this.tone(NOTE(n), 0.5, { type: 'triangle', vol: 0.25, delay: i * 0.07 }));
  }
  yawn() {
    this.tone(500, 0.7, { type: 'sine', vol: 0.2, slide: -260, attack: 0.1 });
  }

  // -------------------------------------------------------------------------
  // Music: a soft lullaby arpeggio over C - Am - F - G.

  private startMusic() {
    if (!this.ctx) return;
    this.nextBeat = this.ctx.currentTime + 0.3;
    this.applyMusicLevel();
    const chords = [
      [48, 55, 60, 64, 67],
      [45, 52, 57, 60, 64],
      [41, 48, 53, 57, 60],
      [43, 50, 55, 59, 62],
    ];
    const melodyPool = [72, 74, 76, 79, 81];
    const beat = 0.34;
    this.musicTimer = window.setInterval(() => {
      const ctx = this.ctx!;
      if (ctx.state !== 'running') return;
      while (this.nextBeat < ctx.currentTime + 0.25) {
        const chord = chords[Math.floor(this.step / 8) % chords.length];
        const pos = this.step % 8;
        const t = this.nextBeat - ctx.currentTime;
        if (pos === 0) this.tone(NOTE(chord[0]), 2.4, { type: 'sine', vol: 0.35, delay: t, attack: 0.05, out: this.music });
        const arp = [1, 2, 3, 4, 3, 2, 3, 4][pos];
        this.tone(NOTE(chord[arp]), 0.7, { type: 'triangle', vol: 0.2, delay: t, out: this.music });
        if ((pos === 0 || pos === 3 || pos === 6) && Math.random() < 0.55) {
          const m = melodyPool[Math.floor(Math.random() * melodyPool.length)];
          this.tone(NOTE(m), 0.9, { type: 'sine', vol: 0.16, delay: t, attack: 0.02, out: this.music });
        }
        this.nextBeat += beat;
        this.step++;
      }
    }, 60);
  }

  // -------------------------------------------------------------------------
  // Speech

  private loadVoice() {
    if (!('speechSynthesis' in window) || this.voice) return;
    const pick = () => {
      const voices = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en'));
      const liked = ['Samantha', 'Google US English', 'Karen', 'Moira', 'Tessa', 'Aria', 'Jenny', 'Zira', 'Female'];
      for (const name of liked) {
        const v = voices.find((x) => x.name.includes(name));
        if (v) return (this.voice = v);
      }
      this.voice = voices.find((v) => v.lang === 'en-US') ?? voices[0];
    };
    pick();
    if (!this.voice) speechSynthesis.addEventListener('voiceschanged', pick, { once: true });
  }

  speak(text: string) {
    if (!save.sound || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (this.voice) u.voice = this.voice;
      u.lang = this.voice?.lang ?? 'en-US';
      u.rate = 0.92;
      u.pitch = 1.25;
      u.volume = 1;
      u.onstart = () => this.applyMusicLevel(true);
      u.onend = () => this.applyMusicLevel(false);
      speechSynthesis.speak(u);
    } catch {
      // Speech is a nice-to-have; ignore failures.
    }
  }
}

export const sound = new Sound();
