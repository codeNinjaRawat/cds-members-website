'use client';
/**
 * Member directory (WildApricot: Member directory + privacy). Only members who opted in are listed; which details
 * show comes from Admin › Settings › Configuration. DEMO: sample people (live: GET /member/directory, opted-in only).
 */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { OrgConfig } from '@/lib/community/org-config';
import { directoryCard, type DirectoryPerson } from '@/lib/community/member-records';
import { findMember, getSessionEmail, SESSION_EVENT } from '@/lib/demo/demo-member';

const SAMPLE: DirectoryPerson[] = [
  { name: 'Aisha Rahman', center: 'Southwest Islamic Center 1', phone: '(713) 555-0142', email: 'aisha@example.com', listed: true, values: { profession: 'Pharmacist' } },
  { name: 'Imran Siddiqui', center: 'North Islamic Center 3', phone: '(281) 555-0199', email: 'member@example.com', listed: true, values: { profession: 'Civil engineer' } },
  { name: 'Bilal Ahmed', center: 'Bear Creek', phone: '(832) 555-0110', email: 'bilal@example.com', listed: true, values: { profession: 'Teacher' } },
  { name: 'Maryam Qureshi', center: 'Katy', phone: '(281) 555-0175', email: 'maryam@example.com', listed: true, values: { profession: 'Nurse practitioner' } },
  { name: 'Hassan Ali', center: 'Champions', phone: '(713) 555-0188', email: 'hassan@example.com', listed: true, values: { profession: 'Electrician' } },
  { name: 'Zainab Hussain', center: 'HWY 3', phone: '(832) 555-0121', email: 'zainab@example.com', listed: true, values: { profession: 'Accountant' } },
  { name: 'Omar Farooqui', center: 'Katy', phone: '(281) 555-0133', email: 'omar@example.com', listed: false, values: { profession: 'Dentist' } }, // did not opt in – never shown when opt-in is on
];

export function MemberDirectory({ config }: { config: OrgConfig }) {
  const d = config.members.directory;
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [q, setQ] = useState('');
  const [listed, setListed] = useState(false);
  useEffect(() => { const read = () => setSignedIn(!!findMember(getSessionEmail())); read(); window.addEventListener(SESSION_EVENT, read); return () => window.removeEventListener(SESSION_EVENT, read); }, []);
  if (d.audience === 'members' && signedIn === false) return (
    <article className="cms-page"><div className="wrap narrow"><h1>Member directory</h1><p>The directory is for members. <Link href="/sign-in?next=/portal/directory">Sign in</Link> to see it.</p></div></article>
  );
  const viewer = signedIn ? 'member' : 'public';
  const cards = SAMPLE.map((p) => directoryCard(config, p, viewer)).filter((c): c is NonNullable<typeof c> => !!c);
  const rows = cards.filter((p) => !q || `${p.name} ${p.center ?? ''} ${p.extra.map((x) => x.value).join(' ')}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <article className="cms-page"><div className="wrap">
      <header className="cms-head"><h1>Member directory</h1><p className="intro">Members who chose to be listed. {d.optIn ? 'You choose whether you appear.' : ''}</p></header>
      {d.optIn && signedIn && <label className="check dir-optin"><input type="checkbox" checked={listed} onChange={(e) => setListed(e.target.checked)} /> <span>List me in the directory (demo – not saved)</span></label>}
      {!signedIn && <p className="muted">Phone numbers and emails are shown only to signed-in members.</p>}
      <div className="field"><label htmlFor="dir-q">Search by name, center or details</label><input id="dir-q" className="input" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <ul className="dir-list">{rows.map((p) => (
        <li key={p.name}><b>{p.name}</b>{p.extra.map((x) => <span key={x.id} title={x.label}>{x.value}</span>)}{p.center && <span>{p.center}</span>}
          {p.phone && <a href={`tel:${p.phone.replace(/\D/g, '')}`}>{p.phone}</a>}{p.email && <a href={`mailto:${p.email}`}>{p.email}</a>}</li>
      ))}</ul>
      {!rows.length && <p>No one matches “{q}”.</p>}
      <p className="samples-note">Sample people – the real directory lists only members who opted in.</p>
    </div></article>
  );
}
