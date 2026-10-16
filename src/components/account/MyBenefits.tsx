'use client';
/**
 * Member portal › My benefits (F4). Offers from ISGH's partner businesses that this member may use, best first; offers
 * for other plans show as locked when the admin allows it. "Use this offer" shows the card, the shared code, the
 * member's personal code or the partner's link, and counts the use (once / monthly / yearly limits).
 * DEMO: uses are kept in this browser tab. Live: GET /member/benefits, POST /member/benefits/{id}/use.
 */
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  CATEGORIES, LIMIT, discountLabel, fmt, memberCode, memberOffers, type Benefits, type Category, type MemberFacts, type Offer, type Partner, type PlanId, type Redemption,
} from '@/lib/community/benefits';
import { findMember, getSessionEmail, SESSION_EVENT, type DemoMember } from '@/lib/demo/demo-member';

const USES_KEY = 'isgh-demo-benefit-uses';
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
const readUses = (): Redemption[] => { try { return JSON.parse(sessionStorage.getItem(USES_KEY) || '[]'); } catch { return []; } };
export function factsOfDemo(m: DemoMember): MemberFacts {
  const year = Number(today().slice(0, 4));
  return { id: m.memberId, plan: m.plan.toLowerCase() as PlanId, active: m.status === 'Active', goodStanding: m.plan === 'Life' || (m.paidThroughYear ?? 0) >= year };
}

export function MyBenefits({ doc }: { doc: Benefits }) {
  const [m, setM] = useState<DemoMember | null | undefined>(undefined);
  const [uses, setUses] = useState<Redemption[]>([]);
  const [cat, setCat] = useState<'' | Category>('');
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    const read = () => { setM(findMember(getSessionEmail())); setUses(readUses()); };
    read(); window.addEventListener(SESSION_EVENT, read); return () => window.removeEventListener(SESSION_EVENT, read);
  }, []);
  useEffect(() => { if (m === null) window.location.replace('/sign-in?next=/portal/benefits'); }, [m]);
  const list = useMemo(() => (m ? memberOffers(doc, factsOfDemo(m), uses, today()) : []), [doc, m, uses]);
  if (!m) return <div className="portal-loading wrap" role="status">Loading your benefits…</div>;
  const cats = Array.from(new Set(list.map((x) => x.partner.category)));
  const rows = list.filter((x) => !cat || x.partner.category === cat);
  const use = (o: Offer, p: Partner) => {
    const r: Redemption = { id: `R-${String(Date.now()).slice(-6)}`, at: new Date().toISOString(), offerId: o.id, memberId: m.memberId, center: p.center, via: 'portal' };
    const next = [r, ...readUses()];
    try { sessionStorage.setItem(USES_KEY, JSON.stringify(next)); } catch { /* private mode */ }
    setUses(next); setOpen(o.id);
  };
  return (
    <div className="portal">
      <header className="portal-hero bn-hero">
        <div className="wrap portal-hero-in">
          <div>
            <p className="eyebrow">Member benefits</p>
            <h1>Thank you for being a member</h1>
            <p className="portal-sub">Offers from local businesses for ISGH members · {m.plan} plan · ID {m.memberId}</p>
          </div>
          <Link className="btn btn-outline portal-out" href="/portal">Back to member home</Link>
        </div>
      </header>
      <div className="wrap">
        {!doc.enabled ? <section className="p-tile mb-empty"><h2>Benefits are not available right now</h2><p className="p-muted">Please check again later.</p></section> : <>
          {cats.length > 1 && (
            <div className="mb-cats" role="group" aria-label="Filter by category">
              <button type="button" aria-pressed={!cat} onClick={() => setCat('')}>All</button>
              {cats.map((c) => <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)}>{CATEGORIES[c]}</button>)}
            </div>
          )}
          <ul className="mb-list">
            {rows.map(({ offer: o, partner: p, canUse, eligible, why }) => (
              <li key={o.id} className={`mb-offer${eligible ? '' : ' locked'}`} data-offer={o.id}>
                <div className="mb-value"><b>{discountLabel(o)}</b><small>{LIMIT[o.limit]}</small></div>
                <div className="mb-main">
                  <h2>{o.title}</h2>
                  <p className="mb-partner">{p.name} · {CATEGORIES[p.category]}{p.center ? ` · near ${p.center}` : ''}</p>
                  {o.details && <p className="p-muted">{o.details}</p>}
                  <p className="p-muted small">Until {fmt(o.until)}{p.address ? ` · ${p.address}` : ''}{p.phone ? ` · ${p.phone}` : ''}</p>
                  {open === o.id ? <HowToUse o={o} p={p} m={m} />
                    : canUse ? <button type="button" className="btn btn-primary btn-sm" onClick={() => use(o, p)}>Use this offer<span className="sr-only"> {o.title}</span></button>
                      : <p className="mb-why" role="note">{why}</p>}
                  {canUse && o.limit !== 'unlimited' && open !== o.id && <p className="p-muted small">Counts as your use: {LIMIT[o.limit].toLowerCase()}.</p>}
                </div>
              </li>
            ))}
          </ul>
          {!rows.length && <section className="p-tile mb-empty"><h2>No offers yet</h2><p className="p-muted">New partner offers show here as soon as they start.</p></section>}
          <p className="samples-note">Demo: sample businesses. Partners check your membership on the Verify page and see only your first name, last initial and whether you are active.</p>
        </>}
      </div>
    </div>
  );
}

function HowToUse({ o, p, m }: { o: Offer; p: Partner; m: DemoMember }) {
  const [copied, setCopied] = useState(false);
  const code = o.redeem === 'code' ? o.code : o.redeem === 'unique' ? memberCode(m.memberId, o.id) : '';
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); } catch { setCopied(false); } };
  return (
    <div className="mb-how" role="status">
      {o.redeem === 'card' && <p>Show your digital member card at {p.name}. <Link href="/portal">Open my card</Link></p>}
      {code && <p>Your code{o.redeem === 'unique' ? ' (only for you)' : ''}: <b className="mb-code">{code}</b> <button type="button" className="linkish" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button></p>}
      {o.redeem === 'link' && <p><a className="btn btn-primary btn-sm" href={o.url} target="_blank" rel="noopener noreferrer">Book with {p.name}</a> <span className="p-muted small">Opens the partner’s website.</span></p>}
      <p className="p-muted small">Used today, {fmt(today())}.</p>
    </div>
  );
}
