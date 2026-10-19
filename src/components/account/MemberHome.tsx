'use client';
/**
 * Member home (W5) – DEMO. Reads the demo session; real: GET /member/me (session cookie).
 * Shows: digital card (+ Wallet, QR), status + countdowns, Bylaws voting checklist with one-tap fixes,
 * household, center, payments/receipts, contact details. Signed-out visitors go to /sign-in?next=/portal.
 */
import Link from 'next/link';
import type { OrgConfig } from '@/lib/community/org-config';
import { discountLabel, memberOffers, type Benefits } from '@/lib/community/benefits';
import type { PublicOfficial } from '@/lib/community/officials';
import { factsOfDemo } from './MyBenefits';
import { useEffect, useMemo, useState } from 'react';
import { findMember, getSessionEmail, memberGroups, saveMemberGroups, setSession, SESSION_EVENT, type CheckState, type DemoMember } from '@/lib/demo/demo-member';
import { profileGroups, type Facts, type GroupsDoc } from '@/lib/community/groups';
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

export type PortalMasjid = { name: string; zone: string; zips: string[]; city: string; phone: string };
export function MemberHome({ config, groups, benefits, masjids = [], leaders = [] }: { config?: OrgConfig; groups?: GroupsDoc; benefits?: Benefits; masjids?: PortalMasjid[]; leaders?: PublicOfficial[] } = {}) {
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
  return <MemberDashboard m={member} note={note} setNote={setNote} config={config} groups={groups} benefits={benefits} masjids={masjids} leaders={leaders} />;
}

