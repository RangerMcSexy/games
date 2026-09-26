// Collects every spoken line from the four games into voice/lines.json, the
// list scripts/voice/generate.py turns into audio clips.
//
// Lines are keyed by what they say, with the child's name left out, exactly
// as the games look them up (see `unnamed` in each game's src/voice.ts).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GAMES = ['butterfly-garden', 'bakery', 'colour-splash', 'fishing-pond'];
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const unnamed = (text) => text.replace(/\{name\}'s\s*/g, '').replace(/,?\s*\{name\}/g, '');

const texts = new Set();
for (const game of GAMES) {
  const src = readFileSync(join(root, game, 'src', 'voice.ts'), 'utf8');
  for (const m of src.matchAll(/\{ id: '[^']+', text: (['"])((?:\\.|(?!\1).)*)\1/g)) {
    texts.add(unnamed(m[2].replace(/\\(.)/g, '$1')));
  }
}

const lines = [...texts].sort();
writeFileSync(join(root, 'voice', 'lines.json'), `${JSON.stringify(lines, null, 2)}\n`);
console.log(`${lines.length} lines written to voice/lines.json`);
