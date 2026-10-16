'use client';
/**
 * F6 Prayer times (public). Pick an Islamic Center: today's adhan and iqamah with the next prayer, Jumu'ah, Eid and
 * other special prayers, and the month. The chosen center is remembered on this device.
 */
import { useEffect, useMemo, useState } from 'react';
import { PRAYERS, PRAYER_NAME, clock, dayTimes, monthDays, nextPrayer, type IqPrayer, type PrayerSettings } from '@/lib/community/prayer';

type C = { name: string; zone: string; jumuah: string[] };
const KEY = 'isgh-prayer-center';
const todayCT = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
const nowMin = () => { const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', hourCycle: 'h23', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date()); return Number(p.find((x) => x.type === 'hour')?.value) * 60 + Number(p.find((x) => x.type === 'minute')?.value); };
const t12 = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return clock(h * 60 + m); };
const day = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export function PrayerTimesPage({ s, centers }: { s: PrayerSettings; centers: C[] }) {
  const [c, setC] = useState(centers[0]?.name ?? '');
  const [now, setNow] = useState<number | null>(null);
  const [showMonth, setShowMonth] = useState(false);
  useEffect(() => { try { const v = localStorage.getItem(KEY); if (v && centers.some((x) => x.name === v)) setC(v); } catch { /* blocked */ } setNow(nowMin()); const t = setInterval(() => setNow(nowMin()), 30_000); return () => clearInterval(t); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const pick = (v: string) => { setC(v); try { localStorage.setItem(KEY, v); } catch { /* blocked */ } };
  const center = centers.find((x) => x.name === c);
  const today = todayCT();
  const d = dayTimes(s, c, today, center?.jumuah ?? []);
  const next = now === null ? null : nextPrayer(d, now);
  const iq = s.website.showIqamah && d.iqamah;
  const fri = useMemo(() => { const x = new Date(`${today}T12:00:00Z`); x.setUTCDate(x.getUTCDate() + ((5 - x.getUTCDay() + 7) % 7)); return x.toISOString().slice(0, 10); }, [today]);
  const [y, m] = today.split('-').map(Number);
  const month = showMonth ? monthDays(y, m).map((x) => dayTimes(s, c, x, center?.jumuah ?? [])) : [];
  const upcoming = s.special.filter((x) => x.date >= today && (!x.center || x.center === c)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  return (
    <article className="cms-page pt-pub"><div className="wrap">
      <header className="cms-head"><p className="eyebrow">{s.website.showHijri ? d.hijri : 'Daily prayers'}</p><h1>Prayer times</h1><p className="intro">{day(today)} · {s.location.label}</p></header>
      <div className="field pt-pick"><label htmlFor="pt-center">Islamic Center</label>
        <select id="pt-center" className="input" value={c} onChange={(e) => pick(e.target.value)}>
          {Array.from(new Set(centers.map((x) => x.zone))).map((z) => <optgroup key={z} label={z}>{centers.filter((x) => x.zone === z).map((x) => <option key={x.name}>{x.name}</option>)}</optgroup>)}
        </select></div>
      {next && <p className="pt-nextp" role="status">Next: <b>{PRAYER_NAME[next.prayer]} {next.kind}</b> at {clock(next.at)} · in {Math.max(0, next.at - (now ?? 0))} minutes</p>}
      <ol className="pt-cards">{PRAYERS.map((p) => (
        <li key={p} className={next?.prayer === p ? 'on' : ''} data-prayer={p}>
          <span>{PRAYER_NAME[p]}</span><b>{clock(d.adhan[p])}</b>
          {p !== 'sunrise' && iq && <small>Iqamah {clock(d.iqamah![p as IqPrayer])}</small>}
        </li>))}</ol>
      <div className="pt-extra">
        <section><h2>Jumu’ah</h2>{center?.jumuah.length ? <p>{day(fri).split(',').slice(0, 2).join(',')}: khutbah at {center.jumuah.map(t12).join(' and ')}</p> : <p className="muted">Ask the center for Jumu’ah times.</p>}</section>
        {upcoming.length > 0 && <section><h2>Eid and special prayers</h2><ul>{upcoming.map((x) => <li key={x.id}><b>{x.name}</b> – {day(x.date)}: {x.times.map(t12).join(', ')}{x.place ? ` · ${x.place}` : ''}</li>)}</ul></section>}
      </div>
      <button type="button" className="btn btn-outline" onClick={() => setShowMonth((v) => !v)} aria-expanded={showMonth}>{showMonth ? 'Hide' : 'Show'} this month</button>
      {showMonth && <div className="pt-mtable"><table>
        <thead><tr><th>Day</th>{PRAYERS.map((p) => <th key={p}>{PRAYER_NAME[p]}</th>)}</tr></thead>
        <tbody>{month.map((x) => <tr key={x.date} className={x.date === today ? 'today' : ''}><td>{new Date(`${x.date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', timeZone: 'UTC' })}</td>{PRAYERS.map((p) => <td key={p}>{clock(x.adhan[p])}{p !== 'sunrise' && iq && x.iqamah && <small>{clock(x.iqamah[p as IqPrayer])}</small>}</td>)}</tr>)}</tbody>
      </table></div>}
      <p className="samples-note">Adhan times are calculated (ISNA, standard Asr). {s.website.showIqamah ? 'Iqamah times are set by each center.' : ''}</p>
    </div></article>
  );
}
