'use client';
/**
 * O2.1 – "My masjid": remembers the masjid a visitor last opened (this browser only) and offers it in the header.
 * Members: their record's masjid wins when they are signed in (portal sets the same key).
 */
import Link from 'next/link';
import { useEffect, useState } from 'react';

export const MY_MASJID_KEY = 'isgh-my-masjid';
export type MyMasjid = { id: string; name: string };
export const rememberMasjid = (m: MyMasjid) => { try { localStorage.setItem(MY_MASJID_KEY, JSON.stringify(m)); window.dispatchEvent(new Event('isgh:my-masjid')); } catch { /* storage blocked */ } };
const read = (): MyMasjid | null => { try { const v = localStorage.getItem(MY_MASJID_KEY); return v ? (JSON.parse(v) as MyMasjid) : null; } catch { return null; } };

export function MyMasjidLink({ className = '' }: { className?: string }) {
  const [m, setM] = useState<MyMasjid | null>(null);
  useEffect(() => { const f = () => setM(read()); f(); window.addEventListener('isgh:my-masjid', f); return () => window.removeEventListener('isgh:my-masjid', f); }, []);
  if (!m) return null;
  return <Link className={`my-masjid ${className}`} href={`/masjid/${m.id}`} title={`My masjid: ${m.name}`}><span aria-hidden>◉</span> {m.name}</Link>;
}
/** Placed on masjid pages: remembers this masjid. */
export function RememberMasjid({ id, name }: { id: string; name: string }) {
  useEffect(() => { rememberMasjid({ id, name }); }, [id, name]);
  return null;
}
