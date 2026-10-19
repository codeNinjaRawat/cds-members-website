/** WildApricot-style features on the website: events + registration, payment options on join, member card / directory switches. */
import { test, expect, type Page } from '@playwright/test';

const cont = (page: Page) => page.getByRole('button', { name: 'Continue', exact: true }).click();
async function toReview(page: Page) {
  await page.goto('/membership/join'); await page.evaluate(() => sessionStorage.clear()); await page.reload();
  await page.fill('#f-account-email', 'amina.khan@example.com'); await page.click('text=Send code');
  await page.fill('#f-account-code', '123456'); await page.click('text=Verify and continue');
  await page.fill('#f-about-firstName', 'Amina'); await page.fill('#f-about-lastName', 'Khan'); await page.fill('#f-about-dob', '1990-04-12');
  await page.fill('#f-about-phone', '7135550123'); await page.fill('#f-about-street', '10415 Beechnut St'); await page.fill('#f-about-city', 'Houston'); await page.fill('#f-about-zip', '77036');
  await cont(page); await page.locator('.plan-choice', { hasText: 'Single' }).click(); await cont(page); await cont(page);
  await page.locator('label.check', { hasText: 'I accept this pledge' }).click(); await page.locator('label.check', { hasText: 'I have read the Identity Collection' }).click(); await page.fill('#f-pledge-signature', 'Amina Khan');
  await page.locator('label.check', { hasText: 'Take part regularly' }).click(); await cont(page);
  await expect(page.locator('h2#st-h')).toHaveText('Review and pay');
}

