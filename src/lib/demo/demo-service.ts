/**
 * DEMO SERVICE – runs entirely in the browser. NO network / API calls (owner request 2026-10-13:
 * "do not call any API for the time, keep everything dummy, just see the process").
 *
 * Same function shapes the real BE service will have, so swapping later is one import:
 *   sendCode → POST /public/auth/otp/start     verifyCode → POST /public/auth/otp/verify
 *   lookupAddress → POST /public/residency/lookup   submitApplication → POST /public/membership/applications
 *   subscribe → POST /public/newsletter/subscriptions   sendFeedback / fileComplaint / verifyMembership → BE (planned)
 *   give → POST /public/giving/donations (Stripe Checkout / PaymentIntent, planned)
 * Speed (owner 2026-10-13: "it's taking time for completing the actions"):
 *   NEXT_PUBLIC_DEMO_SPEED = fast (default, ~¼ of a real network round trip) | real (full delays, to review loader steps) | instant
 *   (or per browser: localStorage 'isgh-demo-speed')
 */
import { mockLookup, type LookupResult } from '@/lib/join/residency';

export const DEMO = true;
export const DEMO_CODE = '123456';

/** Reviewers can switch speed in the browser too: localStorage 'isgh-demo-speed' = fast | real | instant */
export function demoSpeedFactor() {
  let speed = process.env.NEXT_PUBLIC_DEMO_SPEED ?? 'fast';
  try { speed = (typeof window !== 'undefined' && localStorage.getItem('isgh-demo-speed')) || speed; } catch { /* storage blocked */ }
  return speed === 'real' ? 1 : speed === 'instant' ? 0 : 0.25;
}
const wait = (ms = 450) => new Promise((r) => setTimeout(r, Math.round(ms * demoSpeedFactor())));
const ref = (prefix: string) => `${prefix}-${Math.floor(100000 + Math.random() * 899999)}`;

/** Emails that pretend to already be members (to show the "sign in instead" path). */
const EXISTING = ['member@example.com', 'aisha@example.com'];

export async function sendCode(email: string) {
  await wait(850);
  return { sent: true, demoCode: DEMO_CODE, email };
}

export async function verifyCode(email: string, code: string) {
  await wait(650);
  if (code !== DEMO_CODE) return { ok: false as const, error: 'invalid_code' as const };
  return { ok: true as const, existingMember: EXISTING.includes(email.trim().toLowerCase()) };
}

export async function lookupAddress(a: { street: string; city: string; state: string; zip: string }): Promise<LookupResult> {
  await wait(1100);
  return mockLookup(a);
}

export async function submitApplication(totalCents: number) {
  await wait(2400);
  return { applicationId: ref('APP-2027'), amountCents: totalCents, payment: { mode: 'demo', status: 'paid' } };
}

export async function subscribe(email: string) {
  await wait(900);
  return { status: 'pending_confirmation', email };
}

export async function sendFeedback(input: { rating: number; topic: string; comment: string }) {
  await wait(1000);
  return { reference: ref('FB'), ...input };
}

export async function fileComplaint(input: { category: string; anonymous: boolean }) {
  await wait(1500);
  return { reference: ref('CMP'), category: input.category, respondWithinDays: input.anonymous ? null : 5 };
}

/** Privacy-first public check: needs member ID + last name + ZIP; returns only active / not found. */
export async function verifyMembership(input: { memberId: string; lastName: string; zip: string }) {
  await wait(1200);
  const ok = /^HOU-\d{6}$/i.test(input.memberId.trim()) && input.lastName.trim().length > 1 && /^\d{5}$/.test(input.zip);
  return ok && !input.memberId.endsWith('0')
    ? { found: true as const, status: 'Active' as const, validThrough: '12/31/2027', votingEligible: true }
    : { found: false as const };
}

/* ---------- address suggestions (demo autocomplete; real: address API via BE) ---------- */
const STREETS: [string, string, string][] = [
  ['10415 Beechnut St', 'Houston', '77072'], ['3110 Eastside St', 'Houston', '77098'], ['6233 Hillcroft St', 'Houston', '77081'],
  ['8830 Bellaire Blvd', 'Houston', '77036'], ['12100 Westheimer Rd', 'Houston', '77077'], ['1207 Conrad Sauer Dr', 'Houston', '77043'],
  ['16700 Old Louetta Rd', 'Spring', '77379'], ['2500 Watts Rd', 'Houston', '77030'], ['11815 Adel Rd', 'Houston', '77067'],
  ['4100 Highway 6', 'Sugar Land', '77478'], ['1919 Pasadena Blvd', 'Pasadena', '77502'], ['3130 Smith Ranch Rd', 'Pearland', '77584'],
  ['5115 Aldine Mail Rte', 'Houston', '77039'], ['15000 Bammel North Houston Rd', 'Houston', '77014'], ['7101 Bissonnet St', 'Houston', '77074'],
];
export function suggestAddresses(q: string) {
  const s = q.trim().toLowerCase();
  if (s.length < 3) return [];
  return STREETS.filter(([st]) => st.toLowerCase().includes(s) || st.split(' ')[0] === s.split(' ')[0])
    .slice(0, 5).map(([street, city, zip]) => ({ street, city, state: 'TX', zip }));
}

/* ---------- email typo help ---------- */
const DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'live.com', 'msn.com'];
function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
/** "amina@gmial.com" → "amina@gmail.com" (null when it looks fine) */
export function suggestEmail(email: string): string | null {
  const m = email.trim().toLowerCase().match(/^([^@\s]+)@([^@\s]+)$/);
  if (!m || DOMAINS.includes(m[2])) return null;
  const best = DOMAINS.map((dm) => [dm, distance(m[2], dm)] as const).sort((x, y) => x[1] - y[1])[0];
  return best && best[1] > 0 && best[1] <= 2 ? `${m[1]}@${best[0]}` : null;
}

/* ---------- Continue with Google (DEMO) ----------
 * Real: Google Identity Services / OAuth 2.0 (OpenID Connect) handled by BE module B1:
 *   button → Google consent → BE verifies the ID token (aud, iss, exp, email_verified) → session cookie.
 *   Google gives a verified email + name; we still ask date of birth, phone and address (Bylaws).
 * Demo: a clearly labeled picker with sample accounts – no Google call is made.
 */
export const DEMO_GOOGLE_ACCOUNTS = [
  { email: 'amina.khan@gmail.com', firstName: 'Amina', lastName: 'Khan' },
  { email: 'yusuf.rahman@gmail.com', firstName: 'Yusuf', lastName: 'Rahman' },
  { email: 'member@example.com', firstName: 'Imran', lastName: 'Siddiqui' }, // existing (life) member
];
export async function googleSignIn(account: (typeof DEMO_GOOGLE_ACCOUNTS)[number]) {
  await wait(900);
  return { ok: true as const, provider: 'google' as const, emailVerified: true, ...account, existingMember: EXISTING.includes(account.email) };
}

/* ---------- Give to a need (DEMO – no payment) ---------- */
export async function give(input: { needId: string; amountCents: number; fund: 'zakat' | 'sadaqah'; monthly: boolean; anonymous: boolean }) {
  await wait(2200);
  return { receipt: ref('GIFT'), ...input };
}
