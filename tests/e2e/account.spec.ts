/** W5 sign-in + member home – black-box journeys (DEMO: code 123456, session in this tab). */
import { test, expect, type Page } from '@playwright/test';

async function signInWithCode(page: Page, email: string) {
  await page.goto('/sign-in');
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await page.fill('#si-email', email);
  await page.getByRole('button', { name: 'Send code', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
  await page.fill('#si-code', '123456');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

test.describe('sign in', () => {
  test('validates email, wrong code, then signs in to member home', async ({ page }) => {
    await page.goto('/sign-in');
    await page.evaluate(() => sessionStorage.clear());
    await page.fill('#si-email', 'not-an-email');
    await page.getByRole('button', { name: 'Send code', exact: true }).click();
    await expect(page.locator('#si-email-error')).toContainText('valid email');
    await page.fill('#si-email', 'aisha@example.com');
    await page.getByRole('button', { name: 'Send code', exact: true }).click();
    await expect(page.getByText(/If aisha@example.com has an ISGH account/)).toBeVisible();
    await page.fill('#si-code', '000000');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.locator('#si-code-error')).toContainText('not right');
    await page.fill('#si-code', '123456');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/portal$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Assalamu alaikum, Aisha.');
  });

  test('verified email with no membership offers join (privacy: code step never reveals membership)', async ({ page }) => {
    await signInWithCode(page, 'new.person@example.com');
    await expect(page.getByRole('heading', { name: /No membership linked/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Become a member' }).first()).toHaveAttribute('href', '/membership/join');
  });

  test('Google demo: life member goes to member home', async ({ page }) => {
    await page.goto('/sign-in');
    await page.evaluate(() => sessionStorage.clear());
    await page.getByRole('button', { name: 'Continue with Google' }).click();
    await page.getByRole('button', { name: /Imran Siddiqui/ }).click();
    await expect(page).toHaveURL(/\/portal$/);
    await expect(page.locator('.dcard-tag')).toHaveText('Life member');
    await expect(page.getByText('Lifetime membership – no annual dues.')).toBeVisible();
  });

  test('open-redirect is blocked: ?next=//evil.example goes to /portal', async ({ page }) => {
    await page.goto('/sign-in?next=//evil.example');
    await page.evaluate(() => sessionStorage.clear());
    await page.fill('#si-email', 'aisha@example.com');
    await page.getByRole('button', { name: 'Send code', exact: true }).click();
    await page.fill('#si-code', '123456');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/localhost:4321\/portal$/);
  });
});

test.describe('member home', () => {
  test('signed out → redirected to sign in with next', async ({ page }) => {
    await page.goto('/sign-in'); await page.evaluate(() => sessionStorage.clear());
    await page.goto('/portal');
    await expect(page).toHaveURL(/\/sign-in\?next=\/portal$/);
  });

  test('shows card, status, voting checklist, household, payments; header switches to My membership; sign out', async ({ page }) => {
    await signInWithCode(page, 'aisha@example.com');
    await expect(page.locator('.dcard-name')).toHaveText('Aisha Rahman');
    await expect(page.locator('.dcard')).toContainText('HOU-204781');
    await expect(page.locator('.p-pill')).toHaveText('4 of 6 done');
    await expect(page.locator('.p-checks li.c-todo')).toContainText('Own 2027 dues paid by June 30, 2027');
    // Renewal opens Nov 1, 2026 (admin setting): disabled before that date, a link after it
    if (Date.now() < Date.parse('2026-11-01T00:00:00-05:00')) {
      await expect(page.getByRole('button', { name: 'Renew for 2027' })).toBeDisabled();
      await expect(page.locator('.p-status')).toContainText('Renewal opens November 1, 2026');
    } else await expect(page.getByRole('link', { name: 'Renew for 2027' })).toHaveAttribute('href', '/membership/renew');
    await expect(page.locator('.p-people')).toContainText('Omar Rahman');
    await expect(page.locator('.p-payments li')).toHaveCount(3);
    await page.getByRole('button', { name: 'Upload ID' }).click();
    await expect(page.locator('.portal-note')).toContainText('Demo');
    await expect(page.locator('#site-header .signin')).toHaveText('My membership');
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL('http://localhost:4321/');
    await expect(page.locator('#site-header .signin')).toHaveText('Sign in');
  });

  test('renew info page exists (no more 404)', async ({ page }) => {
    const r = await page.goto('/membership/renew');
    expect(r?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Renew your membership');
  });
});
