"""Makes the games' spoken lines as audio clips with a free, natural voice.

Runs on GitHub's servers (see .github/workflows/voice.yml), because the
voice models are big downloads.

  audition   A few sample lines in many voices, plus a page to listen to
             them: voice/audition/index.html.
  full       Every line in voice/lines.json in one voice, as
             voice/clips/*.mp3 and voice/manifest.json, which the games
             play when a grown-up hasn't recorded that line.

Voices are named "kokoro:<voice>" (Apache 2.0, https://github.com/hexgrad/kokoro)
or "chatterbox:<expressiveness>" (MIT, https://github.com/resemble-ai/chatterbox).
Chatterbox copies the voice in voice/reference.wav if that file exists.
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
        ref = VOICE_DIR / "reference.wav"
        self.ref = str(ref) if ref.exists() else None

    def say(self, voice, text, wav):
        import torchaudio

        audio = self.model.generate(text, audio_prompt_path=self.ref, exaggeration=float(voice), cfg_weight=0.4)
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
        # Trim the silence at both ends, even out the loudness, small mono mp3.
        trim = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05"
        subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-y", "-i", wav,
             "-af", f"{trim},areverse,{trim},areverse,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=24000",
             "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "48k", str(out)],
            check=True,
        )


def clip_name(text):
    return hashlib.sha1(text.encode()).hexdigest()[:12] + ".mp3"


def audition(engine):
    """Samples for every audition voice of one engine, then (re)builds the page
    from whatever voices have samples, so engines can run one at a time."""
    out = VOICE_DIR / "audition"
    for name, _ in AUDITION_VOICES:
        if not name.startswith(engine + ":"):
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
        shutil.rmtree(clips_dir, ignore_errors=True)
    clips = {}
    for text in lines:
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
    p.add_argument("mode", choices=["audition", "full"])
    p.add_argument("--voice", default="kokoro:af_heart", help='for "full", e.g. kokoro:af_heart')
    p.add_argument("--engine", default="kokoro", help='for "audition": kokoro or chatterbox')
    a = p.parse_args()
    audition(a.engine) if a.mode == "audition" else full(a.voice)
