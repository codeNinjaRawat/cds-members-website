/** Footer forms: rate your experience, file a complaint, verify a membership (demo, no API). */
import { test, expect } from '@playwright/test';

test('feedback: requires rating and topic; low rating needs a comment; success reference', async ({ page }) => {
  await page.goto('/feedback');
  await page.click('text=Send feedback');
  await expect(page.locator('#rating-error')).toBeVisible();
  await page.locator('.star-row label').nth(1).click();
  await page.selectOption('#fb-topic', 'Website');
  await page.click('text=Send feedback');
  await expect(page.locator('#fb-comment-error')).toContainText('what went wrong');
  await page.fill('#fb-comment', 'The renew button did not work on my phone.');
  await page.click('text=Send feedback');
  await expect(page.locator('.done-card')).toContainText(/FB-\d{6}/);
  await expect(page.locator('.done-card')).toContainText('file a formal complaint');
});

test('feedback: ?topic=website preselects the topic', async ({ page }) => {
  await page.goto('/feedback?topic=website');
  await expect(page.locator('#fb-topic')).toHaveValue('Website');
});

test('complaint: validation, anonymous option, reference number', async ({ page }) => {
  await page.goto('/complaints');
  await page.click('text=Submit complaint');
  await expect(page.locator('#cp-category-error')).toBeVisible();
  await expect(page.locator('#cp-what-error')).toBeVisible();
  await expect(page.locator('#cp-name-error')).toBeVisible();
  await page.selectOption('#cp-category', 'Elections');
  await page.fill('#cp-what', 'I was told at the center that my vote did not count even though I paid in May.');
  await page.locator('label.check', { hasText: 'stay anonymous' }).click();
  await expect(page.locator('#cp-name')).toHaveCount(0);
  await page.locator('label.check', { hasText: 'true to the best' }).click();
  await page.click('text=Submit complaint');
  await expect(page.locator('.done-card')).toContainText(/CMP-\d{6}/);
  await expect(page.locator('.done-card')).toContainText('cannot reply');
});

test('verify: format checks, found and not found, never shows personal data', async ({ page }) => {
  await page.goto('/verify');
  await page.fill('#vf-id', '12345');
  await page.click('text=Check membership');
  await expect(page.locator('#vf-id-error')).toBeVisible();
  await page.fill('#vf-id', 'hou-204781');
  await page.fill('#vf-last', 'Khan');
  await page.fill('#vf-zip', '77036');
  await page.click('text=Check membership');
  await expect(page.locator('.callout')).toContainText('Active membership');
  await expect(page.locator('.form-card')).not.toContainText('Beechnut');
  await page.fill('#vf-id', 'HOU-204780');
  await page.click('text=Check membership');
  await expect(page.locator('.callout')).toContainText('No active membership');
});
