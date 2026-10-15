'use client';
/**
 * Member home (W5) – DEMO. Reads the demo session; real: GET /member/me (session cookie).
 * Shows: digital card (+ Wallet, QR), status + countdowns, Bylaws voting checklist with one-tap fixes,
 * household, center, payments/receipts, contact details. Signed-out visitors go to /sign-in?next=/portal.
 */
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { findMember, getSessionEmail, setSession, SESSION_EVENT, type CheckState, type DemoMember } from '@/lib/demo/demo-member';
import { formatUSD } from '@/lib/content/membership';
import { LoaderMark } from '@/components/ui/SmartLoader';
import { badgeFor, generations } from '@/lib/family/family';
import { loadFamily } from '@/components/family/MyFamily';

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }) =>
  new Date(iso + 'T12:00:00-06:00').toLocaleDateString('en-US', { timeZone: 'America/Chicago', ...opts });
const daysUntil = (iso: string) => Math.max(0, Math.ceil((new Date(iso + 'T23:59:59-05:00').getTime() - Date.now()) / 86400000));

const ICON: Record<CheckState, string> = { ok: '✓', todo: '!', wait: '…', no: '✕' };
const RECORD_DATE = '2027-06-30';      // admin: Settings › Voting › record date (from membership settings in live mode)
const RENEWAL_OPENS = '2026-11-01';    // admin: Settings › Renewal › opens on

export function MemberHome() {
  const [member, setMember] = useState<DemoMember | null | undefined>(undefined); // undefined = loading
  const [note, setNote] = useState('');

  useEffect(() => {
    const read = () => setMember(findMember(getSessionEmail()));
    read();
    window.addEventListener(SESSION_EVENT, read);
    return () => window.removeEventListener(SESSION_EVENT, read);
  }, []);
  useEffect(() => { if (member === null) window.location.replace('/sign-in?next=/portal'); }, [member]);

  if (!member) {
    return (
      <div className="portal-loading wrap" role="status">
        <LoaderMark size={44} />
        <p>{member === null ? 'Taking you to sign in…' : 'Loading your membership…'}</p>
      </div>
    );
  }
  return <MemberDashboard m={member} note={note} setNote={setNote} />;
}

