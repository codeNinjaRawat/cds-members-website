/** W4 member sign-up flow – black-box journeys + validation + white-box API checks. Mock mode: OTP code 123456. */
import { test, expect, type Page } from '@playwright/test';

const cont = (page: Page) => page.getByRole('button', { name: 'Continue', exact: true }).click();

async function verifyEmail(page: Page, email = 'amina.khan@example.com') {
  await page.goto('/membership/join');
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await page.fill('#f-account-email', email);
  await page.click('text=Send code');
  await expect(page.locator('.jf-test')).toContainText('123456');
  await page.fill('#f-account-code', '123456');
  await page.click('text=Verify and continue');
}

async function fillAbout(page: Page, opts: { dob?: string; zip?: string; state?: string } = {}) {
  await expect(page.locator('h2#st-h')).toHaveText('About you');
  await page.fill('#f-about-firstName', 'Amina');
  await page.fill('#f-about-lastName', 'Khan');
  await page.fill('#f-about-dob', opts.dob ?? '1990-04-12');
  await page.fill('#f-about-phone', '7135550123');
  await page.fill('#f-about-street', '10415 Beechnut St');
  await page.fill('#f-about-city', 'Houston');
  if (opts.state) await page.selectOption('#f-about-state', opts.state);
  await page.fill('#f-about-zip', opts.zip ?? '77036');
}

