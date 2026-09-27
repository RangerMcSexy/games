import './font.css';
import '../../shared/base.css';
import './style.css';
import { appIcon, startGame } from '../../shared/shell';
import { hint } from '../../shared/ui';
import { ICONS } from './art';
import { sound } from './audio';
import { initBackdrop } from './backdrop';
import { needsName, setName } from './data';
import { guide } from './guide';
import { paint } from './paint';
import { naturalFills, pictureById, pictureSVG } from './pictures';
import { galleryScreen, pickerScreen, titleScreen } from './screens';
import { initSettings } from './settings';
import { loadRecordings, say, stopSpeaking } from './voice';

const { host, play } = startGame({
  game: 'colour-splash',
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

// The painted sun fills the whole icon.
appIcon(async (g, load) => {
  const sun = pictureById('sun')!;
  g.drawImage(await load(pictureSVG(sun, naturalFills(sun)).svg, 180), 0, 0, 180, 180);
});

void play<'title' | 'pick' | 'gallery'>('title', async (route) => {
  if (route === 'title') {
    const next = (await titleScreen(host)) === 'play' ? 'pick' : 'gallery';
    if (next === 'pick') void say('letsPaint');
    return next;
  }
  if (route === 'pick') {
    const pic = await pickerScreen(host);
    return (await paint(host, pic)) === 'gallery' ? 'gallery' : 'pick';
  }
  await galleryScreen(host);
  return 'pick';
});
