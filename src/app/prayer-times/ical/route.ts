/** O6 – /prayer-times/ical?masjid=<id>: iqamah times for the next 30 days as a calendar subscription (Google/Apple/Outlook). */
import { getOrgStructure, getPrayerTimes } from '@/lib/content/loaders';
import { dayTimes, IQAMAH_PRAYERS, PRAYER_NAME, clock24 } from '@/lib/community/prayer';

export const dynamic = 'force-dynamic';
const esc = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

export async function GET(req: Request) {
  const url = new URL(req.url); const ref = url.searchParams.get('masjid') ?? '';
  const [s, map] = await Promise.all([getPrayerTimes(), getOrgStructure()]);
  if (!s.website.enabled) return new Response('Not found', { status: 404 });
  const center = map.centers.find((c) => c.active && (c.id === ref || c.name === ref)) ?? map.centers.find((c) => c.active);
  if (!center) return new Response('Not found', { status: 404 });
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//${esc(map.zones[0]?.name ?? 'Masjid')}//Prayer times//EN`, `X-WR-CALNAME:${esc(center.name)} – iqamah`, 'X-WR-TIMEZONE:America/Chicago', 'REFRESH-INTERVAL;VALUE=DURATION:P1D'];
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  for (let i = 0; i < 30; i++) {
    const iso = new Date(Date.parse(`${today}T12:00:00Z`) + i * 86_400_000).toISOString().slice(0, 10);
    const d = dayTimes(s, center.name, iso, center.jumuah.map((j) => j.khutbah));
    const ymd = iso.replace(/-/g, '');
    for (const p of IQAMAH_PRAYERS) {
      const t = (d.iqamah ? d.iqamah[p] : d.adhan[p]); const hm = clock24(t).replace(':', '');
      lines.push('BEGIN:VEVENT', `UID:${center.id}-${iso}-${p}@prayer`, `DTSTAMP:${stamp}`, `DTSTART;TZID=America/Chicago:${ymd}T${hm}00`, `DURATION:PT15M`, `SUMMARY:${esc(`${PRAYER_NAME[p]} ${d.iqamah ? 'iqamah' : 'adhan'} – ${center.name}`)}`, `LOCATION:${esc(`${center.address.street}, ${center.address.city}`)}`, 'END:VEVENT');
    }
    for (const j of d.jumuah) lines.push('BEGIN:VEVENT', `UID:${center.id}-${iso}-jumuah-${j}@prayer`, `DTSTAMP:${stamp}`, `DTSTART;TZID=America/Chicago:${ymd}T${j.replace(':', '')}00`, 'DURATION:PT45M', `SUMMARY:${esc(`Jumuah khutbah – ${center.name}`)}`, 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return new Response(lines.join('\r\n'), { headers: { 'content-type': 'text/calendar; charset=utf-8', 'content-disposition': `inline; filename="${center.id}-prayer-times.ics"`, 'cache-control': 'public, max-age=3600' } });
}