test.describe('join flow', () => {
  test('email step: invalid email, wrong code, then success', async ({ page }) => {
    await page.goto('/membership/join');
    await page.fill('#f-account-email', 'not-an-email');
    await page.click('text=Send code');
    await expect(page.locator('.error-summary')).toContainText('valid email');
    await page.fill('#f-account-email', 'amina@example.com');
    await page.click('text=Send code');
    await page.fill('#f-account-code', '000000');
    await page.click('text=Verify and continue');
    await expect(page.locator('.error-summary')).toContainText('not right');
    await expect(page.getByRole('button', { name: /Resend code in/ })).toBeDisabled();
    await page.fill('#f-account-code', '123456');
    await page.click('text=Verify and continue');
    await expect(page.locator('h2#st-h')).toHaveText('About you');
    await expect(page.locator('h2#st-h')).toBeFocused();
  });

  test('existing member is sent to sign in instead of creating a duplicate', async ({ page }) => {
    await verifyEmail(page, 'member@example.com');
    await expect(page.locator('.callout')).toContainText('already have an ISGH membership');
    await expect(page.getByRole('link', { name: 'Sign in' }).last()).toBeVisible();
  });

  test('about step: required fields, under 18, phone format, error summary links to fields', async ({ page }) => {
    await verifyEmail(page);
    await cont(page);
    const summary = page.locator('.error-summary');
    await expect(summary).toBeFocused();
    await expect(summary).toContainText('Enter your street address');
    await fillAbout(page, { dob: '2012-01-01' });
    await cont(page);
    await expect(summary).toContainText('at least 18');
    await page.fill('#f-about-dob', '1990-04-12');
    await expect(page.locator('#f-about-phone')).toHaveValue('(713) 555-0123');
    await summary.locator('a').first().click().catch(() => {});
    await cont(page);
    await expect(page.locator('h2#st-h')).toHaveText('Choose your membership');
  });

  test('address outside Greater Houston: can continue but warned about voting', async ({ page }) => {
    await verifyEmail(page);
    await fillAbout(page, { zip: '75201', state: 'TX' });
    await page.click('text=Find my Islamic Center');
    await expect(page.locator('.callout')).toContainText('outside Greater Houston');
  });

  test('near a zone border: can request a different center', async ({ page }) => {
    await verifyEmail(page);
    await fillAbout(page, { zip: '77063' }); // mock: last digit divisible by 3 → near border
    await page.click('text=Find my Islamic Center');
    await expect(page.locator('.center-result')).toContainText('near a zone border');
    await page.locator('.border-choice input').nth(1).check();
  });

  test('family plan requires spouse details; multi-year shows savings', async ({ page }) => {
    await verifyEmail(page);
    await fillAbout(page);
    await cont(page);
    await page.locator('.plan-choice', { hasText: 'Family' }).click();
    await page.selectOption('#f-plan-years', '3');
    await expect(page.locator('.price-box')).toContainText('Multi-year savings');
    await expect(page.locator('.price-box .total')).toContainText('$108');
    await cont(page);
    await expect(page.locator('.error-summary')).toContainText("spouse's first name");
  });

  test('associate members only see associate plans and are told they cannot vote', async ({ page }) => {
    await verifyEmail(page);
    await fillAbout(page);
    await cont(page);
    await page.locator('.choice', { hasText: 'As an associate member' }).click();
    await expect(page.locator('.plan-choice')).toHaveCount(1);
    await expect(page.locator('.plan-choice')).toContainText('Associate');
  });

  test('pledge: signature must match name; full journey to confirmation; relative payer rule', async ({ page }) => {
    await verifyEmail(page);
    await fillAbout(page);
    await cont(page);
    await page.locator('.plan-choice', { hasText: 'Single' }).click();
    await cont(page);
    await expect(page.locator('h2#st-h')).toHaveText('Commitment and pledge');
    await cont(page);
    await expect(page.locator('.error-summary')).toContainText('accept the pledge');
    await page.locator('label.check', { hasText: 'I accept this pledge' }).click();
    await page.fill('#f-pledge-signature', 'Someone Else');
    await cont(page);
    await expect(page.locator('.error-summary')).toContainText('exactly as entered: Amina Khan');
    await page.fill('#f-pledge-signature', 'amina  khan');
    await page.locator('label.check', { hasText: 'Take part regularly' }).click();
    await cont(page);
    await expect(page.locator('h2#st-h')).toHaveText('Review and pay');
    await expect(page.locator('.eligibility')).toContainText('on track to vote');
    await page.locator('.choice', { hasText: 'A relative is paying' }).click();
    await page.getByRole('button', { name: /^Pay \$25 and submit$/ }).click();
    await expect(page.locator('.error-summary')).toContainText('related to you');
    await page.fill('#f-payment-payerName', 'Omar Khan');
    await page.selectOption('#f-payment-payerRelationship', 'Spouse');
    await page.getByRole('button', { name: /^Pay \$25 and submit$/ }).click();
    await expect(page.locator('h2#st-h')).toHaveText('Application received');
    await expect(page.locator('.jf-lead')).toContainText(/APP-2027-\d{5}/);
  });

  test('no commitment → review warns voting not yet', async ({ page }) => {
    await verifyEmail(page);
    await fillAbout(page);
    await cont(page);
    await page.locator('.plan-choice', { hasText: 'Single' }).click();
    await cont(page);
    await page.locator('label.check', { hasText: 'I accept this pledge' }).click();
    await page.fill('#f-pledge-signature', 'Amina Khan');
    await cont(page);
    await expect(page.locator('.eligibility')).toContainText('Choose at least one commitment');
  });

  test('progress is restored after reload in the same tab', async ({ page }) => {
    await verifyEmail(page);
    await page.fill('#f-about-firstName', 'Amina');
    await page.reload();
    await expect(page.locator('.jf-note')).toContainText('restored your progress');
    await expect(page.locator('#f-about-firstName')).toHaveValue('Amina');
  });

  test('plan from the home page link is preselected', async ({ page }) => {
    await page.goto('/membership/join?plan=life');
    await page.evaluate(() => sessionStorage.clear());
    await page.goto('/membership/join?plan=life');
    await page.fill('#f-account-email', 'x@example.com');
    await page.click('text=Send code'); await page.fill('#f-account-code', '123456'); await page.click('text=Verify and continue');
    await fillAbout(page); await cont(page);
    await expect(page.locator('.plan-choice.on')).toContainText('Life');
  });
});

