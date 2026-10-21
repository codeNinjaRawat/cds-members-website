/** R6.5 black-box: editorial home (demo mode). */
import { expect, test } from '@playwright/test';

test('editorial home: hero, five quick actions, live sections, no horizontal scroll on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'editorial');
  await expect(page.locator('.ed-headline')).toBeVisible();
  expect(await page.locator('.ed-quick-a').count()).toBe(5);
  await expect(page.locator('.ed-quick-a[data-tone="primary"]')).toHaveAttribute('href', '/membership/join');
  await expect(page.locator('.ed-today .blk-prayer')).toBeVisible();
  await expect(page.locator('.ed-masajid .blk-card').first()).toBeVisible();
  await expect(page.locator('.ed-give')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await page.locator('.ed-quick-a').first().click();
  await expect(page).toHaveURL(/\/khutbah$/);
});
