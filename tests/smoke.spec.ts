// Opens every game in a real browser and plays the first moments: skip the
// name card, press play, wait for the helping hand, and open the grown-up
// settings. Any error on the page fails the test.
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

    await page.locator('.ask-skip').click();
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
    await expect(page.locator('.set-count')).toHaveText(/^0 of \d+ lines recorded$/);

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
