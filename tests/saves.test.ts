// Each game's save: what it starts with, what survives a reload, and what
// happens when the saved data is damaged or from an older version. Also checks
// that the sticker book can count what each game saves.
import { describe, expect, it, vi } from 'vitest';
import { BOOK } from '../shared/stickers';
import { newStickers } from '../shared/sticker-moment';

/** Collects three things through the game's own functions. */
const COLLECT: Record<string, (data: any) => void> = {
  'butterfly-garden': (d) => {
    for (const [i, shape] of ['round', 'pointy', 'heart'].entries())
      d.addButterfly({ id: `b${i}`, shape, pattern: 'dots', foods: ['strawberry', 'pear'], golden: false, created: i });
  },
  bakery: (d) => {
    for (let i = 0; i < 3; i++)
      d.addTreat({ id: `t${i}`, kind: 'cake', shape: 'heart', batter: 'pink', icing: 'blue', sprinkles: 2, topper: 'cherry', customer: 'bear', wished: true, created: i });
  },
  'colour-splash': (d) => {
    for (let i = 0; i < 3; i++) d.addPainting({ id: `p${i}`, pic: 'fish', fills: { body: 'blue' }, created: i });
  },
  'fishing-pond': (d) => {
    for (const f of d.FISH.slice(0, 3)) d.addCatch('fish', f.id);
  },
  'leapy-pond': (d) => {
    for (let i = 0; i < 3; i++) d.finishTrip(d.nextFriend().friend);
  },
  'unicorn-dash': (d) => {
    for (let i = 0; i < 3; i++) d.finishDash(d.nextItem().item);
  },
  'ducky-bath': (d) => {
    for (let i = 0; i < 3; i++) d.finishBath(d.nextItem().item);
  },
  'postie-pip': (d) => {
    for (const f of d.FRIENDS.slice(0, 3)) d.finishRound(f);
  },
};

/** Loads the game's data module afresh, as opening the game would. */
async function open(game: string) {
  vi.resetModules();
  return import(`../${game}/src/data.ts`);
}

const size = (v: unknown) => (Array.isArray(v) ? v.length : v && typeof v === 'object' ? Object.keys(v).length : NaN);

describe.each(BOOK)('$title', (page) => {
  it('starts empty, with sound and music on', async () => {
    const { save } = await open(page.game);
    expect(size(save[page.count])).toBe(0);
    expect(save.sound).toBe(true);
    expect(save.music).toBe(true);
  });

  it('keeps what was collected after the game is opened again', async () => {
    const first = await open(page.game);
    COLLECT[page.game](first);
    expect(size(first.save[page.count])).toBe(3);
    const collected = structuredClone(first.save[page.count]);

    const again = await open(page.game);
    expect(again.save[page.count]).toEqual(collected);
  });

  it('keeps the sound and music switches', async () => {
    const first = await open(page.game);
    first.save.sound = false;
    first.save.music = false;
    first.persist();

    const { save } = await open(page.game);
    expect(save.sound).toBe(false);
    expect(save.music).toBe(false);
  });

  it('saves where the sticker book looks for it', async () => {
    COLLECT[page.game](await open(page.game));
    const stored = JSON.parse(localStorage.getItem(page.key)!);
    expect(size(stored[page.count])).toBe(3);
    // Three things earn the first two stickers.
    const earned = page.stickers.filter((s) => s.at <= 3).map((s) => s.id);
    expect(earned.length).toBeGreaterThan(0);
    expect(newStickers(page.game)).toEqual(earned);
  });

  it('starts empty if the save is unreadable', async () => {
    localStorage.setItem(page.key, '{not json');
    const { save } = await open(page.game);
    expect(size(save[page.count])).toBe(0);
  });

  it('drops damaged things from an old or broken save', async () => {
    const first = await open(page.game);
    COLLECT[page.game](first);
    const good = structuredClone(first.save[page.count]);
    const stored = JSON.parse(localStorage.getItem(page.key)!);
    const junk = [null, 'nonsense', 42, {}, ['x']];
    stored[page.count] = Array.isArray(good) ? [...good, ...junk] : { ...good, nonsense: 3, bad: 'x', worse: null };
    localStorage.setItem(page.key, JSON.stringify(stored));

    const { save } = await open(page.game);
    expect(save[page.count]).toEqual(good);
  });

  it('starts empty if the collection has the wrong type', async () => {
    for (const wrong of ['x', 7, null, true]) {
      localStorage.setItem(page.key, JSON.stringify({ [page.count]: wrong }));
      const { save } = await open(page.game);
      expect(size(save[page.count])).toBe(0);
    }
  });
});
