/** Join form builder (admin-defined sections) + smart helpers on the website – black-box. DEMO (no API). */
import { test, expect, type Page } from '@playwright/test';

const cont = (page: Page) => page.getByRole('button', { name: 'Continue', exact: true }).click();
async function start(page: Page, email = 'amina.khan@example.com') {
  await page.goto('/membership/join');
  await page.evaluate(() => { sessionStorage.clear(); });
  await page.reload();
  await page.fill('#f-account-email', email);
  await page.click('text=Send code');
  await page.fill('#f-account-code', '123456');
  await page.click('text=Verify and continue');
}
async function about(page: Page) {
  await page.fill('#f-about-firstName', 'Amina'); await page.fill('#f-about-lastName', 'Khan');
  await page.fill('#f-about-dob', '1990-04-12'); await page.fill('#f-about-phone', '7135550123');
  await page.fill('#f-about-street', '10415 Beechnut St'); await page.fill('#f-about-zip', '77036');
}

test('admin sections render inside core steps and as their own step; rules show and hide questions', async ({ page }) => {
  await start(page); await about(page);
  await expect(page.locator('fieldset[data-section="contact-more"] > legend')).toHaveText('A little more about you');
  await cont(page);
  // Single plan → the spouse question does not apply
  await page.locator('.plan-choice', { hasText: 'Single' }).click();
  await expect(page.locator('#f-custom-spouse-same-address')).toHaveCount(0);
  await expect(page.locator('#f-custom-weekend-school')).toHaveCount(0);
  await page.fill('#f-custom-children-count', '2');
  await expect(page.locator('#f-custom-weekend-school')).toBeVisible();
  await page.locator('#f-custom-weekend-school').getByText('Yes').click();
  // Family plan → required follow-up
  await page.locator('.plan-choice', { hasText: 'Family' }).click();
  await page.fill('#f-plan-spouse-firstName', 'Omar'); await page.fill('#f-plan-spouse-lastName', 'Khan'); await page.fill('#f-plan-spouse-email', 'omar@example.com');
  await cont(page);
  await expect(page.locator('.error-summary')).toContainText('Does your spouse live at the same address?');
  await page.locator('#f-custom-spouse-same-address').getByText('Yes').click();
  await cont(page);
  await expect(page.locator('h2#st-h')).toHaveText('Getting involved');
  await expect(page.locator('.stepper li.current')).toContainText('Getting involved');
  await expect(page.locator('#f-custom-how-heard-other')).toHaveCount(0);
  await page.selectOption('#f-custom-how-heard', 'other');
  await expect(page.locator('#f-custom-how-heard-other')).toBeVisible();
  await page.fill('#f-custom-how-heard-other', 'Jumuah khutbah');
  await page.locator('#f-custom-volunteer').getByText('Youth programs').click();
  await cont(page);
  await page.locator('label.check', { hasText: 'Take part regularly' }).click();
  await page.locator('label.check', { hasText: 'I accept this pledge' }).click();
  await page.locator('label.check', { hasText: 'I have read the Identity Collection' }).click();
  await page.fill('#f-pledge-signature', 'Amina Khan');
  await cont(page);
  await expect(page.locator('h2#st-h')).toHaveText('Review and pay');
  const block = page.locator('.review-block', { hasText: 'Getting involved' });
  await expect(block).toContainText('How did you hear about ISGH membership?: Other');
  await expect(block).toContainText('Please tell us where: Jumuah khutbah');
  await expect(block).toContainText('Ways you would like to help: Youth programs');
  await expect(page.locator('.review-block', { hasText: 'Your household' })).toContainText('Interested in weekend Islamic school for your children?: Yes');
  await block.getByRole('button', { name: /Edit/ }).click();
  await expect(page.locator('h2#st-h')).toHaveText('Getting involved');
});

test('scan photo ID (sample) fills name, birth date and address, finds the center, counts as the ID upload', async ({ page }) => {
  await start(page);
  await page.getByRole('button', { name: 'Use a sample ID' }).click();
  await expect(page.locator('.sl-inline').first()).toContainText('Reading your ID');
  await expect(page.locator('#f-about-dob')).toHaveValue('1990-05-14');
  await expect(page.locator('label[for="f-about-dob"] .jf-filled')).toHaveText('From your ID');
  await expect(page.locator('#f-about-street')).toHaveValue('10415 Beechnut St');
  await expect(page.locator('.center-result')).toBeVisible();
  await page.fill('#f-about-dob', '1990-05-15');
  await expect(page.locator('label[for="f-about-dob"] .jf-filled')).toHaveCount(0);
  await expect(page.locator('.jf-scan b')).toContainText('ID read');
});

test('existing member renews with last year’s answers', async ({ page }) => {
  await start(page, 'aisha@example.com');
  await page.getByRole('button', { name: 'Renew with last year’s details' }).click();
  await expect(page.locator('h2#st-h')).toHaveText('About you');
  await expect(page.locator('.jf-ok')).toContainText('Renewing Aisha');
  await expect(page.locator('#f-about-firstName')).toHaveValue('Aisha');
  await expect(page.locator('label[for="f-about-firstName"] .jf-filled')).toHaveText('From last year');
  await expect(page.locator('#f-custom-language')).toHaveCount(0);   // no language choice on the form
  await page.fill('#f-about-dob', '1986-04-21');
  await cont(page);
  await expect(page.locator('.plan-choice.on')).toContainText('Family');
  await expect(page.locator('#f-custom-children-count')).toHaveValue('2');
  await expect(page.locator('.stepper li').last()).toContainText('Review and renew');
});

test('save and finish later gives a link that reopens the application', async ({ page, context }) => {
  await start(page); await about(page);
  await page.getByRole('button', { name: 'Save and finish later' }).click();
  const link = await page.locator('.jf-saved input').inputValue();
  expect(link).toMatch(/\/membership\/join\?resume=[a-z0-9]+$/);
  const p2 = await context.newPage();
  await p2.goto(link.replace(/^https?:\/\/[^/]+/, ''));
  await expect(p2.locator('h2#st-h')).toHaveText('About you');
  await expect(p2.locator('#f-about-firstName')).toHaveValue('Amina');
  await expect(p2.locator('.jf-ok')).toContainText('opened your saved application');
});

test('admin live preview: an unsaved form appears at once (and bad definitions are ignored)', async ({ page }) => {
  await start(page);
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('isgh:join-form-preview', { detail: { form: { version: 'x', sections: [{ id: 'bad id', title: '', placement: 'nowhere', fields: [] }] } } }));
  });
  await expect(page.locator('h2#st-h')).toHaveText('About you');
  await page.evaluate(() => {
    const form = { version: 'draft', core: { dob: { label: 'Birthday (as on your ID)' }, middleName: { show: false } }, helpers: { idScan: false },
      sections: [{ id: 'emergency', title: 'Emergency contact', placement: 'step-after-about', fields: [{ id: 'ec-name', type: 'text', label: 'Contact name', required: true }] }] };
    window.dispatchEvent(new CustomEvent('isgh:join-form-preview', { detail: { form, step: 'about' } }));
  });
  await expect(page.locator('label[for="f-about-dob"]')).toContainText('Birthday (as on your ID)');
  await expect(page.locator('#f-about-middleName')).toHaveCount(0);
  await expect(page.locator('.jf-scan')).toHaveCount(0);
  await expect(page.locator('.stepper')).toContainText('Emergency contact');
  await expect(page.locator('.stepper')).not.toContainText('Getting involved');
});
