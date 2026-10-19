'use client';
/**
 * Sign in (W5 + M4) – DEMO, no API. One door for everyone: members, Board, zone directors, masjid working bodies.
 * The ways to sign in come from Admin › Settings › Sign-in (Google, a code by email, a code by text, a password).
 * After signing in, a person with more than one dashboard picks where to go (or the last / main one opens – setting).
 * Real: POST /public/auth/otp/start|verify or Google OAuth → httpOnly session → GET /auth/dashboards → redirect.
 * Privacy: the code step always says "if this email has an account…" so it never reveals who has one; the dashboards
 * are listed only after the code is verified.
 */
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import * as svc from '@/lib/demo/demo-service';
import { DEMO_MEMBERS, findMember, getSessionEmail, refreshLiveMember, safeNext, setSession } from '@/lib/demo/demo-member';
import { GoogleButton, type GoogleProfile } from '@/components/join/GoogleButton';
import { aria, FField } from '@/components/forms/FormBits';
import { LOADER_PLANS, SmartLoader, type LoaderKey } from '@/components/ui/SmartLoader';
import { autoOpen, dashKey, mockSignIn, type Dashboard, type DashKind, type SignInSettings } from '@/lib/community/sign-in';

type Step = 'email' | 'code' | 'nomember' | 'choose' | 'done';
type Via = 'email' | 'phone' | 'password';
export type MasjidLookup = { name: string; zone: string; zips: string[]; city: string };
const LAST = 'isgh-last-dashboard';

/** The admin app that belongs to this website (local ports, SaaS "-admin" address, or the configured origin). */
function adminOrigin() {
  const { hostname, port, protocol, origin } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost')) return `${protocol}//${hostname}:${port === '4321' ? '4322' : '3001'}`;
  const [sub, ...rest] = hostname.split('.');
  return rest.length >= 2 && !sub.endsWith('-admin') ? `${protocol}//${sub}-admin.${rest.join('.')}` : process.env.NEXT_PUBLIC_ISGH_ADMIN_ORIGIN ?? origin;
}
const ICON: Record<DashKind, string> = {
  member: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0',
  organization: 'M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6',
  zone: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  masjid: 'M12 3c-3 2.5-6 4.6-6 8h12c0-3.4-3-5.5-6-8ZM5 11h14v10H5zM10 21v-4a2 2 0 0 1 4 0v4',
  area: 'M4 6h16M4 12h16M4 18h10',
};

