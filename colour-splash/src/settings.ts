// Grown-up settings: the player's name, recording your own voice, and
// starting a fresh collection. Opened by holding the gear for 3 seconds.
import { ICONS } from './art';
import { sound } from './audio';
import { resetCollection, save, setName } from './data';
import { el } from './ui';
import { LINES, Recorder, deleteRecording, hasRecording, lineText, previewLine, recordingCount, saveRecording, stopSpeaking } from './voice';

const HOLD_MS = 3000;
const MAX_CLIP_MS = 7000;

/** Adds the hold-to-open gear to the top bar. */
export function initSettings(bar: HTMLElement, before: Element, onChange: () => void) {
  const gear = el('button', 'round-btn gear-btn', null, `${ICONS.gear}<span class="ring"></span>`);
  gear.setAttribute('aria-label', 'Grown-up settings (hold for 3 seconds)');
  bar.insertBefore(gear, before);
  let timer = 0;
  const cancel = () => {
    clearTimeout(timer);
    gear.classList.remove('holding');
  };
  gear.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    gear.classList.add('holding');
    timer = window.setTimeout(() => {
      gear.classList.remove('holding');
      openSettings(onChange);
    }, HOLD_MS);
  });
  gear.addEventListener('pointerup', cancel);
  gear.addEventListener('pointerleave', cancel);
  gear.addEventListener('pointercancel', cancel);
}

function openSettings(onChange: () => void) {
  stopSpeaking();
  sound.pauseMusic(true);
  const startName = save.name;
  let changed = false;

  const overlay = el('div', 'settings-overlay', document.body);
  const panel = el('div', 'settings', overlay);
  const head = el('div', 'settings-head', panel);
  el('h2', '', head, 'Grown-up settings');
  const close = el('button', 'round-btn close-btn', head, ICONS.close);
  close.setAttribute('aria-label', 'Close settings');

  const body = el('div', 'settings-scroll', panel);

  // Name -------------------------------------------------------------------
  const nameSec = el('section', 'set-sec', body);
  el('h3', '', nameSec, "Child's name");
  el('p', 'set-help', nameSec, 'Used on the title screen, the gallery sign and in cheers like “You did it, Mia!”. Leave it empty for no name.');
  const input = el('input', 'set-input', nameSec) as HTMLInputElement;
  input.type = 'text';
  input.maxLength = 20;
  input.value = save.name;
  input.autocomplete = 'off';
  input.addEventListener('input', () => setName(input.value));

  // Voice ------------------------------------------------------------------
  const voiceSec = el('section', 'set-sec', body);
  el('h3', '', voiceSec, 'Your voice');
  el(
    'p',
    'set-help',
    voiceSec,
    'Record any line in your own voice. Tap <b>●</b> to record, tap again to stop. Lines you don’t record use the built-in voice. Recordings stay on this device only.',
  );
  const counter = el('p', 'set-count', voiceSec);
  const paintCount = () => (counter.textContent = `${recordingCount()} of ${LINES.length} lines recorded`);
  paintCount();

  if (!Recorder.supported()) {
    el(
      'p',
      'set-warn',
      voiceSec,
      'Recording isn’t available here. Browsers only allow the microphone on pages served over https (or localhost), so open the game from a web address rather than a file to record.',
    );
  }

  let active: { rec: Recorder; btn: HTMLElement; row: HTMLElement; timer: number } | null = null;
  const stopActive = async () => {
    if (!active) return;
    const { rec, btn, row, timer } = active;
    active = null;
    clearTimeout(timer);
    btn.classList.remove('recording');
    const blob = await rec.stop();
    const id = row.dataset.id!;
    if (blob) {
      await saveRecording(id, blob);
      row.classList.add('has');
      paintCount();
      void previewLine(id);
    }
  };

  const list = el('div', 'line-list', voiceSec);
  for (const line of LINES) {
    const row = el('div', `line-row${hasRecording(line.id) ? ' has' : ''}`, list);
    row.dataset.id = line.id;
    const txt = el('div', 'line-text', row);
    el('div', 'line-say', txt, `“${escapeHtml(lineText(line))}”`);
    el('div', 'line-when', txt, line.when);
    const btns = el('div', 'line-btns', row);
    const rec = el('button', 'lb rec', btns, '<span></span>');
    rec.setAttribute('aria-label', 'Record');
    const play = el('button', 'lb play', btns, '▶');
    play.setAttribute('aria-label', 'Play');
    const del = el('button', 'lb del', btns, '✕');
    del.setAttribute('aria-label', 'Delete recording');
    if (!Recorder.supported()) rec.setAttribute('disabled', '');

    rec.addEventListener('click', async () => {
      if (active?.btn === rec) return stopActive();
      await stopActive();
      stopSpeaking();
      const r = new Recorder();
      try {
        await r.start();
      } catch {
        alert('Could not use the microphone. Please allow microphone access and try again.');
        return;
      }
      rec.classList.add('recording');
      active = { rec: r, btn: rec, row, timer: window.setTimeout(() => void stopActive(), MAX_CLIP_MS) };
    });
    play.addEventListener('click', async () => {
      await stopActive();
      sound.unlock();
      void previewLine(line.id);
    });
    del.addEventListener('click', async () => {
      await deleteRecording(line.id);
      row.classList.remove('has');
      paintCount();
    });
  }

  // Collection -------------------------------------------------------------
  const resetSec = el('section', 'set-sec', body);
  el('h3', '', resetSec, 'Gallery');
  el('p', 'set-help', resetSec, `${save.paintings.length} pictures painted so far.`);
  const reset = el('button', 'set-danger', resetSec, 'Start a new gallery');
  reset.addEventListener('click', () => {
    if (confirm('Clear every picture and start with an empty gallery? Your voice recordings are kept.')) {
      resetCollection();
      changed = true;
      reset.textContent = 'Done: the gallery is empty';
      reset.setAttribute('disabled', '');
    }
  });

  el('p', 'set-foot', body, 'Tip: add the game to your home screen to play full screen.');

  requestAnimationFrame(() => overlay.classList.add('open'));

  close.addEventListener('click', async () => {
    await stopActive();
    stopSpeaking();
    sound.pauseMusic(false);
    overlay.classList.remove('open');
    setTimeout(() => overlay.remove(), 300);
    if (changed || save.name !== startName) onChange();
  });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
