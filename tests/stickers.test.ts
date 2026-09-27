// The sticker book: its list of stickers, and when a game has earned them.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PAGES } from '../home/stickers';
import { newStickers } from '../shared/sticker-moment';
import { BOOK, BOOK_KEY } from '../shared/stickers';

const GAMES = JSON.parse(
  readFileSync(new URL('../scripts/build-site.mjs', import.meta.url), 'utf8')
    .match(/const GAMES = (\[.*?\]);/)![1]
    .replace(/'/g, '"'),
) as string[];

/** Pretends the game has collected `n` things. */
function collect(game: string, n: number) {
  const page = BOOK.find((p) => p.game === game)!;
  localStorage.setItem(page.key, JSON.stringify({ [page.count]: Array.from({ length: n }, (_, i) => `thing${i}`) }));
}

const setBook = (book: object) => localStorage.setItem(BOOK_KEY, JSON.stringify(book));

describe('the book', () => {
  it('has a page for every game, in the same order as the home page', () => {
    expect(BOOK.map((p) => p.game)).toEqual(GAMES);
  });

  it('has four stickers on every page, earned at 1 and then further on', () => {
    for (const page of BOOK) {
      const at = page.stickers.map((s) => s.at);
      expect(at, page.game).toHaveLength(4);
      expect(at[0], page.game).toBe(1);
      expect(at, page.game).toEqual([...at].sort((a, b) => a - b));
      expect(new Set(at).size, page.game).toBe(4);
    }
  });

  it('never uses the same sticker twice', () => {
    const ids = BOOK.flatMap((p) => p.stickers.map((s) => s.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has a picture for every sticker', () => {
    for (const page of PAGES)
      for (const s of page.stickers) {
        expect(s.svg, s.id).toBeTypeOf('function');
        expect(s.svg(), s.id).toMatch(/^<svg[\s>]/);
      }
  });
});

describe('earning stickers', () => {
  const page = BOOK[0];
  const ids = page.stickers.map((s) => s.id);

  it('earns nothing before anything is collected', () => {
    expect(newStickers(page.game)).toEqual([]);
    collect(page.game, 0);
    expect(newStickers(page.game)).toEqual([]);
  });

  it('earns each sticker exactly when enough is collected', () => {
    for (const [i, s] of page.stickers.entries()) {
      collect(page.game, s.at - 1);
      expect(newStickers(page.game)).toEqual(ids.slice(0, i));
      collect(page.game, s.at);
      expect(newStickers(page.game)).toEqual(ids.slice(0, i + 1));
    }
  });

  it('counts a collection saved as named counts, like the fish tank', () => {
    localStorage.setItem('fishing-pond.v1', JSON.stringify({ caught: { goldfish: 4, clownfish: 1, crab: 2 } }));
    expect(newStickers('fishing-pond')).toEqual(['goldfish', 'turtle']);
  });

  it('does not show a sticker again once it has been shown or stuck in', () => {
    collect(page.game, 99);
    setBook({ told: [ids[0]], stuck: [ids[1]] });
    expect(newStickers(page.game)).toEqual(ids.slice(2));
  });

  it('copes with a damaged sticker book or game save', () => {
    collect(page.game, 1);
    localStorage.setItem(BOOK_KEY, '{oops');
    expect(newStickers(page.game)).toEqual([ids[0]]);
    setBook({ told: 'x', stuck: [null, 4] });
    expect(newStickers(page.game)).toEqual([ids[0]]);
    localStorage.setItem(page.key, 'nope');
    expect(newStickers(page.game)).toEqual([]);
  });

  it('knows nothing about a game that is not in the book', () => {
    expect(newStickers('not-a-game')).toEqual([]);
  });
});
