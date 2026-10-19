'use client';
/**
 * Bento grid: deadline countdown (record date from settings), plan switcher (plans + prices from settings),
 * wallet card, find-your-center, eligibility preview, news. All values come from admin/BE.
 */
import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { Home } from '@/lib/content/home';
import type { MembershipSettings } from '@/lib/content/membership';
import { formatUSD, memberClass } from '@/lib/content/membership';
import type { NewsItem } from '@/lib/content/pages';
import { Photo } from '@/components/ui/Photo';

type Props = { bento: Home['bento']; settings: MembershipSettings; news: NewsItem[] };

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Chicago' });

export function HomeBento({ bento, settings, news }: Props) {
  const plans = useMemo(() => settings.plans.filter((p) => p.visible && memberClass(settings.rules, p.memberClass).canVote), [settings.plans, settings.rules]);
  const [planId, setPlanId] = useState(plans.find((p) => p.featured)?.id ?? plans[0]?.id);
  const plan = plans.find((p) => p.id === planId) ?? plans[0];
  const deadline = Date.parse(settings.recordDate);
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setDays(Math.max(0, Math.ceil((deadline - Date.now()) / 864e5)));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [deadline]);

  const zip = useZipCheck();

  return (
    <section className="bento-sec" id="plans" aria-labelledby="bento-h">
      <div className="wrap">
        <h2 className="sec-title" id="bento-h">{bento.title}</h2>
        <div className="bento">
          <article className="tile t-deadline">
            <h3>{bento.deadlineTitle}</h3>
            <div className="big" aria-live="polite">{days ?? '—'}</div>
            <div>
              <p className="sub">Pay your {settings.year} dues by {fmtDate(settings.recordDate)} to vote in the December elections.</p>
              <div className="yearbar" aria-hidden="true"><i style={{ width: `${days === null ? 0 : Math.max(2, Math.min(100, (days / 365) * 100))}%` }} /></div>
              <div className="yearlabels"><span>Time left this cycle</span><span>{fmtDate(settings.recordDate)}</span></div>
            </div>
          </article>

          {plan && (
            <article className="tile t-plans">
              <h3>Pick a plan</h3>
              <div className="seg" role="radiogroup" aria-label="Membership plans">
                {plans.map((p) => (
                  <button key={p.id} type="button" role="radio" aria-checked={p.id === plan.id} onClick={() => setPlanId(p.id)}>{p.name}</button>
                ))}
              </div>
              <div className="price">{formatUSD(plan.priceCents)} <small>{plan.unit}</small></div>
              <p className="sub">{plan.summary}</p>
              <ul className="perks">{plan.perks.map((x) => <li key={x}>{x}</li>)}</ul>
              <Link className="btn btn-primary" href={`/membership/join?plan=${plan.id}`}>Choose {plan.name.toLowerCase()}</Link>
            </article>
          )}

          <article className="tile t-card">
            <h3>{bento.walletTitle}</h3>
            <p className="sub">{bento.walletText}</p>
            <Photo image={bento.walletImage} sizes="(max-width: 960px) 100vw, 33vw" className="tile-photo" />
          </article>

          <article className="tile t-find">
            <h3>{bento.findTitle}</h3>
            <p className="sub">{bento.findText}</p>
            <form onSubmit={zip.submit} noValidate>
              <label htmlFor="homeZip" className="sr-only">ZIP code</label>
              <input id="homeZip" className="input" inputMode="numeric" maxLength={5} placeholder="ZIP code, like 77036" autoComplete="postal-code"
                value={zip.value} onChange={(e) => zip.setValue(e.target.value.replace(/\D/g, ''))} aria-describedby="homeZipMsg" aria-invalid={zip.error || undefined} />
              <button className="btn btn-dark" type="submit">Find</button>
            </form>
            <p className="result" id="homeZipMsg" aria-live="polite">{zip.message}</p>
          </article>

          <article className="tile t-check">
            <h3>{bento.statusTitle}</h3>
            <ul>
              <li><b>Approved</b><span className="ok">Done</span></li>
              <li><b>ID check</b><span className="wait">In review</span></li>
              <li><b>{settings.year} dues</b><span className="no">Not paid</span></li>
            </ul>
            <Link className="tile-link" href="/portal">See my checklist</Link>
          </article>

          <article className="tile t-news">
            <div><h3>{bento.newsTitle}</h3><p className="sub">{bento.newsText}</p><Link className="tile-link" href="/news">All news</Link></div>
            {news.slice(0, 2).map((n) => (
              <Link key={n.slug} className="post" href={`/news/${n.slug}`}>
                <time dateTime={n.date}>{fmtDate(n.date + 'T12:00:00-05:00')}</time><strong>{n.title}</strong><span className="sub">{n.excerpt}</span>
              </Link>
            ))}
          </article>
        </div>
      </div>
    </section>
  );
}

/** ZIP pre-check: Houston-area ZIPs start with 77. Exact center comes from the full street address (BE geocoding). */
function useZipCheck() {
  const [value, setValue] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{5}$/.test(value)) { setError(true); setMessage('Enter a 5-digit ZIP code, like 77036.'); return; }
    setError(false);
    setMessage(value.startsWith('77')
      ? `ZIP ${value} is in the Greater Houston area. We'll confirm your exact center from your street address when you join.`
      : `ZIP ${value} looks outside Greater Houston. You can still join as an Associate member or contact us.`);
  };
  return { value, setValue, message, error, submit };
}
