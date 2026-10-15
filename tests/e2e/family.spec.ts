/** Member portal › family tree – black-box (DEMO, browser only). */
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => { sessionStorage.setItem('isgh-demo-session', 'aisha@example.com'); localStorage.clear(); });
  await page.goto('/portal/family');
});

test('signed out → sign in first', async ({ page }) => {
  await page.evaluate(() => sessionStorage.clear());
  await page.goto('/portal/family');
  await expect(page).toHaveURL(/\/sign-in\?next=\/portal\/family/);
});

test('membership family: statuses, relations and highlights', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Your family tree' })).toBeVisible();
  const card = (n: string) => page.locator('.ft-card', { hasText: n });
  await expect(card('Aisha Rahman')).toHaveClass(/is-root/);
  await expect(card('Omar Rahman')).toContainText('Husband');
  await expect(card('Tariq Khan')).toContainText('Life · can vote');
  await expect(card('Nasreen Khan')).toContainText('Not renewed');
  await expect(card('Sumayya Rahman')).toContainText('Turns 18 on 03/14/2027');
  await expect(card('Sara Khan')).toContainText('Can join');
  await expect(card('Yusuf Rahman')).toContainText('Father-in-law');
  await expect(card('Abdul Latif Khan')).toHaveCount(0); // history is hidden in the membership layer
  await expect(page.locator('.fam-tips')).toContainText('Sumayya turns 18');
  await expect(page.locator('.ft-lines path').first()).toBeAttached();
});

test('whole family shows older generations as history', async ({ page }) => {
  await page.getByRole('radio', { name: /Whole family/ }).click();
  await expect(page.locator('.ft-card', { hasText: 'Ghulam Rasul' })).toContainText('Great-grandfather');
  await expect(page.locator('.ft-card', { hasText: 'Ghulam Rasul' })).toContainText('Late');
  await expect(page.locator('.fam-tips')).toContainText('6 names from earlier generations');
});

test('invite an adult relative; reminder for the daughter turning 18', async ({ page }) => {
  await page.locator('.ft-card', { hasText: 'Sara Khan' }).click();
  await expect(page.locator('.fam-person h2')).toHaveText('Sara Khan');
  await page.getByRole('button', { name: 'Invite to join' }).click();
  await expect(page.locator('.fam-toast')).toContainText('invitation');
  await expect(page.locator('.ft-card', { hasText: 'Sara Khan' })).toContainText('Invited');
  await page.locator('.ft-card', { hasText: 'Sumayya Rahman' }).click();
  await expect(page.locator('.fam-person')).toContainText('can vote in that election'.slice(0, 10));
  await page.getByRole('button', { name: 'Remind me on the birthday' }).click();
  await expect(page.locator('.fam-toast')).toContainText('03/14/2027');
});

test('add a child, edit, remove; tree is saved after reload', async ({ page }) => {
  await page.getByRole('button', { name: 'Add a relative' }).click();
  await page.getByLabel('Relation').selectOption('daughter');
  await page.getByLabel('First name').fill('Noor');
  await page.getByLabel('Date or year of birth (optional)').fill('2025-02-01');
  await page.getByRole('button', { name: 'Add to tree' }).click();
  await expect(page.locator('.ft-card', { hasText: 'Noor Rahman' })).toContainText('Daughter');
  await page.reload();
  await expect(page.locator('.ft-card', { hasText: 'Noor Rahman' })).toBeVisible();
  await page.locator('.ft-card', { hasText: 'Noor Rahman' }).click();
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('First name').fill('Nour');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('.ft-card', { hasText: 'Nour Rahman' })).toBeVisible();
  await page.getByRole('button', { name: 'Remove' }).click();
  await expect(page.locator('.ft-card', { hasText: 'Nour Rahman' })).toHaveCount(0);
});

test('add a late grandparent → goes to family history', async ({ page }) => {
  await page.locator('.ft-card', { hasText: 'Omar Rahman' }).click();
  await page.getByRole('button', { name: /Add a relative of Omar/ }).click();
  await page.getByLabel('Relation').selectOption('brother');
  await page.getByLabel('First name').fill('Khalid');
  await page.getByLabel('Date or year of birth (optional)').fill('1980');
  await page.getByRole('button', { name: 'Add to tree' }).click();
  await expect(page.locator('.ft-card', { hasText: 'Khalid Rahman' })).toContainText('Brother-in-law');
  await page.locator('.ft-card', { hasText: 'Yusuf Rahman' }).click();
  await page.getByRole('button', { name: /Add a relative of Yusuf/ }).click();
  await page.getByLabel('Relation').selectOption('father');
  await page.getByLabel('First name').fill('Abdul Qadir');
  await page.getByLabel(/Has passed away/).check();
  await page.getByLabel('Year of passing').fill('1990');
  await page.getByRole('button', { name: 'Add to tree' }).click();
  await expect(page.getByRole('radio', { name: /Whole family/ })).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.ft-card', { hasText: 'Abdul Qadir Rahman' })).toContainText('Late');
});

test('list view groups by generation; keyboard works', async ({ page }) => {
  await page.getByRole('radio', { name: 'List' }).click();
  await expect(page.getByRole('region', { name: 'Children' }).or(page.locator('section[aria-label="Children"]'))).toContainText('Sumayya Rahman');
  await page.locator('.ft-row', { hasText: 'Bilal Khan' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.fam-person h2')).toHaveText('Bilal Khan');
});

test('member home shows the family tile with counts and link', async ({ page }) => {
  await page.goto('/portal');
  await expect(page.locator('#hh-h')).toHaveText('Family tree');
  await expect(page.locator('.p-family-mini')).toContainText('4 can vote');
  await page.getByRole('link', { name: 'Open family tree' }).click();
  await expect(page).toHaveURL(/\/portal\/family/);
});

test('phone width: no sideways page scroll (the tree scrolls inside its box)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.locator('.ft-card').first()).toBeAttached();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
});
