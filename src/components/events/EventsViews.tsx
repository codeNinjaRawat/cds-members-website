'use client';
/**
 * Events (admin › Events): list with filters, detail with registration. Registration rules come from the event:
 * types (price, guest price, who may register, code, limit), guests, waitlist, cancellation, reminders.
 * Demo: the signed-in demo member counts as a member; the server checks everything again.
 */
import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  CATEGORY_LABEL, canCancel, canSee, fmtRange, priceFor, refundFor, registrationState, seatsFor, spotsLeft, toIcs, typeAvailable,
  type EventItem, type EventsDoc, type Viewer,
} from '@/lib/community/events';
import { findMember, getSessionEmail, memberGroups, SESSION_EVENT } from '@/lib/demo/demo-member';
import { formatUSD } from '@/lib/content/membership';

function useViewer(): Viewer {
  const [v, setV] = useState<Viewer>({ signedIn: false });
  useEffect(() => {
    const read = () => { const m = findMember(getSessionEmail()); setV(m ? { signedIn: true, planId: m.plan.toLowerCase(), groupIds: memberGroups(m).ids } : { signedIn: false }); };
    read(); window.addEventListener(SESSION_EVENT, read); return () => window.removeEventListener(SESSION_EVENT, read);
  }, []);
  return v;
}

