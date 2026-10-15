'use client';
/**
 * Give to a specific need – DEMO (no payment, no API). Real: POST /public/giving/donations → Stripe.
 * Smart touches: Zakat option only when the case is Zakat-eligible, suggested amounts that finish the goal,
 * "cover the remaining" chip, monthly option for ongoing funds, anonymous by default for privacy.
 */
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { formatUSD } from '@/lib/content/membership';
import type { Need } from '@/lib/content/giving';
import { give } from '@/lib/demo/demo-service';
import { LOADER_PLANS, SmartLoader } from '@/components/ui/SmartLoader';

type Receipt = Awaited<ReturnType<typeof give>>;

export function GiveDialog({ need, onClose }: { need: Need | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const remaining = need?.goalCents !== undefined ? Math.max(0, need.goalCents - (need.raisedCents ?? 0)) : null;
  const chips = [2500, 5000, 10000, 25000];
  const [amount, setAmount] = useState(5000);
  const [custom, setCustom] = useState('');
  const [fund, setFund] = useState<'zakat' | 'sadaqah'>('sadaqah');
  const [monthly, setMonthly] = useState(false);
  const [anonymous, setAnonymous] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    const d = ref.current; if (!d) return;
    if (need && !d.open) { setReceipt(null); setError(''); setCustom(''); setAmount(5000); setFund(need.zakatEligible ? 'zakat' : 'sadaqah'); setMonthly(false); d.showModal(); }
    if (!need && d.open) d.close();
  }, [need]);

  const cents = custom ? Math.round(parseFloat(custom) * 100) : amount;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!need) return;
    if (!Number.isFinite(cents) || cents < 500) return setError('Enter at least $5.00.');
    if (cents > 5000000) return setError('For gifts over $50,000, please contact the ISGH office.');
    setError(''); setBusy(true);
    try { setReceipt(await give({ needId: need.id, amountCents: cents, fund, monthly, anonymous })); }
    finally { setBusy(false); }
  };

  return (
    <dialog ref={ref} className="give-dialog" aria-labelledby="give-h" onClose={onClose} onCancel={onClose}>
      {need && (
        <div className="give-inner" aria-busy={busy || undefined}>
          <SmartLoader plan={LOADER_PLANS.give} active={busy} variant="overlay" expectedMs={2000} />
          <button type="button" className="give-x" onClick={onClose} aria-label="Close dialog">×</button>
          {!receipt ? (
            <form onSubmit={submit} noValidate>
              <p className="give-kicker">Give to</p>
              <h2 id="give-h">{need.title}</h2>
              <p className="give-demo">Demo – no payment is taken.</p>
              {need.zakatEligible && (
                <fieldset className="give-fund">
                  <legend className="sr-only">Type of gift</legend>
                  <label><input type="radio" name="fund" checked={fund === 'zakat'} onChange={() => setFund('zakat')} /> <span><b>Zakat</b><small>Eligible case – verified</small></span></label>
                  <label><input type="radio" name="fund" checked={fund === 'sadaqah'} onChange={() => setFund('sadaqah')} /> <span><b>Sadaqah</b><small>General charity</small></span></label>
                </fieldset>
              )}
              <fieldset className="give-amounts">
                <legend>Amount</legend>
                <div className="chips">
                  {chips.map((c) => (
                    <button key={c} type="button" className="chip" aria-pressed={!custom && amount === c} onClick={() => { setAmount(c); setCustom(''); }}>{formatUSD(c)}</button>
                  ))}
                  {remaining !== null && remaining > 0 && remaining <= 1000000 && !chips.includes(remaining) && (
                    <button type="button" className="chip chip-finish" aria-pressed={!custom && amount === remaining} onClick={() => { setAmount(remaining); setCustom(''); }}>
                      Finish it: {formatUSD(remaining)}
                    </button>
                  )}
                </div>
                <label className="give-custom"><span>Other amount</span>
                  <span className="dollar"><i aria-hidden="true">$</i><input className="input" inputMode="decimal" placeholder="0.00" value={custom}
                    onChange={(e) => setCustom(e.target.value.replace(/[^\d.]/g, ''))} aria-invalid={!!error || undefined} aria-describedby={error ? 'give-err' : undefined} /></span>
                </label>
                {error && <p className="field-error" id="give-err">{error}</p>}
              </fieldset>
              <label className="check"><input type="checkbox" checked={monthly} onChange={(e) => setMonthly(e.target.checked)} /> <span>Make it monthly{need.status === 'ongoing' ? ' – helps the office plan ahead' : ''}</span></label>
              <label className="check"><input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} /> <span>Give anonymously (your name is never shown publicly)</span></label>
              <button className="btn btn-primary give-submit" type="submit" disabled={busy} data-busy={busy || undefined}>
                Give {Number.isFinite(cents) && cents >= 500 ? formatUSD(cents) : ''}{monthly ? ' monthly' : ''}
              </button>
              <p className="give-fine">ISGH is a 501(c)(3) nonprofit. Gifts are tax-deductible as allowed by law; you get an emailed receipt.</p>
            </form>
          ) : (
            <div className="give-thanks" role="status">
              <svg width="54" height="54" aria-hidden="true" className="thanks-star"><use href="#star8" /></svg>
              <h2 id="give-h">JazakAllahu khayran</h2>
              <p>Your {receipt.fund === 'zakat' ? 'Zakat' : 'Sadaqah'} gift of <b>{formatUSD(receipt.amountCents)}</b>{receipt.monthly ? ' each month' : ''} is recorded for &ldquo;{need.title}&rdquo;.</p>
              <p className="give-ref">Receipt number {receipt.receipt}</p>
              <blockquote><p>&ldquo;The example of those who spend their wealth in the way of Allāh is like a seed [of grain] which grows seven spikes; in each spike is a hundred grains.&rdquo;</p><cite>Quran 2:261</cite></blockquote>
              <button type="button" className="btn btn-outline" onClick={onClose}>Close</button>
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}