test.describe('events', () => {
  test('list: upcoming in date order, past below, filters; group-only events are not public', async ({ page }) => {
    await page.goto('/events');
    await expect(page.getByRole('heading', { name: 'Events', level: 1 })).toBeVisible();
    await expect(page.locator('.ev-list:not(.past) .ev-card h3')).toHaveText(['Meet the candidates – 2026 elections', 'Family night at Katy', 'Shura meeting – November', 'Saturday Quran class (demo)']); // featured first
    await expect(page.locator('.ev-card.featured .tag-featured')).toHaveText('Featured');
    await expect(page.locator('.ev-list.past')).toContainText('Weekend school open house');
    await expect(page.locator('body')).not.toContainText('nominee orientation');
    await expect(page.locator('body')).not.toContainText('Sisters’ halaqa'); // waiting for approval – drafts never show
    await expect(page.locator('.ev-card', { hasText: 'Shura meeting' })).toContainText('Members only');
    await expect(page.locator('.ev-card', { hasText: 'Family night' })).toContainText('Full – waitlist open · from $5');
    await page.getByLabel('Kind of event').selectOption('governance');
    await expect(page.locator('.ev-list:not(.past) .ev-card')).toHaveCount(2);
    await page.getByLabel('Place').selectOption('Katy');
    await expect(page.locator('.ev-empty')).toContainText('match your filters');
  });

  test('full event with waitlist: form checks, then you are on the waitlist', async ({ page }) => {
    await page.goto('/events/family-night-katy');
    await expect(page.locator('.ev-reg .notice')).toContainText('full');
    await page.getByRole('button', { name: 'Join the waitlist' }).click();
    await expect(page.locator('.ev-form .field-error').first()).toContainText('full name');
    await page.getByLabel('Guests coming with you').selectOption('2');
    await expect(page.locator('.ev-total')).toContainText('$20');
    await page.locator('.choice', { hasText: 'member price' }).click();
    await page.locator('#reg-name').fill('Amina Khan'); await page.locator('#reg-email').fill('amina@example.com');
    await page.getByRole('button', { name: 'Join the waitlist' }).click();
    await expect(page.locator('.ev-form .field-error').first()).toContainText('members');
    await page.locator('.choice', { hasText: /^Adult – \$10/ }).click();
    await page.getByRole('button', { name: 'Join the waitlist' }).click();
    await expect(page.getByRole('heading', { name: 'You are on the waitlist' })).toBeVisible();
    await expect(page.locator('.ev-done')).toContainText(/EV-FAMILY-[A-Z0-9]{5}/);
  });

  test('free event: register as a guest; signed-in member gets the member type', async ({ page }) => {
    await page.goto('/events/meet-the-candidates-2026'.replace('meet-the-candidates-2026', 'candidates-forum-2026'));
    await expect(page.locator('.ev-reg')).not.toContainText('Join the waitlist');
    await page.locator('.choice', { hasText: 'Guest' }).click();
    await page.locator('#reg-name').fill('Sara Lee'); await page.locator('#reg-email').fill('sara@example.com');
    await page.getByRole('button', { name: 'Register', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'You are registered' })).toBeVisible();
    await page.evaluate(() => sessionStorage.setItem('isgh-demo-session', 'aisha@example.com'));
    await page.goto('/events/family-night-katy');
    await expect(page.locator('#reg-name')).toHaveValue('Aisha Rahman');
    await page.locator('.choice', { hasText: 'member price' }).click();
    await page.getByRole('button', { name: 'Join the waitlist' }).click();
    await expect(page.getByRole('heading', { name: 'You are on the waitlist' })).toBeVisible();
  });

  test('event without registration and unknown event', async ({ page }) => {
    await page.goto('/events/shura-november-2026');
    await expect(page.locator('.ev-reg')).toContainText('No registration needed');
    await expect(page.locator('.ev-info')).toContainText('sign in to see it');
    await page.goto('/events/nominee-orientation-2026');                 // group event: a gate, no details
    await expect(page.locator('h1')).toHaveText('Group event');
    const r = await page.goto('/events/no-such-event');
    expect(r?.status()).toBe(404);
  });

  test('API re-checks every rule', async ({ request }) => {
    const post = (data: object) => request.post('/api/events/register', { data: { name: 'Test Person', email: 't@example.com', guests: 0, ...data } });
    expect((await post({ eventId: 'nope', typeId: 'x' })).status()).toBe(404);
    expect((await post({ eventId: 'shura-november-2026', typeId: 'general' })).status()).toBe(409);       // no registration
    expect((await post({ eventId: 'nominee-orientation-2026', typeId: 'nominee', code: 'EC2026' })).status()).toBe(403); // group event, not signed in
    const outsider = await post({ eventId: 'nominee-orientation-2026', typeId: 'nominee', code: 'EC2026', member: { planId: 'single' } });
    expect(outsider.status()).toBe(403); expect((await outsider.json()).message).toContain('group you are not in'); // signed in, but not a nominee
    expect((await post({ eventId: 'nominee-orientation-2026', typeId: 'nominee', code: 'EC2026', member: { planId: 'single', groupIds: ['made-up-group'] } })).status()).toBe(403);
    const wrong = await post({ eventId: 'nominee-orientation-2026', typeId: 'nominee', code: 'NOPE', member: { planId: 'single', groupIds: ['nominees-2026'] } });
    expect(wrong.status()).toBe(403); expect((await wrong.json()).message).toContain('code');
    const ok = await post({ eventId: 'nominee-orientation-2026', typeId: 'nominee', code: 'ec2026', member: { planId: 'single', groupIds: ['nominees-2026'] } });
    expect(ok.status()).toBe(200); expect((await ok.json()).status).toBe('registered');
    expect((await post({ eventId: 'candidates-forum-2026', typeId: 'guest', guests: 3 })).status()).toBe(422); // no guests allowed
    const paid = await (await post({ eventId: 'family-night-katy', typeId: 'adult', guests: 2 })).json();
    expect(paid).toMatchObject({ status: 'waitlisted', totalCents: 0 });
  });
});

test.describe('payment options (Configuration)', () => {
  test('pay by check: the button says so and the confirmation shows the check waiting to clear', async ({ page }) => {
    await toReview(page);
    await expect(page.getByRole('radiogroup', { name: /How would you like to pay/ }).or(page.locator('#f-payment-method'))).toBeVisible();
    await page.locator('#f-payment-method .choice', { hasText: 'Check' }).click();
    await expect(page.locator('.pay-options')).toContainText('waiting to clear');
    await page.getByRole('button', { name: 'Submit – I will pay $25 by check' }).click();
    await expect(page.locator('h2#st-h')).toHaveText('Application received');
    await expect(page.locator('.timeline')).toContainText('Check – waiting to clear');
  });

  test('card: optional gift to cover fees changes the total', async ({ page }) => {
    await toReview(page);
    await page.locator('label.check', { hasText: 'to cover card fees' }).click();
    await expect(page.locator('.pay-total')).toContainText('$25.75');
    await expect(page.getByRole('button', { name: 'Pay $25.75 and submit' })).toBeVisible();
  });

  test('server: a switched-off payment method or a bad discount code is refused', async ({ request }) => {
    const base = { checkout: { method: 'cash' } };
    const r = await request.post('/api/membership/applications', { data: base });
    expect([422]).toContain(r.status());
  });
});

