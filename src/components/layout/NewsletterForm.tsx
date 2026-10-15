'use client';
/** Newsletter sign-up → POST /api/newsletter (route handler → BE). Texts from admin CMS; consent is required (CAN-SPAM). */
import { useState, type FormEvent } from 'react';
import { t } from '@/content/en-US/common';
import { subscribe } from '@/lib/demo/demo-service';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Props = { title: string; text: string; consent: string };
type Status = { kind: 'idle' | 'error' | 'ok' | 'busy'; message: string };

export function NewsletterForm({ title, text, consent }: Props) {
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle', message: '' });

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const v = email.trim();
    const form = e.currentTarget;
    if (!EMAIL_RE.test(v)) {
      setInvalid(true); setStatus({ kind: 'error', message: t.newsletter.invalidEmail });
      form.querySelector<HTMLInputElement>('#nlEmail')?.focus(); return;
    }
    setInvalid(false);
    if (!agreed) {
      setStatus({ kind: 'error', message: t.newsletter.needConsent });
      form.querySelector<HTMLInputElement>('#nlConsent')?.focus(); return;
    }
    setStatus({ kind: 'busy', message: '' });
    try {
      await subscribe(v); // DEMO: no API call. Live: POST /api/newsletter → BE (double opt-in)
      setStatus({ kind: 'ok', message: t.newsletter.success(v) });
      setEmail(''); setAgreed(false);
    } catch {
      setStatus({ kind: 'error', message: t.newsletter.failed });
    }
  };

  return (
    <div className="newsletter">
      <h3>{title}</h3>
      <p>{text}</p>
      <form id="nlForm" noValidate onSubmit={onSubmit}>
        <div className="row">
          <label className="sr-only" htmlFor="nlEmail">{t.newsletter.emailLabel}</label>
          <input className="input" id="nlEmail" type="email" autoComplete="email" placeholder={t.newsletter.placeholder}
            value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={invalid || undefined} aria-describedby="nlMsg" />
          <button className="btn" type="submit" disabled={status.kind === 'busy'} data-busy={status.kind === 'busy' || undefined}>
            {status.kind === 'busy' ? t.newsletter.submitting : t.newsletter.submit}
          </button>
        </div>
        <label className="check"><input type="checkbox" id="nlConsent" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /> <span>{consent}</span></label>
        <p className={`msg${status.kind === 'error' ? ' error' : status.kind === 'ok' ? ' ok' : ''}`} id="nlMsg" aria-live="polite">{status.message}</p>
      </form>
    </div>
  );
}
