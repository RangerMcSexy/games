// This game's spoken lines. How they're spoken (a grown-up's recording, a
// natural-voice clip or the device's voice) is in shared/voice.ts.
import { TIMER_LINES } from '../../shared/play-timer';
import { makeVoice, type Line } from '../../shared/voice';
import { sound } from './audio';
import { playerName, save } from './data';

export const LINES: Line[] = [
  { id: 'title', text: "{name}'s Colour Splash!", when: 'Title screen' },
  { id: 'letsPaint', text: "Let's paint, {name}!", when: 'Pressing play' },
  { id: 'pickPicture', text: 'Pick a picture!', when: 'Choosing a picture' },
  { id: 'more', text: 'More pictures!', when: 'Showing the next pictures' },
  { id: 'p-sun', text: 'Sunshine!', when: 'Naming pictures' },
  { id: 'p-fish', text: 'Fishy!', when: 'Naming pictures' },
  { id: 'p-butterfly', text: 'Butterfly!', when: 'Naming pictures' },
  { id: 'p-house', text: 'House!', when: 'Naming pictures' },
  { id: 'p-car', text: 'Car! Beep beep!', when: 'Naming pictures' },
  { id: 'p-flower', text: 'Flower!', when: 'Naming pictures' },
  { id: 'p-cat', text: 'Kitty!', when: 'Naming pictures' },
  { id: 'p-icecream', text: 'Ice cream!', when: 'Naming pictures' },
  { id: 'p-rainbow', text: 'Rainbow!', when: 'Naming pictures' },
  { id: 'p-rocket', text: 'Rocket!', when: 'Naming pictures' },
  { id: 'p-duck', text: 'Duckie! Quack!', when: 'Naming pictures' },
  { id: 'p-dino', text: 'Dino! Roar!', when: 'Naming pictures' },
  { id: 'tapToPaint', text: 'Tap to paint!', when: 'Starting a picture' },
  { id: 'c-pink', text: 'Pink!', when: 'Naming colours' },
  { id: 'c-red', text: 'Red!', when: 'Naming colours' },
  { id: 'c-orange', text: 'Orange!', when: 'Naming colours' },
  { id: 'c-yellow', text: 'Yellow!', when: 'Naming colours' },
  { id: 'c-green', text: 'Green!', when: 'Naming colours' },
  { id: 'c-blue', text: 'Blue!', when: 'Naming colours' },
  { id: 'c-purple', text: 'Purple!', when: 'Naming colours' },
  { id: 'c-brown', text: 'Brown!', when: 'Naming colours' },
  { id: 'c-rainbow', text: 'Rainbow colours!', when: 'Naming colours' },
  { id: 'wow', text: 'Wow!', when: 'Cheering while painting' },
  { id: 'pretty', text: 'So pretty!', when: 'Cheering while painting' },
  { id: 'lovely', text: 'Lovely colours!', when: 'Cheering while painting' },
  { id: 'mixStart', text: "Let's mix a new colour! Tap the paint pots!", when: 'Mixing two colours before painting' },
  { id: 'mixStir', text: 'Stir it up! Tap the bowl!', when: 'Stirring the colours together' },
  { id: 'mix-orange', text: 'Red and yellow make orange!', when: 'The colours mixed' },
  { id: 'mix-green', text: 'Blue and yellow make green!', when: 'The colours mixed' },
  { id: 'mix-purple', text: 'Red and blue make purple!', when: 'The colours mixed' },
  { id: 'magic', text: 'Magic!', when: 'The magic star paints for you' },
  { id: 'done', text: 'You did it, {name}!', when: 'A picture is finished' },
  { id: 'alive', text: "Look! It's moving!", when: 'The picture comes alive' },
  { id: 'gallery', text: 'Your pictures!', when: 'Opening the gallery' },
  { id: 'galleryEmpty', text: "No pictures yet. Let's paint!", when: 'Gallery with no pictures yet' },
  { id: 'galleryNew', text: 'Look! Something new!', when: 'A gallery surprise unlocked' },
  { id: 'splat', text: 'Splat!', when: 'Tapping the gallery wall' },
  { id: 'yay', text: 'Yay!', when: 'Cheering' },
  { id: 'sticker', text: 'A sticker for your book!', when: 'Earning a sticker for the sticker book' },
];

export const voice = makeVoice({
  lines: [...LINES, ...TIMER_LINES],
  db: 'colour-splash-voice',
  sound,
  playerName,
  soundOn: () => save.sound,
});

export const { loadRecordings, hasRecording, stopSpeaking, sayText, say, sayAll } = voice;
