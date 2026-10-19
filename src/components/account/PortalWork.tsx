'use client';
/**
 * Member portal pages added 2026-10-18 (status table: "the portal pages are next"):
 *   /portal/records     members-only records (Records library, audience "members") – public ones are on /records
 *   /portal/leadership  who served, year by year (every past term the organization shows; no member IDs or emails)
 *   /portal/requests    "Ask or tell us": a question, request, complaint or idea → a help-desk ticket; the member's own
 *                       requests with their status and the team's replies (never internal notes).
 * DEMO: the session is the demo member in this browser; sent requests are kept in this browser too.
 * Live: GET /member/records, GET /member/leadership, POST /member/tickets, GET /member/tickets.
 */
import Link from 'next/link';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { RECORD_CATEGORIES, fmtDate, recordsByCenter, type RecordItem } from '@/lib/community/records';
import type { PublicHelpdesk } from '@/lib/community/work';
import { findMember, getSessionEmail, SESSION_EVENT, type DemoMember } from '@/lib/demo/demo-member';
import { aria, FField } from '@/components/forms/FormBits';

/** Members only: sends visitors to sign in and back. */
function useMember(next: string) {
  const [m, setM] = useState<DemoMember | null | undefined>(undefined);
  useEffect(() => { const read = () => setM(findMember(getSessionEmail())); read(); window.addEventListener(SESSION_EVENT, read); return () => window.removeEventListener(SESSION_EVENT, read); }, []);
  useEffect(() => { if (m === null) window.location.replace(`/sign-in?next=${encodeURIComponent(next)}`); }, [m, next]);
  return m;
}
function Shell({ eyebrow = 'Members only', title, intro, children }: { eyebrow?: string; title: string; intro: string; children: ReactNode }) {
  return (
    <article className="cms-page"><div className="wrap narrow">
      <header className="cms-head"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="intro">{intro}</p></header>
      {children}
      <p className="pw-back"><Link href="/portal">Back to member home</Link></p>
    </div></article>
  );
}

