import './font.css';
import '../../shared/base.css';
import './style.css';
import { appIcon, startGame } from '../../shared/shell';
import { ICONS, frogSVG, padSVG } from './art';
import { sound } from './audio';
import { needsName, setName } from './data';
import { leapScreen } from './leap';
import { pondScreen, titleScreen } from './screens';
import { initSettings } from './settings';
import { loadRecordings, say, stopSpeaking } from './voice';

const { host, play } = startGame({
  game: 'leapy-pond',
  icons: ICONS,
  sound,
  voice: { loadRecordings, stopSpeaking },
  name: { needed: needsName, set: setName },
  initSettings,
});

// Hoppy on a lily pad in the pond.
appIcon(async (g, load) => {
  const [pad, frog] = await Promise.all([load(padSVG(0, 160, true), 100), load(frogSVG(), 100)]);
  g.fillStyle = '#5cc4f0';
  g.fillRect(0, 0, 180, 180);
  g.drawImage(pad, 14, 14, 152, 152);
  g.drawImage(frog, 36, 30, 108, 108);
});

void play<'title' | 'leap' | 'pond'>('title', async (route) => {
  if (route === 'title') {
    const next = (await titleScreen(host)) === 'play' ? 'leap' : 'pond';
    if (next === 'leap') void say('letsHop');
    return next;
  }
  if (route === 'leap') return (await leapScreen(host)) === 'again' ? 'leap' : 'pond';
  await pondScreen(host);
  void say('letsHop');
  return 'leap';
});
