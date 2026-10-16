'use client';
/**
 * Email and text preferences (the link at the bottom of every bulk email). Members choose which kinds of message they get.
 * Membership and election notices are official and always sent. DEMO: saved in this tab; the server checks the choices.
 * Live: GET/PUT /member/preferences (signed in) or a signed one-click link (no sign-in) from the email footer.
 */
import { useEffect, useState } from 'react';
import { TOPICS, TOPIC_KEYS, type Prefs, type Topic } from '@/lib/community/campaigns';
import { findMember, getSessionEmail } from '@/lib/demo/demo-member';

const KEY = 'isgh-demo-prefs';
const DEFAULT: Prefs = { email: true, sms: false, optOut: [] };

export function EmailPreferences({ smsConsentText }: { smsConsentText: string }) {
  const [p, setP] = useState<Prefs>(DEFAULT);
  const [who, setWho] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    setWho(findMember(getSessionEmail())?.firstName ?? null);
    try { const s = sessionStorage.getItem(KEY); if (s) setP(JSON.parse(s)); } catch { /* private mode */ }
  }, []);
  const flip = (t: Topic) => setP((x) => ({ ...x, optOut: x.optOut.includes(t) ? x.optOut.filter((y) => y !== t) : [...x.optOut, t] }));
  const save = async () => {
    setMsg(null);
    const r = await fetch('/api/preferences', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    if (!r?.ok) { setMsg({ ok: false, text: j.message ?? 'Could not save. Try again.' }); return; }
    try { sessionStorage.setItem(KEY, JSON.stringify(j.prefs)); } catch { /* */ }
    setP(j.prefs); setMsg({ ok: true, text: 'Saved. Changes apply to the next message.' });
  };
  return (
    <article className="cms-page prefs-page"><div className="wrap narrow">
      <header className="cms-head"><h1>Email and text choices</h1>
        <p className="intro">{who ? `${who}, choose` : 'Choose'} what we send you. Membership and election notices always go to every member – the Bylaws require them.</p></header>
      <section className="prefs-box" aria-labelledby="pf-email">
        <h2 id="pf-email">Email</h2>
        <label className="check"><input type="checkbox" checked={p.email} onChange={(e) => setP({ ...p, email: e.target.checked })} /> <span>Send me email</span></label>
        <ul className="prefs-topics">{TOPIC_KEYS.map((t) => (
          <li key={t}><label className="check"><input type="checkbox" disabled={!p.email || !TOPICS[t].optional} checked={!TOPICS[t].optional || (p.email && !p.optOut.includes(t))} onChange={() => flip(t)} /> <span>{TOPICS[t].label}{!TOPICS[t].optional && <small> – always sent</small>}</span></label></li>
        ))}</ul>
        {!p.email && <p className="hint">You will still get receipts, renewal reminders and membership and election notices – they are part of your membership.</p>}
      </section>
      <section className="prefs-box" aria-labelledby="pf-sms">
        <h2 id="pf-sms">Text messages</h2>
        <label className="check"><input type="checkbox" checked={p.sms} onChange={(e) => setP({ ...p, sms: e.target.checked })} /> <span>{smsConsentText}</span></label>
      </section>
      <button type="button" className="btn btn-primary" onClick={save}>Save my choices</button>
      {msg && <p className={`notice ${msg.ok ? 'ok' : 'bad'}`} role="status">{msg.text}</p>}
    </div></article>
  );
}
