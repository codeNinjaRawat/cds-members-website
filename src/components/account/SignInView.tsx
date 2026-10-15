'use client';
/**
 * Sign in (W5) – DEMO, no API. Google (demo picker) or a 6-digit code by email. No passwords.
 * Real: POST /public/auth/otp/start|verify or Google OAuth → httpOnly session → redirect to ?next (same-site only).
 * Privacy: the code step always says "if this email has a membership…" so it never reveals who is a member;
 * only after the code is verified do we say whether a membership is linked.
 */
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import * as svc from '@/lib/demo/demo-service';
import { findMember, getSessionEmail, safeNext, setSession } from '@/lib/demo/demo-member';
import { GoogleButton, type GoogleProfile } from '@/components/join/GoogleButton';
import { aria, FField } from '@/components/forms/FormBits';
import { LOADER_PLANS, SmartLoader, type LoaderKey } from '@/components/ui/SmartLoader';

type Step = 'email' | 'code' | 'nomember' | 'done';

export function SignInView() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [task, setTask] = useState<LoaderKey | null>(null);
  const [seconds, setSeconds] = useState(0);
  const headRef = useRef<HTMLHeadingElement>(null);
  const busy = task !== null;

  const go = (url: string) => { window.location.assign(url); };
  const next = () => safeNext(new URLSearchParams(window.location.search).get('next'));

  // Already signed in → straight to member home
  useEffect(() => { if (findMember(getSessionEmail())) go(next()); }, []);
  useEffect(() => { if (seconds <= 0) return; const t = setTimeout(() => setSeconds((s) => s - 1), 1000); return () => clearTimeout(t); }, [seconds]);
  useEffect(() => { headRef.current?.focus(); }, [step]);

  const finish = (mail: string) => {
    if (!findMember(mail)) { setStep('nomember'); return; }
    setSession(mail); setStep('done');
    go(next());
  };

  const sendCode = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setError('Enter a valid email address, like name@example.com.');
    setError(''); setTask('sendCode');
    try { await svc.sendCode(email.trim()); setStep('code'); setSeconds(30); setCode(''); }
    finally { setTask(null); }
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code from the email.');
    setError(''); setTask('verifyCode');
    try {
      const r = await svc.verifyCode(email, code);
      if (!r.ok) return setError('That code is not right or has expired. Check the email or send a new code.');
      finish(email.trim().toLowerCase());
    } finally { setTask(null); }
  };

  const onGoogle = (p: GoogleProfile) => { setEmail(p.email); finish(p.email); };
  const fix = step === 'email' ? svc.suggestEmail(email) : null;

  return (
    <div className="signin-page">
      <div className="wrap signin-grid">
        <section className="signin-card jf-card" aria-busy={busy || undefined}>
          {step === 'email' && (<>
            <h1 tabIndex={-1} ref={headRef}>Sign in</h1>
            <p className="jf-lead">Welcome back. Use Google or get a 6-digit code by email – no password to remember.</p>
            <div className="auth-box">
              <GoogleButton onProfile={onGoogle} disabled={busy} />
              <div className="or" role="separator"><span>or use your email</span></div>
              <form onSubmit={sendCode} noValidate>
                <FField id="si-email" label="Email address" error={error}>
                  <div className="input-group">
                    <input id="si-email" className="input" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com"
                      value={email} onChange={(e) => setEmail(e.target.value)} {...aria('si-email', false, error)} />
                    <button className="btn btn-primary" type="submit" disabled={busy} data-busy={task === 'sendCode' || undefined}>{task === 'sendCode' ? 'Sending…' : 'Send code'}</button>
                  </div>
                </FField>
                {fix && <p className="jf-suggest">Did you mean <button type="button" className="linkish" onClick={() => setEmail(fix)}>{fix}</button>?</p>}
                <SmartLoader plan={LOADER_PLANS.sendCode} active={task === 'sendCode'} expectedMs={900} />
              </form>
              <p className="jf-test">Demo: sign in as <b>aisha@example.com</b> (family member) or <b>member@example.com</b> (life member). Code <b>{svc.DEMO_CODE}</b>.</p>
            </div>
          </>)}

          {step === 'code' && (
            <form onSubmit={verify} noValidate>
              <h1 tabIndex={-1} ref={headRef}>Check your email</h1>
              <p className="jf-lead" role="status">If <b>{email}</b> has an ISGH account, a 6-digit code is on its way. It expires in 10 minutes.</p>
              <FField id="si-code" label="6-digit code" error={error}>
                <input id="si-code" className="input code" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                  value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} {...aria('si-code', false, error)} />
              </FField>
              <div className="row-actions">
                <button className="btn btn-primary" type="submit" disabled={busy} data-busy={task === 'verifyCode' || undefined}>{task === 'verifyCode' ? 'Checking…' : 'Sign in'}</button>
                <button className="btn btn-outline" type="button" disabled={seconds > 0 || busy} onClick={() => void sendCode()}>{seconds > 0 ? `Resend code in ${seconds}s` : 'Resend code'}</button>
                <button className="linkish" type="button" onClick={() => { setStep('email'); setError(''); }}>Use a different email</button>
              </div>
              <SmartLoader plan={task === 'sendCode' ? LOADER_PLANS.sendCode : LOADER_PLANS.verifyCode} active={busy} expectedMs={800} />
              <p className="jf-test">Demo: no email is sent. Use code <b>{svc.DEMO_CODE}</b>.</p>
            </form>
          )}

          {step === 'nomember' && (<>
            <h1 tabIndex={-1} ref={headRef}>No membership linked to {email}</h1>
            <p className="jf-lead">Your email is verified, but we could not find an ISGH membership for it. If you joined with another email, sign in with that one. Otherwise, you can join in about five minutes.</p>
            <div className="row-actions">
              <Link className="btn btn-primary" href="/membership/join">Become a member</Link>
              <button className="btn btn-outline" type="button" onClick={() => { setStep('email'); setEmail(''); setCode(''); }}>Try another email</button>
            </div>
            <p className="hint">Joined on paper or at a center? <Link href="/contact">Contact the Membership Office</Link> to link your email.</p>
          </>)}

          {step === 'done' && <p role="status" className="jf-lead">Signed in. Opening your member home…</p>}
        </section>

        <aside className="signin-aside" aria-label="What you can do after signing in">
          <p className="eyebrow">Your member home</p>
          <h2>Everything about your membership, in one place.</h2>
          <ul className="si-list">
            <li><b>Digital member card</b><span>Show it at any center. Add it to Apple Wallet or Google Wallet.</span></li>
            <li><b>Your voting checklist</b><span>See exactly what you need before June 30.</span></li>
            <li><b>Renew in one tap</b><span>And download receipts for your tax records.</span></li>
            <li><b>Your household</b><span>Manage your spouse on a family plan.</span></li>
          </ul>
          <p className="si-new">New to ISGH? <Link href="/membership/join">Become a member</Link></p>
        </aside>
      </div>
    </div>
  );
}
