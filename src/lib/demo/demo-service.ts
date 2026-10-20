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
import { LIVE, be } from '@/lib/live/live';
import type { Dashboard } from '@/lib/community/sign-in';

/** Demo mode (no API). In live mode (NEXT_PUBLIC_LIVE_API=1) every function below calls the API through /api/be. */
export const DEMO = !LIVE;
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

/** `join`: proves the email for a membership application · `signin`: a sign-in code (email or phone). */
export type CodePurpose = 'signin' | 'join';
let joinToken = '';
export const liveJoinToken = () => joinToken || (() => { try { return sessionStorage.getItem('ms-join-token') ?? ''; } catch { return ''; } })();
/** Live: the 30-day link to the application saved on the server (kept in this browser so a closed tab loses nothing). */
const RESUME_KEY = 'ms-join-resume';
export const liveResumeToken = () => { try { return localStorage.getItem(RESUME_KEY) ?? ''; } catch { return ''; } };
const keepResume = (t: string) => { try { if (t) localStorage.setItem(RESUME_KEY, t); else localStorage.removeItem(RESUME_KEY); } catch { /* storage off */ } };
export const forgetSavedApplication = () => { keepResume(''); joinToken = ''; try { sessionStorage.removeItem('ms-join-token'); } catch { /* */ } };
export type SavedApplication = { email: string; step: string; data: Record<string, unknown>; resumeToken: string };
export type AlreadyApplied = { applicationId: string | null; submittedOn: string | null; status: string };

export async function sendCode(email: string, purpose: CodePurpose = 'signin') {
  if (LIVE) {
    const r = purpose === 'join' ? await be<{ devCode?: string }>('POST', 'public/join/email/start', { email }) : await be<{ devCode?: string }>('POST', 'auth/code/start', { address: email });
    if (!r.ok) throw new Error(r.message);
    return { sent: true, demoCode: r.data.devCode ?? '', email };
  }
  await wait(850);
  return { sent: true, demoCode: DEMO_CODE, email };
}

export async function verifyCode(email: string, code: string, purpose: CodePurpose = 'signin'): Promise<{ ok: true; existingMember: boolean; dashboards?: Dashboard[]; current?: number; saved?: SavedApplication | null; alreadyApplied?: AlreadyApplied } | { ok: false; error: 'invalid_code' | 'unavailable' | 'already_applied'; message?: string }> {
  if (LIVE) {
    if (purpose === 'join') {
      const r = await be<{ joinToken?: string; resumeToken?: string; resumed?: boolean; step?: string; data?: Record<string, unknown>; alreadyApplied?: AlreadyApplied }>('POST', 'public/join/email/verify', { email, code });
      if (!r.ok && r.status === 409 && r.data.code === 'already-member') return { ok: true, existingMember: true };   // shows "sign in / renew"
      if (!r.ok) return { ok: false, error: r.status === 0 ? 'unavailable' : r.status === 409 ? 'already_applied' : 'invalid_code', message: r.message };
      if (r.data.alreadyApplied) return { ok: true, existingMember: false, alreadyApplied: r.data.alreadyApplied };   // shown, not refused
      joinToken = r.data.joinToken ?? ''; try { sessionStorage.setItem('ms-join-token', joinToken); } catch { /* */ }
      keepResume(r.data.resumeToken ?? '');
      const data = r.data.data ?? {};
      return { ok: true, existingMember: false, saved: r.data.resumed && Object.keys(data).length ? { email, step: r.data.step ?? 'about', data, resumeToken: r.data.resumeToken ?? '' } : null };
    }
    const r = await be<{ dashboards: Dashboard[]; current: number }>('POST', 'auth/code/verify', { address: email, code });
    if (!r.ok) return { ok: false, error: r.status === 0 ? 'unavailable' : 'invalid_code', message: r.message };
    return { ok: true, existingMember: r.data.dashboards.some((d) => d.kind === 'member'), dashboards: r.data.dashboards, current: r.data.current };
  }
  await wait(650);
  if (code !== DEMO_CODE) return { ok: false as const, error: 'invalid_code' as const };
  return { ok: true as const, existingMember: EXISTING.includes(email.trim().toLowerCase()) };
}

