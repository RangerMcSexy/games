// This game's spoken lines. How they're spoken (a grown-up's recording, a
// natural-voice clip or the device's voice) is in shared/voice.ts.
import { makeVoice, type Line } from '../../shared/voice';
import { sound } from './audio';
import { playerName, save } from './data';

export const LINES: Line[] = [
  { id: 'title', text: "{name}'s Butterfly Garden!", when: 'Title screen' },
  { id: 'letsGo', text: "Let's grow a butterfly, {name}!", when: 'Pressing play' },
  { id: 'pickEgg', text: 'Pick an egg!', when: 'Choosing an egg' },
  { id: 'tapEgg', text: 'Tap, tap, tap the egg!', when: 'Egg is ready to hatch' },
  { id: 'achoo', text: 'Achoo! Bless you, egg!', when: 'Silly: the egg sneezes' },
  { id: 'hello', text: 'Hello, little caterpillar!', when: 'Caterpillar hatches' },
  { id: 'hungry', text: 'The caterpillar is hungry! Tap some yummy food!', when: 'Feeding starts' },
  { id: 'sparkly', text: 'Ooh, sparkly!', when: 'Eating the rare golden leaf' },
  { id: 'full', text: "I'm so full! Time for a nap.", when: 'Done eating' },
  { id: 'burp', text: 'Excuse me!', when: 'Silly: the caterpillar burps' },
  { id: 'wrap', text: 'Tap to wrap it up!', when: 'Making the chrysalis' },
  { id: 'sticker', text: 'Pick a sticker!', when: 'Decorating the chrysalis' },
  { id: 'night', text: 'Shh. Night night! Tap the stars.', when: 'Night time' },
  { id: 'shootingStar', text: 'A shooting star! Make a wish!', when: 'Silly: shooting star at night' },
  { id: 'morning', text: 'Good morning! Something is wiggling! Tap, tap, tap!', when: 'Morning, ready to hatch' },
  { id: 'wow', text: 'Wow! A beautiful butterfly!', when: 'Butterfly appears' },
  { id: 'goodJob', text: 'Great job, {name}!', when: 'After the butterfly appears' },
  { id: 'newOne', text: 'A new one for your book!', when: 'A new kind of butterfly' },
  { id: 'bookDone', text: 'You filled your whole butterfly book! Hooray, {name}!', when: 'Book complete' },
  { id: 'garden', text: 'Your butterfly garden!', when: 'Opening the garden' },
  { id: 'gardenEmpty', text: "Your garden is empty. Let's grow a butterfly!", when: 'Garden with no butterflies' },
  { id: 'gardenNew', text: 'Look! Something new in the garden!', when: 'A garden surprise unlocked' },
  { id: 'nectar', text: 'Mmm, yummy nectar!', when: 'Feeding a butterfly a flower' },
  { id: 'dragFlower', text: 'Drag a flower to feed the butterflies!', when: 'Garden tip' },
  { id: 'nightGarden', text: 'Night night, garden!', when: 'Garden switched to night' },
  { id: 'dayGarden', text: 'Good morning, garden!', when: 'Garden switched to day' },
  { id: 'book', text: 'Your butterfly book!', when: 'Opening the book' },
  { id: 'yay', text: 'Yay!', when: 'Dot the ladybug cheering' },
  { id: 'n1', text: 'One!', when: 'Counting' },
  { id: 'n2', text: 'Two!', when: 'Counting' },
  { id: 'n3', text: 'Three!', when: 'Counting' },
  { id: 'n4', text: 'Four!', when: 'Counting' },
  { id: 'n5', text: 'Five!', when: 'Counting' },
  { id: 'bookSticker', text: 'A sticker for your book!', when: 'Earning a sticker for the sticker book' },
];

export const voice = makeVoice({
  lines: LINES,
  db: 'butterfly-garden-voice',
  sound,
  playerName,
  soundOn: () => save.sound,
});

export const { loadRecordings, hasRecording, stopSpeaking, sayText, say, sayAll } = voice;
