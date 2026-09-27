import './font.css';
import './style.css';
import { appIcon, startGame } from '../../shared/shell';
import { ICONS, unicornSVG } from './art';
import { sound } from './audio';
import { needsName, setName } from './data';
import { dashScreen } from './dash';
import { dressScreen, titleScreen } from './screens';
import { initSettings } from './settings';
import { loadRecordings, say, stopSpeaking } from './voice';

const { host, play } = startGame({
  game: 'unicorn-dash',
  icons: ICONS,
  sound,
  voice: { loadRecordings, stopSpeaking },
  name: { needed: needsName, set: setName },
  initSettings,
});

// Sparkle's head and shoulders on a sky-blue square.
appIcon(async (g, load) => {
  const uni = await load(unicornSVG().replace('viewBox="-100 -180 210 186"', 'viewBox="-14 -176 112 112"'), 100);
  const sky = g.createLinearGradient(0, 0, 0, 180);
  sky.addColorStop(0, '#8fd3ff');
  sky.addColorStop(1, '#ffe3f3');
  g.fillStyle = sky;
  g.fillRect(0, 0, 180, 180);
  g.drawImage(uni, 10, 14, 166, 166);
});

void play<'title' | 'dash' | 'dress'>('title', async (route) => {
  if (route === 'title') {
    const next = (await titleScreen(host)) === 'play' ? 'dash' : 'dress';
    if (next === 'dash') void say('letsGo');
    return next;
  }
  if (route === 'dash') return (await dashScreen(host)) === 'again' ? 'dash' : 'dress';
  await dressScreen(host);
  return 'dash';
});