function MemberDashboard({ m, note, setNote }: { m: DemoMember; note: string; setNote: (s: string) => void }) {
  const done = m.checks.filter((c) => c.state === 'ok').length;
  const voteDays = daysUntil(RECORD_DATE);
  const renewOpen = new Date() >= new Date(RENEWAL_OPENS + 'T00:00:00-05:00');
  const expiryDays = m.validThrough ? daysUntil(m.validThrough) : null;
  const demo = (what: string) => setNote(`Demo: in the live site this ${what}.`);
  const signOut = () => { setSession(null, true); window.location.assign('/'); };

  return (
    <div className="portal">
      <header className="portal-hero">
        <div className="wrap portal-hero-in">
          <div>
            <p className="eyebrow">Member home</p>
            <h1>Assalamu alaikum, {m.firstName}.</h1>
            <p className="portal-sub">Member since {m.memberSince} · {m.plan} plan · ID {m.memberId}</p>
          </div>
          <button type="button" className="btn btn-outline portal-out" onClick={signOut}>Sign out</button>
        </div>
      </header>

      <div className="wrap">
        {note && <p className="portal-note" role="status">{note} <button type="button" className="linkish" onClick={() => setNote('')}>Dismiss</button></p>}
        <div className="portal-grid">
          {/* Digital card */}
          <section className="p-tile p-card" aria-labelledby="card-h">
            <h2 id="card-h" className="sr-only">Digital member card</h2>
            <div className="dcard">
              <div className="dcard-top"><span className="dcard-org">ISGH Member</span><span className="dcard-tag">{m.plan === 'Life' ? 'Life member' : m.checks.every((c) => c.state === 'ok') ? 'Voting eligible' : 'Active'}</span></div>
              <div className="dcard-name">{m.firstName} {m.lastName}</div>
              <div className="dcard-meta">
                <div><span>Member ID</span>{m.memberId}</div>
                <div><span>Center</span>{m.zone} zone</div>
                <div><span>Valid through</span>{m.validThrough ? fmt(m.validThrough, { month: '2-digit', day: '2-digit', year: 'numeric' }) : 'Lifetime'}</div>
              </div>
              <FakeQr seed={m.memberId} />
            </div>
            <div className="p-actions">
              <button type="button" className="btn btn-dark btn-sm" onClick={() => demo('adds the card to Apple Wallet')}>Add to Apple Wallet</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => demo('adds the card to Google Wallet')}>Add to Google Wallet</button>
            </div>
          </section>

          {/* Status */}
          <section className="p-tile p-status" aria-labelledby="st-h">
            <h2 id="st-h">Membership status</h2>
            <p className="p-big"><span className="dot ok" aria-hidden="true" />{m.status}</p>
            <p className="p-muted">{m.validThrough ? `Valid through ${fmt(m.validThrough)} (${expiryDays} days).` : 'Lifetime membership – no annual dues.'}</p>
            {m.plan !== 'Life' && (
              <div className="p-count">
                <div><b>{voteDays}</b><span>days left to pay 2027 dues and keep your vote (June 30)</span></div>
              </div>
            )}
            {m.plan !== 'Life' && (renewOpen
              ? <Link className="btn btn-primary" href="/membership/renew">Renew for 2027</Link>
              : <><button type="button" className="btn btn-primary" disabled>Renew for 2027</button><p className="p-muted small">Renewal opens {fmt(RENEWAL_OPENS)}. We will email you that day.</p></>)}
          </section>

          {/* Voting checklist */}
          <section className="p-tile p-vote" aria-labelledby="vote-h">
            <div className="p-head"><h2 id="vote-h">Voting checklist for 2027</h2><span className="p-pill">{done} of {m.checks.length} done</span></div>
            <div className="p-bar" role="progressbar" aria-label="Voting checklist" aria-valuemin={0} aria-valuemax={m.checks.length} aria-valuenow={done}><span style={{ width: `${(done / m.checks.length) * 100}%` }} /></div>
            <ul className="p-checks">
              {m.checks.map((c) => (
                <li key={c.label} className={`c-${c.state}`}>
                  <i aria-hidden="true">{ICON[c.state]}</i>
                  <div><b>{c.label}</b><span>{c.note}</span></div>
                  {c.label.startsWith('Photo ID') && c.state !== 'ok' && <button type="button" className="btn btn-outline btn-sm" onClick={() => demo('opens a secure upload for your ID')}>Upload ID</button>}
                </li>
              ))}
            </ul>
            <p className="p-muted small">Rules from the ISGH Bylaws, Article I, Section 2. Paying after June 30 keeps you a member but not a voter for that year.</p>
          </section>

          {/* Household + family tree */}
          <section className="p-tile" aria-labelledby="hh-h">
            <h2 id="hh-h">Family tree</h2>
            <FamilyMini email={m.email} />
            {m.household?.length ? (
              <ul className="p-people">{m.household.map((h) => <li key={h.name}><span className="avatar" aria-hidden="true">{h.name[0]}</span><div><b>{h.name}</b><span>{h.relation} · {h.status}</span></div></li>)}</ul>
            ) : null}
            <Link href="/portal/family" className="btn btn-outline btn-sm">Open family tree</Link>
          </section>

          {/* Center */}
          <section className="p-tile" aria-labelledby="ctr-h">
            <h2 id="ctr-h">Your Islamic Center</h2>
            <p className="p-big sm">{m.center}</p>
            <p className="p-muted">{m.zone} zone · decided by your home address</p>
            <div className="p-actions"><Link className="btn btn-outline btn-sm" href="/centers">All centers</Link><button type="button" className="btn btn-outline btn-sm" onClick={() => demo('lets you request a different nearby center (5-mile border rule)')}>Request a change</button></div>
          </section>

          {/* Payments */}
          <section className="p-tile p-pay" aria-labelledby="pay-h">
            <h2 id="pay-h">Payments and receipts</h2>
            <ul className="p-payments">
              {m.payments.map((p) => (
                <li key={p.receipt}><div><b>{p.label}</b><span>{fmt(p.date)} · {p.receipt}</span></div><span className="amt">{formatUSD(p.amountCents)}</span>
                  <button type="button" className="linkish" onClick={() => demo(`downloads receipt ${p.receipt} as a PDF`)}>Receipt</button></li>
              ))}
            </ul>
          </section>

          {/* Details */}
          <section className="p-tile" aria-labelledby="det-h">
            <h2 id="det-h">Your details</h2>
            <dl className="p-details">
              <div><dt>Email</dt><dd>{m.email}</dd></div>
              <div><dt>Phone</dt><dd>{m.phone}</dd></div>
              <div><dt>Home address</dt><dd>{m.address.join(', ')}</dd></div>
            </dl>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => demo('lets you update your details (a new address may change your center)')}>Update details</button>
          </section>

          {/* Quick links */}
          <section className="p-tile p-links" aria-labelledby="ql-h">
            <h2 id="ql-h">More</h2>
            <ul>
              <li><Link href="/needs">Help a neighbor in need</Link></li>
              <li><Link href="/elections">Elections and dates</Link></li>
              <li><Link href="/verify">Verify a membership</Link></li>
              <li><Link href="/feedback">Rate your experience</Link></li>
            </ul>
          </section>
        </div>
        <p className="samples-note">Demo member home: sample data, no account is created and nothing is saved on a server.</p>
      </div>
    </div>
  );
}

