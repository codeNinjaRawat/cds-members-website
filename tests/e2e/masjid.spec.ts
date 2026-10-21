/** O3 black-box: masjid micro-sites (demo mode, start-dev.cmd). */
import { expect, test } from '@playwright/test';

const noHScroll = async (page: import('@playwright/test').Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);

test('overview: band, chip menu, live sections; phone has no horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/masjid/n-1');
  await expect(page.locator('.masjid-name')).toHaveText('North Islamic Center 1');
  const chips = page.locator('.masjid-nav a');
  await expect(chips.first()).toHaveAttribute('aria-current', 'page');
  expect(await chips.count()).toBeGreaterThanOrEqual(10);
  await expect(page.locator('.blk-prayer')).toBeVisible();
  await expect(page.locator('.blk-jumuah')).toBeVisible();
  await expect(page.locator('.blk-prayer-head h3')).toContainText('North Islamic Center 1');
  await noHScroll(page);
});

test('sub-routes answer and the chip is current; slugified name redirects to the id', async ({ page }) => {
  for (const sub of ['prayer-times', 'jumuah', 'events', 'programs', 'announcements', 'leadership', 'give', 'visit']) {
    const r = await page.goto(`/masjid/n-1/${sub}`);
    expect(r?.status(), sub).toBe(200);
    await expect(page.locator(`.masjid-nav a[aria-current="page"]`)).toHaveAttribute('href', `/masjid/n-1/${sub}`);
  }
  await page.goto('/masjid/north-islamic-center-1/visit');
  await expect(page).toHaveURL(/\/masjid\/n-1\/visit$/);
  await expect(page.locator('.blk-embed iframe[src^="https://www.google.com/maps"]')).toHaveCount(1);
});

test('unknown masjid and unknown sub-route are 404; screen view hides the site header', async ({ page }) => {
  expect((await page.goto('/masjid/nowhere'))?.status()).toBe(404);
  expect((await page.goto('/masjid/n-1/not-a-page'))?.status()).toBe(404);
  await page.goto('/masjid/n-1/screen');
  await expect(page.locator('.screen-row[data-next], .screen-next')).toBeVisible();
  await expect(page.locator('.site-header')).toBeHidden();
  expect(await page.locator('.screen-row').count()).toBeGreaterThanOrEqual(7);
});

test('network directory and zone pages', async ({ page }) => {
  await page.goto('/masajid');
  expect(await page.locator('.blk-masjids .blk-card').count()).toBeGreaterThan(10);
  await page.locator('.blk-masjids .blk-card a').first().click();
  await expect(page).toHaveURL(/\/masjid\/[a-z0-9-]+$/);
  await page.locator('.masjid-crumbs a').nth(1).click();
  await expect(page).toHaveURL(/\/zones\/[a-z0-9-]+$/);
  await expect(page.locator('.blk-masjids')).toBeVisible();
});
