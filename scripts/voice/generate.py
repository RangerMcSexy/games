"""Makes the games' spoken lines as audio clips with a free, natural voice.

Runs on GitHub's servers (see .github/workflows/voice.yml), because the
voice models are big downloads.

  audition   A few sample lines in many voices, plus a page to listen to
             them: voice/audition/index.html.
  full       Every line in voice/lines.json in one voice, as
             voice/clips/*.mp3 and voice/manifest.json, which the games
             play when a grown-up hasn't recorded that line on the device.
             Lines someone has recorded for everyone (voice/recorded/, see
             below) use the recording instead.

  refs       The recordings Chatterbox copies voices from (see below).

Voices are named "kokoro:<voice>" (Apache 2.0, https://github.com/hexgrad/kokoro)
or "chatterbox:<expressiveness>[:<reference>]" (MIT,
https://github.com/resemble-ai/chatterbox). Chatterbox has no voices of its
own: it copies the voice of a short recording and adds its own expression.
"chatterbox:0.6:af_nicole" copies voice/refs/af_nicole.flac, a storybook
passage read by Kokoro's af_nicole ("refs" makes these). Without a reference
it copies voice/reference.wav if that file exists, else its built-in voice.

Recordings for everyone: voice/recorded/ holds a grown-up's recordings of
lines, one file per line, named with the line's number in the recording
script (voice/script/, made by scripts/voice/script.mjs): 001.m4a, 123.wav
and so on, in any format ffmpeg reads. "full" tidies them up the same way as
the AI clips (silence trimmed, loudness evened out) and uses them in place
of the AI voice, whatever voice is chosen.
"""

import argparse
import hashlib
import html
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VOICE_DIR = ROOT / "voice"

AUDITION_LINES = [
    "Yay!",
    "Well done!",
    "Let's go fishing!",
    "A goldfish!",
    "Nibble nibble!",
    "Blue!",
    "Wow! A beautiful butterfly!",
]

AUDITION_VOICES = [
    ("chatterbox:0.6:af_nicole", "Soft 1: gentle, breathy (American)"),
    ("chatterbox:0.6:af_heart", "Soft 2: warm (American)"),
    ("chatterbox:0.6:af_bella", "Soft 3: bright (American)"),
    ("chatterbox:0.6:bf_emma", "Soft 4: warm (British)"),
    ("chatterbox:0.6:bf_isabella", "Soft 5: clear (British)"),
    ("kokoro:af_heart", "Heart (American)"),
    ("kokoro:af_bella", "Bella (American)"),
    ("kokoro:af_nicole", "Nicole (American, soft)"),
    ("kokoro:af_sarah", "Sarah (American)"),
    ("kokoro:bf_emma", "Emma (British)"),
    ("kokoro:bf_isabella", "Isabella (British)"),
    ("kokoro:am_michael", "Michael (American, male)"),
    ("kokoro:bm_george", "George (British, male)"),
    ("chatterbox:0.5", "Chatterbox (calm)"),
    ("chatterbox:0.8", "Chatterbox (excited)"),
]


# What the Kokoro voices read for Chatterbox to copy: gentle, a little
# playful, about 12 seconds.
REF_TEXT = (
    "Once upon a time, in a little garden by the pond, a tiny caterpillar woke up "
    "and stretched in the warm morning sun. She wiggled, and giggled, and said hello "
    "to all her friends. Oh, what a lovely day it was going to be!"
)


class Kokoro:
    def __init__(self):
        from kokoro import KPipeline

        self.pipes = {}
        self.KPipeline = KPipeline

    def say(self, voice, text, wav):
        import numpy as np
        import soundfile as sf

        lang = voice[0]  # "a" American, "b" British
        if lang not in self.pipes:
            self.pipes[lang] = self.KPipeline(lang_code=lang)
        parts = []
        for _, _, audio in self.pipes[lang](text, voice=voice, speed=0.92):
            parts.append(audio.cpu().numpy() if hasattr(audio, "cpu") else np.asarray(audio))
        sf.write(wav, np.concatenate(parts), 24000)


