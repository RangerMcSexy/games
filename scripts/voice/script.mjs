// The recording script: every spoken line in all the games, numbered, with
// who's speaking and how to say it, for a grown-up to record in their own
// voice. Run `node scripts/voice/script.mjs` (add --pdf for a PDF too):
//
//   voice/script/recording-script.html  to read on screen or print
//   voice/script/recording-script.pdf   the same, as a PDF (with --pdf)
//   voice/script/recording-script.csv   a checklist, for a spreadsheet
//   voice/script/numbers.json           which number is which line
//
// Recordings named by their number (007.m4a, 123.wav...) go in
// voice/recorded/. The voice workflow (scripts/voice/generate.py) then uses
// them in place of the AI voice. numbers.json keeps the numbers working even
// if lines are added later: new lines get new numbers at the end.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = join(root, 'voice', 'script');
const unnamed = (text) => text.replace(/\{name\}'s\s*/g, '').replace(/,?\s*\{name\}/g, '');
const unq = (s) => s.replace(/\\(.)/g, '$1');

const GAMES = [
  ['butterfly-garden', 'Butterfly Garden'],
  ['bakery', 'Little Bakery'],
  ['colour-splash', 'Colour Splash'],
  ['fishing-pond', 'Little Fishing Pond'],
  ['leapy-pond', 'Leapy Pond'],
  ['unicorn-dash', 'Unicorn Dash'],
  ['ducky-bath', 'Ducky Bath'],
  ['postie-pip', 'Postie Pip'],
];

/** Who mostly talks in each game, and the feel of it. */
const GAME_NOTES = {
  'butterfly-garden': 'Gentle and full of wonder: a nature story told with a smile. Dot the ladybird helps along.',
  bakery: 'Busy and cheerful, like baking with a little one at the kitchen table. Pip the mouse is the chef; the animal customers speak their own lines.',
  'colour-splash': 'Bright and encouraging, like a craft table. Dot the puppy helps.',
  'fishing-pond': 'Calm and patient by the water, with excitement when something bites. Pip the penguin rows the boat.',
  'leapy-pond': 'Bouncy and playful: Hoppy the frog hops across a pond.',
  'unicorn-dash': 'Fast, sparkly and fun: Sparkle the unicorn gallops and jumps.',
  'ducky-bath': 'Splashy, silly bath-time fun with Ducky the rubber duck.',
  'postie-pip': 'Friendly and clear: Pip the penguin delivers parcels to letter friends. Letters and their sounds need to be very clear.',
};

// ---------------------------------------------------------------------------
// Collect the lines

const LINE_RE = /\{ id: '([^']+)', text: (['"])((?:\\.|(?!\2).)*)\2(?:, when: (['"])((?:\\.|(?!\4).)*)\4)? \}/g;
const read = (p) => readFileSync(join(root, p), 'utf8');

/** text → { text, id, where: [{ game, when }] } in order of first appearance. */
const all = new Map();
const add = (raw, id, game, when) => {
  const text = unnamed(raw);
  const named = raw !== text;
  if (!all.has(text)) all.set(text, { text, id, named, where: [] });
  const l = all.get(text);
  l.named ||= named;
  if (!l.where.some((w) => w.game === game && w.when === when)) l.where.push({ game, when });
};
for (const [game] of GAMES) {
  for (const m of read(`${game}/src/voice.ts`).matchAll(LINE_RE)) add(unq(m[3]), m[1], game, unq(m[5] ?? ''));
}
for (const m of read('shared/play-timer.ts').matchAll(LINE_RE)) add(unq(m[3]), m[1], 'timer', unq(m[5] ?? ''));
for (const m of read('home/book.js').matchAll(/\{ id: '([^']+)', text: '([^']*)' \}/g)) add(m[2], m[1], 'book', 'The sticker book');
for (const m of read('shared/stickers.ts').matchAll(/(name|hello): '([^']*)'/g)) add(m[2], m[1], 'book', m[1] === 'hello' ? 'The sticker book: a game’s page' : 'The sticker book: naming a sticker');

// ---------------------------------------------------------------------------
// How to say each line

const NUMBERS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const COLOURS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown', 'chocolate', 'rainbow'];

