// Postie Pip's letters: when a new one comes along, and how sure the child
// is of each one.
import { describe, expect, it, vi } from 'vitest';

async function open() {
  vi.resetModules();
  return import('../postie-pip/src/data.ts');
}

describe('Postie Pip', () => {
  it('starts with the first letter, s', async () => {
    const d = await open();
    expect(d.nextNew()?.letter).toBe('s');
  });

  it('brings the first two letters straight away', async () => {
    const d = await open();
    d.finishRound(d.nextNew());
    expect(d.nextNew()?.letter).toBe('a');
  });

  it('waits for the letters so far to be got right before a new one', async () => {
    const d = await open();
    d.finishRound(d.nextNew());
    d.finishRound(d.nextNew());
    expect(d.save.letters).toEqual(['s', 'a']);
    // Not sure of either yet.
    expect(d.nextNew()).toBeNull();
    for (const l of ['s', 'a']) {
      d.record(l, true);
      d.record(l, true);
    }
    expect(d.nextNew()?.letter).toBe('t');
  });

  it('brings a new letter anyway after two rounds without one', async () => {
    const d = await open();
    d.finishRound(d.nextNew());
    d.finishRound(d.nextNew());
    d.finishRound(null);
    expect(d.nextNew()).toBeNull();
    d.finishRound(null);
    expect(d.nextNew()?.letter).toBe('t');
  });

  it('counts a wrong door first against a letter, down to nothing', async () => {
    const d = await open();
    d.record('s', true);
    d.record('s', true);
    d.record('s', true);
    expect(d.scoreOf('s')).toBe(3);
    d.record('s', false);
    expect(d.scoreOf('s')).toBe(1);
    d.record('s', false);
    expect(d.scoreOf('s')).toBe(0);
    for (let i = 0; i < 9; i++) d.record('s', true);
    expect(d.scoreOf('s')).toBe(d.MAX_SCORE);
  });

  it('keeps the scores, and drops damaged ones', async () => {
    const d = await open();
    d.record('s', true);
    const stored = JSON.parse(localStorage.getItem('postie-pip.v1')!);
    stored.scores = { ...stored.scores, zz: 3, a: 'x', t: -1, m: 99 };
    localStorage.setItem('postie-pip.v1', JSON.stringify(stored));
    const again = await open();
    expect(again.save.scores).toEqual({ s: 1, m: again.MAX_SCORE });
  });

  it('has a letter drawn, a house and a friend for all twelve, in the order they come', async () => {
    const d = await open();
    const { STROKES } = await import('../postie-pip/src/art.ts');
    expect(d.FRIENDS).toHaveLength(12);
    for (const f of d.FRIENDS) {
      expect(STROKES[f.letter], f.letter).toBeDefined();
      expect(f.animal[0], f.animal).toBe(f.letter);
    }
    // b, d and p, easy to mix up, never come one after another.
    const order = d.FRIENDS.map((f) => f.letter);
    for (let i = 1; i < order.length; i++) expect(d.lookAlike(order[i - 1], order[i])).toBe(false);
  });
});