class Chatterbox:
    def __init__(self):
        from chatterbox.tts import ChatterboxTTS

        self.model = ChatterboxTTS.from_pretrained(device="cpu")
        self.builtin = self.model.conds
        ref = VOICE_DIR / "reference.wav"
        self.default_ref = str(ref) if ref.exists() else None
        self.loaded = None

    def say(self, voice, text, wav):
        import torchaudio

        exaggeration, _, ref = voice.partition(":")
        ref = str(VOICE_DIR / "refs" / f"{ref}.flac") if ref else self.default_ref
        # Study the voice to copy once, not before every line (much faster).
        if ref != self.loaded:
            if ref:
                self.model.prepare_conditionals(ref, exaggeration=float(exaggeration))
            else:
                self.model.conds = self.builtin
            self.loaded = ref
        audio = self.model.generate(text, exaggeration=float(exaggeration), cfg_weight=0.4)
        torchaudio.save(wav, audio, self.model.sr)


engines = {}


def speak(name, text, out):
    """Says `text` in voice `name` ("engine:voice") into the mp3 file `out`."""
    engine, voice = name.split(":", 1)
    if engine not in engines:
        engines[engine] = {"kokoro": Kokoro, "chatterbox": Chatterbox}[engine]()
    out.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        wav = str(Path(tmp) / "raw.wav")
        engines[engine].say(voice, text, wav)
        polish(wav, out)


def polish(src, out):
    """Trims the silence at both ends, evens out the loudness, and makes a small mono mp3."""
    out.parent.mkdir(parents=True, exist_ok=True)
    trim = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05"
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-i", str(src),
         "-af", f"{trim},areverse,{trim},areverse,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=24000",
         "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "48k", str(out)],
        check=True,
    )


def recorded():
    """The recordings in voice/recorded/, by the line they say: {text: file}."""
    folder = VOICE_DIR / "recorded"
    numbers_path = VOICE_DIR / "script" / "numbers.json"
    if not folder.is_dir() or not numbers_path.exists():
        return {}
    numbers = json.loads(numbers_path.read_text())
    out = {}
    for f in sorted(folder.iterdir()):
        stem = f.stem.strip()
        if f.is_file() and stem.isdigit() and str(int(stem)) in numbers:
            out[numbers[str(int(stem))]] = f
        elif f.is_file() and not f.name.startswith(".") and f.name != "README.md":
            print(f"Not a numbered recording, skipping: {f.name}", file=sys.stderr, flush=True)
    return out


def recorded_clip_name(src):
    """Named after the recording itself, so a new take of a line replaces the old one."""
    return "r" + hashlib.sha1(src.read_bytes()).hexdigest()[:11] + ".mp3"


def clip_name(text):
    return hashlib.sha1(text.encode()).hexdigest()[:12] + ".mp3"


def refs(voices):
    """Makes the Kokoro recordings the Chatterbox voices in `voices` copy."""
    for name in voices:
        engine, _, rest = name.partition(":")
        ref = rest.partition(":")[2]
        path = VOICE_DIR / "refs" / f"{ref}.flac"
        if engine != "chatterbox" or not ref or path.exists():
            continue
        path.parent.mkdir(parents=True, exist_ok=True)
        if "kokoro" not in engines:
            engines["kokoro"] = Kokoro()
        engines["kokoro"].say(ref, REF_TEXT, str(path))
        print(f"reference: {ref}", flush=True)


def audition(engine, only):
    """Samples for the audition voices of one engine (all, or those in `only`),
    then (re)builds the page from whatever voices have samples, so engines
    and voices can be added one run at a time."""
    out = VOICE_DIR / "audition"
    for name, _ in AUDITION_VOICES:
        if not name.startswith(engine + ":") or (only and name not in only):
            continue
        folder = out / name.replace(":", "-")
        shutil.rmtree(folder, ignore_errors=True)
        try:
            for i, text in enumerate(AUDITION_LINES):
                speak(name, text, folder / f"{i}.mp3")
                print(f"{name}: {text}", flush=True)
        except Exception as e:  # one voice failing shouldn't lose the rest
            print(f"Skipping {name}: {e}", file=sys.stderr, flush=True)
            shutil.rmtree(folder, ignore_errors=True)
    rows = []
    for name, label in AUDITION_VOICES:
        folder = name.replace(":", "-")
        if not (out / folder).exists():
            continue
        buttons = "".join(
            f'<button data-src="{folder}/{i}.mp3">{html.escape(t)}</button>' for i, t in enumerate(AUDITION_LINES)
        )
        rows.append(
            f'<section><h2>{html.escape(label)}</h2><code>{html.escape(name)}</code>'
            f'<div>{buttons}<button class="all">▶ Play all</button></div></section>'
        )
    out.mkdir(parents=True, exist_ok=True)
    (out / "index.html").write_text(AUDITION_PAGE.replace("<!--ROWS-->", "\n".join(rows)))