/** Live: email + password (when the organization allows passwords). */
export async function passwordSignIn(email: string, password: string) {
  const r = await be<{ dashboards: Dashboard[]; current: number }>('POST', 'auth/password', { email, password });
  return r.ok ? { ok: true as const, dashboards: r.data.dashboards, current: r.data.current } : { ok: false as const, message: r.message };
}
/** Live: switch the session to another dashboard (re-checked by the API). */
export async function openDashboard(index: number) { return (await be('POST', 'auth/dashboard', { index })).ok; }

export async function lookupAddress(a: { street: string; city: string; state: string; zip: string }): Promise<LookupResult> {
  if (LIVE) {
    const r = await be<{ zone: string | null; zone_name: string | null; center: string | null; center_name: string | null; nearest: { id: string; name: string; miles: number }[] }>('GET', `public/place?zip=${encodeURIComponent(a.zip.slice(0, 5))}`);
    if (!r.ok) throw new Error(r.message);
    const d = r.data;
    return { inServiceArea: !!d.center, zone: d.zone ? { id: d.zone, name: d.zone_name ?? d.zone } : null, center: d.center ? { id: d.center, name: d.center_name ?? d.center } : null,
      nearBorder: false, alternatives: (d.nearest ?? []).map((n) => ({ id: n.id, name: n.name, zoneName: '', miles: n.miles })), estimate: false };
  }
  await wait(1100);
  return mockLookup(a);
}

export type ApplicationAnswer = { applicationId: string; amountCents: number; payment: { mode?: string; method?: string | null; status: string; paymentIds?: string[]; checkout?: { kind: 'dues'; paymentIds: string[] } | null; next?: string } ; checkoutUrl?: string };
/** Live: `body` is the whole application ({account, about, plan, pledge, payment, custom, checkout, …}); the API checks it all again. */
export async function submitApplication(totalCents: number, body?: Record<string, unknown>): Promise<ApplicationAnswer> {
  if (LIVE) {
    const r = await be<ApplicationAnswer>('POST', 'public/membership/applications', { ...body, joinToken: liveJoinToken(), resumeToken: liveResumeToken() || undefined });
    if (!r.ok) throw Object.assign(new Error(r.message), { fields: (r.data.detail ?? {}) as Record<string, string>, status: r.status, code: String(r.data.code ?? '') });
    forgetSavedApplication();
    const co = r.data.payment?.checkout;
    if (co) { const c = await be<{ url: string }>('POST', 'public/checkout', co); if (c.ok) return { ...r.data, checkoutUrl: c.data.url }; }
    return r.data;
  }
  await wait(2400);
  return { applicationId: ref('APP-2027'), amountCents: totalCents, payment: { mode: 'demo', status: 'paid' } };
}

export async function subscribe(email: string, consentText = 'Send me news and announcements by email. I can unsubscribe at any time.') {
  if (LIVE) { const r = await be('POST', 'public/newsletter', { email, consent: true, consentText }); if (!r.ok) throw new Error(r.message); return { status: 'pending_confirmation', email }; }
  await wait(900);
  return { status: 'pending_confirmation', email };
}

export async function sendFeedback(input: { rating: number; topic: string; comment: string }) {
  if (LIVE) {
    if (!input.comment.trim()) return { reference: '', ...input };   // a "was this page helpful?" click: nothing to file (page analytics later)
    const r = await be<{ id: string }>('POST', 'public/tickets', { kind: 'feedback', anonymous: true, title: `Feedback: ${input.topic}`.slice(0, 140), detail: `Rating ${input.rating}/5\n\n${input.comment}` });
    if (!r.ok) throw new Error(r.message);
    return { reference: r.data.id, ...input };
  }
  await wait(1000);
  return { reference: ref('FB'), ...input };
}

export async function fileComplaint(input: { category: string; anonymous: boolean; title?: string; detail?: string; name?: string; email?: string; phone?: string; center?: string }) {
  if (LIVE) {
    const r = await be<{ id: string }>('POST', 'public/tickets', { kind: 'complaint', anonymous: input.anonymous, title: (input.title || `Complaint: ${input.category}`).slice(0, 140), detail: input.detail ?? '', name: input.name, email: input.email, phone: input.phone, center: input.center });
    if (!r.ok) throw new Error(r.message);
    return { reference: r.data.id, category: input.category, respondWithinDays: input.anonymous ? null : 5 };
  }
  await wait(1500);
  return { reference: ref('CMP'), category: input.category, respondWithinDays: input.anonymous ? null : 5 };
}

