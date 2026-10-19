'use client';
/** Member portal › Meeting minutes: published minutes of Councils, the Board, Joint meetings and the General Assembly. */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BODIES, fmt, type memberMinutes } from '@/lib/community/minutes';
import { findMember, getSessionEmail, SESSION_EVENT } from '@/lib/demo/demo-member';
import { memberMinutes as toItems, type Meeting } from '@/lib/community/minutes';
import { LIVE, be } from '@/lib/live/live';

type Item = ReturnType<typeof memberMinutes>[number];
export function MeetingMinutes({ items: demo }: { items: Item[] }) {
  const [ok, setOk] = useState<boolean | null>(null);
  const [liveItems, setLiveItems] = useState<Item[] | null>(null);
  useEffect(() => { if (LIVE && ok) void be<{ meetings: Meeting[] }>('GET', 'member/minutes').then((r) => setLiveItems(r.ok ? toItems(r.data.meetings) : [])); }, [ok]);
  const items = LIVE ? liveItems ?? [] : demo;
  const [body, setBody] = useState('');
  useEffect(() => { const read = () => setOk(!!findMember(getSessionEmail())); read(); window.addEventListener(SESSION_EVENT, read); return () => window.removeEventListener(SESSION_EVENT, read); }, []);
  useEffect(() => { if (ok === false) window.location.replace('/sign-in?next=/portal/minutes'); }, [ok]);
  if (!ok || (LIVE && !liveItems)) return <div className="portal-loading wrap" role="status">Loading…</div>;
  const rows = items.filter((m) => !body || m.body === body);
  return (
    <article className="cms-page"><div className="wrap narrow">
      <header className="cms-head"><p className="eyebrow">Members only</p><h1>Meeting minutes</h1><p className="intro">Approved minutes from your Councils, the Board, Joint meetings and the General Assembly.</p></header>
      <div className="mb-cats mm-filter" role="group" aria-label="Filter by meeting">
        <button type="button" aria-pressed={!body} onClick={() => setBody('')}>All</button>
        {Array.from(new Set(items.map((m) => m.body))).map((b) => <button key={b} type="button" aria-pressed={body === b} onClick={() => setBody(b)}>{BODIES[b]}</button>)}
      </div>
      <ul className="mm-list">{rows.map((m) => (
        <li key={m.id} data-minutes={m.id}><details>
          <summary><b>{m.title}</b><span>{fmt(m.date)} · approved {fmt(m.approvedOn)}</span></summary>
          {m.decisions.length > 0 && <><h3>Decisions</h3><ul className="mm-dec">{m.decisions.map((d, i) => <li key={i}><span className={`mm-res ${d.result === 'Passed' ? 'ok' : 'no'}`}>{d.result}</span>{d.text}</li>)}</ul></>}
          {m.notes && <><h3>Minutes</h3><p>{m.notes}</p></>}
        </details></li>
      ))}</ul>
      {!rows.length && <p>No published minutes yet.</p>}
      <p><Link href="/portal">Back to member home</Link></p>
      <p className="samples-note">{LIVE ? 'Minutes marked for leaders only are not shown here.' : 'Sample minutes. Minutes marked for leaders only are not shown here.'}</p>
    </div></article>
  );
}