/** How to say each letter's sound (for the "S says sss" lines). */
const SOUNDS = {
  s: 'a long hiss, /sss/', a: 'the short a in “ant” (not “ay”)', t: 'a crisp, whispered /t/ (not “tuh”)', m: 'a long hum, /mmm/',
  p: 'a puff of air, /p/ (not “puh”)', o: 'the short o in “octopus” (not “oh”)', c: 'a hard, whispered /k/, like the start of “cat”',
  h: 'a breathy /h/, like fogging a window', d: 'a short /d/ (not “duh”)', f: 'a long /fff/, like a slow puncture',
  e: 'the short e in “elephant”', b: 'a short /b/, lips together (not “buh”)', r: 'a growly /rrr/', n: 'a long /nnn/',
  g: 'a short, throaty /g/ like in “goat” (not “jee”)', i: 'the short i in “iguana”', l: 'a long /lll/, tongue up',
  k: 'a whispered /k/ (the same as c)', u: 'like the word “you”, as in “unicorn”', j: 'a short /j/ (not “juh”)',
  w: 'a short /w/, lips rounded', z: 'a long buzzy /zzz/, like a bee', y: 'a short /y/, as in “yak”', v: 'a long buzzy /vvv/',
  q: '/kw/, as in “quail”', x: '/ks/, as at the end of “fox”',
};

