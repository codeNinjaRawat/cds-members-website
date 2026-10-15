'use client';
/**
 * Verify a membership – privacy-first (improves on the current site, which looked people up by name + street number + birth date).
 * Needs Member ID + last name + ZIP and shows ONLY status. DEMO (no API). Real: rate-limited BE endpoint.
 */
import { useState, type FormEvent } from 'react';
import { verifyMembership } from '@/lib/demo/demo-service';
import { aria, DemoNote, FField } from './FormBits';
import { LOADER_PLANS, SmartLoader } from '@/components/ui/SmartLoader';

type Result = Awaited<ReturnType<typeof verifyMembership>>;

export function VerifyForm() {
  const [f, setF] = useState({ memberId: '', lastName: '', zip: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!/^HOU-\d{6}$/i.test(f.memberId.trim())) er.memberId = 'Enter the member ID from the card, like HOU-204781.';
    if (f.lastName.trim().length < 2) er.lastName = 'Enter the last name on the membership.';
    if (!/^\d{5}$/.test(f.zip)) er.zip = 'Enter a 5-digit ZIP code, like 77036.';
    setErrors(er); setResult(null);
    if (Object.keys(er).length) return;
    setBusy(true);
    setResult(await verifyMembership(f));
    setBusy(false);
  };

  return (
    <form className="form-card" aria-busy={busy || undefined} onSubmit={submit} noValidate>
      <DemoNote>Demo: try member ID <b>HOU-204781</b>, any last name and ZIP <b>77036</b>.</DemoNote>
      <FField id="vf-id" label="Member ID" hint="Printed on the member card and in the welcome email." error={errors.memberId}>
        <input id="vf-id" className="input" value={f.memberId} autoCapitalize="characters" onChange={(e) => setF({ ...f, memberId: e.target.value.toUpperCase() })} {...aria('vf-id', true, errors.memberId)} />
      </FField>
      <div className="grid-2">
        <FField id="vf-last" label="Last name" error={errors.lastName}>
          <input id="vf-last" className="input" autoComplete="family-name" value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} {...aria('vf-last', false, errors.lastName)} />
        </FField>
        <FField id="vf-zip" label="Home ZIP code" error={errors.zip}>
          <input id="vf-zip" className="input" inputMode="numeric" maxLength={5} value={f.zip} onChange={(e) => setF({ ...f, zip: e.target.value.replace(/\D/g, '') })} {...aria('vf-zip', false, errors.zip)} />
        </FField>
      </div>
      <button className="btn btn-primary" type="submit" disabled={busy} data-busy={busy || undefined}>{busy ? 'Checking…' : 'Check membership'}</button>
      <SmartLoader plan={LOADER_PLANS.verify} active={busy} />
      <div aria-live="polite">
        {result && (result.found ? (
          <div className="callout" data-tone="success"><b>Active membership</b><p>Valid through {result.validThrough}. {result.votingEligible ? 'Eligible to vote this year.' : 'Not eligible to vote this year.'}</p></div>
        ) : (
          <div className="callout" data-tone="warning"><b>No active membership found</b><p>Check the member ID, last name and ZIP code. If they are right, contact the Membership Office.</p></div>
        ))}
      </div>
      <p className="hint">For privacy, this check shows only whether a membership is active. It never shows addresses, birth dates or other personal details.</p>
    </form>
  );
}