/** Decorative QR-style pattern (demo). Live: signed QR from the BE that staff scan at centers. */
function FakeQr({ seed }: { seed: string }) {
  const cells = useMemo(() => {
    let h = 2166136261; for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    const out: boolean[] = [];
    for (let i = 0; i < 121; i++) { h = Math.imul(h ^ (h >>> 13), 1274126177); out.push(((h >>> 7) & 1) === 1); }
    return out;
  }, [seed]);
  const inFinder = (x: number, y: number) => (x < 3 && y < 3) || (x > 7 && y < 3) || (x < 3 && y > 7);
  const isCenter = (x: number, y: number) => (x === 1 || x === 9) && (y === 1 || y === 9) && !(x === 9 && y === 9);
  return (
    <svg className="dcard-qr" viewBox="-0.5 -0.5 12 12" role="img" aria-label="Member QR code (demo)">
      <rect x="-0.5" y="-0.5" width="12" height="12" fill="#fff" rx=".8" />
      {cells.map((on, i) => {
        const x = i % 11, y = Math.floor(i / 11);
        const fill = inFinder(x, y) ? !isCenter(x, y) : on;
        return fill ? <rect key={i} x={x} y={y} width="1" height="1" fill="#10221B" /> : null;
      })}
    </svg>
  );
}

/** Small family summary on member home: who is a member, who can join, who turns 18 before the record date. */
function FamilyMini({ email }: { email: string }) {
  const [counts, setCounts] = useState<{ vote: number; join: number; soon: number; total: number } | null>(null);
  useEffect(() => {
    const f = loadFamily(email); const g = generations(f); const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const living = f.people.filter((p) => !p.died && !p.heritage && !p.placeholder && g.has(p.id));
    const b = living.map((p) => badgeFor(p, today, RECORD_DATE).tone);
    setCounts({ vote: b.filter((t) => t === 'vote').length, join: b.filter((t) => t === 'join').length, soon: b.filter((t) => t === 'soon').length, total: living.length });
  }, [email]);
  if (!counts) return <p className="p-muted">Loading your family…</p>;
  return (
    <>
      <p className="p-muted">{counts.total} people in your tree, including you.</p>
      <p className="p-family-mini"><span>{counts.vote} can vote</span><span>{counts.join} can join</span>{counts.soon > 0 && <span>{counts.soon} turn{counts.soon > 1 ? '' : 's'} 18 soon</span>}</p>
    </>
  );
}
