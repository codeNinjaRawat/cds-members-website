'use client';
/**
 * F8 Campaigns (public). A list of live campaigns with progress; one campaign with its story, matching ("your gift is
 * doubled until…"), personal pages and a donor wall of first names (never amounts). Members can ask to start their own
 * page (staff approve it). DEMO: giving opens the existing give flow; the page request is not sent anywhere.
 */
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { usd, fmt, type PublicCampaign } from '@/lib/community/fundraising';
import { findMember, getSessionEmail, SESSION_EVENT } from '@/lib/demo/demo-member';

function Bar({ pct, matched = 0 }: { pct: number; matched?: number }) {
  return <span className="cp-bar" role="img" aria-label={`${pct}% of the goal`}><i style={{ width: `${Math.min(100, Math.max(0, pct - matched))}%` }} /><b style={{ width: `${Math.max(0, Math.min(100 - (pct - matched), matched))}%` }} /></span>;
}

export function CampaignsView({ items, selected, page }: { items: PublicCampaign[]; selected: string; page: string }) {
  const c = items.find((x) => x.id === selected);
  if (c) return <One c={c} pageId={page} />;
  const live = items.filter((x) => x.state === 'live'); const past = items.filter((x) => x.state !== 'live' && x.state !== 'scheduled');
  return (
    <article className="cms-page cp"><div className="wrap">
      <header className="cms-head"><p className="eyebrow">Give together</p><h1>Campaigns</h1><p className="intro">Goals the community is working toward right now. Every gift stays in the campaign’s fund.</p></header>
      <ul className="cp-list">{live.map((x) => (
        <li key={x.id} data-campaign={x.id}><Link href={`/campaigns?c=${x.id}`} className="cp-card">
          <span className="cp-tag">{x.center || 'All of ISGH'}{x.matchNow ? ' · gifts matched now' : ''}</span>
          <b>{x.name}</b>
          <Bar pct={x.pct} matched={Math.round((x.matchedCents / x.goalCents) * 100)} />
          <span className="cp-nums"><strong>{usd(x.totalCents)}</strong> of {usd(x.goalCents)} · {x.donors} donors · {x.daysLeft} days left</span>
        </Link></li>
      ))}</ul>
      {!live.length && <p>No campaign is running right now. You can always <Link href="/give">give to a fund</Link>.</p>}
      {past.length > 0 && <><h2 className="cp-h2">Finished campaigns</h2><ul className="cp-past">{past.map((x) => <li key={x.id}><Link href={`/campaigns?c=${x.id}`}>{x.name}</Link> – {usd(x.totalCents)} raised of {usd(x.goalCents)}</li>)}</ul></>}
    </div></article>
  );
}