export function EventsListView({ doc, now }: { doc: EventsDoc; now: string }) {
  const viewer = useViewer();
  const [cat, setCat] = useState<string>('');
  const [where, setWhere] = useState<string>('');
  // group-only events are listed only for people in one of the groups (BE: never sent to anyone else)
  const visible = doc.events.filter((e) => e.status !== 'draft' && (e.visibility !== 'groups' || canSee(e, viewer)));
  const places = Array.from(new Set(visible.map((e) => e.location.center ?? e.location.name))).sort();
  const match = (e: EventItem) => (!cat || e.category === cat) && (!where || (e.location.center ?? e.location.name) === where);
  const up = visible.filter((e) => e.end >= now && match(e)).sort((a, b) => Number(b.promotion.featured) - Number(a.promotion.featured) || a.start.localeCompare(b.start)); // F9: featured first
  const past = visible.filter((e) => e.end < now && match(e)).sort((a, b) => b.start.localeCompare(a.start));
  return (
    <article className="cms-page ev-page"><div className="wrap">
      <header className="cms-head"><h1>Events</h1><p className="intro">Meetings, programs and gatherings at our Islamic Centers. Register online where needed.</p></header>
      <div className="ev-filters" role="group" aria-label="Filter events">
        <label className="sr-only" htmlFor="ev-cat">Kind of event</label>
        <select id="ev-cat" className="input" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All kinds</option>{Object.entries(CATEGORY_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <label className="sr-only" htmlFor="ev-where">Place</label>
        <select id="ev-where" className="input" value={where} onChange={(e) => setWhere(e.target.value)}><option value="">All places</option>{places.map((p) => <option key={p}>{p}</option>)}</select>
      </div>
      <h2 className="ev-h">Coming up</h2>
      {up.length ? <ul className="ev-list">{up.map((e) => <EventCard key={e.id} e={e} now={now} viewer={viewer} />)}</ul> : <p className="ev-empty">No upcoming events{cat || where ? ' match your filters' : ' right now'}.</p>}
      {doc.showPast && past.length > 0 && (<><h2 className="ev-h">Past events</h2><ul className="ev-list past">{past.slice(0, 12).map((e) => <EventCard key={e.id} e={e} now={now} viewer={viewer} />)}</ul></>)}
    </div></article>
  );
}

function EventCard({ e, now, viewer }: { e: EventItem; now: string; viewer: Viewer }) {
  const st = registrationState(e, now); const left = spotsLeft(e);
  const from = e.registration.enabled ? Math.min(...e.registration.types.filter((t) => t.enabled).map((t) => t.priceCents)) : 0;
  return (
    <li className={`ev-card${e.promotion.featured ? ' featured' : ''}`} data-event={e.id}>
      <div className="ev-date" aria-hidden="true"><b>{new Date(`${e.start.slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', { month: 'short' })}</b><span>{Number(e.start.slice(8, 10))}</span></div>
      <div className="ev-body">
        <h3><Link href={`/events/${e.id}`}>{e.title}</Link></h3>
        <p className="ev-when">{fmtRange(e)} · {e.location.name}</p>
        {e.summary && <p className="ev-sum">{e.summary}</p>}
        <p className="ev-tags">
          {e.promotion.featured && <span className="tag tag-featured">Featured</span>}
          <span className="tag">{CATEGORY_LABEL[e.category]}</span>
          {e.visibility === 'members' && <span className="tag gold">Members only</span>}{e.visibility === 'groups' && <span className="tag gold">Group event</span>}
          {e.status === 'cancelled' && <span className="tag bad">Cancelled</span>}
          {e.registration.enabled && e.status !== 'cancelled' && e.end >= now && (st.open ? <span className="tag ok">{st.waitlist ? 'Full – waitlist open' : left !== Infinity ? `${left} spots left` : 'Registration open'}{from > 0 ? ` · from ${formatUSD(from)}` : ' · free'}</span> : <span className="tag">{st.reason}</span>)}
          {!viewer.signedIn && e.visibility === 'members' && e.registration.enabled && <span className="tag">Sign in to register</span>}
        </p>
      </div>
    </li>
  );
}

export function EventDetailView({ e, now }: { e: EventItem; now: string }) {
  const viewer = useViewer();
  const st = registrationState(e, now);
  const hidden = !canSee(e, viewer) && e.visibility === 'members';
  if (e.visibility === 'groups' && !canSee(e, viewer)) return (
    <article className="cms-page ev-page ev-detail"><div className="wrap narrow">
      <nav aria-label="Breadcrumb" className="crumbs"><Link href="/events">Events</Link></nav>
      <h1>Group event</h1>
      <p className="ev-gate">This event is only for members of a group. {viewer.signedIn ? 'You are not in that group – ask the event organizer if you think you should be.' : <><Link href={`/sign-in?next=/events/${e.id}`}>Sign in</Link> to see it.</>}</p>
    </div></article>
  );
  return (
    <article className="cms-page ev-page ev-detail"><div className="wrap">
      <nav aria-label="Breadcrumb" className="crumbs"><Link href="/events">Events</Link> › <span aria-current="page">{e.title}</span></nav>
      <header className="cms-head">
        <p className="ev-when big">{fmtRange(e)}</p>
        <h1>{e.title}</h1>
        {e.status === 'cancelled' && <p className="notice bad" role="status">This event was cancelled.</p>}
        {e.summary && <p className="intro">{e.summary}</p>}
      </header>
      <div className="ev-grid">
        <section aria-labelledby="ev-where-h" className="ev-info">
          <h2 id="ev-where-h">Where</h2>
          <p><b>{e.location.name}</b>{e.location.address && <><br />{e.location.address}</>}</p>
          {e.location.onlineUrl && <p>Online: {hidden ? 'link for members – sign in to see it' : <a href={e.location.onlineUrl} rel="noopener noreferrer" target="_blank">join online<span className="sr-only"> (opens in a new tab)</span></a>}</p>}
          <p className="ev-tags"><span className="tag">{CATEGORY_LABEL[e.category]}</span>{e.visibility === 'members' && <span className="tag gold">Members only</span>}</p>
          {e.registration.enabled && <p className="hint">{e.registration.cancellation.policy === 'none' ? 'Registrations cannot be cancelled online.' : e.registration.cancellation.policy === 'anytime' ? 'You can cancel any time before the event.' : `You can cancel up to ${e.registration.cancellation.daysBefore} day${e.registration.cancellation.daysBefore === 1 ? '' : 's'} before the event.`}
            {e.registration.cancellation.policy !== 'none' && e.registration.types.some((t) => t.priceCents > 0) && <> {e.registration.cancellation.refund === 'full' ? 'Payments are refunded in full.' : e.registration.cancellation.refund === 'none' ? 'Payments are not refunded.' : `Refunded minus a ${formatUSD(e.registration.cancellation.feeCents)} fee.`}</>}</p>}
          {e.status !== 'cancelled' && <p><a className="ev-ics" download={`${e.id}.ics`} href={`data:text/calendar;charset=utf-8,${encodeURIComponent(toIcs(e, { name: 'ISGH', domain: 'isgh.org' }, `${now.replace(/[-:]/g, '')}00`))}`}>Add to my calendar</a></p>}
        </section>
        <section aria-labelledby="ev-reg-h" className="ev-reg">
          <h2 id="ev-reg-h">Registration</h2>
          {!e.registration.enabled ? <p>No registration needed – just come.</p>
            : !st.open ? <p className="notice">{st.reason}</p>
            : <RegisterForm e={e} viewer={viewer} now={now} waitlist={st.waitlist} />}
        </section>
      </div>
    </div></article>
  );
}

function RegisterForm({ e, viewer, now, waitlist }: { e: EventItem; viewer: Viewer; now: string; waitlist: boolean }) {
  const types = e.registration.types.filter((t) => t.enabled);
  const [typeId, setTypeId] = useState(types[0]?.id ?? '');
  const [guests, setGuests] = useState(0);
  const [code, setCode] = useState('');
  const [name, setName] = useState(''); const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const [done, setDone] = useState<null | { status: 'registered' | 'waitlisted'; ref: string; totalCents: number }>(null);
  useEffect(() => { const m = findMember(getSessionEmail()); if (m) { setName(`${m.firstName} ${m.lastName}`); setEmail(m.email); } }, [viewer.signedIn]);
  const t = types.find((x) => x.id === typeId);
  const seats = seatsFor(guests);
  const avail = t ? typeAvailable(t, viewer, code, e, seats) : { ok: false };
  const fit = registrationState(e, now, seats);
  const total = t ? priceFor(t, guests) : 0;
  const maxGuests = e.registration.guests.allowed ? e.registration.guests.max : 0;
  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const er: Record<string, string> = {};
    if (!fit.open) er.guests = fit.reason ?? 'Not enough spots.';
    if (!t) er.type = 'Choose how you are registering.';
    else if (!avail.ok) er.type = avail.reason ?? 'Not available.';
    if (name.trim().length < 2) er.name = 'Enter your full name.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) er.email = 'Enter your email, like name@example.com.';
    setErr(er); if (Object.keys(er).length) { document.getElementById(`reg-${Object.keys(er)[0]}`)?.focus(); return; }
    setBusy(true);
    const r = await fetch('/api/events/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId: e.id, typeId, guests, code, name, email, member: viewer.signedIn ? { planId: viewer.planId, groupIds: viewer.groupIds } : null }) }).catch(() => null);
    setBusy(false);
    const j = r ? await r.json().catch(() => ({})) : {};
    if (r?.ok) setDone(j); else setErr({ form: j.message ?? 'Something went wrong. Please try again.' });
  };
  if (done) return (
    <div className="ev-done" role="status" tabIndex={-1} ref={(el) => el?.focus()}>
      <h3>{done.status === 'waitlisted' ? 'You are on the waitlist' : 'You are registered'}</h3>
      <p>{done.status === 'waitlisted' ? 'The event is full. We will email you if a spot opens.' : `See you on ${fmtRange(e)}.`} Confirmation number <b>{done.ref}</b>.</p>
      {done.totalCents > 0 && done.status === 'registered' && <p className="hint">Demo: no card is charged. Amount {formatUSD(done.totalCents)}.</p>}
      {canCancel(e, now) && <p className="hint">Need to cancel? Use the link in your confirmation email. {refundFor(e, done.totalCents, now).text}</p>}
    </div>
  );
  return (
    <form className="ev-form" onSubmit={submit} noValidate>
      {waitlist && <p className="notice">This event is full. Register to join the waitlist.</p>}
      {err.form && <p className="field-error" role="alert">{err.form}</p>}
      <fieldset className={err.type ? 'has-error' : ''}><legend>Registration type</legend>
        {types.map((x) => { const a = typeAvailable(x, viewer, x.availability === 'code' ? code : undefined, e, seats); return (
          <label key={x.id} className={`choice${typeId === x.id ? ' on' : ''}`}><input type="radio" name="reg-type" id={typeId === x.id ? 'reg-type' : undefined} value={x.id} checked={typeId === x.id} onChange={() => setTypeId(x.id)} />
            <span><b>{x.name}</b> – {x.priceCents ? formatUSD(x.priceCents) : 'free'}{x.availability === 'members' && ' · members'}{x.availability === 'plans' && ' · some plans'}{x.availability === 'code' && ' · needs a code'}{!a.ok && x.availability !== 'code' && <small className="block-hint">{a.reason}</small>}</span></label>
        ); })}
        {err.type && <p className="field-error">{err.type}</p>}
      </fieldset>
      {t?.availability === 'code' && <div className="field"><label htmlFor="reg-code">Registration code</label><input id="reg-code" className="input" value={code} onChange={(x) => setCode(x.target.value)} autoComplete="off" /></div>}
      {maxGuests > 0 && <div className="field"><label htmlFor="reg-guests">Guests coming with you</label>
        <select id="reg-guests" className="input narrow-input" value={guests} onChange={(x) => setGuests(Number(x.target.value))}>{Array.from({ length: maxGuests + 1 }, (_, i) => <option key={i} value={i}>{i}</option>)}</select>
        {t && t.guestPriceCents > 0 && <p className="hint">{formatUSD(t.guestPriceCents)} per guest</p>}
        {!fit.open && <p className="field-error" role="alert">{fit.reason}</p>}
        {fit.open && fit.waitlist && !waitlist && <p className="hint">Not enough spots for everyone – this registration joins the waitlist.</p>}</div>}
      <div className="field"><label htmlFor="reg-name">Full name</label><input id="reg-name" className="input" value={name} onChange={(x) => setName(x.target.value)} autoComplete="name" aria-invalid={!!err.name || undefined} />{err.name && <p className="field-error">{err.name}</p>}</div>
      <div className="field"><label htmlFor="reg-email">Email</label><input id="reg-email" className="input" type="email" value={email} onChange={(x) => setEmail(x.target.value)} autoComplete="email" aria-invalid={!!err.email || undefined} />{err.email && <p className="field-error">{err.email}</p>}</div>
      <p className="ev-total">Total: <b>{total ? formatUSD(total) : 'Free'}</b></p>
      <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Registering…' : waitlist || fit.waitlist ? 'Join the waitlist' : total ? `Register and pay ${formatUSD(total)}` : 'Register'}</button>
    </form>
  );
}

export const useNow = () => useMemo(() => new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 16), []);
