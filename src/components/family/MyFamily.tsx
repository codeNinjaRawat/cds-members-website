'use client';
/**
 * Member portal › My family tree (DEMO, browser only; live: GET/PUT /member/family).
 * The member keeps their family here: who is a member, who can vote, who can join soon, and – if they wish – older
 * generations as family history. Only the member sees the whole tree; relatives who are members are linked only after
 * they accept; ISGH staff see the membership family only, never the history.
 */
import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { FamilyTree } from './FamilyTree';
import {
  addRelative, badgeFor, eighteenth, fmtDate, fullName, insights, lifeYears, RELATIONS, relationTo, removePerson, updatePerson,
  type Family, type Relation,
} from '@/lib/family/family';
import { DEMO_FAMILIES } from '@/lib/family/demo-family';
import { findMember, getSessionEmail, SESSION_EVENT, type DemoMember } from '@/lib/demo/demo-member';
import { LoaderMark } from '@/components/ui/SmartLoader';

const RECORD_DATE = '2027-06-30'; // admin: Settings › Voting › record date
const todayCT = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
const key = (email: string) => `isgh-family:${email}`;

export function loadFamily(email: string): Family {
  try { const s = localStorage.getItem(key(email)); if (s) return JSON.parse(s) as Family; } catch { /* storage blocked */ }
  return DEMO_FAMILIES[email] ?? { rootId: 'me', people: [{ id: 'me', first: 'You', last: '', sex: 'm' }], unions: [] };
}

export function MyFamily() {
  const [member, setMember] = useState<DemoMember | null | undefined>(undefined);
  useEffect(() => { const read = () => setMember(findMember(getSessionEmail())); read(); window.addEventListener(SESSION_EVENT, read); return () => window.removeEventListener(SESSION_EVENT, read); }, []);
  useEffect(() => { if (member === null) window.location.replace('/sign-in?next=/portal/family'); }, [member]);
  if (!member) return <div className="portal-loading wrap" role="status"><LoaderMark size={44} /><p>{member === null ? 'Taking you to sign in…' : 'Loading your family…'}</p></div>;
  return <FamilyPage m={member} />;
}

function FamilyPage({ m }: { m: DemoMember }) {
  const [family, setFamilyState] = useState<Family>(() => loadFamily(m.email));
  const [layer, setLayer] = useState<'membership' | 'whole'>('membership');
  const [sel, setSel] = useState<string | null>(family.rootId);
  const [mode, setMode] = useState<null | 'add' | 'edit'>(null);
  const [toast, setToast] = useState('');
  const today = todayCT();
  const save = (f: Family, msg?: string) => { setFamilyState(f); try { localStorage.setItem(key(m.email), JSON.stringify(f)); } catch { /* */ } if (msg) { setToast(msg); window.setTimeout(() => setToast(''), 4000); } };
  const p = family.people.find((x) => x.id === sel) ?? null;
  const tips = useMemo(() => insights(family, today, RECORD_DATE, layer), [family, today, layer]);

  const onAdd = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const d = new FormData(e.currentTarget);
    const rel = d.get('rel') as Relation; const passed = d.get('passed') === 'on';
    const born = String(d.get('born') || '') || undefined; const died = passed ? String(d.get('died') || '') || undefined : undefined;
    const before = family.people.length;
    const next = addRelative(family, p!.id, rel, { first: String(d.get('first')).trim(), last: String(d.get('last')).trim(), born, died, heritage: passed && !!died && Number(died) < 2000 ? true : undefined });
    if (next.people.length === before) { setToast(`${p!.first} already has two parents in the tree.`); return; }
    const added = next.people[next.people.length - 1];
    save(next, `${fullName(added)} added as ${relationTo(next, added.id).toLowerCase()}.`);
    setSel(added.id); setMode(null);
    if (passed) setLayer('whole');
  };
  const onEdit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const d = new FormData(e.currentTarget); const passed = d.get('passed') === 'on';
    save(updatePerson(family, p!.id, { first: String(d.get('first')).trim(), last: String(d.get('last')).trim(), born: String(d.get('born') || '') || undefined, died: passed ? String(d.get('died') || '') || undefined : undefined }), 'Saved.');
    setMode(null);
  };

  return (
    <div className="portal family">
      <header className="portal-hero fam-hero">
        <div className="wrap portal-hero-in">
          <div>
            <p className="eyebrow"><Link href="/portal">Member home</Link> › Family tree</p>
            <h1>Your family tree</h1>
            <p className="portal-sub fam-hadith">“Whoever is pleased that he be granted more wealth and that his lease of life be prolonged, then he should keep good relations with his kith and kin.” <span>Sahih al-Bukhari 5986</span></p>
          </div>
        </div>
      </header>
      <div className="wrap fam-wrap">
        <ul className="fam-tips" aria-label="About your family">
          {tips.map((t, i) => <li key={i} className={`t-${t.tone}`}>{t.personId ? <button type="button" className="linkish" onClick={() => setSel(t.personId!)}>{t.text}</button> : t.text}</li>)}
        </ul>

        <div className="fam-grid">
          <section className="fam-tree-card" aria-label="Family tree">
            <FamilyTree family={family} today={today} recordDate={RECORD_DATE} layer={layer} onLayer={setLayer} selected={sel} onSelect={(id) => { setSel(id); setMode(null); }} label={`${m.firstName}’s family tree`} />
          </section>

          <aside className="fam-side" aria-live="polite">
            {!p ? <p className="p-muted">Pick someone in the tree.</p> : mode === 'add' ? (
              <form className="fam-form" onSubmit={onAdd}>
                <h2>Add a relative of {p.id === family.rootId ? 'yours' : p.first}</h2>
                <label>Relation<select name="rel" className="input" defaultValue="son">{RELATIONS.map((r) => <option key={r.id} value={r.id}>{p.id === family.rootId ? `My ${r.label.toLowerCase()}` : `${p.first}’s ${r.label.toLowerCase()}`}</option>)}</select></label>
                <div className="fam-2"><label>First name<input name="first" className="input" required maxLength={40} autoComplete="off" /></label><label>Last name<input name="last" className="input" maxLength={40} defaultValue={p.last} autoComplete="off" /></label></div>
                <label>Date or year of birth (optional)<input name="born" className="input" placeholder="YYYY or YYYY-MM-DD" pattern="\d{4}(-\d{2}-\d{2})?" /></label>
                <PassedFields />
                <p className="fam-hint">Children’s details stay private to your family. Adults get an invitation only if you send one.</p>
                <div className="fam-actions"><button className="btn btn-primary">Add to tree</button><button type="button" className="btn btn-ghost" onClick={() => setMode(null)}>Cancel</button></div>
              </form>
            ) : mode === 'edit' ? (
              <form className="fam-form" onSubmit={onEdit}>
                <h2>Edit {p.first}</h2>
                <div className="fam-2"><label>First name<input name="first" className="input" required defaultValue={p.first} /></label><label>Last name<input name="last" className="input" defaultValue={p.last} /></label></div>
                <label>Date or year of birth<input name="born" className="input" defaultValue={p.born} placeholder="YYYY or YYYY-MM-DD" pattern="\d{4}(-\d{2}-\d{2})?" /></label>
                <PassedFields died={p.died} />
                <div className="fam-actions"><button className="btn btn-primary">Save</button><button type="button" className="btn btn-ghost" onClick={() => setMode(null)}>Cancel</button></div>
              </form>
            ) : (
              <PersonPanel family={family} id={p.id} today={today}
                onAdd={() => setMode('add')} onEdit={() => setMode('edit')}
                onInvite={() => save(updatePerson(family, p.id, { invited: today }), `Demo: ${p.first} would get an invitation to join ISGH by email or text.`)}
                onRemove={() => { save(removePerson(family, p.id), `${fullName(p)} removed from your tree.`); setSel(family.rootId); }}
                onNote={(t) => { setToast(t); window.setTimeout(() => setToast(''), 4000); }} />
            )}
            <p className="fam-privacy"><b>Private to you.</b> Relatives who are ISGH members are linked only when they accept. ISGH staff see your membership family only – never your family history.</p>
            <button type="button" className="linkish fam-reset" onClick={() => { try { localStorage.removeItem(key(m.email)); } catch { /* */ } setFamilyState(loadFamily(m.email)); setSel(family.rootId); }}>Reset demo tree</button>
          </aside>
        </div>
      </div>
      {toast && <p className="fam-toast" role="status">{toast}</p>}
    </div>
  );
}

