import './font.css';
import '../../shared/base.css';
import './style.css';
import { appIcon, startGame } from '../../shared/shell';
import { ICONS, fishSVG } from './art';
import { sound } from './audio';
import { FISH, needsName, setName } from './data';
import { pondScreen } from './pond';
import { aquariumScreen, titleScreen } from './screens';
import { initSettings } from './settings';
import { loadRecordings, say, stopSpeaking } from './voice';

const { host, play } = startGame({
  game: 'fishing-pond',
  icons: ICONS,
  sound,
  voice: { loadRecordings, stopSpeaking, say },
  name: { needed: needsName, set: setName },
  initSettings,
});

appIcon(async (g, load) => {
  const fish = await load(fishSVG(FISH[0]), 150, 108);
  g.fillStyle = '#8fd3ff';
  g.fillRect(0, 0, 180, 180);
  g.drawImage(fish, 15, 36, 150, 108);
});

void play<'title' | 'pond' | 'aquarium'>('title', async (route) => {
  if (route === 'title') {
    const next = (await titleScreen(host)) === 'play' ? 'pond' : 'aquarium';
    if (next === 'pond') void say('letsFish');
    return next;
  }
  if (route === 'pond') return pondScreen(host);
  await aquariumScreen(host);
  return 'pond';
});
