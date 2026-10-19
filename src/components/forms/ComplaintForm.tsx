'use client';
/**
 * File a complaint – DEMO (no API). Real: POST /public/complaints → admin Complaints queue with SLA, assignment,
 * confidential handling and audit trail. Categories, response time and texts will come from admin settings.
 */
import { useState, type FormEvent } from 'react';
import { fileComplaint } from '@/lib/demo/demo-service';
import { aria, DemoNote, FField } from './FormBits';
import { LOADER_PLANS, SmartLoader } from '@/components/ui/SmartLoader';

const CATEGORIES = ['Membership or dues', 'Elections', 'An Islamic Center', 'Conduct of staff, volunteers or officials', 'Privacy or my personal data', 'The website or app', 'Something else'];
const NONE = 'Not about a specific center';

/** `zones`: this organization's zones (Masjids and zones), `org`: its short name. */
export function ComplaintForm({ zones = [], org = '' }: { zones?: string[]; org?: string }) {
  const ZONES = [NONE, ...zones.map((z) => `${z} zone`)];
  const [f, setF] = useState({ category: '', zone: NONE, when: '', what: '', outcome: '', anonymous: false, name: '', email: '', phone: '', truthful: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ reference: string; days: number | null } | null>(null);
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!f.category) er.category = 'Choose what your complaint is about.';
    if (f.what.trim().length < 30) er.what = 'Describe what happened in at least 30 characters, so we can look into it.';
    if (f.when && f.when > new Date().toISOString().slice(0, 10)) er.when = 'The date cannot be in the future.';
    if (!f.anonymous) {
      if (f.name.trim().length < 2) er.name = 'Enter your name, or choose to stay anonymous.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email) && f.phone.replace(/\D/g, '').length !== 10) er.email = 'Enter an email or a 10-digit phone number so we can reply.';
    }
    if (!f.truthful) er.truthful = 'Confirm that the information is true to the best of your knowledge.';
    setErrors(er);
    if (Object.keys(er).length) { document.getElementById(`cp-${Object.keys(er)[0]}`)?.focus(); return; }
    setBusy(true);
    try {
      const detail = [f.what.trim(), f.when && `When: ${f.when}`, f.zone !== ZONES[0] && `Where: ${f.zone}`, f.outcome.trim() && `Hoped-for outcome: ${f.outcome.trim()}`].filter(Boolean).join('\n\n');
      const r = await fileComplaint({ category: f.category, anonymous: f.anonymous, title: `Complaint: ${f.category}`, detail, ...(f.anonymous ? {} : { name: f.name.trim(), email: f.email.trim(), phone: f.phone }) });
      setDone({ reference: r.reference, days: r.respondWithinDays });
    } catch (err) { setErrors({ what: err instanceof Error ? err.message : 'We could not send it. Please try again.' }); }
    finally { setBusy(false); }
  };

  if (done) return (
    <div className="form-card done-card" role="status">
      <h2>Complaint received</h2>
      <p>Your reference number is <b>{done.reference}</b>. Save it to follow up.</p>
      {done.days ? <p>A member of the Membership Office will contact you within {done.days} business days.</p>
        : <p>Because you chose to stay anonymous, we cannot reply to you, but your complaint will be reviewed.</p>}
    </div>
  );

  return (
    <form className="form-card" aria-busy={busy || undefined} onSubmit={submit} noValidate>
      <DemoNote>Demo: nothing is sent yet. This shows how complaints will work.</DemoNote>
      <FField id="cp-category" label="What is your complaint about?" error={errors.category}>
        <select id="cp-category" className="input" value={f.category} onChange={(e) => set({ category: e.target.value })} {...aria('cp-category', false, errors.category)}>
          <option value="">Choose one</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </FField>
      <div className="grid-2">
        <FField id="cp-zone" label="Zone or Islamic Center" optional>
          <select id="cp-zone" className="input" value={f.zone} onChange={(e) => set({ zone: e.target.value })}>{ZONES.map((z) => <option key={z}>{z}</option>)}</select>
        </FField>
        <FField id="cp-when" label="When did it happen?" optional error={errors.when}>
          <input id="cp-when" className="input" type="date" value={f.when} onChange={(e) => set({ when: e.target.value })} {...aria('cp-when', false, errors.when)} />
        </FField>
      </div>
      <FField id="cp-what" label="What happened?" hint={`Include names, places and dates if you can. ${f.what.length}/2000`} error={errors.what}>
        <textarea id="cp-what" className="input textarea" rows={6} maxLength={2000} value={f.what} onChange={(e) => set({ what: e.target.value })} {...aria('cp-what', true, errors.what)} />
      </FField>
      <FField id="cp-outcome" label="What would you like us to do?" optional>
        <textarea id="cp-outcome" className="input textarea" rows={3} maxLength={1000} value={f.outcome} onChange={(e) => set({ outcome: e.target.value })} />
      </FField>
      <fieldset className="jf-fieldset">
        <legend>Your contact details</legend>
        <label className="check"><input type="checkbox" checked={f.anonymous} onChange={(e) => set({ anonymous: e.target.checked })} /> <span>I want to stay anonymous<small className="block-hint">We will review it, but we cannot reply or update you.</small></span></label>
        {!f.anonymous && (
          <>
            <FField id="cp-name" label="Your name" error={errors.name}>
              <input id="cp-name" className="input" autoComplete="name" value={f.name} onChange={(e) => set({ name: e.target.value })} {...aria('cp-name', false, errors.name)} />
            </FField>
            <div className="grid-2">
              <FField id="cp-email" label="Email" error={errors.email}>
                <input id="cp-email" className="input" type="email" autoComplete="email" value={f.email} onChange={(e) => set({ email: e.target.value })} {...aria('cp-email', false, errors.email)} />
              </FField>
              <FField id="cp-phone" label="Phone" optional>
                <input id="cp-phone" className="input" type="tel" autoComplete="tel-national" value={f.phone} onChange={(e) => set({ phone: e.target.value })} />
              </FField>
            </div>
          </>
        )}
      </fieldset>
      <label className="check" id="cp-truthful" tabIndex={-1}><input type="checkbox" checked={f.truthful} onChange={(e) => set({ truthful: e.target.checked })} /> <span>The information I gave is true to the best of my knowledge.</span></label>
      {errors.truthful && <p className="field-error">{errors.truthful}</p>}
      <p className="hint">Complaints are handled confidentially by the Membership Office. Complaints about officials are reviewed under the {org ? `${org} ` : ''}Code of Ethics.</p>
      <button className="btn btn-primary" type="submit" disabled={busy} data-busy={busy || undefined}>{busy ? 'Sending…' : 'Submit complaint'}</button>
      <SmartLoader plan={LOADER_PLANS.complaint} active={busy} />
    </form>
  );
}