function PassedFields({ died }: { died?: string }) {
  const [passed, setPassed] = useState(!!died);
  return (
    <>
      <label className="fam-check"><input type="checkbox" name="passed" checked={passed} onChange={(e) => setPassed(e.target.checked)} /> Has passed away (may Allah have mercy on them)</label>
      {passed && <label>Year of passing<input name="died" className="input" defaultValue={died} placeholder="YYYY" pattern="\d{4}" /></label>}
    </>
  );
}

function PersonPanel({ family, id, today, onAdd, onEdit, onInvite, onRemove, onNote }: { family: Family; id: string; today: string; onAdd: () => void; onEdit: () => void; onInvite: () => void; onRemove: () => void; onNote: (t: string) => void }) {
  const p = family.people.find((x) => x.id === id)!;
  const b = badgeFor(p, today, RECORD_DATE);
  const isRoot = id === family.rootId;
  return (
    <div className="fam-person">
      <h2>{fullName(p)}</h2>
      <p className="fam-rel">{relationTo(family, id)}{lifeYears(p) ? ` · ${lifeYears(p)}` : ''}{p.place ? ` · ${p.place}` : ''}</p>
      <p><span className={`ft-badge t-${b.tone}`}>{b.text}</span></p>
      {p.member && <p className="fam-line">ISGH member {p.member.memberId}{p.member.accepted ? ' · linked' : ' · waiting for them to accept'}</p>}
      {b.tone === 'soon' && <p className="fam-line">{p.first} can join as their own member from {fmtDate(eighteenth(p.born!))}. Paying by {fmtDate(RECORD_DATE)} means they can vote in that election.</p>}
      {b.tone === 'child' && <p className="fam-line">Children are covered by the family’s activities; they can become members at 18.</p>}
      {b.tone === 'join' && <p className="fam-line">{p.first} is 18 or older and not a member yet.</p>}
      <div className="fam-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={onAdd}>Add a relative{isRoot ? '' : ` of ${p.first}`}</button>
        {(b.tone === 'join' || b.tone === 'invited') && <button type="button" className="btn btn-outline btn-sm" onClick={onInvite}>{b.tone === 'invited' ? 'Send again' : 'Invite to join'}</button>}
        {b.tone === 'soon' && <button type="button" className="btn btn-outline btn-sm" onClick={() => onNote(`Demo: we will remind you on ${fmtDate(eighteenth(p.born!))}.`)}>Remind me on the birthday</button>}
        {p.member?.status === 'expired' && <button type="button" className="btn btn-outline btn-sm" onClick={() => onNote(`Demo: ${p.first} would get a friendly renewal reminder.`)}>Send a renewal reminder</button>}
        {!p.member && <button type="button" className="btn btn-ghost btn-sm" onClick={onEdit}>Edit</button>}
        {!isRoot && !p.member && <button type="button" className="btn btn-ghost btn-sm fam-remove" onClick={onRemove}>Remove</button>}
      </div>
    </div>
  );
}