/* ---------------- records ---------------- */
export function PortalRecords({ items, centerOrder }: { items: RecordItem[]; centerOrder: string[] }) {
  const m = useMember('/portal/records');
  const [mine, setMine] = useState(false);
  const [cat, setCat] = useState('');
  if (!m) return <div className="portal-loading wrap" role="status">Loading…</div>;
  const rows = items.filter((r) => (!mine || !r.center || r.center === m.center) && (!cat || r.category === cat));
  const groups = recordsByCenter(rows, centerOrder);
  return (
    <Shell title="Records library" intro="Minutes, reports, financial statements and notices for members – for the whole organization and for each masjid.">
      <div className="mb-cats pw-filter" role="group" aria-label="Filter records">
        <button type="button" aria-pressed={!mine} onClick={() => setMine(false)}>Every masjid</button>
        <button type="button" aria-pressed={mine} onClick={() => setMine(true)}>{m.center || 'My masjid'} and the organization</button>
        <select className="input pw-select" aria-label="Kind of record" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All kinds</option>{Object.entries(RECORD_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      </div>
      {!groups.length && <p>Nothing here yet.</p>}
      {groups.map((g) => (
        <section key={g.center || 'org'} className="rec-group" aria-labelledby={`prec-${g.center || 'org'}`} data-center={g.center}>
          <h2 id={`prec-${g.center || 'org'}`}>{g.label}</h2>
          <ul className="rec-list">{g.items.map((r) => (
            <li key={r.id} data-record={r.id}><a href={r.url} target={r.url.startsWith('http') ? '_blank' : undefined} rel="noreferrer"><b>{r.title}</b></a>
              <span className="rec-meta">{RECORD_CATEGORIES[r.category]} · {fmtDate(r.date)}{r.audience === 'members' ? ' · members only' : ''}</span>{r.summary && <p>{r.summary}</p>}</li>
          ))}</ul>
        </section>
      ))}
      <p className="samples-note">Sample records. Documents for elected leaders only are not shown here.</p>
    </Shell>
  );
}

/* ---------------- past leadership ---------------- */
type Year = { year: number; terms: { seat: string; name: string; term: string; kind: string }[] };
export function PortalLeadership({ years }: { years: Year[] }) {
  const m = useMember('/portal/leadership');
  const [q, setQ] = useState('');
  if (!m) return <div className="portal-loading wrap" role="status">Loading…</div>;
  const ql = q.trim().toLowerCase();
  const shown = years.map((y) => ({ ...y, terms: y.terms.filter((t) => !ql || `${t.seat} ${t.name}`.toLowerCase().includes(ql)) })).filter((y) => y.terms.length);
  return (
    <Shell title="Who served" intro="Every elected and appointed term the organization keeps on record, by election year. The people serving now are on the Leadership page.">
      <label className="pw-search"><span className="sr-only">Search by name or seat</span><input className="input" type="search" placeholder="Search by name or seat – e.g. Treasurer" value={q} onChange={(e) => setQ(e.target.value)} /></label>
      {!years.length && <p>No past terms are on record yet.</p>}
      {shown.map((y) => (
        <section key={y.year} className="pw-year" aria-labelledby={`yr-${y.year}`} data-year={y.year}>
          <h2 id={`yr-${y.year}`}>Elected in {y.year}</h2>
          <table className="pw-table"><thead><tr><th scope="col">Seat</th><th scope="col">Name</th><th scope="col">Term</th></tr></thead>
            <tbody>{y.terms.map((t, i) => <tr key={i}><td>{t.seat}</td><td>{t.name}</td><td>{t.term}</td></tr>)}</tbody></table>
        </section>
      ))}
      {years.length > 0 && !shown.length && <p>Nobody matches “{q}”.</p>}
      <p><Link href="/leadership">Who serves now</Link></p>
    </Shell>
  );
}

/* ---------------- my requests ---------------- */
type Sent = { reference: string; subject: string; category: string; at: string; status: string };
const KEY = 'isgh-my-requests';
const readSent = (email: string): Sent[] => { try { return (JSON.parse(localStorage.getItem(KEY) || '{}') as Record<string, Sent[]>)[email] ?? []; } catch { return []; } };
const writeSent = (email: string, list: Sent[]) => { try { const all = JSON.parse(localStorage.getItem(KEY) || '{}'); all[email] = list; localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* */ } };

export function MyRequests({ helpdesk }: { helpdesk: PublicHelpdesk }) {
  const m = useMember('/portal/requests');
  const [sent, setSent] = useState<Sent[]>([]);
  const [f, setF] = useState({ categoryId: '', subject: '', detail: '', website: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  useEffect(() => { if (m) setSent(readSent(m.email)); }, [m]);
  if (!m) return <div className="portal-loading wrap" role="status">Loading…</div>;
  const cat = helpdesk.categories.find((c) => c.id === f.categoryId);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!f.categoryId) er.categoryId = 'Choose what it is about.';
    if (f.subject.trim().length < 4) er.subject = 'Give it a short title (4 characters or more).';
    if (f.detail.trim().length < 10) er.detail = 'Tell us a little more (10 characters or more).';
    setErrors(er); if (Object.keys(er).length) { document.getElementById(`rq-${Object.keys(er)[0]}`)?.focus(); return; }
    setBusy(true);
    const r = await fetch('/api/tickets', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...f, name: `${m.firstName} ${m.lastName}`, email: m.email, phone: m.phone, center: m.center, memberId: m.memberId }) }).then((x) => x.json().then((j) => ({ ok: x.ok, j }))).catch(() => ({ ok: false, j: {} as Record<string, unknown> }));
    setBusy(false);
    if (!r.ok) { setErrors({ form: r.j?.error === 'category_closed' ? 'This kind of request is not taken online right now. Please call the office.' : 'We could not send it. Please try again in a minute.' }); return; }
    const item: Sent = { reference: String(r.j.reference), subject: f.subject.trim(), category: cat?.label ?? '', at: new Date().toISOString(), status: 'Received' };
    const list = [item, ...sent]; setSent(list); writeSent(m.email, list); setDone(item.reference); setF({ categoryId: '', subject: '', detail: '', website: '' });
  };
  return (
    <Shell title="Ask or tell us" intro="A question, a request, a complaint or an idea – it goes straight to the right person at your masjid or the office, and you can follow it here.">
      {!helpdesk.enabled ? <p className="form-card">Online requests are switched off right now. Please call or visit your masjid’s office.</p> : (
        <form className="form-card" onSubmit={submit} noValidate aria-busy={busy || undefined}>
          {done && <p className="done-note" role="status">Thank you – we have it. Your reference is <b>{done}</b>.</p>}
          {errors.form && <p className="field-error" role="alert">{errors.form}</p>}
          {/* D7 – one tap for the two things members most often need from the membership office */}
          {helpdesk.categories.some((c) => c.id === 'my-record' || c.id === 'my-center') && (
            <div className="rq-quick" role="group" aria-label="Common requests">
              {helpdesk.categories.some((c) => c.id === 'my-record') && <button type="button" className="rq-chip" aria-pressed={f.categoryId === 'my-record'} onClick={() => setF({ ...f, categoryId: 'my-record', subject: 'My membership record is wrong', detail: f.detail || `What I see: ${m.plan} plan, member since ${m.memberSince}, status ${m.status}. What is wrong: ` })}>My membership record is wrong</button>}
              {helpdesk.categories.some((c) => c.id === 'my-center') && <button type="button" className="rq-chip" aria-pressed={f.categoryId === 'my-center'} onClick={() => setF({ ...f, categoryId: 'my-center', subject: 'My Islamic Center is wrong', detail: f.detail || `The record says ${m.center} (${m.zone} zone). I live at ${m.address.join(', ')}. The center should be: ` })}>My center is wrong</button>}
            </div>
          )}
          <FField id="rq-categoryId" label="What is it about?" error={errors.categoryId}>
            <select id="rq-categoryId" className="input" value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: e.target.value })} {...aria('rq-categoryId', false, errors.categoryId)}>
              <option value="">Choose one</option>{helpdesk.categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </FField>
          {cat?.description && <p className="pw-hint">{cat.description}{cat.private ? ' Only the people handling it will see it.' : ''}</p>}
          <FField id="rq-subject" label="Title" error={errors.subject}><input id="rq-subject" className="input" maxLength={140} value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} {...aria('rq-subject', false, errors.subject)} /></FField>
          <FField id="rq-detail" label="Tell us more" hint={`${f.detail.length}/5000`} error={errors.detail}><textarea id="rq-detail" className="input textarea" rows={5} maxLength={5000} value={f.detail} onChange={(e) => setF({ ...f, detail: e.target.value })} {...aria('rq-detail', true, errors.detail)} /></FField>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} />
          <p className="pw-hint">We answer by email at {m.email}. Your member ID and masjid ({m.center}) are added for you.</p>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Send'}</button>
        </form>
      )}
      <section className="pw-sent" aria-labelledby="sent-h">
        <h2 id="sent-h">My requests</h2>
        {!sent.length ? <p className="muted">Nothing sent yet.</p> : (
          <ul className="pw-list">{sent.map((s) => <li key={s.reference} data-request={s.reference}><b>{s.subject}</b><span>{s.reference} · {s.category} · {new Date(s.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span><em>{s.status}</em></li>)}</ul>
        )}
        <p className="samples-note">Demo: requests are kept in this browser. In the live system you also see the team’s replies here and get them by email.</p>
      </section>
    </Shell>
  );
}