function MemberDashboard({ m, note, setNote, config, groups, benefits, masjids = [], leaders = [] }: { m: DemoMember; note: string; setNote: (s: string) => void; config?: OrgConfig; groups?: GroupsDoc; benefits?: Benefits; masjids?: PortalMasjid[]; leaders?: PublicOfficial[] }) {
  const card = config?.members.card ?? { enabled: true, wallet: true, pdf: true, phoneImage: true, showPhoto: false, showCenter: true, showRenewal: true };
  // Configuration › Members › What members can do themselves (all on when no config is given)
  const self = config?.members.selfService ?? { editProfile: true, renew: true, changePlan: true, cancelAutoRenew: true, downloadReceipts: true };
  const directory = config?.members.directory.enabled ?? false;
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
          {/* Digital card – Admin › Settings › Configuration › Member card */}
          {card.enabled && <section className="p-tile p-card" aria-labelledby="card-h">
            <h2 id="card-h" className="sr-only">Digital member card</h2>
            <div className="dcard">
              <div className="dcard-top"><span className="dcard-org">ISGH Member</span><span className="dcard-tag">{m.plan === 'Life' ? 'Life member' : m.checks.every((c) => c.state === 'ok') ? 'Voting eligible' : 'Active'}</span></div>
              <div className="dcard-name">{card.showPhoto && <span className="dcard-photo" aria-label={m.idVerified ? 'Photo on file' : 'Photo shows after your ID is checked'}>{m.idVerified ? '' : `${m.firstName[0]}${m.lastName[0]}`}</span>}{m.firstName} {m.lastName}</div>
              <div className="dcard-meta">
                <div><span>Member ID</span>{m.memberId}</div>
                {card.showCenter && <div><span>Center</span>{m.center}</div>}
                {card.showRenewal && <div><span>Valid through</span>{m.validThrough ? fmt(m.validThrough, { month: '2-digit', day: '2-digit', year: 'numeric' }) : 'Lifetime'}</div>}
              </div>
              <FakeQr seed={m.memberId} />
            </div>
            {(card.wallet || card.pdf || card.phoneImage) && <div className="p-actions">
              {card.wallet && <button type="button" className="btn btn-dark btn-sm" onClick={() => demo('adds the card to Apple Wallet')}>Add to Apple Wallet</button>}
              {card.wallet && <button type="button" className="btn btn-outline btn-sm" onClick={() => demo('adds the card to Google Wallet')}>Add to Google Wallet</button>}
              {card.pdf && <button type="button" className="btn btn-outline btn-sm" onClick={() => demo('downloads a printable PDF card')}>Printable card (PDF)</button>}
              {card.phoneImage && <button type="button" className="btn btn-outline btn-sm" onClick={() => demo('saves the card as an image on your phone')}>Save card image</button>}
            </div>}
          </section>}

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
            {m.plan !== 'Life' && !self.renew && <p className="p-muted small">To renew, contact the membership office.</p>}
            {m.plan !== 'Life' && self.renew && (renewOpen
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

          {/* M6 My masjid – everyone belongs to the masjid that serves their home ZIP code */}
          <MyMasjid m={m} masjids={masjids} leaders={leaders} onChange={() => demo('lets you request a different nearby masjid (5-mile border rule)')} />

          {/* Payments */}
          <section className="p-tile p-pay" aria-labelledby="pay-h">
            <h2 id="pay-h">Payments and receipts</h2>
            <ul className="p-payments">
              {m.payments.map((p) => (
                <li key={p.receipt}><div><b>{p.label}</b><span>{fmt(p.date)} · {p.receipt}</span></div><span className="amt">{formatUSD(p.amountCents)}</span>
                  {self.downloadReceipts && <button type="button" className="linkish" onClick={() => demo(`downloads receipt ${p.receipt} as a PDF`)}>Receipt<span className="sr-only"> {p.receipt}</span></button>}</li>
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
            {self.editProfile ? <button type="button" className="btn btn-outline btn-sm" onClick={() => demo('lets you update your details (a new address may change your center)')}>Update details</button> : <p className="p-muted small">To change your details, contact the membership office.</p>}
            {self.changePlan && m.plan !== 'Life' && <button type="button" className="btn btn-outline btn-sm" onClick={() => demo('lets you move to another plan (the price difference is worked out for you)')}>Change plan</button>}
          </section>

          {groups && <MyGroups m={m} doc={groups} />}

          {/* Member benefits (F4) – Admin › Member benefits */}
          {benefits?.enabled && <BenefitsTile m={m} doc={benefits} />}

          {/* Quick links */}
          <section className="p-tile p-links" aria-labelledby="ql-h">
            <h2 id="ql-h">More</h2>
            <ul>
              <li><Link href="/events">Events and registration</Link></li>
              <li><Link href="/prayer-times">Prayer times</Link></li>
              <li><Link href="/portal/minutes">Meeting minutes</Link></li>
              <li><Link href="/portal/records">Records library</Link></li>
              <li><Link href="/portal/leadership">Who served (past terms)</Link></li>
              <li><Link href="/portal/requests">Ask or tell us – my requests</Link></li>
              {directory && <li><Link href="/portal/directory">Member directory</Link></li>}
              <li><Link href="/needs">Help a neighbor in need</Link></li>
              <li><Link href="/elections">Elections and dates</Link></li>
              <li><Link href="/verify">Verify a membership</Link></li>
              <li><Link href="/feedback">Rate your experience</Link></li>
              <li><Link href="/sign-in?switch=1">Switch dashboard (if you serve in a role)</Link></li>
            </ul>
          </section>
        </div>
        <p className="samples-note">Demo member home: sample data, no account is created and nothing is saved on a server.</p>
      </div>
    </div>
  );
}

function BenefitsTile({ m, doc }: { m: DemoMember; doc: Benefits }) {
  const list = memberOffers(doc, factsOfDemo(m), [], new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })).filter((x) => x.eligible);
  return (
    <section className="p-tile p-benefits" aria-labelledby="bn-h">
      <div className="p-head"><h2 id="bn-h">My benefits</h2><span className="p-pill">{list.length} {list.length === 1 ? 'offer' : 'offers'}</span></div>
      {list.length ? <ul className="p-bn-list">{list.slice(0, 3).map((x) => <li key={x.offer.id}><b>{discountLabel(x.offer)}</b><span>{x.offer.title} · {x.partner.name}</span></li>)}</ul>
        : <p className="p-muted">No partner offers for your plan right now.</p>}
      <Link href="/portal/benefits" className="btn btn-outline btn-sm">See all benefits</Link>
    </section>
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

/** Groups on the member's profile (Admin › Groups › "Show on member profiles"). Join / ask / leave follow the join policy; the server checks again. */
function MyGroups({ m, doc }: { m: DemoMember; doc: GroupsDoc }) {
  const [st, setSt] = useState(() => memberGroups(m));
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');
  useEffect(() => setSt(memberGroups(m)), [m]);
  const facts: Facts = { id: m.memberId, zone: m.zone, center: m.center, plan: m.plan, status: m.status === 'Active' ? 'active' : m.status === 'Expired' ? 'expired' : 'pending', voting: m.checks.every((c) => c.state === 'ok') ? 'yes' : 'no', payment: 'card', age: 30, joinedYear: m.memberSince };
  const list = profileGroups(doc, facts, st.ids).map((g) => (st.requested.includes(g.id) && !g.isIn ? { ...g, action: null, pending: true } : { ...g, pending: false }));
  if (!list.length) return null;
  const act = async (id: string, action: 'join' | 'request' | 'leave') => {
    setBusy(id); setMsg('');
    const r = await fetch('/api/groups/membership', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ groupId: id, action, member: { groupIds: st.ids, requested: st.requested } }) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    setBusy('');
    if (!r?.ok) { setMsg(j.message ?? 'Could not reach the server. Try again.'); return; }
    const next = action === 'join' ? { ...st, ids: [...st.ids, id] } : action === 'leave' ? { ...st, ids: st.ids.filter((x) => x !== id) } : { ...st, requested: [...st.requested, id] };
    setSt(next); saveMemberGroups(m, next); setMsg(j.message);
  };
  return (
    <section className="p-tile p-groups" aria-labelledby="gr-h">
      <h2 id="gr-h">Your groups</h2>
      <ul>{list.map((g) => (
        <li key={g.id} data-group={g.id}>
          <div><b>{g.name}</b>{g.description && <small>{g.description}</small>}</div>
          {g.isIn && <span className="p-badge ok">Member</span>}
          {g.pending && <span className="p-badge">Request sent</span>}
          {g.action && <button type="button" className={`btn btn-sm ${g.action === 'leave' ? 'btn-outline' : 'btn-primary'}`} disabled={busy === g.id} onClick={() => act(g.id, g.action!)}>{g.action === 'join' ? 'Join' : g.action === 'request' ? 'Ask to join' : 'Leave'}<span className="sr-only"> {g.name}</span></button>}
        </li>
      ))}</ul>
      {msg && <p className="p-note" role="status">{msg}</p>}
    </section>
  );
}

/** M6: the member's masjid (by home ZIP code), who runs it, and their Area Representative. */
function MyMasjid({ m, masjids, leaders, onChange }: { m: DemoMember; masjids: PortalMasjid[]; leaders: PublicOfficial[]; onChange: () => void }) {
  const zip = /\b(\d{5})\b/.exec(m.address[m.address.length - 1] ?? '')?.[1] ?? '';
  const home = masjids.find((x) => x.zips.includes(zip));
  const name = home?.name ?? m.center;
  const ad = leaders.find((p) => p.kind === 'associate-director' && p.center === name);
  const reps = leaders.filter((p) => p.kind === 'area-rep' && p.zips.includes(zip));
  return (
    <section className="p-tile p-masjid" aria-labelledby="ctr-h2" data-masjid={name}>
      <h2 id="ctr-h2">My masjid</h2>
      <p className="p-big sm">{name}</p>
      <p className="p-muted">{home ? `${home.zone}${home.city ? ` · ${home.city}` : ''} · serves ZIP ${home.zips.join(', ')}` : `${m.zone} zone`} · you belong here because you live in {zip || 'its area'}</p>
      <dl className="p-masjid-people">
        <div><dt>Associate Director</dt><dd>{ad ? <>{ad.name}{ad.email && <> · <a href={`mailto:${ad.email}`}>{ad.email}</a></>}</> : 'To be announced'}</dd></div>
        <div><dt>Your Area Representative</dt><dd>{reps.length ? reps.map((r) => r.name).join(', ') : 'Not listed yet'}</dd></div>
        {home?.phone && <div><dt>Masjid office</dt><dd><a href={`tel:+1${home.phone.replace(/\D/g, '')}`}>{home.phone}</a></dd></div>}
      </dl>
      <div className="p-actions"><Link className="btn btn-outline btn-sm" href="/prayer-times">Prayer times</Link><Link className="btn btn-outline btn-sm" href="/leadership">Who serves</Link><button type="button" className="btn btn-outline btn-sm" onClick={onChange}>Request a change</button></div>
    </section>
  );
}
