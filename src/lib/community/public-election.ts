/**
 * O10 – what the public website may show of an election (same shape as BE GET /public/elections/:year):
 * status, dates, seats with accepted candidates once the ballot is set, results once certified. No member ids,
 * no pending/declined nominations, no nominator names.
 */
import { ballot, ELECTION_STATUS, nominationWindow, tally, type Election, type ElectionsDoc } from '@/lib/community/elections';

export type PublicElection = {
  year: number; electionDay: string; status: string; statusKey: Election['status']; window: { open: string; close: string }; method: string;
  seats: { key: string; label: string; places: number; candidates: string[]; uncontested: boolean }[];
  results: { label: string; ballotsCast: number; rows: { name: string; votes: number; winner: boolean }[] }[] | null;
  certified: { by: string; on: string; note: string } | null;
};

export function publicElection(e: Election): PublicElection {
  const done = e.status === 'certified' || e.status === 'closed';
  const hideCandidates = e.status === 'planning' || e.status === 'nominations';
  return {
    year: e.year, electionDay: e.electionDay, status: ELECTION_STATUS[e.status], statusKey: e.status, window: nominationWindow(e), method: e.rules.method,
    seats: ballot(e).filter((s) => !s.empty || e.status === 'nominations').map((s) => ({ key: s.seat.key, label: s.seat.label, places: s.seat.places, candidates: hideCandidates ? [] : s.candidates.map((c) => c.name), uncontested: s.uncontested })),
    results: done ? e.seats.filter((s) => !s.removed).map((s) => { const t = tally(e, s.key)!; return { label: s.label, ballotsCast: t.ballotsCast, rows: t.rows.map((r) => ({ name: r.nomination.name, votes: r.votes, winner: r.winner })) }; }).filter((x) => x.rows.length) : null,
    certified: done ? e.certification : null,
  };
}
/** The election to feature: the latest that is not closed, else the latest. */
export function currentElection(d: ElectionsDoc): Election | null {
  const open = d.elections.filter((e) => e.status !== 'closed').sort((a, b) => b.year - a.year);
  return open[0] ?? [...d.elections].sort((a, b) => b.year - a.year)[0] ?? null;
}
export const electionYears = (d: ElectionsDoc) => [...new Set(d.elections.map((e) => e.year))].sort((a, b) => b - a);
