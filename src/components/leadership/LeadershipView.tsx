'use client';
/**
 * F5 Leadership (public). The Board (Executive Body + Zonal Directors), "Who represents me?" by ZIP code, and the
 * leadership of each Islamic Center (Associate Director, Secretaries, Council of Area Representatives).
 * Data: publicOfficials() from Admin › Elected officials – names, seats and office emails only.
 */
import { useState, type FormEvent } from 'react';
import { OFFICERS, SECRETARIES, findMyRepresentatives, fmt, type PublicOfficial } from '@/lib/community/officials';

type Zone = { id: string; name: string; zips: string[] };
type Center = { name: string; zone: string };

export function LeadershipView({ people, zones, centers, findByZip }: { people: PublicOfficial[]; zones: Zone[]; centers: Center[]; findByZip: boolean }) {
  const officers = (Object.keys(OFFICERS) as (keyof typeof OFFICERS)[]).map((o) => people.find((p) => p.kind === 'officer' && p.office === o)).filter(Boolean) as PublicOfficial[];
  const directors = zones.map((z) => ({ z, p: people.find((p) => p.kind === 'zonal-director' && p.zone === z.id) }));
  return (
    <article className="cms-page ld"><div className="wrap">
      <header className="cms-head"><p className="eyebrow">Elected by the members</p><h1>Leadership</h1>
        <p className="intro">ISGH is run by people its members elect: a nine-member Board (Majlis-e-Shura), and at every Islamic Center an Associate Director and a Council of Area Representatives. Terms are two years.</p></header>

      {findByZip && <Finder people={people} zones={zones} />}

      <section className="ld-sec" aria-labelledby="ld-board">
        <h2 id="ld-board">The Board (Majlis-e-Shura)</h2>
        <p className="ld-sub">Four officers elected by all voting members, and a Director for each zone elected by its residents.</p>
        <ul className="ld-grid">
          {officers.map((p) => <Card key={p.seat} p={p} role={p.seat} />)}
          {directors.map(({ z, p }) => p ? <Card key={z.id} p={p} role={`Director, ${z.name}`} /> : <li key={z.id} className="ld-card vacant"><span className="ld-role">Director, {z.name}</span><b>Seat open</b><small>The Board appoints until the next election.</small></li>)}
        </ul>
      </section>

      <section className="ld-sec" aria-labelledby="ld-centers">
        <h2 id="ld-centers">Islamic Center leadership</h2>
        <p className="ld-sub">Each center’s Associate Director chairs its Council of Area Representatives and leads five Secretaries.</p>
        {zones.map((z) => (
          <div key={z.id} className="ld-zone"><h3>{z.name}</h3>
            {centers.filter((c) => c.zone === z.id).map((c) => <CenterBlock key={c.name} c={c} people={people} />)}
          </div>
        ))}
      </section>
      <p className="samples-note">Demo: sample names. Contact your representatives through the office email addresses shown.</p>
    </div></article>
  );
}

function Card({ p, role }: { p: PublicOfficial; role: string }) {
  return (
    <li className="ld-card">
      <span className="ld-av" aria-hidden="true">{p.name.split(' ').map((x) => x[0]).slice(0, 2).join('')}</span>
      <span className="ld-role">{role}</span><b>{p.name}</b>
      {p.termEnd && <small>Term until {fmt(p.termEnd)}</small>}
      {p.email && <a href={`mailto:${p.email}`}>{p.email}</a>}
    </li>
  );
}

