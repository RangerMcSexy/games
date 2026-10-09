// Opens every game in a real browser and plays the first moments: skip the
// name card, press play, wait for the helping hand, and open the grown-up
// settings. Also checks the home-screen icon gets drawn. Any error on the page fails the test.
import { expect, test, type Page } from '@playwright/test';
import { BOOK } from '../shared/stickers';

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return errors;
}

for (const { game, title } of BOOK) {
  test(`${title} starts and plays`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(`/${game}/`);

    // The icon for "Add to Home Screen" is drawn when the game opens.
    await expect(page.locator('link[rel="apple-touch-icon"]')).toBeAttached();
    const icon = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
    expect(icon).toMatch(/^data:image\/png;base64,.{2000,}/);

    await page.locator('.ask-skip').click();
    const home = page.locator('.home-btn');
    await expect(home).toHaveAttribute('aria-label', 'All games');
    // The play button bounces, so don't wait for it to hold still.
    await page.locator('.play-btn').click({ force: true });
    // Nobody taps: the helping hand comes to show what to do.
    await expect(page.locator('.hint-hand')).toBeAttached({ timeout: 15_000 });

    // Grown-up settings open after holding the gear for 3 seconds.
    const gear = (await page.locator('.gear-btn').boundingBox())!;
    await page.mouse.move(gear.x + gear.width / 2, gear.y + gear.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(3300);
    await page.mouse.up();
    await expect(page.locator('.settings')).toBeVisible();
    await expect(page.locator('.line-row').first()).toBeVisible();
    await expect(page.locator('.set-count:not(.set-left)')).toHaveText(/^0 of \d+ lines recorded$/);
    await page.locator('.settings .close-btn').click();
    await expect(page.locator('.settings')).toHaveCount(0);

    // Home goes back to the title screen.
    await expect(home).toHaveAttribute('aria-label', 'Home');
    await home.dispatchEvent('pointerdown');
    await expect(page.locator('.title-scene')).toBeAttached();
    await expect(home).toHaveAttribute('aria-label', 'All games');

    expect(errors).toEqual([]);
  });
}

test('the home page links to every game and shows a newly earned sticker', async ({ page }) => {
  const errors = watchErrors(page);
  // One butterfly grown: the first sticker is waiting to be stuck in.
  const first = BOOK[0];
  await page.addInitScript(({ key, count }) => localStorage.setItem(key, JSON.stringify({ [count]: [{}] })), first);
  await page.goto('/');
  for (const { game } of BOOK) await expect(page.locator(`a.game[href*="${game}"]`)).toBeAttached();

  await page.locator('.ask-skip').click();
  await expect(page.locator('.book-tile')).toHaveClass(/has-new/);
  await page.locator('.book-tile').click();
  await expect(page.locator('.b-page')).toBeVisible();
  await expect(page.locator('.b-spots > *')).toHaveCount(4);
  await expect(page.locator('.b-spots .waiting')).toHaveCount(1);

  expect(errors).toEqual([]);
});

test('the helping hand never gives the answer away before a try', async ({ page }) => {
  const errors = watchErrors(page);
  // A few letters learned and a few rounds played: three doors to choose from.
  await page.addInitScript(() => {
    localStorage.setItem('games.name', '');
    localStorage.setItem('postie-pip.v1', JSON.stringify({ letters: ['s', 'a', 't'], scores: { s: 1, a: 1, t: 1 }, rounds: 3 }));
  });
  await page.goto('/postie-pip/');
  await page.locator('.play-btn').click({ force: true });
  const parcel = page.locator('.parcel.bob[data-for]');
  await expect(parcel).toBeAttached({ timeout: 20_000 });
  const want = await parcel.getAttribute('data-for');
  const houses = page.locator('.house.live');
  await expect(houses).toHaveCount(3);

  /** Which house the hand is over right now. */
  const handOver = () =>
    page.evaluate(() => {
      const hand = document.querySelector('.hint-hand.show');
      if (!hand) return null;
      const r = hand.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const house = [...document.querySelectorAll<HTMLElement>('.house')].find((h) => {
        const b = h.getBoundingClientRect();
        return x > b.left && x < b.right;
      });
      return house?.dataset.letter ?? null;
    });

  // Nobody taps: the hand goes from door to door.
  const visited = new Set<string>();
  for (let i = 0; i < 24 && visited.size < 2; i++) {
    await page.waitForTimeout(500);
    const at = await handOver();
    if (at) visited.add(at);
  }
  expect(visited.size).toBeGreaterThan(1);

  // Both wrong doors tried: only the right one is left, and the hand points at it.
  const letters = await houses.evaluateAll((hs) => hs.map((h) => (h as HTMLElement).dataset.letter!));
  for (const l of letters.filter((l) => l !== want)) {
    const wrong = page.locator(`.house[data-letter="${l}"]`);
    await wrong.dispatchEvent('pointerdown');
    await expect(wrong).toHaveClass(/ruled-out/, { timeout: 10_000 });
  }
  await expect.poll(handOver, { timeout: 10_000 }).toBe(want);

  expect(errors).toEqual([]);
});

test('the play timer says goodnight when the time is up, until a grown-up wakes the games', async ({ page }) => {
  const errors = watchErrors(page);
  // A 10-minute session with a few seconds left, already warned.
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('games.play-timer.v1', JSON.stringify({ minutes: 10, used: 10 * 60_000 - 3000, last: Date.now(), warned: true, asleep: false }));
  });
  await page.goto('/leapy-pond/');
  await page.locator('.ask-skip').click();
  await expect(page.locator('.pt-sun')).toBeVisible();
  // Time runs out on the title screen; going to the next screen is a natural stop.
  await page.waitForTimeout(3500);
  await page.locator('.play-btn').click({ force: true });
  await expect(page.locator('.pt-rest')).toBeVisible();

  // Still asleep after a reload, and in the other games.
  await page.goto('/bakery/');
  await expect(page.locator('.pt-rest')).toBeVisible();

  // Holding the grown-up button for 3 seconds shows the choices.
  const hold = (await page.locator('.pt-hold').boundingBox())!;
  await page.mouse.move(hold.x + hold.width / 2, hold.y + hold.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(3300);
  await page.mouse.up();
  await page.locator('.pt-choices button', { hasText: '15 more minutes' }).click();
  await expect(page.locator('.pt-rest')).toHaveCount(0);
  await expect(page.locator('.title-scene')).toBeAttached();
  const left = await page.evaluate(() => JSON.parse(localStorage.getItem('games.play-timer.v1')!));
  expect(left).toMatchObject({ minutes: 10, asleep: false });
  expect(10 * 60_000 - left.used).toBeGreaterThan(14 * 60_000 - 10_000);

  expect(errors).toEqual([]);
});