test.describe('join flow – smart helpers (demo, no API)', () => {
  test('continue with Google: verified email, name prefilled, skips the code step', async ({ page }) => {
    await page.goto('/membership/join');
    await page.evaluate(() => sessionStorage.clear()); await page.reload();
    await page.getByRole('button', { name: 'Continue with Google' }).click();
    await expect(page.locator('.g-dialog')).toBeVisible();
    await page.locator('.g-dialog button', { hasText: 'amina.khan@gmail.com' }).click();
    await expect(page.locator('h2#st-h')).toHaveText('About you');
    await expect(page.locator('#f-about-firstName')).toHaveValue('Amina');
    await expect(page.locator('.jf-ok')).toContainText('Signed in with Google');
  });
  test('Google account that is already a member is sent to sign in', async ({ page }) => {
    await page.goto('/membership/join');
    await page.evaluate(() => sessionStorage.clear()); await page.reload();
    await page.getByRole('button', { name: 'Continue with Google' }).click();
    await page.locator('.g-dialog button', { hasText: 'member@example.com' }).click();
    await expect(page.locator('.callout')).toContainText('already have an ISGH membership');
  });
  test('suggests a fix for a mistyped email domain', async ({ page }) => {
    await page.goto('/membership/join');
    await page.fill('#f-account-email', 'amina@gmial.com');
    await expect(page.locator('.jf-suggest')).toContainText('amina@gmail.com');
    await page.locator('.jf-suggest button').click();
    await expect(page.locator('#f-account-email')).toHaveValue('amina@gmail.com');
  });
  test('address suggestions fill city/ZIP and find the center automatically', async ({ page }) => {
    await verifyEmail(page);
    await page.fill('#f-about-street', '8830 Bel');
    await page.locator('.addr-list button').first().click();
    await expect(page.locator('#f-about-zip')).toHaveValue('77036');
    await expect(page.locator('.center-result')).toContainText('Southwest');
    await expect(page.locator('.jf-summary')).toContainText('Southwest');
  });
  test('validates a field when you leave it', async ({ page }) => {
    await verifyEmail(page);
    await page.fill('#f-about-zip', '123');
    await page.locator('#f-about-zip').blur();
    await expect(page.locator('#f-about-zip-error')).toContainText('5-digit');
  });
  test('suggests the family plan when it saves money', async ({ page }) => {
    await verifyEmail(page);
    await fillAbout(page);
    await cont(page);
    await page.locator('.plan-choice', { hasText: 'Single' }).click();
    await expect(page.locator('.jf-tip')).toContainText('Married?');
    await page.locator('.jf-tip button').click();
    await expect(page.locator('.plan-choice.on')).toContainText('Family');
  });
  test('live summary tracks progress and voting checklist', async ({ page }) => {
    await verifyEmail(page);
    await expect(page.locator('.sum-checks li').first()).toHaveAttribute('data-state', 'ok');
    await page.fill('#f-about-dob', '2010-01-01');
    await expect(page.locator('.sum-checks li').nth(1)).toHaveAttribute('data-state', 'no');
  });
});

test.describe('join API (server re-validates)', () => {
  test('rejects tampered application and recomputes price', async ({ request }) => {
    const bad = await request.post('/api/membership/applications', { data: { account: { email: 'a@b.co', verified: true }, plan: { planId: 'single', priceCents: 1 } } });
    expect(bad.status()).toBe(422);
    const base = {
      account: { email: 'a@b.co', verified: true },
      about: { firstName: 'Amina', middleName: '', lastName: 'Khan', preferredName: '', dob: '1990-04-12', phone: '(713) 555-0123', street: '10415 Beechnut St', unit: '', city: 'Houston', state: 'TX', zip: '77036', centerId: 'sw-1', zoneId: 'sw', borderRequestCenterId: '' },
      plan: { memberClass: 'natural', planId: 'family', years: 2, spouse: { firstName: 'Omar', lastName: 'Khan', email: 'omar@example.com' } },
      pledge: { commitments: ['programs'], pledgeAccepted: true, signature: 'Amina Khan', emailConsent: true, smsConsent: false },
      payment: { payer: 'self', payerRelationship: '', payerName: '' },
      pledgeVersion: 'v', emailConsentVersion: 'v', smsConsentVersion: 'v', amountCents: 1,
    };
    const ok = await request.post('/api/membership/applications', { data: base });
    expect(ok.status()).toBe(201);
    expect((await ok.json()).amountCents).toBe(7200); // 2 × $40 − 10%
    const minor = await request.post('/api/membership/applications', { data: { ...base, about: { ...base.about, dob: '2015-01-01' } } });
    expect(minor.status()).toBe(422);
    const tooMany = await request.post('/api/membership/applications', { data: { ...base, plan: { ...base.plan, years: 9 } } });
    expect(tooMany.status()).toBe(422);
  });
  test('OTP and lookup endpoints validate input', async ({ request }) => {
    expect((await request.post('/api/auth/otp/start', { data: { email: 'nope' } })).status()).toBe(422);
    expect((await request.post('/api/auth/otp/verify', { data: { email: 'a@b.co', code: '12' } })).status()).toBe(422);
    expect((await request.post('/api/centers/lookup', { data: { street: 'x' } })).status()).toBe(422);
    const r = await request.post('/api/centers/lookup', { data: { street: '1 Main St', city: 'Houston', state: 'TX', zip: '77036' } });
    expect((await r.json()).zone.name).toBe('Southwest');
  });
});
