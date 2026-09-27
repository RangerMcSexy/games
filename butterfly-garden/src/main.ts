import './font.css';
import '../../shared/base.css';
import './style.css';
import { appIcon, startGame } from '../../shared/shell';
import { hint } from '../../shared/ui';
import { ICONS, butterflySVG } from './art';
import { sound } from './audio';
import { initBackdrop } from './backdrop';
import { needsName, setName } from './data';
import { guide } from './guide';
import { journey } from './journey';
import { gardenScreen, titleScreen } from './screens';
import { initSettings } from './settings';
import { loadRecordings, say, stopSpeaking } from './voice';

const { host, play } = startGame({
  game: 'butterfly-garden',
  icons: ICONS,
  sound,
  voice: { loadRecordings, stopSpeaking },
  name: { needed: needsName, set: setName },
  initSettings,
  beforeStage: initBackdrop,
  afterStage(app) {
    guide.init(app);
    hint.onShow = (t) => guide.pointAt(t);
    hint.onHide = () => guide.goHome();
  },
});

appIcon(async (g, load) => {
  const butterfly = await load(
    butterflySVG({ shape: 'round', pattern: 'hearts', foods: ['melon', 'strawberry', 'blueberry', 'grape', 'banana'], golden: false }, {}),
    150,
  );
  const grad = g.createLinearGradient(0, 0, 0, 180);
  grad.addColorStop(0, '#a9dcf7');
  grad.addColorStop(1, '#fdf1e7');
  g.fillStyle = grad;
  g.fillRect(0, 0, 180, 180);
  g.drawImage(butterfly, 15, 18, 150, 150);
});

void play<'title' | 'play' | 'garden'>('title', async (route) => {
  if (route === 'title') {
    const next = await titleScreen(host);
    if (next === 'play') void say('letsGo');
    return next;
  }
  if (route === 'play') return (await journey(host)) === 'garden' ? 'garden' : 'play';
  return (await gardenScreen(host)) === 'play' ? 'play' : 'title';
});