/** `startPath`: Configuration › Start page – where members land when no ?next= is given. */
export function SignInView({ startPath = '/portal', settings = mockSignIn, masjids = [] }: { startPath?: string; settings?: SignInSettings; masjids?: MasjidLookup[] } = {}) {
  const m = settings.methods;
  const [step, setStep] = useState<Step>('email');
  const [via, setVia] = useState<Via>(m.emailCode ? 'email' : m.phoneCode ? 'phone' : 'password');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [task, setTask] = useState<LoaderKey | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [list, setList] = useState<Dashboard[]>([]);
  const [remember, setRemember] = useState(true);
  const headRef = useRef<HTMLHeadingElement>(null);
  const busy = task !== null;

  const go = (url: string) => { window.location.assign(url); };
  const next = () => safeNext(new URLSearchParams(window.location.search).get('next'), startPath);

  // Already signed in as a member (and no ?switch) → straight to member home
  useEffect(() => { if (findMember(getSessionEmail()) && !new URLSearchParams(window.location.search).has('switch')) go(next()); }, []);
  useEffect(() => { if (seconds <= 0) return; const t = setTimeout(() => setSeconds((s) => s - 1), 1000); return () => clearTimeout(t); }, [seconds]);
  useEffect(() => { headRef.current?.focus(); }, [step]);

  const current = useRef<number | null>(null);   // live: the dashboard the new session opened on
  const open = async (d: Dashboard, mail = email) => {
    try { if (remember) localStorage.setItem(LAST, `${mail}|${dashKey(d)}`); } catch { /* storage blocked */ }
    if (!svc.DEMO && current.current !== d.index) { if (!(await svc.openDashboard(d.index))) return setError('That dashboard is not available any more. Please sign in again.'); current.current = d.index; }
    setStep('done');
    if (d.kind === 'member') { setSession(mail); go(next()); return; }
    if (findMember(mail)) setSession(mail, true);
    // DEMO: the admin reads ?as= and ?dash= once. Live: the admin has its own sign-in (its own address and cookie); dash picks the role.
    go(svc.DEMO ? `${adminOrigin()}/?as=${encodeURIComponent(d.adminId)}&dash=${d.index}` : `${adminOrigin()}/sign-in?dash=${d.index}&email=${encodeURIComponent(mail)}`);
  };

  const finish = async (mail: string, live?: { dashboards: Dashboard[]; current?: number }) => {
    if (live) { current.current = live.current ?? null; if (live.dashboards.some((x) => x.kind === 'member')) await refreshLiveMember(false); }
    const member = !!findMember(mail);
    let dashboards: Dashboard[] = live ? live.dashboards : member ? [{ kind: 'member', label: settings.kinds.member.label, role: 'Member', where: '', index: -1, adminId: '' }] : [];
    if (!live) try {
      const r = await fetch('/api/auth/dashboards', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: mail, code: svc.DEMO_CODE, member }) });
      if (r.ok) dashboards = ((await r.json()) as { dashboards: Dashboard[] }).dashboards;
    } catch { /* offline: membership only */ }
    if (!dashboards.length) { setStep('nomember'); return; }
    setEmail(mail); setList(dashboards);
    let last: string | undefined;
    try { const v = localStorage.getItem(LAST); if (v?.startsWith(`${mail}|`)) last = v.slice(mail.length + 1); } catch { /* storage blocked */ }
    const auto = new URLSearchParams(window.location.search).has('switch') ? null : autoOpen(dashboards, settings, last);
    if (auto) void open(auto, mail); else setStep('choose');
  };

  const sendCode = async (e?: FormEvent) => {
    e?.preventDefault();
    if (via === 'phone') {
      const digits = phone.replace(/\D/g, '');
      if (digits.length !== 10) return setError('Enter a 10-digit US mobile number, like (713) 555-0142.');
      // DEMO: find the member by phone (live: the API does this and never says whether it found one)
      const found = svc.DEMO ? Object.values(DEMO_MEMBERS).find((x) => x.phone.replace(/\D/g, '') === digits) : undefined;
      setEmail(svc.DEMO ? found?.email ?? `${digits}@phone.invalid` : digits);
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setError('Enter a valid email address, like name@example.com.');
    setError(''); setTask('sendCode');
    try { await svc.sendCode(via === 'phone' && !svc.DEMO ? phone.replace(/\D/g, '') : email.trim() || phone); setStep('code'); setSeconds(30); setCode(''); }
    catch (err) { setError(err instanceof Error ? err.message : 'We could not send the code. Please try again.'); }
    finally { setTask(null); }
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return setError(`Enter the 6-digit code from the ${via === 'phone' ? 'text message' : 'email'}.`);
    setError(''); setTask('verifyCode');
    try {
      const r = await svc.verifyCode(email, code);
      if (!r.ok) return setError(r.error === 'unavailable' ? (r.message ?? 'We could not reach the server.') : `That code is not right or has expired. Check the ${via === 'phone' ? 'text message' : 'email'} or send a new code.`);
      await finish(email.trim().toLowerCase(), r.dashboards ? { dashboards: r.dashboards, current: r.current } : undefined);
    } finally { setTask(null); }
  };

  const withPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setError('Enter a valid email address, like name@example.com.');
    if (password.length < 8) return setError('Enter your password (at least 8 characters).');
    setError(''); setTask('verifyCode');
    try {
      if (svc.DEMO) return await finish(email.trim().toLowerCase());
      const r = await svc.passwordSignIn(email.trim().toLowerCase(), password);
      if (!r.ok) return setError(r.message);
      await finish(email.trim().toLowerCase(), { dashboards: r.dashboards, current: r.current });
    } finally { setTask(null); }
  };

  const onGoogle = (p: GoogleProfile) => { setEmail(p.email); void finish(p.email); };
  const fix = step === 'email' && via !== 'phone' ? svc.suggestEmail(email) : null;
  const ways = ([['email', m.emailCode, 'Email code'], ['phone', m.phoneCode, 'Text code'], ['password', m.password, 'Password']] as const).filter(([, on]) => on);

  return (
    <div className="signin-page">
      <div className="wrap signin-grid">
        <section className="signin-card jf-card" aria-busy={busy || undefined}>
          {step === 'email' && (<>
            <h1 tabIndex={-1} ref={headRef}>Sign in</h1>
            <p className="jf-lead">One sign-in for members and everyone who serves – then choose where to go.</p>
            <div className="auth-box">
              {m.google && <GoogleButton onProfile={onGoogle} disabled={busy} />}
              {m.google && ways.length > 0 && <div className="or" role="separator"><span>or</span></div>}
              {ways.length > 1 && (
                <div className="si-ways" role="tablist" aria-label="How to sign in">
                  {ways.map(([id, , label]) => <button key={id} type="button" role="tab" aria-selected={via === id} className={via === id ? 'on' : ''} onClick={() => { setVia(id); setError(''); }}>{label}</button>)}
                </div>
              )}
              {via === 'password' && m.password ? (
                <form onSubmit={withPassword} noValidate className="si-pass">
                  <FField id="si-email" label="Email address"><input id="si-email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></FField>
                  <FField id="si-pass" label="Password" error={error}><input id="si-pass" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} {...aria('si-pass', false, error)} /></FField>
                  <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
                  {svc.DEMO && <p className="jf-test">Demo: any password with 8 or more characters.</p>}
                </form>
              ) : (ways.length > 0 && (
                <form onSubmit={sendCode} noValidate>
                  {via === 'phone' ? (
                    <FField id="si-phone" label="Mobile number" error={error}>
                      <div className="input-group">
                        <input id="si-phone" className="input" type="tel" autoComplete="tel" inputMode="tel" placeholder="(713) 555-0142" value={phone} onChange={(e) => setPhone(e.target.value)} {...aria('si-phone', false, error)} />
                        <button className="btn btn-primary" type="submit" disabled={busy}>{task === 'sendCode' ? 'Sending…' : 'Text me a code'}</button>
                      </div>
                    </FField>
                  ) : (
                    <FField id="si-email" label="Email address" error={error}>
                      <div className="input-group">
                        <input id="si-email" className="input" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com"
                          value={email} onChange={(e) => setEmail(e.target.value)} {...aria('si-email', false, error)} />
                        <button className="btn btn-primary" type="submit" disabled={busy} data-busy={task === 'sendCode' || undefined}>{task === 'sendCode' ? 'Sending…' : 'Send code'}</button>
                      </div>
                    </FField>
                  )}
                  {fix && <p className="jf-suggest">Did you mean <button type="button" className="linkish" onClick={() => setEmail(fix)}>{fix}</button>?</p>}
                  <SmartLoader plan={LOADER_PLANS.sendCode} active={task === 'sendCode'} expectedMs={900} />
                </form>
              ))}
              {svc.DEMO && <p className="jf-test">Demo: <b>aisha@example.com</b> (member), <b>ad.se1@example.org</b> (member who runs a masjid and represents a ZIP code), <b>president@example.org</b> (Board). Code <b>{svc.DEMO_CODE}</b>.</p>}
              {settings.staffNote && <p className="si-staff">{settings.staffNote}</p>}
            </div>
          </>)}

          {step === 'code' && (
            <form onSubmit={verify} noValidate>
              <h1 tabIndex={-1} ref={headRef}>{via === 'phone' ? 'Check your phone' : 'Check your email'}</h1>
              <p className="jf-lead" role="status">If <b>{via === 'phone' ? phone : email}</b> has an ISGH account, a 6-digit code is on its way. It expires in 10 minutes.</p>
              <FField id="si-code" label="6-digit code" error={error}>
                <input id="si-code" className="input code" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                  value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} {...aria('si-code', false, error)} />
              </FField>
              <div className="row-actions">
                <button className="btn btn-primary" type="submit" disabled={busy} data-busy={task === 'verifyCode' || undefined}>{task === 'verifyCode' ? 'Checking…' : 'Sign in'}</button>
                <button className="btn btn-outline" type="button" disabled={seconds > 0 || busy} onClick={() => void sendCode()}>{seconds > 0 ? `Resend code in ${seconds}s` : 'Resend code'}</button>
                <button className="linkish" type="button" onClick={() => { setStep('email'); setError(''); }}>{via === 'phone' ? 'Use a different number' : 'Use a different email'}</button>
              </div>
              <SmartLoader plan={task === 'sendCode' ? LOADER_PLANS.sendCode : LOADER_PLANS.verifyCode} active={busy} expectedMs={800} />
              {svc.DEMO && <p className="jf-test">Demo: no message is sent. Use code <b>{svc.DEMO_CODE}</b>.</p>}
            </form>
          )}

          {step === 'choose' && (
            <div className="si-choose">
              <h1 tabIndex={-1} ref={headRef}>Where would you like to go?</h1>
              <p className="jf-lead">You have {list.length} dashboards. You can switch any time from the top bar.</p>
              <ul className="si-dash-list">{list.map((d) => (
                <li key={dashKey(d)}>
                  <button type="button" className={`si-dash k-${d.kind}`} data-kind={d.kind} onClick={() => open(d)}>
                    <span className="si-dash-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path d={ICON[d.kind]} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                    <span className="si-dash-txt"><b>{d.label}</b><span>{d.kind === 'member' ? settings.kinds.member.help : `${d.role}${d.where ? ` · ${d.where}` : ''}`}</span></span>
                    <span className="si-dash-go" aria-hidden="true">→</span>
                  </button>
                </li>
              ))}</ul>
              <label className="check si-remember"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> <span>Remember my choice on this device</span></label>
            </div>
          )}

          {step === 'nomember' && (<>
            <h1 tabIndex={-1} ref={headRef}>No membership linked to {via === 'phone' ? phone : email}</h1>
            <p className="jf-lead">Your email is verified, but we could not find an ISGH membership or a role for it. If you joined with another email, sign in with that one. Otherwise, you can join in about five minutes.</p>
            <div className="row-actions">
              <Link className="btn btn-primary" href="/membership/join">Become a member</Link>
              <button className="btn btn-outline" type="button" onClick={() => { setStep('email'); setEmail(''); setCode(''); }}>Try another email</button>
            </div>
            <p className="hint">Joined on paper or at a center? <Link href="/contact">Contact the Membership Office</Link> to link your email.</p>
          </>)}

          {step === 'done' && <p role="status" className="jf-lead">Signed in. Opening your dashboard…</p>}
        </section>

        <aside className="signin-aside" aria-label="What you can do after signing in">
          <p className="eyebrow">One sign-in</p>
          <h2>Your membership and your work, in one place.</h2>
          <ul className="si-list">
            {(['member', 'masjid', 'zone', 'organization'] as const).filter((k) => settings.kinds[k].enabled).map((k) => <li key={k}><b>{settings.kinds[k].label}</b><span>{settings.kinds[k].help}</span></li>)}
          </ul>
          {settings.findMasjid && masjids.length > 0 && <FindMasjid masjids={masjids} />}
          <p className="si-new">New to ISGH? <Link href="/membership/join">Become a member</Link></p>
        </aside>
      </div>
    </div>
  );
}

/** Everyone belongs to a masjid by ZIP code – look it up before joining or signing in. */
function FindMasjid({ masjids }: { masjids: MasjidLookup[] }) {
  const [zip, setZip] = useState('');
  const hit = zip.length === 5 ? masjids.find((x) => x.zips.includes(zip)) : undefined;
  return (
    <div className="si-find">
      <label htmlFor="si-zip"><b>Find your masjid</b> <span>by home ZIP code</span></label>
      <input id="si-zip" className="input" inputMode="numeric" maxLength={5} placeholder="77072" value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))} />
      {zip.length === 5 && <p role="status" className="si-find-out">{hit ? <>Your masjid is <b>{hit.name}</b>{hit.city ? ` in ${hit.city}` : ''} · {hit.zone}</> : 'No masjid serves this ZIP code yet. You can still join – the Membership Office will place you.'}</p>}
    </div>
  );
}