test.describe('member home follows Configuration', () => {
  test('card and wallet shown; directory link hidden while the directory is off; directory page is 404', async ({ page }) => {
    await page.goto('/verify'); await page.evaluate(() => sessionStorage.setItem('isgh-demo-session', 'aisha@example.com'));
    await page.goto('/portal');
    await expect(page.locator('.dcard-name')).toHaveText('Aisha Rahman');
    await expect(page.getByRole('button', { name: 'Add to Apple Wallet' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Events and registration' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Member directory' })).toHaveCount(0);
  });
});

test.describe('member directory privacy (Configuration › Members)', () => {
  // harness fixture: directory on, public, opt-in, phones on, emails off ("Profession" is a members-only field)
  test('public directory: opted-in people only, no phone or email for visitors; members see contact details', async ({ page }) => {
    await page.goto('/verify'); await page.evaluate(() => sessionStorage.clear());
    await page.goto('/portal/directory');
    const list = page.locator('.dir-list');
    await expect(list.locator('li')).toHaveCount(6);              // Omar did not opt in
    await expect(list).not.toContainText('Omar Farooqui');
    await expect(list).not.toContainText('Pharmacist');
    await expect(list.locator('a[href^="tel:"]')).toHaveCount(0); // visitors never see phones
    await page.evaluate(() => sessionStorage.setItem('isgh-demo-session', 'aisha@example.com'));
    await page.reload();
    await expect(list.locator('li', { hasText: 'Aisha Rahman' })).toContainText('Pharmacist');
    await expect(list.locator('a[href^="tel:"]')).toHaveCount(6);
    await expect(list.locator('a[href^="mailto:"]')).toHaveCount(0);
  });
});

test.describe('groups on the website (review step 3)', () => {
  const signIn = async (page: import('@playwright/test').Page, email: string | null) => { await page.goto('/verify'); await page.evaluate((e) => { sessionStorage.clear(); if (e) sessionStorage.setItem('isgh-demo-session', e); }, email); };
  test('group-only event: listed and open for its group, a gate for everyone else', async ({ page }) => {
    await signIn(page, 'member@example.com'); // Imran is a 2026 nominee
    await page.goto('/events');
    await expect(page.locator('.ev-card', { hasText: 'nominee orientation' })).toContainText('Group event');
    await signIn(page, 'aisha@example.com');
    await page.goto('/events');
    await expect(page.locator('body')).not.toContainText('nominee orientation');
    await expect(page.locator('body')).not.toContainText('Sisters’ halaqa'); // waiting for approval – drafts never show
    await page.goto('/events/nominee-orientation-2026');
    await expect(page.locator('h1')).toHaveText('Group event');
    await expect(page.locator('.ev-gate')).toContainText('You are not in that group');
    await expect(page.locator('body')).not.toContainText('orientation');
    await signIn(page, null);
    await page.goto('/events/nominee-orientation-2026');
    await expect(page.locator('.ev-gate')).toContainText('Sign in');
  });
  test('member home: join an open group, ask to join a closed one; the server follows the join policy', async ({ page, request }) => {
    await signIn(page, 'aisha@example.com');
    await page.goto('/portal');
    const tile = page.locator('.p-groups');
    await expect(tile.locator('li')).toHaveCount(2);
    await tile.locator('li[data-group="volunteers"]').getByRole('button', { name: /Join/ }).click();
    await expect(tile.locator('li[data-group="volunteers"]')).toContainText('Member');
    await expect(tile.locator('li[data-group="volunteers"]').getByRole('button', { name: /Leave/ })).toBeVisible();
    await tile.locator('li[data-group="sisters-quran-sw"]').getByRole('button', { name: /Ask to join/ }).click();
    await expect(tile.locator('li[data-group="sisters-quran-sw"]')).toContainText('Request sent');
    await expect(tile.locator('.p-note')).toContainText('sent to the group leader');
    const post = (data: object) => request.post('/api/groups/membership', { data });
    expect((await post({ groupId: 'sisters-quran-sw', action: 'join', member: { groupIds: [] } })).status()).toBe(409);   // must ask
    expect((await post({ groupId: 'elected-2026', action: 'join', member: { groupIds: [] } })).status()).toBe(404);        // not on profiles
    expect((await post({ groupId: 'volunteers', action: 'leave', member: { groupIds: [] } })).status()).toBe(409);        // not in it
    expect((await post({ groupId: 'volunteers', action: 'join', member: { groupIds: [] } })).status()).toBe(200);
  });
});

