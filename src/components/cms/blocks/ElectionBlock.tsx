/** O10 – `election` live block: the featured (or a given year's) election – status, key dates, ballot, results. */
import Link from 'next/link';
import { getPublicElection, getElectionYears } from '@/lib/content/loaders';
import type { LiveBlock } from '@/lib/content/pages';

const fmt = (iso: string) => (iso ? new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '');

export async function ElectionBlockView({ b }: { b: Extract<LiveBlock, { type: 'election' }> }) {
  const [e, years] = await Promise.all([getPublicElection(b.year || undefined), getElectionYears()]);
  if (!e) return <p className="blk-empty">No election is scheduled right now.</p>;
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
  const steps = [
    { label: 'Nominations open', date: e.window.open }, { label: 'Nominations close', date: e.window.close }, { label: 'Election Day', date: e.electionDay },
  ];
  return (
    <div className="el">
      <header className="el-head">
        <p className="el-status" data-status={e.statusKey}>{e.year} election · {e.status}</p>
        <ol className="el-steps">{steps.map((s) => <li key={s.label} data-done={s.date <= today || undefined}><b>{s.label}</b><span>{fmt(s.date)}</span></li>)}</ol>
      </header>
      {e.statusKey === 'nominations' && <aside className="callout" data-tone="info"><b>Nominations are open until {fmt(e.window.close)}</b><p>Eligible voting members may nominate from their member home. The Election Commission publishes the ballot after the deadline.</p><Link className="btn btn-primary btn-sm" href="/sign-in?next=/portal">Sign in to nominate</Link></aside>}
      {e.seats.length > 0 && (
        <section><h3>{e.results ? 'Seats on the ballot' : 'Seats and candidates'}</h3>
          <ul className="el-seats">{e.seats.map((s) => (
            <li key={s.key}><b>{s.label}</b>{s.places > 1 && <span className="el-places">{s.places} seats</span>}
              {s.candidates.length ? <ul className="el-cands">{s.candidates.map((c) => <li key={c}>{c}</li>)}</ul> : <span className="el-tba">{e.statusKey === 'nominations' ? 'Candidates announced after nominations close' : 'No candidates'}</span>}
              {s.uncontested && s.candidates.length > 0 && <span className="el-unc">Uncontested</span>}
            </li>
          ))}</ul>
        </section>
      )}
      {e.results && (
        <section><h3>Results{e.certified?.on ? ` · certified ${fmt(e.certified.on)}${e.certified.by ? ` by ${e.certified.by}` : ''}` : ''}</h3>
          <div className="blk-table-wrap"><table className="blk-table el-results"><thead><tr><th scope="col">Seat</th><th scope="col">Candidate</th><th scope="col">Votes</th></tr></thead>
            <tbody>{e.results.flatMap((r) => r.rows.map((row, i) => <tr key={`${r.label}-${row.name}`} data-winner={row.winner || undefined}>{i === 0 ? <th scope="row" rowSpan={r.rows.length}>{r.label}<small>{r.ballotsCast} ballots</small></th> : null}<td>{row.name}{row.winner ? ' ✓' : ''}</td><td>{row.votes}</td></tr>))}</tbody></table></div>
          {e.certified?.note && <p className="blk-empty">{e.certified.note}</p>}
        </section>
      )}
      {years.length > 1 && <p className="el-years">Past elections: {years.filter((y) => y !== e.year).map((y) => <Link key={y} href={`/elections/${y}`}>{y}</Link>)}</p>}
    </div>
  );
}
