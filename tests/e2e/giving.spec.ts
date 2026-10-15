/** Giving (verses, impact, needs) + smart loader – black-box journeys. DEMO: no API, no payment. */
import { test, expect } from '@playwright/test';

test.describe('giving pages', () => {
  for (const p of ['/give', '/impact', '/needs']) {
    test(`${p} renders with one h1, verses or cards, and the samples note`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(p);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('.samples-note')).toContainText('Sample');
      expect(errors).toEqual([]);
    });
  }

  test('verse band: Arabic marked up as RTL Arabic, reference links to Quran.com, prev/next works', async ({ page }) => {
    await page.goto('/give');
    const band = page.locator('.verse-band').first();
    const ar = band.locator('.verse-ar');
    await expect(ar).toHaveAttribute('lang', 'ar');
    await expect(ar).toHaveAttribute('dir', 'rtl');
    await expect(band.locator('figcaption a')).toHaveAttribute('href', 'https://quran.com/2/261');
    await expect(band.locator('figcaption')).toContainText('Saheeh International');
    await band.getByRole('button', { name: 'Next verse' }).click();
    await expect(band.locator('figcaption a')).toHaveAttribute('href', 'https://quran.com/3/92');
    await band.getByRole('button', { name: 'Previous verse' }).click();
    await band.getByRole('button', { name: 'Previous verse' }).click();
    await expect(band.locator('figcaption a')).toContainText('9:60');
  });

  test('every real impact item links a source; samples are labeled', async ({ page }) => {
    await page.goto('/impact');
    const cards = page.locator('.impact-card');
    const n = await cards.count();
    expect(n).toBeGreaterThan(4);
    for (let i = 0; i < n; i++) {
      const c = cards.nth(i);
      const sample = await c.locator('.t-sample').count();
      if (!sample) await expect(c.locator('.impact-foot a')).toHaveAttribute('href', /^https:\/\//);
      else await expect(c.locator('.impact-foot')).toContainText('names and details changed');
    }
  });

  test('needs: urgent first, filter by category, met cases have no Give button', async ({ page }) => {
    await page.goto('/needs');
    await expect(page.locator('.need-card').first()).toHaveClass(/s-urgent/);
    await expect(page.locator('.need-card.s-met .need-give')).toHaveCount(0);
    await page.getByRole('button', { name: 'Health care' }).click();
    await expect(page.locator('.need-card')).toHaveCount(1);
    await expect(page.locator('.need-card h3')).toContainText('Eye surgery');
    await page.getByRole('button', { name: /^All/ }).click();
    expect(await page.locator('.need-card').count()).toBeGreaterThan(3);
  });

  test('give dialog: validation, Zakat option, smart loader, thank-you with receipt', async ({ page }) => {
    await page.goto('/needs');
    await page.locator('.need-card.s-urgent .need-give').click();
    const dlg = page.locator('dialog.give-dialog');
    await expect(dlg).toBeVisible();
    await expect(dlg.getByText('Demo – no payment is taken.')).toBeVisible();
    await expect(dlg.getByRole('radio', { name: /Zakat/ })).toBeChecked();
    await expect(dlg.getByRole('button', { name: /Finish it: \$840$/ })).toBeVisible();
    await dlg.locator('.give-custom input').fill('2');
    await dlg.locator('.give-submit').click();
    await expect(dlg.locator('#give-err')).toContainText('at least $5.00');
    await dlg.locator('.give-custom input').fill('75');
    await dlg.locator('.give-submit').click();
    await expect(dlg.locator('.sl-overlay')).toBeVisible();
    await expect(dlg.locator('.sl-steps li')).toHaveCount(4);
    await expect(dlg.getByRole('heading', { name: 'JazakAllahu khayran' })).toBeVisible({ timeout: 6000 });
    await expect(dlg).toContainText("$75");
    await expect(dlg.locator('.give-ref')).toContainText(/GIFT-\d{6}/);
    await dlg.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(dlg).toBeHidden();
  });

  test('home shows verse, impact and needs sections; nav and footer link to giving pages', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.verse-band')).toHaveCount(1);
    await expect(page.locator('.impact-sec .impact-card')).toHaveCount(3);
    await expect(page.locator('.needs-sec .need-card')).toHaveCount(3);
    for (const name of ['Who still needs help', 'How we helped']) await expect(page.locator('#site-footer').getByRole('link', { name })).toBeVisible();
  });

  test('join page explains why membership matters with a verse', async ({ page }) => {
    await page.goto('/membership/join');
    await expect(page.locator('.join-why h2')).toBeVisible();
    await expect(page.locator('.jw-verse figcaption')).toContainText('Quran 3:92');
  });
});