function One({ c, pageId }: { c: PublicCampaign; pageId: string }) {
  const pg = c.pages.find((x) => x.id === pageId);
  const live = c.state === 'live';
  return (
    <article className="cms-page cp"><div className="wrap">
      <p><Link href="/campaigns">← All campaigns</Link></p>
      <header className="cms-head"><p className="eyebrow">{c.center || 'All of ISGH'}{live ? ` · ${c.daysLeft} days left` : ' · finished'}</p><h1>{pg ? pg.title : c.name}</h1>
        {pg ? <p className="intro">{pg.owner} is raising money for <Link href={`/campaigns?c=${c.id}`}>{c.name}</Link>.</p> : <p className="intro">{c.story}</p>}</header>
      <div className="cp-main">
        <section className="cp-progress" aria-label="Progress">
          {pg ? <><strong className="cp-big">{usd(pg.totalCents)}</strong><span>raised of {usd(pg.goalCents)} · {pg.donors} donors</span><Bar pct={pg.pct} /></>
            : <><strong className="cp-big">{usd(c.totalCents)}</strong><span>raised of {usd(c.goalCents)} · {c.donors} donors{c.matchedCents ? ` · ${usd(c.matchedCents)} from matching sponsors` : ''}</span><Bar pct={c.pct} matched={Math.round((c.matchedCents / c.goalCents) * 100)} /></>}
          {c.matchNow && live && <p className="cp-match" role="note">{c.matchNow.ratio === 1 ? 'Your gift is doubled' : c.matchNow.ratio > 1 ? `Every $1 becomes $${1 + c.matchNow.ratio}` : `Every $1 gets ${Math.round(c.matchNow.ratio * 100)} cents more`} by {c.matchNow.sponsor} – {usd(c.matchNow.leftCents)} of matching left.</p>}
          {live ? <Link className="btn btn-primary" href={`/give?fund=${c.fund}&campaign=${c.id}${pg ? `&page=${pg.id}` : ''}`}>Give now</Link> : <p className="muted">This campaign has ended. Thank you to everyone who gave.</p>}
          {live && c.monthly && <p className="muted small">Monthly giving is available.</p>}
          {pg?.story && <p>{pg.story}</p>}
        </section>
        {c.wall.length > 0 && <section className="cp-wall" aria-label="Recent donors"><h2>Recent donors</h2><ul>{c.wall.map((w, i) => <li key={i}>{w.name}<small>{fmt(w.when)}</small></li>)}</ul><p className="muted small">First names of donors who chose to be listed. Amounts are never shown.</p></section>}
      </div>
      {!pg && c.pages.length > 0 && <section className="cp-pages" aria-label="Personal pages"><h2>People raising money for this campaign</h2><ul>{c.pages.map((x) => <li key={x.id} data-page={x.id}><Link href={`/campaigns?c=${c.id}&p=${x.id}`}><b>{x.title}</b><span>{x.owner} · {usd(x.totalCents)} of {usd(x.goalCents)}</span><Bar pct={x.pct} /></Link></li>)}</ul></section>}
      {!pg && c.p2p && <StartPage c={c} />}
    </div></article>
  );
}

function StartPage({ c }: { c: PublicCampaign }) {
  const [member, setMember] = useState<boolean | null>(null);
  const [f, setF] = useState({ title: '', story: '', goal: String(Math.max(250, c.minPageGoalCents / 100)) });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  useEffect(() => { const r = () => setMember(!!findMember(getSessionEmail())); r(); window.addEventListener(SESSION_EVENT, r); return () => window.removeEventListener(SESSION_EVENT, r); }, []);
  const submit = (e: FormEvent) => {
    e.preventDefault(); const er: Record<string, string> = {};
    if (f.title.trim().length < 3) er.title = 'Give your page a title.';
    if (Number(f.goal) * 100 < c.minPageGoalCents) er.goal = `The smallest page goal is ${usd(c.minPageGoalCents)}.`;
    setErrs(er); if (!Object.keys(er).length) setSent(true);
  };
  return (
    <section className="cp-start" aria-labelledby="cp-start-h">
      <h2 id="cp-start-h">Raise money with your own page</h2>
      <p>Run, fast, celebrate a birthday – and ask friends to give. ISGH staff check each page before it appears.</p>
      {member === false && <p><Link className="btn btn-outline" href={`/sign-in?next=/campaigns?c=${c.id}`}>Sign in to start a page</Link></p>}
      {member && !sent && <form className="cp-form" onSubmit={submit} noValidate>
        <div className="field"><label htmlFor="cp-title">Page title</label><input id="cp-title" className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} aria-invalid={!!errs.title} />{errs.title && <p className="field-error" role="alert">{errs.title}</p>}</div>
        <div className="field"><label htmlFor="cp-goal">Your goal ($)</label><input id="cp-goal" className="input" type="number" min="1" value={f.goal} onChange={(e) => setF({ ...f, goal: e.target.value })} aria-invalid={!!errs.goal} />{errs.goal && <p className="field-error" role="alert">{errs.goal}</p>}</div>
        <div className="field"><label htmlFor="cp-story">Why you are raising money</label><textarea id="cp-story" className="input" rows={3} maxLength={1200} value={f.story} onChange={(e) => setF({ ...f, story: e.target.value })} /></div>
        <button className="btn btn-primary" type="submit">Send for approval</button>
      </form>}
      {sent && <p className="cp-sent" role="status">Thank you! Your page was sent to ISGH for approval – we will email you when it is live. (Demo: nothing was sent.)</p>}
    </section>
  );
}