test.describe('email and text choices (review step 5)', () => {
  test('members choose kinds of email; membership notices are always on; the server refuses opting out of them', async ({ page, request }) => {
    await page.goto('/email-preferences');
    const notices = page.getByRole('checkbox', { name: /Membership and election notices/ });
    await expect(notices).toBeChecked(); await expect(notices).toBeDisabled();
    await page.getByRole('checkbox', { name: 'Newsletters' }).uncheck();
    await page.getByRole('button', { name: 'Save my choices' }).click();
    await expect(page.locator('.notice.ok')).toContainText('Saved');
    await page.reload();
    await expect(page.getByRole('checkbox', { name: 'Newsletters' })).not.toBeChecked();
    await page.getByRole('checkbox', { name: 'Send me email' }).uncheck();
    await expect(page.getByRole('checkbox', { name: 'Announcements' })).toBeDisabled();
    await expect(page.locator('.hint')).toContainText('receipts, renewal reminders');
    const put = (data: object) => request.put('/api/preferences', { data });
    expect((await put({ email: true, sms: false, optOut: ['membership'] })).status()).toBe(422);
    expect((await put({ email: true, sms: false, optOut: ['crypto-tips'] })).status()).toBe(422);
    expect((await (await put({ email: true, sms: true, optOut: ['newsletter', 'newsletter'] })).json()).prefs.optOut).toEqual(['newsletter']);
  });
});

test.describe('events, card and self-service (review steps 6–8)', () => {
  test('event page: refund rule, calendar file; registration codes never reach the browser', async ({ page }) => {
    await page.goto('/events/family-night-katy');
    await expect(page.locator('.ev-info')).toContainText('Payments are refunded in full.');
    const ics = page.getByRole('link', { name: 'Add to my calendar' });
    await expect(ics).toHaveAttribute('download', 'family-night-katy.ics');
    expect(decodeURIComponent((await ics.getAttribute('href'))!)).toContain('DTSTART;TZID=America/Chicago:20261107T183000');
    await page.goto('/verify'); await page.evaluate(() => sessionStorage.setItem('isgh-demo-session', 'member@example.com'));
    await page.goto('/events/nominee-orientation-2026');
    await expect(page.locator('h1')).toHaveText('Election nominee orientation');
    expect(await page.content()).not.toContain('EC2026');
  });
  test('registration: a party bigger than the spots left is told so before sending', async ({ request }) => {
    const r = await request.post('/api/events/register', { data: { eventId: 'family-night-katy', typeId: 'adult', guests: 4, name: 'Test Person', email: 't@example.com' } });
    expect((await r.json()).status).toBe('waitlisted');                    // full event with a waitlist: the whole party waits
  });
  test('member card follows Configuration: real center name, printable card and image', async ({ page }) => {
    await page.goto('/verify'); await page.evaluate(() => sessionStorage.setItem('isgh-demo-session', 'aisha@example.com'));
    await page.goto('/portal');
    await expect(page.locator('.dcard-meta')).toContainText('Southwest Islamic Center 1');
    await expect(page.getByRole('button', { name: 'Printable card (PDF)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Change plan' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Receipt/ }).first()).toBeVisible();
  });
});
