// This game's spoken lines. How they're spoken (a grown-up's recording, a
// natural-voice clip or the device's voice) is in shared/voice.ts.
import { makeVoice, type Line } from '../../shared/voice';
import { sound } from './audio';
import { playerName, save } from './data';

export const LINES: Line[] = [
  { id: 'title', text: "{name}'s Little Fishing Pond!", when: 'Title screen' },
  { id: 'letsFish', text: "Let's go fishing, {name}!", when: 'Pressing play' },
  { id: 'tapWater', text: 'Tap the water!', when: 'Waiting to cast' },
  { id: 'wait', text: 'Wait for a nibble…', when: 'The line is in the water' },
  { id: 'nibble', text: 'Nibble nibble!', when: 'Something is nibbling' },
  { id: 'bite', text: 'You got one! Tap tap!', when: 'A fish is on the hook' },
  { id: 'tapTap', text: 'Tap tap!', when: 'Reminder to reel in' },
  { id: 'f-gold', text: 'A goldfish!', when: 'Naming the fish' },
  { id: 'f-blue', text: 'A blue fish!', when: 'Naming the fish' },
  { id: 'f-red', text: 'A red fish!', when: 'Naming the fish' },
  { id: 'f-purple', text: 'A purple fish!', when: 'Naming the fish' },
  { id: 'f-spotty', text: 'A spotty fish!', when: 'Naming the fish' },
  { id: 'f-stripy', text: 'A stripy fish!', when: 'Naming the fish' },
  { id: 'f-rainbow', text: 'A rainbow fish!', when: 'Naming the fish' },
  { id: 'f-puffer', text: 'A puffer fish! Puff!', when: 'Naming the fish' },
  { id: 'f-cat', text: 'A whiskery catfish!', when: 'Naming the fish' },
  { id: 'f-tiny', text: 'A teeny tiny fish!', when: 'Naming the fish' },
  { id: 'f-crab', text: 'A crab! Snap snap!', when: 'Naming the fish' },
  { id: 'f-glow', text: 'A glowing fish!', when: 'Naming the fish (night only)' },
  { id: 's-boot', text: 'Oh! An old boot!', when: 'Silly catches' },
  { id: 's-duck', text: 'A rubber duckie! Squeak!', when: 'Silly catches' },
  { id: 's-teapot', text: 'A teapot! How silly!', when: 'Silly catches' },
  { id: 's-sock', text: 'A stinky sock! Pee-yoo!', when: 'Silly catches' },
  { id: 's-crown', text: 'A shiny crown!', when: 'Silly catches' },
  { id: 's-hat', text: 'A funny hat!', when: 'Silly catches' },
  { id: 'newFish', text: 'A new one!', when: 'Catching a fish for the first time' },
  { id: 'allFish', text: 'You found every fish, {name}!', when: 'All 12 fish caught' },
  { id: 'yay', text: 'Yay!', when: 'Cheering' },
  { id: 'wow', text: 'Wow!', when: 'Cheering' },
  { id: 'wellDone', text: 'Well done, {name}!', when: 'Cheering' },
  { id: 'w-day', text: 'Good morning, sunshine!', when: 'The sun comes out' },
  { id: 'w-rain', text: 'Pitter patter! It\'s raining!', when: 'It starts to rain' },
  { id: 'w-sunset', text: 'The sun is going down.', when: 'Sunset' },
  { id: 'w-night', text: 'Night night! Look at the moon!', when: 'Night time' },
  { id: 'frog', text: 'Ribbit!', when: 'Tapping the frog' },
  { id: 'duck', text: 'Quack quack!', when: 'Tapping the duck' },
  { id: 'turtle', text: 'Hello, turtle!', when: 'Tapping the turtle' },
  { id: 'pip', text: "Hi! I'm Pip!", when: 'Tapping Pip the penguin' },
  { id: 'aquarium', text: 'Your fish!', when: 'Opening the fish tank' },
  { id: 'aquariumEmpty', text: "No fish yet. Let's go fishing!", when: 'Fish tank with no fish yet' },
  { id: 'aquariumNew', text: 'Look! Something new!', when: 'A fish tank surprise unlocked' },
  { id: 'yum', text: 'Yum yum!', when: 'Feeding the fish' },
  { id: 'sticker', text: 'A sticker for your book!', when: 'Earning a sticker for the sticker book' },
];

export const voice = makeVoice({
  lines: LINES,
  db: 'fishing-pond-voice',
  sound,
  playerName,
  soundOn: () => save.sound,
});

export const { loadRecordings, hasRecording, stopSpeaking, sayText, say, sayAll } = voice;
