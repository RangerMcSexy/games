import './font.css';
import '../../shared/base.css';
import './style.css';
import { appIcon, startGame } from '../../shared/shell';
import { ICONS, PIP_BOX, pipSVG } from './art';
import { sound } from './audio';
import { needsName, setName } from './data';
import { roundScreen } from './round';
import { streetScreen, titleScreen } from './screens';
import { initSettings } from './settings';
import { loadRecordings, say, stopSpeaking } from './voice';

const { host, play } = startGame({
  game: 'postie-pip',
  icons: ICONS,
  sound,
  voice: { loadRecordings, stopSpeaking, say },
  name: { needed: needsName, set: setName },
  initSettings,
});

// Pip, head and shoulders, on a sky-blue square.
appIcon(async (g, load) => {
  const pip = await load(pipSVG().replace(`viewBox="${PIP_BOX}"`, 'viewBox="-66 -104 132 132"'), 100);
  const sky = g.createLinearGradient(0, 0, 0, 180);
  sky.addColorStop(0, '#bfe6ff');
  sky.addColorStop(1, '#e6f6ff');
  g.fillStyle = sky;
  g.fillRect(0, 0, 180, 180);
  g.drawImage(pip, 0, 6, 180, 180);
});

void play<'title' | 'round' | 'street'>('title', async (route) => {
  if (route === 'title') {
    const next = (await titleScreen(host)) === 'play' ? 'round' : 'street';
    if (next === 'round') void say('letsGo');
    return next;
  }
  if (route === 'round') return (await roundScreen(host)) === 'again' ? 'round' : 'street';
  await streetScreen(host);
  void say('letsGo');
  return 'round';
});