/** Privacy-first public check: needs member ID + last name + ZIP; returns only active / not found. */
export async function verifyMembership(input: { memberId: string; lastName: string; zip: string }) {
  if (LIVE) {
    const r = await be<{ found: true; status: 'Active'; validThrough: string; votingEligible: boolean } | { found: false }>('POST', 'public/members/verify', input);
    if (!r.ok) throw new Error(r.message);
    return r.data;
  }
  await wait(1200);
  const ok = /^[A-Z]{2,5}-\d{4,8}$/i.test(input.memberId.trim()) && input.lastName.trim().length > 1 && /^\d{5}$/.test(input.zip);
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
export async function give(input: { needId: string; amountCents: number; fund: 'zakat' | 'sadaqah'; monthly: boolean; anonymous: boolean; name?: string; email?: string }) {
  if (LIVE) {
    const r = await be<{ url: string }>('POST', 'public/checkout', { kind: 'gift', amountCents: input.amountCents, fund: input.fund, campaignId: '', monthly: input.monthly, anonymous: input.anonymous, showName: !input.anonymous, name: input.name ?? '', email: input.email ?? '' });
    if (!r.ok) throw new Error(r.message);
    window.location.assign(r.data.url);   // the card page (Stripe, or the test page while no key is set)
    return { receipt: '', ...input };
  }
  await wait(2200);
  return { receipt: ref('GIFT'), ...input };
}

/* ---------- live: the application saved on the server as they go (nothing typed is lost) ---------- */
/** Autosave – called after changes (debounced). false = could not save just now (the next change tries again). */
export async function saveApplicationDraft(step: string, data: unknown, progress: { index: number; total: number; label: string }): Promise<'saved' | 'offline' | 'expired' | 'sent'> {
  if (!LIVE) return 'saved';
  const token = liveResumeToken(); if (!token) return 'expired';
  const r = await be('PUT', 'public/join/draft', { resumeToken: token, step, data, progress });
  if (r.ok) return 'saved';
  if (r.status === 401) { keepResume(''); return 'expired'; }
  if (r.status === 409) return 'sent';
  return 'offline';
}
/** Open a saved application from its link (or from this browser). */
export async function openSavedApplication(token: string): Promise<{ ok: true; saved: SavedApplication } | { ok: false; reason: 'expired' | 'sent' | 'offline'; message: string }> {
  const r = await be<{ email: string; joinToken: string; resumeToken: string; step: string; data: Record<string, unknown> }>('GET', `public/join/draft/${encodeURIComponent(token)}`);
  if (!r.ok) { if (r.status === 404 || r.status === 409) keepResume(''); return { ok: false, reason: r.status === 409 ? 'sent' : r.status === 404 ? 'expired' : 'offline', message: r.message }; }
  joinToken = r.data.joinToken; try { sessionStorage.setItem('ms-join-token', joinToken); } catch { /* */ }
  keepResume(r.data.resumeToken);
  return { ok: true, saved: { email: r.data.email, step: r.data.step, data: r.data.data, resumeToken: r.data.resumeToken } };
}
/** Save and finish later: email the link (the answers are already saved). */
export async function emailSavedApplication(): Promise<{ sent: boolean; link: string; to?: string; message?: string }> {
  const token = liveResumeToken();
  const link = typeof window === 'undefined' ? '' : `${window.location.origin}/membership/join?resume=${encodeURIComponent(token)}`;
  if (!token) return { sent: false, link: '', message: 'Confirm your email first – then your answers are saved.' };
  const r = await be<{ sent: boolean; to?: string; message?: string }>('POST', 'public/join/draft/link', { resumeToken: token });
  return r.ok ? { sent: r.data.sent, link, to: r.data.to, message: r.data.message } : { sent: false, link, message: r.message };
}

/** J1 – after "About you": is this person (same name + birth date) or this mobile number already on file? Only yes/no. */
export async function checkPerson(a: { firstName: string; lastName: string; dob: string; phone: string }, notMe = false): Promise<{ possibleMember: boolean; phoneOnFile: boolean }> {
  if (!LIVE) return { possibleMember: false, phoneOnFile: false };
  const token = liveResumeToken(); if (!token) return { possibleMember: false, phoneOnFile: false };
  const r = await be<{ possibleMember: boolean; phoneOnFile: boolean }>('POST', 'public/join/check', { resumeToken: token, ...a, notMe });
  return r.ok ? r.data : { possibleMember: false, phoneOnFile: false };   // never block on a failed check – the office still sees duplicates
}
