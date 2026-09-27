import './font.css';
import './style.css';
import { appIcon, startGame } from '../../shared/shell';
import { hint } from '../../shared/ui';
import { ICONS, treatSVG } from './art';
import { sound } from './audio';
import { initBackdrop } from './backdrop';
import { bake } from './bake';
import { needsName, setName } from './data';
import { guide } from './guide';
import { shopScreen, titleScreen } from './screens';
import { initSettings } from './settings';
import { loadRecordings, say, stopSpeaking } from './voice';

const { host, play } = startGame({
  game: 'bakery',
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
  // The window and shelf step down on the title so the sign has room.
  onScene: (onTitle) => document.documentElement.classList.toggle('on-title', onTitle),
});

appIcon(async (g, load) => {
  const cupcake = await load(treatSVG({ kind: 'cupcake', shape: 'heart', batter: 'yellow', icing: 'pink', sprinkles: 3, topper: 'cherry', seed: 'icon' }), 150);
  const grad = g.createLinearGradient(0, 0, 0, 180);
  grad.addColorStop(0, '#ffd6e4');
  grad.addColorStop(1, '#fff4e0');
  g.fillStyle = grad;
  g.fillRect(0, 0, 180, 180);
  g.drawImage(cupcake, 15, 20, 150, 150);
});

void play<'title' | 'play' | 'shop'>('title', async (route) => {
  if (route === 'title') {
    const next = await titleScreen(host);
    if (next === 'play') void say('letsBake');
    return next;
  }
  if (route === 'play') return (await bake(host)) === 'shop' ? 'shop' : 'play';
  return (await shopScreen(host)) === 'play' ? 'play' : 'title';
});