def full(name):
    lines = json.loads((VOICE_DIR / "lines.json").read_text())
    clips_dir = VOICE_DIR / "clips"
    manifest_path = VOICE_DIR / "manifest.json"
    old = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    same_voice = old.get("voice") == name
    if not same_voice:
        # A new voice: every AI clip is made again (recordings are kept).
        for f in clips_dir.glob("*.mp3"):
            if not f.name.startswith("r"):
                f.unlink()
    rec = recorded()
    clips = {}
    for text in lines:
        if text in rec:
            file = recorded_clip_name(rec[text])
            if not (clips_dir / file).exists():
                polish(rec[text], clips_dir / file)
                print(f"recorded: {text}", flush=True)
        else:
            file = clip_name(text)
            if not (same_voice and (clips_dir / file).exists()):
                speak(name, text, clips_dir / file)
                print(f"{name}: {text}", flush=True)
        clips[text] = f"clips/{file}"
    # Drop clips for lines that no longer exist.
    keep = {Path(f).name for f in clips.values()}
    for f in clips_dir.glob("*.mp3"):
        if f.name not in keep:
            f.unlink()
    manifest_path.write_text(json.dumps({"voice": name, "clips": clips}, indent=2, ensure_ascii=False) + "\n")


AUDITION_PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Voice audition</title>
<style>
  :root { color-scheme: light; font-family: ui-rounded, system-ui, sans-serif; color: #5a4272; }
  body { margin: 0; padding: 24px 16px 48px; background: #f3fbff; }
  main { max-width: 760px; margin: 0 auto; }
  h1 { margin: 0 0 4px; }
  p { margin: 0 0 20px; }
  section { background: #fff; border-radius: 18px; padding: 14px 16px; margin-bottom: 14px;
            box-shadow: 0 4px 0 #d9ecf8; }
  h2 { display: inline; font-size: 20px; margin: 0 8px 0 0; }
  code { font-size: 13px; background: #f1ecfa; padding: 2px 6px; border-radius: 6px; }
  div { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
  button { font: inherit; font-size: 15px; border: 0; border-radius: 999px; padding: 8px 14px;
           background: #e9f5ff; color: inherit; cursor: pointer; }
  button.all { background: #7fcf6a; color: #fff; font-weight: 700; }
  button.playing { outline: 3px solid #b58cff; }
</style>
</head>
<body>
<main>
<h1>Pick a voice</h1>
<p>Tap a line to hear it, or <b>Play all</b>. Tell Claude the name in the grey box of the one you like.</p>
<!--ROWS-->
</main>
<script>
  let audio;
  const play = (btn) => new Promise((done) => {
    audio?.pause();
    document.querySelectorAll('.playing').forEach((b) => b.classList.remove('playing'));
    btn.classList.add('playing');
    audio = new Audio(btn.dataset.src);
    audio.onended = audio.onerror = () => { btn.classList.remove('playing'); done(); };
    audio.play().catch(done);
  });
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (!btn.classList.contains('all')) return play(btn);
    for (const b of btn.parentElement.querySelectorAll('button[data-src]')) {
      await play(b);
      await new Promise((r) => setTimeout(r, 250));
    }
  });
</script>
</body>
</html>
"""


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("mode", choices=["audition", "full", "refs"])
    p.add_argument("--voice", default="kokoro:af_heart", help='for "full", e.g. kokoro:af_heart')
    p.add_argument("--engine", default="kokoro", help='for "audition": kokoro or chatterbox')
    p.add_argument("--voices", default="", help="comma-separated voices (default: every audition voice)")
    a = p.parse_args()
    only = [v for v in a.voices.split(",") if v]
    if a.mode == "audition":
        audition(a.engine, only)
    elif a.mode == "refs":
        refs(only or [name for name, _ in AUDITION_VOICES])
    else:
        full(a.voice)