/** Lines that a character says, rather than the narrator. */
const CHARACTERS = [
  [/^Hello! I'm Pip the postie!$|^Parcels for everyone!$|^Hi! I'm Pip!$/, 'Pip the penguin', 'Cheery and proud, a little puffed-up.'],
  [/^Hi! I'm Hoppy!$|^Ribbit!$/, 'Hoppy the frog', 'Bouncy and croaky, a bit of a frog voice.'],
  [/^Thank you, Pip!$/, 'A letter friend', 'Delighted to get a parcel.'],
  [/^I would like…$/, 'The customer', 'Thinking dreamily about cake, trailing off as the picture appears.'],
  [/^Please!$|^Just what I wanted!$|^Mmm! Yummy!$|^Thank you!$|^Bye-bye!$/, 'The customer', 'Happy and grateful, like a little animal who loves cake.'],
  [/^I'm (two|three|four|five)!/, 'The customer', 'Proudly telling their age (hold up fingers if it helps!), then asking nicely for the candles.'],
  [/^Can I have /, 'The caterpillar', 'A small, hopeful, hungry little voice. Stress the food.'],
  [/^I'm so full!|^Excuse me!$/, 'The caterpillar', 'Full and sleepy; “Excuse me!” comes after a burp, a bit embarrassed and giggly.'],
  [/^Mmm! Tasty!$|^Achoo! Bless you!$/, 'Pip the mouse chef', 'Silly and cheeky.'],
  [/^Hi! I'm Sparkle!$|^Neigh!$/, 'Sparkle the unicorn', 'Bright and sparkly; a happy little whinny for “Neigh!”.'],
  [/^Hello! I'm Ducky!$/, 'Ducky', 'Squeaky and cheerful, a rubber-duck voice.'],
];

/** More specific ways to say narrator lines, by what they say (or where they're heard). */
const KINDS = [
  [(t, w) => /Title screen|a game’s page/.test(w), 'Announcing the game’s name, excited, like the start of a show.'],
  [(t) => /^Egg, caterpillar, chrysalis, butterfly!/.test(t), 'Say the four steps slowly and clearly, like a little chant, then celebrate.'],
  [(t) => / make (orange|green|purple)!$/.test(t), 'Amazed, like a magic trick: build up to the new colour at the end and stress it.'],
  [(t) => /^The biggest!$/.test(t), 'Pleased, with “biggest” in a big, deep voice.'],
  [(t) => /^The smallest!$/.test(t), 'Pleased, with “smallest” in a small, squeaky voice.'],
  [(t) => /…$/.test(t), 'Hushed and patient, trailing off: something is about to happen.'],
  [(t) => /^(Quack|Neigh|Ribbit|Roar|Beep|Blub|Buzz|Moo|Glug|Squeak)|Quack!|Roar!|Beep beep!|wiggle!|Wiggle wiggle!/i.test(t), 'Have fun with the animal noise or sound effect: ham it up!'],
  [(t) => /^(Wheee|Boing|Jump|Up, up, up|Splish splash|Splat|Tick, tock|Ding|Pop|Slurp|Nibble nibble|Hop)!?/.test(t), 'A playful sound-effect word: bouncy, matching the action.'],
  [(t) => /^Hello, /.test(t), 'A warm hello, like greeting a friend at the door.'],
  [(t) => /^(Your |Here is your|Here are your|Dress up)/.test(t), 'Proud and inviting: showing them their collection.'],
  [(t) => /^(No |Nothing here|Nobody here)|empty/.test(t), 'Cheerful, not sad: empty just means it’s time to go and play.'],
  [(t) => /^(Look!|Something new|Another |More )/.test(t), 'Excited discovery: “look at this!”.'],
  [(t) => /^(Mmm|Yum)/.test(t), 'Yummy and satisfied, a happy “mmm”.'],
  [(t) => /^Peekaboo!$/.test(t), 'A giggly, playful “peekaboo!”, like finding someone hiding.'],
  [(t) => /^Pitter patter/.test(t), 'Light and pattery like raindrops, then delighted.'],
  [(t) => /^(Nearly there|Keep playing|The last parcel|Over the puddle|Bath time)/.test(t), 'Encouraging and excited: something good is coming.'],
  [(t) => /Hooray/.test(t), 'Big, genuine delight: smile while you say it.'],
  [(t) => /^(Oh no|Ooh)/.test(t), 'Big, playful surprise.'],
  [(t) => /(clean|lovely|pretty|Lovely|Magic|sparkly|every star|full!|You got one)/.test(t), 'Big, genuine delight: smile while you say it.'],
  [(t, w) => /Naming|Ducks$|Presents|naming a sticker|Pond friends/.test(w), 'Naming it with a big smile, like showing a picture in a book.'],
];

function direct(l) {
  const t = l.text;
  const ids = l.where.length;
  const tags = [];
  for (const [re, who, how] of CHARACTERS) if (re.test(t)) return { who, how };
  const say = (how) => ({ who: 'Narrator', how });
  // Letter names, sounds and capitals.
  if (/^[A-Z]!$/.test(t)) return say(`The letter’s NAME (“${t[0]}”), clear and bright, like pointing at it.`);
  const snd = t.match(/^([A-Z]) says /);
  if (snd) return say(`Letter name, then its SOUND: ${SOUNDS[snd[1].toLowerCase()]}. Keep the sound short and clean, then say the word warmly, stressing its first sound. Say it slowly, like teaching.`);
  if (/^Big [A-Z]! Find little [a-z]!$/.test(t)) return say('“Big” in a big, deep voice and “little” in a small, squeaky voice, to make it fun. The letter names clear.');
  if (/^[A-Z] is for /.test(t)) return say('Proud introduction, stressing the first sound of the animal (“S is for Sss-nake!”).');
  if (/^Find the letter /.test(t)) return say('Clear and inviting, the letter NAME stressed.');
  if (/^A parcel for /.test(t)) return say('Inviting, a little mysterious: who could it be for?');
  // Numbers and colours on their own.
  const word = t.replace(/[!.]/g, '').toLowerCase();
  if (NUMBERS.includes(word)) return say('Counting along, bright and clear, a little bounce. Keep the same energy for every number so they sound good in a row (one, two, three...).');
  if (COLOURS.includes(word)) return say('Naming the colour, bright and clear, a little pleased.');
  if (/^(Circle|Heart|Star|Square|Triangle)!$/.test(t)) return say('Naming the shape, clear and pleased.');
  if (/^(Cake|Cupcake|Cookie)!$/.test(t)) return say('Naming it, yummy and pleased.');
  // Gentle "not that one" lines.
  if (/^That one's |^That's number |^That's an? |^That's watermelon|^Those are |^Not in there|^Ooh, not that one/.test(t))
    return say('Kind and matter-of-fact: never disappointed. It’s just telling them what that one is. (The question is asked again straight after.)');
  // Questions and asks.
  const stress = [...NUMBERS, ...COLOURS, 'biggest', 'smallest', 'capital'].find((w) => new RegExp(`\\b${w}\\b`, 'i').test(t));
  const when = l.where.map((w) => w.when).join(' ');
  const kind = KINDS.find(([test]) => test(t, when));
  if (/\?|(^|[!?.] )(Find|Tap|Pop|Squeak|Hop|Crack|Shake|Pick|Catch|Can you|Stir|Blow|Close|Turn|Pull|Squeeze|Splash|Scrub|Knock|Let's|Jump|Drag|Wait)\b|^(Two|Three|Four|Five) shakes|^Pip wants/.test(t) && !kind)
    tags.push(`An invitation to do something: clear, warm and a little slower, so a 3-year-old can follow.${stress ? ` Stress “${stress}”.` : ''}`);
  else if (kind) tags.push(kind[1]);
  else if (/^(Yay|Wow|Hooray|Well done|You did it|Great job|Yippee|Woohoo)|You found every|You know every|Just what|The bucket is full|That's the one/.test(t))
    tags.push('Big, genuine delight: smile while you say it.');
  else if (/Night night|Shh|Time for a rest|Nearly time for a rest|nap|going down|Good morning/.test(t))
    tags.push('Soft and slow, a cosy bedtime voice.');
  else if (/Achoo|Whoops|Pee-yoo|silly|Silly|boot|sock|Whoa|Oh!|Uh oh|burp/.test(t)) tags.push('Playful and comic: ham it up!');
  else if (/^(A|An) /.test(t)) tags.push('Showing something off: “look what it is!”, happy and clear.');
  else tags.push('Warm, friendly and upbeat, like a kids’ TV presenter.');
  if (/!$/.test(t) && t.split(' ').length <= 2 && /^(Warm|Showing|Naming)/.test(tags[0])) tags.push('Short and punchy.');
  return say(tags.join(' '));
}

/** Record these first: they're heard the most, or the built-in voice can't do them well. */
function priority(l) {
  const t = l.text;
  if (/ says /.test(t)) return true;
  if (l.where.length > 1 || new Set(l.where.map((w) => w.game)).size > 1) return true;
  const word = t.replace(/[!.]/g, '').toLowerCase();
  return NUMBERS.includes(word) || COLOURS.includes(word) || /^(Yay|Wow|Well done|You did it)!?/.test(t);
}

// ---------------------------------------------------------------------------
// Number the lines (keeping the numbers already given out)

mkdirSync(out, { recursive: true });
const numbersPath = join(out, 'numbers.json');
const numbers = existsSync(numbersPath) ? JSON.parse(readFileSync(numbersPath, 'utf8')) : {};
const byText = new Map(Object.entries(numbers).map(([n, t]) => [t, Number(n)]));

// The order to record in: shared lines first (record once, used everywhere),
// then each game, then the sticker book and the play timer.
const lines = [...all.values()];
const sharedLine = (l) => new Set(l.where.map((w) => w.game)).size > 1;
const sections = [
  { key: 'shared', title: 'Shared lines', note: 'These are heard in several games, so they only need recording once. Start here.', lines: lines.filter(sharedLine) },
  ...GAMES.map(([g, title]) => ({ key: g, title, note: GAME_NOTES[g], lines: lines.filter((l) => !sharedLine(l) && l.where[0].game === g) })),
  { key: 'book', title: 'The sticker book', note: 'The sticker book on the games home page: excited, like showing off a collection.', lines: lines.filter((l) => !sharedLine(l) && l.where[0].game === 'book') },
  { key: 'timer', title: 'The play timer', note: 'Said when the grown-up’s play timer is nearly up and when it’s up. Soft and kind: ending playtime gently.', lines: lines.filter((l) => !sharedLine(l) && l.where[0].game === 'timer') },
];
let next = Math.max(0, ...byText.values()) + 1;
for (const s of sections) for (const l of s.lines) {
  if (!byText.has(l.text)) byText.set(l.text, next++);
  l.n = byText.get(l.text);
  Object.assign(l, direct(l), { first: priority(l) });
}
// Keep numbers for lines that have gone, so old recordings never get mixed up.
const keep = { ...numbers };
for (const [t, n] of byText) keep[n] = t;
writeFileSync(numbersPath, `${JSON.stringify(Object.fromEntries(Object.entries(keep).sort((a, b) => a[0] - b[0])), null, 2)}\n`);

const pad = (n) => String(n).padStart(3, '0');
const gameTitle = Object.fromEntries([...GAMES, ['timer', 'Play timer'], ['book', 'Sticker book']]);
const whereText = (l) => l.where.map((w) => (sharedLine(l) ? `${gameTitle[w.game]}${w.when ? `: ${w.when}` : ''}` : w.when)).filter(Boolean);
const total = sections.reduce((a, s) => a + s.lines.length, 0);
const firsts = lines.filter((l) => l.first).length;

// ---------------------------------------------------------------------------
// The CSV checklist

const csv = [['File', 'Line', 'Who', 'How to say it', 'Where it’s heard', 'Record first', 'Done']]
  .concat(sections.flatMap((s) => s.lines.map((l) => [pad(l.n), l.text, l.who, l.how, `${s.title}: ${whereText(l).join('; ')}`, l.first ? 'yes' : '', ''])))
  .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
  .join('\n');
writeFileSync(join(out, 'recording-script.csv'), `﻿${csv}\n`);

// ---------------------------------------------------------------------------
// The script, as a page to read or print

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const rows = (s) =>
  s.lines
    .map(
      (l) => `<tr class="${l.first ? 'first' : ''}">
  <td class="num">${pad(l.n)}</td>
  <td class="box"><span></span></td>
  <td><div class="say">${esc(l.text)}</div>${l.named ? '<div class="nm">Said with the child’s name in the built-in voice; record it without.</div>' : ''}<div class="where">${esc(whereText(l).join(' · '))}</div></td>
  <td><div class="who">${esc(l.who)}${l.first ? ' <b class="star">★ first</b>' : ''}</div><div class="how">${esc(l.how)}</div></td>
</tr>`,
    )
    .join('\n');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Recording Script</title>
<style>
  :root { --ink: #3d2f55; --soft: #7a6a8a; --line: #e9e0f2; --gold: #f5b82e; --bg: #fffdf9; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.45 system-ui, -apple-system, 'Segoe UI', sans-serif; }
  main { max-width: 980px; margin: 0 auto; padding: 28px 16px 60px; }
  h1 { font-size: 30px; margin: 0 0 4px; }
  h2 { font-size: 22px; margin: 36px 0 4px; padding-top: 10px; border-top: 3px solid var(--line); break-after: avoid; }
  h3 { font-size: 16px; margin: 20px 0 6px; }
  p, li { color: #4b3d63; }
  .lead { font-size: 17px; color: var(--soft); margin: 0 0 18px; }
  .card { background: #fff; border: 2px solid var(--line); border-radius: 14px; padding: 14px 18px; margin: 14px 0; break-inside: avoid; }
  .card ul { margin: 6px 0; padding-left: 20px; }
  .note { color: var(--soft); margin: 2px 0 10px; }
  table { width: 100%; border-collapse: collapse; }
  tr { break-inside: avoid; }
  td { vertical-align: top; padding: 9px 8px; border-bottom: 1px solid var(--line); }
  td.num { font: 700 15px ui-monospace, Menlo, Consolas, monospace; color: var(--soft); width: 44px; padding-top: 11px; }
  td.box { width: 30px; padding-top: 11px; }
  td.box span { display: inline-block; width: 16px; height: 16px; border: 2px solid #b9a8cf; border-radius: 4px; }
  td:nth-child(3) { width: 46%; }
  .say { font-size: 18px; font-weight: 700; color: var(--ink); }
  .nm { font-size: 12px; color: #a0612a; margin-top: 2px; }
  .where { font-size: 12px; color: var(--soft); margin-top: 3px; }
  .who { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: #8a6cc4; }
  .how { font-size: 14px; margin-top: 2px; }
  .star { color: #b07a00; background: #fff2c9; border-radius: 6px; padding: 0 5px; font-size: 11px; text-transform: none; letter-spacing: 0; }
  tr.first td.num { color: #b07a00; }
  .toc { columns: 2; padding-left: 20px; }
  code { background: #f3edf9; padding: 1px 5px; border-radius: 5px; }
  @media (max-width: 640px) {
    td:nth-child(4) { display: block; width: auto; border-bottom: 0; padding-top: 0; }
    tr { display: grid; grid-template-columns: 44px 30px 1fr; border-bottom: 1px solid var(--line); }
    td { border-bottom: 0; }
    td:nth-child(4) { grid-column: 3; }
    td:nth-child(3) { width: auto; }
    .toc { columns: 1; }
  }
  @media print {
    body { font-size: 12px; background: #fff; }
    main { padding: 0; max-width: none; }
    h2 { break-before: page; border-top: 0; }
    .say { font-size: 15px; }
    td { padding: 6px; }
  }
  @page { margin: 14mm 12mm; }
</style></head>
<body><main>
<h1>Recording Script</h1>
<p class="lead">Every line the games say: ${total} lines across 8 games, the sticker book and the play timer. ${firsts} of them are marked <b class="star">★ first</b>: record those first.</p>

<div class="card">
<h3>Who you are</h3>
<p>You’re the friendly grown-up voice of the games: think of a warm, playful children’s TV presenter talking to one 3- or 4-year-old sitting right next to you. Smile while you talk (it can be heard). Be clear and a little slower than normal, but never babyish or sing-song. A few lines belong to characters (a hungry caterpillar, animal customers, Pip the penguin): the “Who” column says so. A small change of voice is plenty; you don’t need to do impressions.</p>
<h3>How to record</h3>
<ul>
<li><b>One file per line,</b> named with the line’s number: <code>001.m4a</code>, <code>002.m4a</code> and so on. Any format is fine: a phone’s voice memos (.m4a), .wav, .mp3.</li>
<li><b>A quiet room</b> with soft things around (a bedroom with curtains and a duvet is better than a kitchen). Turn off fans and the TV.</li>
<li><b>Phone about a hand’s width from your mouth,</b> a little to the side so your breath doesn’t pop. Keep the same distance and loudness for every line.</li>
<li><b>Leave a moment of silence</b> before and after each line. The silence is trimmed off and the loudness is evened out afterwards.</li>
<li><b>Say each line exactly as written.</b> Lines that end with “!” are excited; “?” goes up at the end; “…” trails off.</li>
<li><b>Leave out the child’s name.</b> Some lines (like “Well done!”) say the child’s name in the built-in voice. A recording plays for every child, so record them just as written here. (Recording in a game’s grown-up settings on your own device is the exception: there you can say the name.)</li>
<li><b>Mistakes are fine:</b> just record that line again and keep the better take.</li>
<li><b>Short on time?</b> Record the ★ lines first: they’re heard the most, or the built-in voice can’t say them well (like the letter sounds).</li>
</ul>
<h3>Quicker with a laptop</h3>
<p>Recording ${total} separate phone files takes a while. With <a href="https://www.audacityteam.org">Audacity</a> (free), record one long take reading the lines in order with a pause between them. Then put a label at the start of each line (<b>Ctrl+B</b>, or <b>⌘B</b> on a Mac) and type its number as the label. <b>File → Export → Export Multiple</b>, split by labels and named by label, makes all the numbered files in one go.</p>
<h3>When you’re done</h3>
<p>The numbered files go in the games’ <code>voice/recorded/</code> folder (on GitHub: open the folder, then <b>Add file → Upload files</b>). The games then use your voice for every line you’ve recorded, and the AI voice for the rest. You can do it in batches. Each one just adds to or replaces what’s there.</p>
<p>You can also record lines one at a time on a device, in any game’s grown-up settings (hold the gear for 3 seconds). Those recordings stay on that device only.</p>
</div>

<div class="card"><h3>Sections</h3><ol class="toc">${sections
  .filter((s) => s.lines.length)
  .map((s) => `<li>${esc(s.title)} (${s.lines.length})</li>`)
  .join('')}</ol></div>

${sections
  .filter((s) => s.lines.length)
  .map((s) => `<h2>${esc(s.title)}</h2><p class="note">${esc(s.note)}</p><table>${rows(s)}</table>`)
  .join('\n')}
</main></body></html>
`;
writeFileSync(join(out, 'recording-script.html'), html);
console.log(`${total} lines (${firsts} to record first) written to voice/script/`);

if (process.argv.includes('--pdf')) {
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`file://${join(out, 'recording-script.html')}`);
  await page.pdf({
    path: join(out, 'recording-script.pdf'),
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: '<div style="font:9px system-ui;color:#7a6a8a;width:100%;text-align:center">Recording Script · page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
    margin: { top: '14mm', bottom: '16mm', left: '12mm', right: '12mm' },
  });
  await browser.close();
  console.log('and as a PDF: voice/script/recording-script.pdf');
}
