import './font.css';
import './style.css';
import { appIcon, startGame } from '../../shared/shell';
import { DUCK_BOX, ICONS, duckSVG } from './art';
import { sound } from './audio';
import { needsName, setName } from './data';
import { bathScreen } from './bath';
import { shelfScreen, titleScreen } from './screens';
import { initSettings } from './settings';
import { loadRecordings, say, stopSpeaking } from './voice';

const { host, play } = startGame({
  game: 'ducky-bath',
  icons: ICONS,
  sound,
  voice: { loadRecordings, stopSpeaking },
  name: { needed: needsName, set: setName },
  initSettings,
});

// Ducky afloat on a bath-blue square.
appIcon(async (g, load) => {
  const duck = await load(duckSVG('ducky').replace(`viewBox="${DUCK_BOX}"`, 'viewBox="-58 -110 128 128"'), 100);
  const sky = g.createLinearGradient(0, 0, 0, 180);
  sky.addColorStop(0, '#cdeef0');
  sky.addColorStop(0.8, '#cdeef0');
  sky.addColorStop(0.8, '#7cc8f0');
  sky.addColorStop(1, '#5eb4e6');
  g.fillStyle = sky;
  g.fillRect(0, 0, 180, 180);
  g.drawImage(duck, 0, 0, 180, 180);
});

void play<'title' | 'bath' | 'shelf'>('title', async (route) => {
  if (route === 'title') {
    const next = (await titleScreen(host)) === 'play' ? 'bath' : 'shelf';
    if (next === 'bath') void say('letsGo');
    return next;
  }
  if (route === 'bath') return (await bathScreen(host)) === 'again' ? 'bath' : 'shelf';
  await shelfScreen(host);
  void say('letsGo');
  return 'bath';
});