function CenterBlock({ c, people }: { c: Center; people: PublicOfficial[] }) {
  const here = people.filter((p) => p.center === c.name);
  const ad = here.find((p) => p.kind === 'associate-director');
  const secs = (Object.keys(SECRETARIES) as (keyof typeof SECRETARIES)[]).map((s) => here.find((p) => p.kind === 'secretary' && p.office === s)).filter(Boolean) as PublicOfficial[];
  const reps = here.filter((p) => p.kind === 'area-rep');
  return (
    <details className="ld-center" data-center={c.name}>
      <summary><b>{c.name}</b><span>{ad ? `Associate Director: ${ad.name}` : 'Associate Director: seat open'} · {reps.length} Area Representative{reps.length === 1 ? '' : 's'}</span></summary>
      <div className="ld-center-body">
        <ul className="ld-grid sm">{ad && <Card p={ad} role="Associate Director" />}{secs.map((p) => <Card key={p.office} p={p} role={SECRETARIES[p.office as keyof typeof SECRETARIES]} />)}</ul>
        {reps.length > 0 && <><h4>Council of Representatives</h4><ul className="ld-reps">{reps.map((p) => <li key={p.seat}><b>{p.name}</b><span>{p.atLarge ? p.seat.split(' – ')[1] : p.zips.length > 1 ? `ZIP codes ${p.zips.join(', ')}` : `ZIP code ${p.zips[0]}`}</span>{p.email && <a href={`mailto:${p.email}`}>{p.email}</a>}</li>)}</ul></>}
      </div>
    </details>
  );
}

function Finder({ people, zones }: { people: PublicOfficial[]; zones: Zone[] }) {
  const [zip, setZip] = useState('');
  const [err, setErr] = useState('');
  const [res, setRes] = useState<ReturnType<typeof findMyRepresentatives> | null>(null);
  const go = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{5}(-\d{4})?$/.test(zip.trim())) { setErr('Enter a 5-digit ZIP code, like 77036.'); setRes(null); return; }
    setErr(''); setRes(findMyRepresentatives(people, (z) => zones.find((x) => x.zips.includes(z))?.id ?? null, zip));
  };
  const zoneName = res ? zones.find((z) => z.id === res.zone)?.name : '';
  return (
    <section className="ld-find" aria-labelledby="ld-find-h">
      <div><h2 id="ld-find-h">Who represents me?</h2><p>Enter your home ZIP code to see your Area Representatives, your center’s Associate Director and your Zonal Director.</p></div>
      <form onSubmit={go} className="ld-form" noValidate>
        <label htmlFor="ld-zip">Home ZIP code</label>
        <div className="ld-row"><input id="ld-zip" className="input" inputMode="numeric" autoComplete="postal-code" value={zip} onChange={(e) => setZip(e.target.value)} aria-invalid={!!err} aria-describedby={err ? 'ld-zip-err' : undefined} /><button className="btn btn-primary" type="submit">Find</button></div>
        {err && <p id="ld-zip-err" className="field-error" role="alert">{err}</p>}
      </form>
      {res && (
        <div className="ld-result" role="status">
          {!res.zone && <p>We could not place ZIP {zip.trim().slice(0, 5)} in an ISGH zone. Please contact the membership office.</p>}
          {res.zone && <>
            <p><b>{zoneName}</b>{res.center ? <> · {res.center}</> : null}</p>
            <ul className="ld-reps">
              {res.areaReps.map((p) => <li key={p.seat}><span>Area Representative</span><b>{p.name}</b>{p.email && <a href={`mailto:${p.email}`}>{p.email}</a>}</li>)}
              {res.atLarge.map((p) => <li key={p.seat}><span>{p.seat.split(' – ')[1]}</span><b>{p.name}</b></li>)}
              {res.associateDirector && <li><span>Associate Director</span><b>{res.associateDirector.name}</b>{res.associateDirector.email && <a href={`mailto:${res.associateDirector.email}`}>{res.associateDirector.email}</a>}</li>}
              {res.zonalDirector && <li><span>Zonal Director</span><b>{res.zonalDirector.name}</b>{res.zonalDirector.email && <a href={`mailto:${res.zonalDirector.email}`}>{res.zonalDirector.email}</a>}</li>}
            </ul>
            {!res.areaReps.length && <p className="ld-note">No Area Representative is listed for this ZIP code yet.</p>}
          </>}
        </div>
      )}
    </section>
  );
}
