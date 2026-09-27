// The spoken lines: every line a game asks for by name exists, and the
// natural-voice clips on disk match voice/manifest.json.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BOOK } from '../shared/stickers';
import { unnamed } from '../shared/voice';

const root = new URL('../', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');

/** A game's lines, read the same way scripts/voice/lines.mjs reads them. */
function lines(game: string) {
  const src = read(`${game}/src/voice.ts`);
  return [...src.matchAll(/\{ id: '([^']+)', text: (['"])((?:\\.|(?!\2).)*)\2/g)].map((m) => ({ id: m[1], text: m[3].replace(/\\(.)/g, '$1') }));
}

/**
 * The quoted line ids in each call that says a line: say(...), sayAll(...),
 * and the talk/speak/chirp helpers some games wrap them in.
 */
function idsAskedFor(game: string) {
  const out: { id: string; file: string; line: number }[] = [];
  const dir = new URL(`${game}/src/`, root);
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.ts'))) {
    const src = readFileSync(new URL(file, dir), 'utf8');
    for (const m of src.matchAll(/\b(?:say|sayAll|talk|speak|chirp)\(/g)) {
      // The call's arguments, up to its closing bracket.
      let depth = 1;
      let end = m.index! + m[0].length;
      while (depth && end < src.length) {
        const c = src[end++];
        if (c === '(') depth++;
        else if (c === ')') depth--;
      }
      const args = src.slice(m.index! + m[0].length, end - 1);
      const line = src.slice(0, m.index).split('\n').length;
      for (const q of args.matchAll(/'([^']*)'/g)) out.push({ id: q[1], file, line });
    }
  }
  return out;
}

describe.each(BOOK.map((p) => p.game))('%s', (game) => {
  it('has lines, each with its own id', () => {
    const ids = lines(game).map((l) => l.id);
    expect(ids.length).toBeGreaterThan(10);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  it('only asks for lines that exist', () => {
    const known = new Set(lines(game).map((l) => l.id));
    const asked = idsAskedFor(game);
    expect(asked.length).toBeGreaterThan(10);
    const missing = asked.filter((a) => !known.has(a.id)).map((a) => `'${a.id}' (${a.file}:${a.line})`);
    expect(missing).toEqual([]);
  });
});

describe('voice clips', () => {
  const manifest = JSON.parse(read('voice/manifest.json')) as { clips: Record<string, string> };

  it('has every clip the manifest lists', () => {
    const gone = Object.values(manifest.clips).filter((f) => !existsSync(new URL(`voice/${f}`, root)));
    expect(gone).toEqual([]);
  });

  it('has a clip for every line (new lines get one after merging)', () => {
    // Clips are made on main by the "Make voice clips" workflow, so a new
    // line has none yet on its pull request: warn rather than fail.
    const texts = new Set(BOOK.flatMap((p) => lines(p.game).map((l) => unnamed(l.text))));
    const without = [...texts].filter((t) => !manifest.clips[t]);
    if (without.length) console.warn(`${without.length} line(s) have no voice clip yet:\n  ${without.join('\n  ')}`);
  });
});
