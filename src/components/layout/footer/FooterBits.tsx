'use client';
/** Small interactive footer pieces: CTA (hidden on join), open-now badge, "was this helpful?", back to top. */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { SiteConfig } from '@/lib/site-config/schema';
import { sendFeedback } from '@/lib/demo/demo-service';

type Footer = SiteConfig['footer'];

export function FooterCta({ cta }: { cta: NonNullable<Footer['cta']> }) {
  const pathname = usePathname() || '/';
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    if (!cta.deadline) return;
    setDays(Math.max(0, Math.ceil((Date.parse(cta.deadline) - Date.now()) / 864e5)));
  }, [cta.deadline]);
  if (pathname.startsWith('/membership/join')) return null;
  return (
    <section className="footer-cta" aria-labelledby="footer-cta-h">
      <div className="fc-text">
        <h2 id="footer-cta-h">{cta.title}</h2>
        <p>{cta.text}</p>
      </div>
      {cta.deadline && (
        <div className="fc-count" aria-live="polite"><b>{days ?? '—'}</b><span>days until<br />June 30</span></div>
      )}
      <div className="fc-actions">
        <Link className="btn fc-primary" href={cta.primary.href}>{cta.primary.label}</Link>
        {cta.secondary && <Link className="btn fc-secondary" href={cta.secondary.href}>{cta.secondary.label}</Link>}
      </div>
    </section>
  );
}

/** "Open now" computed in Houston time from admin office hours. */
export function OpenBadge({ hours }: { hours: NonNullable<Footer['hours']> }) {
  const [state, setState] = useState<'open' | 'closed' | null>(null);
  useEffect(() => {
    const check = () => {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
      const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.find((p) => p.type === 'weekday')!.value);
      const hm = `${parts.find((p) => p.type === 'hour')!.value}:${parts.find((p) => p.type === 'minute')!.value}`;
      setState(hours.some((h) => h.days.includes(wd) && hm >= h.open && hm < h.close) ? 'open' : 'closed');
    };
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [hours]);
  if (!state) return null;
  return <span className={`open-badge ${state}`}>{state === 'open' ? 'Open now' : 'Closed now'}</span>;
}

export function HelpfulWidget() {
  const pathname = usePathname() || '/';
  const [answer, setAnswer] = useState<'yes' | 'no' | null>(null);
  useEffect(() => { setAnswer(null); }, [pathname]);
  const vote = (a: 'yes' | 'no') => { setAnswer(a); void sendFeedback({ rating: a === 'yes' ? 5 : 2, topic: `Page ${pathname}`, comment: '' }); };
  return (
    <div className="helpful" aria-live="polite">
      {answer === null ? (
        <>
          <span>Was this page helpful?</span>
          <button type="button" onClick={() => vote('yes')}>Yes</button>
          <button type="button" onClick={() => vote('no')}>No</button>
        </>
      ) : answer === 'yes' ? (
        <span>Thank you for your feedback.</span>
      ) : (
        <span>Thank you. <Link href={`/feedback?topic=website`}>Tell us what was missing</Link>.</span>
      )}
    </div>
  );
}

export function BackToTop() {
  return (
    <button type="button" className="to-top" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); document.getElementById('main')?.focus({ preventScroll: true }); }}>
      Back to top
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
    </button>
  );
}
