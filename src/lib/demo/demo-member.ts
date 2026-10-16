'use client';
/**
 * DEMO member accounts + session (browser only, no API).
 * Real (BE module B1/B3): sign-in by email code or Google → httpOnly session cookie;
 *   GET /member/me → profile, memberships, household, eligibility, payments (shape below = the contract draft).
 * The demo keeps the signed-in email in sessionStorage (cleared when the tab closes).
 */
import { useEffect, useState } from 'react';

export type CheckState = 'ok' | 'todo' | 'wait' | 'no';
export type DemoMember = {
  email: string; firstName: string; lastName: string; memberId: string;
  plan: 'Single' | 'Family' | 'Life'; memberSince: number;
  status: 'Active' | 'Expired' | 'Pending approval';
  validThrough: string | null;              // null = lifetime
  paidThroughYear: number | null;           // last calendar year with own dues paid (null = Life)
  zone: string; center: string;
  phone: string; address: string[];
  household?: { name: string; relation: string; status: string }[];
  checks: { label: string; state: CheckState; note: string }[];   // voting eligibility for the NEXT election year
  payments: { date: string; label: string; amountCents: number; receipt: string }[];
  idVerified: boolean;
  /** Manual groups this person is in (demo; BE: from group membership). Automatic groups follow their rules. */
  groupIds?: string[];
};

export const DEMO_MEMBERS: Record<string, DemoMember> = {
  'aisha@example.com': {
    email: 'aisha@example.com', firstName: 'Aisha', lastName: 'Rahman', memberId: 'HOU-204781',
    plan: 'Family', memberSince: 2019, status: 'Active', validThrough: '2026-12-31', paidThroughYear: 2026,
    zone: 'Southwest', center: 'Southwest Islamic Center 1', phone: '(713) 555-0142', address: ['10415 Beechnut St', 'Houston, TX 77072'],
    household: [{ name: 'Omar Rahman', relation: 'Spouse', status: 'Active · own profile complete' }],
    checks: [
      { label: 'Application approved by the Board', state: 'ok', note: 'Approved March 3, 2019' },
      { label: 'Age 18 or older on June 30', state: 'ok', note: 'Confirmed from date of birth' },
      { label: 'Commitment chosen', state: 'ok', note: 'Volunteer in approved activities' },
      { label: 'Lives in the service area', state: 'ok', note: 'Southwest zone' },
      { label: 'Own 2027 dues paid by June 30, 2027', state: 'todo', note: 'Renewal opens November 1, 2026' },
      { label: 'Photo ID verified', state: 'wait', note: 'Upload a Texas ID or driver license' },
    ],
    payments: [
      { date: '2026-02-14', label: '2026 Family membership', amountCents: 4000, receipt: 'R-2026-00871' },
      { date: '2025-01-09', label: '2025 Family membership', amountCents: 4000, receipt: 'R-2025-00314' },
      { date: '2024-03-22', label: '2024 Family membership', amountCents: 4000, receipt: 'R-2024-01102' },
    ],
    idVerified: false,
  },
  'member@example.com': {
    email: 'member@example.com', firstName: 'Imran', lastName: 'Siddiqui', memberId: 'HOU-100562', groupIds: ['nominees-2026'],
    plan: 'Life', memberSince: 2011, status: 'Active', validThrough: null, paidThroughYear: null,
    zone: 'North', center: 'North Islamic Center 3', phone: '(281) 555-0199', address: ['16700 Old Louetta Rd', 'Spring, TX 77379'],
    checks: [
      { label: 'Application approved by the Board', state: 'ok', note: 'Approved 2011' },
      { label: 'Age 18 or older on June 30', state: 'ok', note: 'Confirmed' },
      { label: 'Commitment chosen', state: 'ok', note: 'Regular participation in an ISGH program' },
      { label: 'Lives in the service area', state: 'ok', note: 'North zone' },
      { label: 'Dues', state: 'ok', note: 'Life member – no annual dues' },
      { label: 'Photo ID verified', state: 'ok', note: 'Verified May 2024' },
    ],
    payments: [{ date: '2015-06-01', label: 'Life membership', amountCents: 100000, receipt: 'R-2015-00042' }],
    idVerified: true,
  },
  /** M4 demo: a member who also runs a masjid (Associate Director) and represents a ZIP code – three dashboards. */
  'ad.se1@example.org': {
    email: 'ad.se1@example.org', firstName: 'Yasir', lastName: 'Karim', memberId: 'HOU-DEMO-AD',
    plan: 'Single', memberSince: 2014, status: 'Active', validThrough: '2026-12-31', paidThroughYear: 2026,
    zone: 'Southeast', center: 'Southeast Islamic Center 1', phone: '(281) 555-0177', address: ['2210 Bay Area Blvd', 'Houston, TX 77062'],
    checks: [
      { label: 'Application approved by the Board', state: 'ok', note: 'Approved 2014' },
      { label: 'Age 18 or older on June 30', state: 'ok', note: 'Confirmed' },
      { label: 'Commitment chosen', state: 'ok', note: 'Volunteer in approved activities' },
      { label: 'Lives in the service area', state: 'ok', note: 'Southeast zone · ZIP 77062' },
      { label: 'Own 2027 dues paid by June 30, 2027', state: 'todo', note: 'Renewal opens November 1, 2026' },
      { label: 'Photo ID verified', state: 'ok', note: 'Verified 2025' },
    ],
    payments: [{ date: '2026-01-20', label: '2026 Single membership', amountCents: 2500, receipt: 'R-2026-00212' }],
    idVerified: true,
  },
};
/** Google demo account Imran Siddiqui uses member@example.com; Amina/Yusuf are not members (shows the "join" path). */

