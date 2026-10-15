'use client';
/**
 * SmartLoader – step-aware progress for anything that takes a moment (forms, lookups, payment).
 *
 * Why "smart":
 *  - Waits 200 ms before showing (fast answers never flash a spinner).
 *  - Once shown, ends on a short ✓ "Done" frame (380 ms, no jarring jumps).
 *  - Walks through real-sounding steps for THIS task, so people know what is happening.
 *  - After 6 s it says "Still working – please keep this page open" (slow network reassurance).
 *  - Screen readers hear the title and each step once (role=status, polite); reduced-motion users get no spinning.
 *  - Optional verse/quote while waiting (admin text from CMS › Giving).
 *
 * Messages live in LOADER_PLANS (admin: Settings › Microcopy › Loaders – planned).
 */
import { useEffect, useState } from 'react';
import { demoSpeedFactor } from '@/lib/demo/demo-service';

export type LoaderPlan = { title: string; steps: string[]; note?: string; quote?: { text: string; ref: string } };

export const LOADER_PLANS = {
  sendCode: { title: 'Sending your code', steps: ['Checking the email address', 'Creating a one-time code', 'Sending it to your inbox'] },
  verifyCode: { title: 'Checking your code', steps: ['Matching the code', 'Securing your session'] },
  google: { title: 'Signing in with Google', steps: ['Confirming your Google account', 'Reading your verified email and name'] },
  lookup: { title: 'Finding your Islamic Center', steps: ['Reading your address', 'Placing it on the map', 'Matching your zone and center'] },
  submit: {
    title: 'Submitting your membership',
    steps: ['Re-checking every answer', 'Confirming your price', 'Processing payment (demo)', 'Creating your member record'],
    note: 'Please keep this page open. You will never be charged twice.',
    quote: { text: 'And cooperate in righteousness and piety.', ref: 'Quran 5:2' },
  },
  feedback: { title: 'Sending your feedback', steps: ['Saving your rating', 'Routing it to the right team'] },
  complaint: { title: 'Filing your complaint', steps: ['Encrypting your report', 'Assigning a case number', 'Notifying the review team'] },
  verify: { title: 'Checking the membership', steps: ['Looking up the member ID', 'Matching name and ZIP', 'Reading the status'] },
  idScan: { title: 'Reading your ID', steps: ['Finding the card edges', 'Reading name and date of birth', 'Reading the address'] },
  newsletter: { title: 'Subscribing', steps: ['Saving your email', 'Sending a confirmation'] },
  give: {
    title: 'Sending your gift',
    steps: ['Confirming the amount', 'Securing payment (demo)', 'Recording it for this case', 'Preparing your receipt'],
    note: 'Your receipt is emailed for your tax records.',
    quote: { text: 'Whatever thing you spend [in His cause] - He will compensate it.', ref: 'Quran 34:39' },
  },
} satisfies Record<string, LoaderPlan>;
export type LoaderKey = keyof typeof LOADER_PLANS;

type Props = { plan: LoaderPlan; active: boolean; variant?: 'overlay' | 'inline'; expectedMs?: number; className?: string };

export function SmartLoader({ plan, active, variant = 'inline', expectedMs = 1400, className = '' }: Props) {
  const [phase, setPhase] = useState<'idle' | 'wait' | 'run' | 'done'>('idle');
  const [step, setStep] = useState(0);
  const [slow, setSlow] = useState(false);
  const n = plan.steps.length;

  useEffect(() => {
    if (active) {
      setStep(0); setSlow(false); setPhase('wait');
      const show = setTimeout(() => setPhase((p) => (p === 'wait' ? 'run' : p)), 200);
      const per = Math.max(140, (expectedMs * demoSpeedFactor()) / n); // steps keep pace with the demo speed
      const tick = setInterval(() => setStep((s) => Math.min(s + 1, n - 1)), per);
      const late = setTimeout(() => setSlow(true), 6000);
      return () => { clearTimeout(show); clearInterval(tick); clearTimeout(late); };
    }
    setPhase((p) => (p === 'run' ? 'done' : 'idle'));
  }, [active, expectedMs, n]);

  useEffect(() => {
    if (phase !== 'done') return;
    setStep(n);
    const t = setTimeout(() => setPhase('idle'), 380);
    return () => clearTimeout(t);
  }, [phase, n]);

  if (phase === 'idle' || phase === 'wait') return null;
  const done = phase === 'done';
  const pct = done ? 100 : Math.round(((step + 0.6) / (n + 0.4)) * 100);
  const current = done ? 'Done' : plan.steps[step];

  return (
    <div className={`sl sl-${variant}${done ? ' is-done' : ''} ${className}`} data-loader>
      <div className="sl-panel">
        <div className="sl-head">
          <LoaderMark done={done} />
          <div className="sl-titles">
            <b className="sl-title">{done ? 'All set' : plan.title}</b>
            {variant === 'inline' && <span className="sl-current">{current}</span>}
          </div>
        </div>
        <div className="sl-bar" role="progressbar" aria-label={plan.title} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
          <span style={{ width: `${pct}%` }} />
        </div>
        {variant === 'overlay' && (
          <ol className="sl-steps">
            {plan.steps.map((s, i) => (
              <li key={s} className={i < step || done ? 'ok' : i === step ? 'now' : ''}>
                <i aria-hidden="true" />{s}
              </li>
            ))}
          </ol>
        )}
        {variant === 'overlay' && plan.note && <p className="sl-note">{plan.note}</p>}
        {variant === 'overlay' && plan.quote && (
          <blockquote className="sl-quote"><p>&ldquo;{plan.quote.text}&rdquo;</p><cite>{plan.quote.ref}</cite></blockquote>
        )}
        {slow && !done && <p className="sl-slow">Still working – this is taking longer than usual. Please keep this page open.</p>}
      </div>
      {/* One polite announcement per step change */}
      <p className="sr-only" role="status" aria-live="polite">{done ? `${plan.title}: done.` : `${plan.title}. ${current}.`}</p>
    </div>
  );
}

/** Brand loader mark: two squares of the 8-point star turning in opposite directions, then a check. */
export function LoaderMark({ done = false, size = 34 }: { done?: boolean; size?: number }) {
  return (
    <svg className={`sl-mark${done ? ' is-done' : ''}`} width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <g className="sl-sq a"><rect x="24" y="24" width="52" height="52" rx="4" /></g>
      <g className="sl-sq b"><rect x="24" y="24" width="52" height="52" rx="4" transform="rotate(45 50 50)" /></g>
      <circle className="sl-core" cx="50" cy="50" r="13" />
      <path className="sl-check" d="M40 51 l7 7 l14 -16" />
    </svg>
  );
}