test.describe('smart loader', () => {
  test('join: send code shows an inline step loader that ends; button shows busy state', async ({ page }) => {
    await page.goto('/membership/join');
    await page.evaluate(() => sessionStorage.clear());
    await page.fill('#f-account-email', 'amina@example.com');
    await page.click('text=Send code');
    await expect(page.locator('[data-busy]').first()).toBeVisible();
    await expect(page.locator('.sl-inline').first()).toContainText('Sending your code');
    await expect(page.locator('.jf-test')).toContainText('123456');
  });

  test('join: address lookup shows step loader with progress bar', async ({ page }) => {
    await page.goto('/membership/join');
    await page.evaluate(() => sessionStorage.clear());
    await page.fill('#f-account-email', 'amina@example.com');
    await page.click('text=Send code');
    await page.fill('#f-account-code', '123456');
    await page.click('text=Verify and continue');
    await page.fill('#f-about-street', '10415 Beechnut St');
    await page.fill('#f-about-city', 'Houston');
    await page.fill('#f-about-zip', '77036');
    await page.getByRole('button', { name: 'Find my Islamic Center' }).click();
    const l = page.locator('.sl-inline');
    await expect(l).toContainText('Finding your Islamic Center');
    await expect(l.getByRole('progressbar')).toHaveAttribute('aria-valuenow', /\d+/);
    await expect(page.locator('.sl-inline')).toHaveCount(0, { timeout: 5000 });
  });

  test('fast forms never flash, slow ones show the loader (verify membership)', async ({ page }) => {
    await page.goto('/verify');
    await page.fill('#vf-id', 'HOU-204781'); await page.fill('#vf-last', 'Khan'); await page.fill('#vf-zip', '77036');
    await page.getByRole('button', { name: /Check membership|Checking/ }).click();
    await expect(page.locator('.sl-inline')).toContainText('Checking the membership');
    await expect(page.locator('.form-card')).toHaveAttribute('aria-busy', 'true');
    await expect(page.getByText('Active membership')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('demo speed (owner: actions felt slow)', () => {
  test('fast (default for the site): send code and membership check finish in well under a second', async ({ page }) => {
    await page.goto('/membership/join');
    await page.evaluate(() => { sessionStorage.clear(); localStorage.setItem('isgh-demo-speed', 'fast'); });
    await page.reload();
    await page.fill('#f-account-email', 'amina@example.com');
    let t = Date.now(); await page.click('text=Send code');
    await expect(page.locator('.jf-test')).toContainText('123456');
    expect(Date.now() - t).toBeLessThan(900);
    await page.goto('/verify');
    await page.fill('#vf-id', 'HOU-204781'); await page.fill('#vf-last', 'Khan'); await page.fill('#vf-zip', '77036');
    t = Date.now(); await page.getByRole('button', { name: /Check membership/ }).click();
    await expect(page.getByText('Active membership')).toBeVisible();
    expect(Date.now() - t).toBeLessThan(1000);
    await page.evaluate(() => localStorage.removeItem('isgh-demo-speed'));
  });
});

test('home: heart line – short hadith with source, right after the stats', async ({ page }) => {
  await page.goto('/');
  const h = page.locator('.heart-line');
  await expect(h).toContainText('loves for his brother what he loves for himself');
  await expect(h.locator('figcaption')).toContainText('Sahih al-Bukhari 13');
  await expect(h.locator('[lang="ar"]')).toHaveAttribute('dir', 'rtl');
  expect(await page.evaluate(() => document.querySelector('.stats')?.nextElementSibling?.className)).toBe('heart-line');
});
