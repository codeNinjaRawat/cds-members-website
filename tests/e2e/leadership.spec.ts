/** F5 public Leadership page. */
import { test, expect } from '@playwright/test';

test('board, open seats and center leadership; no private data', async ({ page }) => {
  await page.goto('/leadership');
  await expect(page.getByRole('heading', { name: 'Leadership', level: 1 })).toBeVisible();
  await expect(page.locator('.ld-card').filter({ hasText: 'Yusuf Karim' })).toContainText('president@isgh.org');
  await expect(page.locator('.ld-card.vacant')).toContainText('Director, Southeast Zone');
  await expect(page.getByText('Ahmed Jaffer')).toHaveCount(0);                 // term ended – not listed
  const html = await page.content();
  expect(html).not.toMatch(/HOU-\d{6}/);                                     // no member IDs
  await page.locator('[data-center="Southwest Islamic Center 1"] summary').click();
  await expect(page.locator('[data-center="Southwest Islamic Center 1"]')).toContainText('Finance Secretary');
});

test('who represents me: by ZIP, grouped ZIPs, bad and unknown ZIPs', async ({ page }) => {
  await page.goto('/leadership');
  const zip = page.getByLabel('Home ZIP code');
  await zip.fill('7703'); await page.getByRole('button', { name: 'Find' }).click();
  await expect(page.getByRole('alert')).toContainText('5-digit ZIP');
  await zip.fill('77036'); await page.getByRole('button', { name: 'Find' }).click();
  const r = page.locator('.ld-result');
  await expect(r).toContainText('Southwest Zone');
  await expect(r).toContainText('Kamran Butt'); await expect(r).toContainText('Asma Latif'); await expect(r).toContainText('Imran Malik');
  await zip.fill('77090'); await page.getByRole('button', { name: 'Find' }).click();
  await expect(r).toContainText('Sadia Rehman'); await expect(r).toContainText('North Zone');
  await zip.fill('77505'); await page.getByRole('button', { name: 'Find' }).click();
  await expect(r).toContainText('No Area Representative is listed');
  await zip.fill('99999'); await page.getByRole('button', { name: 'Find' }).click();
  await expect(r).toContainText('could not place ZIP 99999');
});

test('past leadership: earlier terms by election year, never Area Representatives or member IDs', async ({ page }) => {
  await page.goto('/leadership');
  const past = page.locator('.ld-past');
  await expect(past).toHaveCount(3);
  await expect(past.first()).toContainText('Election 2022');
  await past.first().locator('summary').click();
  await expect(past.first()).toContainText('Nasir Baig');
  await expect(past.first()).toContainText('Zonal Director, North Zone');
  const html0 = await page.locator('.ld-sec[aria-labelledby="ld-past"]').innerText();
  expect(html0).not.toContain('Area Representative'); expect(html0).not.toContain('Kamran Butt');
  expect(await page.content()).not.toMatch(/HOU-\d{6}/);
});