const KEY = 'isgh-demo-session';
export const SESSION_EVENT = 'isgh-session';

export function getSessionEmail(): string | null {
  try { return sessionStorage.getItem(KEY); } catch { return null; }
}
/** `silent` = do not notify open views (used on sign-out so the member home does not redirect to sign-in first). */
export function setSession(email: string | null, silent = false) {
  try { if (email) sessionStorage.setItem(KEY, email); else sessionStorage.removeItem(KEY); } catch { /* storage blocked */ }
  if (!silent) window.dispatchEvent(new Event(SESSION_EVENT));
}
/** Demo: groups joined or asked for in this tab (live: POST /member/groups/{id} and the member's record). */
const GROUPS_KEY = 'isgh-demo-groups';
type GroupState = { ids: string[]; requested: string[] };
const readGroupState = (): Record<string, GroupState> => { try { return JSON.parse(sessionStorage.getItem(GROUPS_KEY) || '{}'); } catch { return {}; } };
export function memberGroups(m: DemoMember): GroupState {
  const s = typeof window === 'undefined' ? undefined : readGroupState()[m.email];
  return s ?? { ids: m.groupIds ?? [], requested: [] };
}
export function saveMemberGroups(m: DemoMember, st: GroupState) {
  try { sessionStorage.setItem(GROUPS_KEY, JSON.stringify({ ...readGroupState(), [m.email]: st })); } catch { /* private mode */ }
  window.dispatchEvent(new Event(SESSION_EVENT));
}
export function findMember(email: string | null | undefined): DemoMember | null {
  return email ? DEMO_MEMBERS[email.trim().toLowerCase()] ?? null : null;
}
/** Only allow same-site relative redirects after sign-in (no open redirect). */
export function safeNext(raw: string | null | undefined, fallback = '/portal') {
  return raw && /^\/(?!\/)[\w\-/?=&.]*$/.test(raw) ? raw : fallback;
}

/** Header/menu: swap "Sign in" for "My membership" while a demo session exists. */
export function useSignedInName(): string | null {
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    const read = () => setName(findMember(getSessionEmail())?.firstName ?? null);
    read(); window.addEventListener(SESSION_EVENT, read);
    return () => window.removeEventListener(SESSION_EVENT, read);
  }, []);
  return name;
}
