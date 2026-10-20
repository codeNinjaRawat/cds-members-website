'use client';
/**
 * Member sign-up flow (W4). Every rule, plan, price, text and option comes from admin settings
 * (GET /public/membership/settings). Steps: email → about you (address → zone/center) → plan → pledge → review & pay → done.
 * Smart behaviors: step validation with the same rules the server uses, error summary + focus, autosave in this tab,
 * duplicate-member detection, live price quote, voting-eligibility preview, border-change option, relative-payer rule.
 * Admin form builder (2026-10-14): extra sections/fields from the join-form definition – inside a core step or as their
 * own step – with "show only if" rules and per-plan fields; smart helpers: scan photo ID, renew with last year's
 * answers, save and finish later on any device, live preview from the admin.
 */
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { formatUSD, memberClass, quote, type MembershipSettings } from '@/lib/content/membership';
import { fmtDay, termFor } from '@/lib/content/renewal';
import { digits, fieldErrors, makeJoinSchemas, US_STATES, votingPreview } from '@/lib/join/schema';
import type { LookupResult } from '@/lib/join/residency';
import * as svc from '@/lib/demo/demo-service';
import { GoogleButton, type GoogleProfile } from './GoogleButton';
import { LOADER_PLANS, SmartLoader, type LoaderKey } from '@/components/ui/SmartLoader';
import { cleanAnswers, coreHelp, coreLabel, coreShown, fieldShown, JoinFormSchema, sectionsAt, validateSections, type Answers, type FormCtx, type JoinForm, type JoinSection, type Placement } from '@/lib/join/form-def';
import { answerText, CustomSections } from './CustomFields';
import { findMember } from '@/lib/demo/demo-member';
import { applyDiscount, feeCover, PAY_LABEL, payMethods, type OrgConfig } from '@/lib/community/org-config';

/** Core steps + admin steps ("s:<section id>") placed after about / plan / pledge. */
type StepId = string;
type StepDef = { id: StepId; label: string; section?: JoinSection };
const RESUME_PREFIX = 'isgh-join-resume:';
const DRAFT_KEY = 'isgh-join-draft-v1';

type Draft = {
  step: StepId;
  account: { email: string; verified: boolean; provider?: 'email' | 'google' };
  about: { firstName: string; middleName: string; lastName: string; preferredName: string; dob: string; phone: string;
    street: string; unit: string; city: string; state: string; zip: string; centerId: string; zoneId: string; borderRequestCenterId: string };
  lookup: LookupResult | null;
  plan: { memberClass: 'natural' | 'associate'; planId: string; years: number; spouse: { firstName: string; lastName: string; email: string } };
  pledge: { commitments: string[]; pledgeAccepted: boolean; signature: string; emailConsent: boolean; smsConsent: boolean; identityConsent?: boolean };
  payment: { payer: 'self' | 'relative'; payerRelationship: string; payerName: string };
  custom: Answers;                       // answers to the admin's questions (by field id)
  filled: Record<string, string>;        // field → "From your ID" / "From last year" (shown until edited)
  idCaptured: boolean;                   // photo ID taken with "Scan your ID"
  mode: 'join' | 'renew';
};

const initialDraft = (planId: string): Draft => ({
  step: 'account',
  account: { email: '', verified: false },
  about: { firstName: '', middleName: '', lastName: '', preferredName: '', dob: '', phone: '', street: '', unit: '', city: 'Houston', state: 'TX', zip: '', centerId: '', zoneId: '', borderRequestCenterId: '' },
  lookup: null,
  plan: { memberClass: 'natural', planId, years: 1, spouse: { firstName: '', lastName: '', email: '' } },
  pledge: { commitments: [], pledgeAccepted: false, signature: '', emailConsent: false, smsConsent: false, identityConsent: false },
  payment: { payer: 'self', payerRelationship: '', payerName: '' },
  custom: {}, filled: {}, idCaptured: false, mode: 'join',
});

const formatPhone = (v: string) => {
  const d = digits(v).replace(/^1(?=\d{10})/, '').slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
};

/* ---------------- small UI helpers ---------------- */
function Field({ id, label, hint, error, children, optional, tag }: { id: string; label: string; hint?: string; error?: string; children: ReactNode; optional?: boolean; tag?: ReactNode }) {
  return (
    <div className={`jf-field${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>{label}{optional && <span className="opt"> (optional)</span>}{tag}</label>
      {hint && <p className="hint" id={`${id}-hint`}>{hint}</p>}
      {children}
      {error && <p className="field-error" id={`${id}-error`}>{error}</p>}
    </div>
  );
}
const describedBy = (id: string, hint?: boolean, error?: string) =>
  [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;

/* ---------------- main ---------------- */
export function JoinFlow({ settings, form, initialPlan, mockMode = svc.DEMO, config }: { settings: MembershipSettings; form: JoinForm; initialPlan?: string; mockMode?: boolean; config?: OrgConfig }) {
  // the admin's live preview can push an unsaved form definition into this page (PreviewBridge → event)
  const [liveForm, setLiveForm] = useState<JoinForm>(form);
  const schemas = useMemo(() => makeJoinSchemas(settings), [settings]);
  const allPlans = settings.plans.filter((p) => p.visible && (settings.flags.familyPlan || p.category !== 'household') && (settings.flags.lifePlan || p.term !== 'lifetime'));
  // D13 – a plan can be for an age range (youth, senior); once the date of birth is known, only matching plans are offered
  const [ageForPlans, setAgeForPlans] = useState<number | null>(null);
  const plans = ageForPlans === null ? allPlans : allPlans.filter((p) => !p.ages || ((p.ages.min === undefined || ageForPlans >= p.ages.min) && (p.ages.max === undefined || ageForPlans <= p.ages.max)));
  const defaultPlan = plans.find((p) => p.id === initialPlan) ?? plans.find((p) => p.featured) ?? plans[0];

  const [d, setD] = useState<Draft>(() => initialDraft(defaultPlan?.id ?? ''));
  useEffect(() => { setAgeForPlans(d.about.dob ? ageOnRecord(d.about.dob, new Date().toISOString().slice(0, 10)) : null); }, [d.about.dob]);
  const [restored, setRestored] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [task, setTask] = useState<LoaderKey | null>(null); // which smart loader is running
  const busy = task !== null;
  const [notice, setNotice] = useState('');
  const [otp, setOtp] = useState({ sent: false, code: '', devCode: '', seconds: 0, existing: false });
  const [result, setResult] = useState<{ applicationId: string; amountCents: number; method?: string } | null>(null);
  // Admin › Settings › Configuration › Payments / Discount codes (WildApricot: Payment settings, Discounts)
  const methods = config ? payMethods(config) : (['card'] as const);
  const [payMethod, setPayMethod] = useState<string>(methods[0] ?? 'card');
  const [coverFees, setCoverFees] = useState(false);
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState<{ code: string; cents: number; message: string } | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  /* autosave in this browser tab (sessionStorage – cleared when the tab closes; cross-device drafts come from BE later) */
  useEffect(() => {
    try {
      const resume = new URLSearchParams(window.location.search).get('resume');
      const fromLink = resume && /^[a-z0-9]{8,40}$/.test(resume) ? localStorage.getItem(RESUME_PREFIX + resume) : null;
      const raw = fromLink ?? sessionStorage.getItem(DRAFT_KEY);
      if (fromLink) setNotice('Welcome back – we opened your saved application.');
      if (raw) {
        const saved = JSON.parse(raw) as Draft;
        if (saved?.account?.email) { setD({ ...initialDraft(defaultPlan?.id ?? ''), ...saved, step: saved.step === 'done' ? 'account' : saved.step }); setRestored(true); }
      }
    } catch { /* ignore broken draft */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (d.step === 'done') { try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* */ } return; }
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch { /* storage unavailable */ }
  }, [d]);

  /* live preview from the admin form builder */
  useEffect(() => {
    const on = (e: Event) => {
      const det = (e as CustomEvent<{ form: unknown; step?: string }>).detail;
      const r = JoinFormSchema.safeParse(det?.form);
      if (!r.success) return;
      setLiveForm(r.data);
      if (det.step) setD((x) => ({ ...x, step: det.step!, account: { ...x.account, verified: true, email: x.account.email || 'preview@example.com' } }));
    };
    window.addEventListener('isgh:join-form-preview', on);
    return () => window.removeEventListener('isgh:join-form-preview', on);
  }, []);

  /* OTP resend countdown */
  useEffect(() => {
    if (otp.seconds <= 0) return;
    const t = setTimeout(() => setOtp((o) => ({ ...o, seconds: o.seconds - 1 })), 1000);
    return () => clearTimeout(t);
  }, [otp.seconds]);

  const goTo = useCallback((step: StepId) => {
    setErrors({}); setNotice('');
    setD((x) => ({ ...x, step }));
    requestAnimationFrame(() => { headingRef.current?.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }, []);

  const showErrors = (errs: Record<string, string>) => {
    setErrors(errs);
    requestAnimationFrame(() => summaryRef.current?.focus());
  };

  const set = <K extends keyof Draft>(section: K, patch: Partial<Draft[K]>) =>
    setD((x) => ({ ...x, [section]: { ...(x[section] as object), ...patch } }));

  const plan = plans.find((p) => p.id === d.plan.planId);
  const price = plan ? quote(plan, d.plan.years) : null;
  const afterCode = price ? (applied ? applied.cents : price.totalCents) : 0;
  const feeCents = config && coverFees ? feeCover(config, afterCode, payMethod) : 0;
  const finalCents = afterCode + feeCents;
  const offline = payMethod === 'check' || payMethod === 'cash' || payMethod === 'payLater';
  // V1 – the classes are the organization's words; when only one is offered the question is skipped
  const offeredClasses = (['natural', 'associate'] as const).map((k) => [k, memberClass(settings.rules, k)] as const).filter(([, c]) => c.offered && plans.some((p) => p.memberClass === c.key)).map(([k, c]) => [k, `As ${/^[aeiou]/i.test(c.label) ? 'an' : 'a'} ${c.label.toLowerCase()}`, c.blurb] as const);
  useEffect(() => { if (offeredClasses.length && !offeredClasses.some(([k]) => k === d.plan.memberClass)) { const k = offeredClasses[0][0]; const first = plans.find((p) => p.memberClass === k && p.featured) ?? plans.find((p) => p.memberClass === k); set('plan', { memberClass: k, planId: first?.id ?? '', years: 1 }); } }, [offeredClasses.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const preview = votingPreview(settings, { dob: d.about.dob, memberClass: d.plan.memberClass, planId: d.plan.planId, commitments: d.pledge.commitments, state: d.about.state, payer: d.payment.payer });
  const ctx: FormCtx = { planId: d.plan.planId, planCategory: plan?.category ?? '', memberClass: d.plan.memberClass, age: d.about.dob ? ageOnRecord(d.about.dob, new Date().toISOString().slice(0, 10)) : null };
  const ownSteps = (p: Placement): StepDef[] => sectionsAt(liveForm, p).map((sec) => ({ id: `s:${sec.id}`, label: sec.title, section: sec }));
  const allSteps: StepDef[] = [
    { id: 'account', label: 'Email' }, { id: 'about', label: 'About you' }, ...ownSteps('step-after-about'),
    { id: 'plan', label: 'Plan' }, ...ownSteps('step-after-plan'), { id: 'pledge', label: 'Pledge' }, ...ownSteps('step-after-pledge'),
    { id: 'review', label: d.mode === 'renew' ? 'Review and renew' : 'Review and pay' },
  ];
  // an admin step is skipped when none of its questions apply (e.g. family-only questions on a Single plan)
  const STEPS = allSteps.filter((s) => !s.section || s.id === d.step || s.section.fields.some((f) => fieldShown(f, d.custom, ctx)));
  const stepIndex = STEPS.findIndex((s) => s.id === d.step);
  const nextOf = (id: StepId) => STEPS[STEPS.findIndex((s) => s.id === id) + 1]?.id ?? 'review';
  const prevOf = (id: StepId) => STEPS[STEPS.findIndex((s) => s.id === id) - 1]?.id ?? 'account';
  const currentSection = allSteps.find((s) => s.id === d.step)?.section;
  const setCustom = (id: string, v: Answers[string]) => setD((x) => { const filled = { ...x.filled }; delete filled[id]; return { ...x, custom: { ...x.custom, [id]: v }, filled }; });
  const customErrors = (p: Placement) => validateSections(sectionsAt(liveForm, p), d.custom, ctx);

  /* ---------------- step actions ---------------- */
  const sendCode = async () => {
    const r = schemas.account.shape.email.safeParse(d.account.email);
    if (!r.success) return showErrors({ 'account.email': r.error.issues[0].message });
    setTask('sendCode'); setErrors({});
    try {
      const j = await svc.sendCode(r.data, 'join');
      setOtp({ sent: true, code: '', devCode: j.demoCode ?? '', seconds: settings.otp.resendSeconds, existing: false });
      setNotice(`We sent a ${settings.otp.length}-digit code to ${r.data}.`);
    } catch { showErrors({ 'account.email': 'We could not send the code. Check the email address and try again.' }); }
    finally { setTask(null); }
  };

  const verifyCode = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!/^\d{6}$/.test(otp.code)) return showErrors({ 'account.code': `Enter the ${settings.otp.length}-digit code from the email.` });
    setTask('verifyCode');
    try {
      const j = await svc.verifyCode(d.account.email, otp.code, 'join');
      if (!j.ok) return showErrors({ 'account.code': 'That code is not right or has expired. Check the email or send a new code.' });
      if (j.existingMember) { setOtp((o) => ({ ...o, existing: true })); return; }
      set('account', { verified: true });
      goTo('about');
    } catch { showErrors({ 'account.code': 'We could not check the code. Try again.' }); }
    finally { setTask(null); }
  };

  const findCenter = async (override?: Partial<Draft['about']>): Promise<LookupResult | null> => {
    const a = { ...d.about, ...override };
    const partial = schemas.about.pick({ street: true, city: true, state: true, zip: true }).safeParse(a);
    if (!partial.success) { showErrors(prefix('about', fieldErrors(partial.error))); return null; }
    setTask('lookup');
    try {
      const lookup = await svc.lookupAddress({ street: a.street, city: a.city, state: a.state, zip: a.zip });
      setD((x) => ({ ...x, lookup, about: { ...x.about,
        centerId: lookup.center?.id ?? 'outside-area', zoneId: lookup.zone?.id ?? 'outside-area', borderRequestCenterId: '' } }));
      setErrors((er) => { const n = { ...er }; delete n['about.centerId']; return n; });
      return lookup;
    } catch { showErrors({ 'about.centerId': 'We could not look up your address right now. Try again.' }); return null; }
    finally { setTask(null); }
  };

  const nextFromAbout = async (e: FormEvent) => {
    e.preventDefault();
    let about = d.about;
    if (!about.centerId) { const l = await findCenter(); if (!l) return; about = { ...about, centerId: l.center?.id ?? 'outside-area', zoneId: l.zone?.id ?? 'outside-area' }; }
    const r = schemas.about.safeParse(about);
    const errs = { ...(r.success ? {} : prefix('about', fieldErrors(r.error))), ...customErrors('about') };
    if (Object.keys(errs).length) return showErrors(errs);
    goTo(nextOf('about'));
  };

  const nextFromPlan = (e: FormEvent) => {
    e.preventDefault();
    const r = schemas.plan.safeParse(d.plan);
    const errs = { ...(r.success ? {} : prefix('plan', fieldErrors(r.error))), ...customErrors('plan') };
    if (Object.keys(errs).length) return showErrors(errs);
    goTo(nextOf('plan'));
  };

  const nextFromPledge = (e: FormEvent) => {
    e.preventDefault();
    const r = schemas.pledge.safeParse(d.pledge);
    const errs = r.success ? {} : prefix('pledge', fieldErrors(r.error));
    const expected = `${d.about.firstName} ${d.about.lastName}`.trim();
    if (d.pledge.signature.trim().toLowerCase().replace(/\s+/g, ' ') !== expected.toLowerCase().replace(/\s+/g, ' '))
      errs['pledge.signature'] = `Type your name exactly as entered: ${expected}.`;
    Object.assign(errs, customErrors('pledge'));
    if (settings.identity.policy.enabled && settings.identity.consentRequired && !d.pledge.identityConsent) errs['pledge.identityConsent'] = `Please read the ${settings.identity.policy.title} and tick the box.`;
    if (Object.keys(errs).length) return showErrors(errs);
    goTo(nextOf('pledge'));
  };

  const nextFromSection = (e: FormEvent) => {
    e.preventDefault();
    if (!currentSection) return;
    const errs = validateSections([currentSection], d.custom, ctx);
    if (Object.keys(errs).length) return showErrors(errs);
    goTo(nextOf(d.step));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const pay = schemas.payment.safeParse(d.payment);
    if (!pay.success) return showErrors(prefix('payment', fieldErrors(pay.error)));
    const body = {
      account: d.account, about: d.about, plan: { ...d.plan, spouse: plan?.category === 'household' ? d.plan.spouse : undefined },
      pledge: d.pledge, payment: d.payment,
      pledgeVersion: settings.pledge.version, emailConsentVersion: settings.consents.email.version, smsConsentVersion: settings.consents.sms.version,
      identityConsentVersion: settings.identity.consentRequired && d.pledge.identityConsent ? settings.identity.consentVersion : '',
    };
    const full = schemas.application.safeParse(body);
    if (!full.success) return showErrors(fieldErrors(full.error));
    const custom = cleanAnswers(liveForm, d.custom, ctx);
    if (Object.keys(custom.errors).length) return showErrors(custom.errors);
    // live: POST { ...body, custom: custom.answers, joinFormVersion } – the server checks the same rules again
    setTask('submit');
    try {
      // DEMO: no API call, no payment. Live: the API re-validates, recomputes the price and opens the card page.
      const j = await svc.submitApplication(finalCents, { ...body, custom: custom.answers, joinFormVersion: liveForm.version, checkout: { method: payMethod, coverFees, discountCode: applied?.code || undefined } });
      try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* */ }
      if (j.checkoutUrl) { window.location.assign(j.checkoutUrl); return; }
      setResult({ applicationId: j.applicationId, amountCents: j.amountCents, method: payMethod });
      goTo('done');
    } catch (err) {
      const fields = (err as { fields?: Record<string, string> }).fields;
      if (fields && Object.keys(fields).length) showErrors(fields);
      else showErrors({ form: err instanceof Error && !svc.DEMO ? `${err.message} Nothing was charged.` : 'We could not submit your application. Nothing was charged. Try again in a minute.' });
    }
    finally { setTask(null); }
  };

  const startOver = () => {
    try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* */ }
    setD(initialDraft(defaultPlan?.id ?? '')); setOtp({ sent: false, code: '', devCode: '', seconds: 0, existing: false }); setRestored(false); setErrors({});
  };

  const err = (k: string) => errors[k];

  /* ---------- smart helpers ---------- */
  /** Scan photo ID (DEMO): live, the photo goes to the BE ID reader (e.g. AWS Textract AnalyzeID) and feeds the Photo ID check. */
  const scanId = async (file?: File) => {
    if (file && !/^image\//.test(file.type)) return showErrors({ 'about.idscan': 'Choose a photo (JPG or PNG) of the front of your ID.' });
    if (file && file.size > 12_000_000) return showErrors({ 'about.idscan': 'That photo is too large. Use a photo under 12 MB.' });
    setTask('idScan'); setErrors({});
    await new Promise((r) => setTimeout(r, Math.round(1400 * svc.demoSpeedFactor())));
    const g = (x: string, v: string) => x || v;
    const sample = { firstName: 'Amina', lastName: 'Khan', dob: '1990-05-14', street: '10415 Beechnut St', city: 'Houston', state: 'TX', zip: '77072' };
    const about = { ...d.about, firstName: g(d.about.firstName, sample.firstName), lastName: g(d.about.lastName, sample.lastName), dob: g(d.about.dob, sample.dob),
      street: sample.street, city: sample.city, state: sample.state, zip: sample.zip, centerId: '', zoneId: '' };
    const filled: Record<string, string> = { ...d.filled };
    (['firstName', 'lastName', 'dob', 'street', 'city', 'zip'] as const).forEach((k) => { if (about[k] !== d.about[k]) filled[`about.${k}`] = 'From your ID'; });
    setD((x) => ({ ...x, about, filled, idCaptured: true }));
    setTask(null);
    setNotice('We read your ID. Check each field marked “From your ID”. Your photo also counts as your photo ID upload.');
    void findCenter({ street: about.street, city: about.city, state: about.state, zip: about.zip });
  };

  /** Existing member → renew with last year's answers (DEMO: from the demo member record). */
  const startRenewal = () => {
    const m = findMember(d.account.email);
    const [street = '', cityLine = ''] = m?.address ?? [];
    const cm = cityLine.match(/^(.*),\s*([A-Z]{2})\s+(\d{5})/);
    const about = { ...d.about, firstName: m?.firstName ?? '', lastName: m?.lastName ?? '', phone: m?.phone ?? '', street, city: cm?.[1] ?? 'Houston', state: cm?.[2] ?? 'TX', zip: cm?.[3] ?? '', centerId: '', zoneId: '' };
    const lastYear: Answers = { 'children-count': '2', volunteer: ['events-and-iftar'], skills: 'Accountant', languages: ['english', 'urdu'], gender: 'female', 'spouse-same-address': 'yes' };
    const custom: Answers = {}; const filled: Record<string, string> = {};
    for (const sec of liveForm.sections) for (const f of sec.fields) if (f.prefill === 'lastYear' && lastYear[f.id] !== undefined) { custom[f.id] = lastYear[f.id]; filled[f.id] = 'From last year'; }
    (['firstName', 'lastName', 'phone', 'street', 'city', 'zip'] as const).forEach((k) => { if (about[k]) filled[`about.${k}`] = 'From last year'; });
    const planId = m?.plan === 'Family' ? plans.find((p) => p.category === 'household')?.id : plans.find((p) => p.id === 'single')?.id;
    setD((x) => ({ ...x, mode: 'renew', account: { ...x.account, verified: true }, about, custom, filled, plan: { ...x.plan, planId: planId ?? x.plan.planId } }));
    setOtp((o) => ({ ...o, existing: false }));
    goTo('about');
    setNotice(`Renewing ${m?.firstName ?? 'your'} membership – we filled in last year's answers. Check each step and change anything that is new.`);
    void findCenter({ street: about.street, city: about.city, state: about.state, zip: about.zip });
  };

  /** Save and finish later (DEMO: link works in this browser; live: BE stores the draft encrypted for 30 days and emails/texts the link). */
  const [saved, setSaved] = useState<string | null>(null);
  const saveForLater = () => {
    const token = Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
    try { localStorage.setItem(RESUME_PREFIX + token, JSON.stringify(d)); } catch { /* storage full */ }
    setSaved(`${window.location.origin}/membership/join?resume=${token}`);
  };
  const filledTag = (k: string) => d.filled[k] ? <span className="jf-filled">{d.filled[k]}</span> : null;
  const clearFilled = (k: string) => d.filled[k] && setD((x) => { const f = { ...x.filled }; delete f[k]; return { ...x, filled: f }; });

  /** Google gives a verified email + name → skip the code step, prefill the name. */
  const onGoogle = (p: GoogleProfile) => {
    setErrors({});
    if (p.existingMember) { set('account', { email: p.email, verified: false }); setOtp({ sent: true, code: '', devCode: '', seconds: 0, existing: true }); return; }
    setD((x) => ({ ...x, account: { email: p.email, verified: true, provider: 'google' } as Draft['account'],
      about: { ...x.about, firstName: x.about.firstName || p.firstName, lastName: x.about.lastName || p.lastName } }));
    setNotice(`Signed in with Google as ${p.email}.`);
    setErrors({}); setD((x) => ({ ...x, step: 'about' }));
    requestAnimationFrame(() => { headingRef.current?.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  };

  /** Validate one field when the person leaves it (friendlier than waiting for Continue). */
  const blurCheck = (section: 'about' | 'account', key: string, value: unknown) => {
    const shape = (section === 'about' ? schemas.about.shape : schemas.account.shape) as Record<string, { safeParse: (v: unknown) => { success: boolean; error?: { issues: { message: string }[] } } }>;
    if (!shape[key] || value === '' || value === undefined) return;
    const r = shape[key].safeParse(value);
    setErrors((e) => {
      const n = { ...e }; const k = `${section}.${key}`;
      if (r.success) delete n[k]; else n[k] = r.error!.issues[0].message;
      return n;
    });
  };
  const [addrFocus, setAddrFocus] = useState(false);
  const addrSuggestions = addrFocus ? svc.suggestAddresses(d.about.street).filter((x) => x.street !== d.about.street) : [];
  const pickAddress = (x: { street: string; city: string; state: string; zip: string }) => {
    set('about', { street: x.street, city: x.city, state: x.state, zip: x.zip, centerId: '', zoneId: '' });
    setAddrFocus(false);
    void findCenter({ street: x.street, city: x.city, state: x.state, zip: x.zip });
  };
  const emailFix = d.step === 'account' ? svc.suggestEmail(d.account.email) : null;
  const single = plans.find((p) => p.id === 'single'), family = plans.find((p) => p.category === 'household');
  const errorList = Object.entries(errors);

  /* ---------------- render ---------------- */
  return (
    <div className={`jf-shell${d.step === 'done' ? ' is-done' : ''}`}>
    <div className="jf-card" aria-busy={busy || undefined}>
      <SmartLoader plan={LOADER_PLANS.submit} active={task === 'submit'} variant="overlay" expectedMs={2200} />
      {d.step !== 'done' && (
        <ol className="stepper" aria-label="Sign-up steps">
          {STEPS.map((s, i) => (
            <li key={s.id} className={i < stepIndex ? 'done' : i === stepIndex ? 'current' : ''} aria-current={i === stepIndex ? 'step' : undefined}>
              <span className="dot" aria-hidden="true">{i < stepIndex ? '✓' : i + 1}</span><span className="lbl">{s.label}</span>
            </li>
          ))}
        </ol>
      )}

      {restored && d.step !== 'done' && (
        <div className="jf-note" role="status">We restored your progress from earlier in this tab. <button type="button" className="linkish" onClick={startOver}>Start over</button></div>
      )}

      {errorList.length > 0 && (
        <div className="error-summary" role="alert" tabIndex={-1} ref={summaryRef}>
          <b>{errorList.length === 1 ? 'Fix this to continue:' : `Fix these ${errorList.length} things to continue:`}</b>
          <ul>{errorList.map(([k, m]) => <li key={k}><a href={`#${fieldId(k)}`}>{m}</a></li>)}</ul>
        </div>
      )}

      {/* ---------- 1. Account ---------- */}
      {d.step === 'account' && (
        <section className="jf-step" aria-labelledby="st-h">
          <h2 id="st-h" tabIndex={-1} ref={headingRef}>Create your account</h2>
          <p className="jf-lead">Use Google, or get a {settings.otp.length}-digit code by email. No password to remember.</p>
          {!otp.sent ? (
            <div className="auth-box">
              {liveForm.helpers.google && <><GoogleButton onProfile={onGoogle} disabled={busy} />
              <div className="or" role="separator"><span>or use your email</span></div></>}
              <form onSubmit={(e) => { e.preventDefault(); void sendCode(); }} noValidate>
                <Field id="f-account-email" label="Email address" error={err('account.email')}>
                  <div className="input-group">
                    <input id="f-account-email" className="input" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" value={d.account.email}
                      onChange={(e) => set('account', { email: e.target.value, verified: false })} aria-invalid={!!err('account.email') || undefined}
                      aria-describedby={describedBy('f-account-email', false, err('account.email'))} />
                    <button className="btn btn-primary" type="submit" disabled={busy} data-busy={task === 'sendCode' || undefined}>{task === 'sendCode' ? 'Sending…' : 'Send code'}</button>
                  </div>
                </Field>
                <SmartLoader plan={LOADER_PLANS.sendCode} active={task === 'sendCode'} expectedMs={900} />
                {emailFix && (
                  <p className="jf-suggest">Did you mean <button type="button" className="linkish" onClick={() => set('account', { email: emailFix })}>{emailFix}</button>?</p>
                )}
              </form>
              <ul className="trust">
                <li>Your details are used only for ISGH membership.</li>
                <li>Payments are handled by Stripe. We never see your card.</li>
                <li>{liveForm.helpers.saveForLater ? 'You can save and finish later on any device.' : 'You can save and finish later in this browser tab.'}</li>
              </ul>
              <p className="fine">By continuing you agree to the <Link href="/terms">Terms of use</Link> and <Link href="/privacy">Privacy policy</Link>.</p>
            </div>
          ) : otp.existing ? (
            <div className="callout" data-tone="info">
              <b>You already have an ISGH membership</b>
              <p>{d.account.email} is linked to an existing member. {liveForm.helpers.renewPrefill ? 'Renew now – we fill in last year’s answers so you only check what changed.' : 'Sign in to renew or update it, so your history and voting record stay together.'}</p>
              <div className="row-actions">
                {liveForm.helpers.renewPrefill && <button type="button" className="btn btn-primary" onClick={startRenewal}>Renew with last year’s details</button>}
                <Link className={`btn ${liveForm.helpers.renewPrefill ? 'btn-outline' : 'btn-primary'}`} href="/sign-in">Sign in instead</Link>
                <button type="button" className="btn btn-outline" onClick={startOver}>Use a different email</button>
              </div>
            </div>
          ) : (
            <form onSubmit={verifyCode} noValidate>
              {notice && <p className="jf-ok" role="status">{notice}</p>}
              {mockMode && otp.devCode && <p className="jf-test">Test mode: no email is sent. Use code <b>{otp.devCode}</b>.</p>}
              <Field id="f-account-code" label={`${settings.otp.length}-digit code`} error={err('account.code')}>
                <input id="f-account-code" className="input code" inputMode="numeric" autoComplete="one-time-code" maxLength={settings.otp.length}
                  value={otp.code} onChange={(e) => setOtp((o) => ({ ...o, code: digits(e.target.value) }))} aria-invalid={!!err('account.code') || undefined}
                  aria-describedby={describedBy('f-account-code', false, err('account.code'))} />
              </Field>
              <div className="row-actions">
                <button className="btn btn-primary" type="submit" disabled={busy} data-busy={task === 'verifyCode' || undefined}>{task === 'verifyCode' ? 'Checking…' : 'Verify and continue'}</button>
                <button className="btn btn-outline" type="button" disabled={otp.seconds > 0 || busy} onClick={() => void sendCode()}>
                  {otp.seconds > 0 ? `Resend code in ${otp.seconds}s` : 'Resend code'}
                </button>
                <button className="linkish" type="button" onClick={() => setOtp({ sent: false, code: '', devCode: '', seconds: 0, existing: false })}>Change email</button>
              </div>
              <SmartLoader plan={task === 'sendCode' ? LOADER_PLANS.sendCode : LOADER_PLANS.verifyCode} active={task === 'verifyCode' || task === 'sendCode'} expectedMs={800} />
            </form>
          )}
        </section>
      )}

      {/* ---------- 2. About you ---------- */}
      {d.step === 'about' && (
        <form className="jf-step" aria-labelledby="st-h" onSubmit={nextFromAbout} noValidate>
          <h2 id="st-h" tabIndex={-1} ref={headingRef}>About you</h2>
          {notice && <p className="jf-ok" role="status">{notice}</p>}
          <p className="jf-lead">{liveForm.intro || 'About 2 minutes.'} Use your legal name. Your home address places you in your zone and Islamic Center.</p>
          {liveForm.helpers.idScan && (
            <div className="jf-scan" id="f-about-idscan">
              <div>
                <b>{d.idCaptured ? 'ID read – check the fields below' : 'Scan your ID to fill this in'}</b>
                <small>Texas driver license, state ID or passport. Your photo also counts as the photo ID check. {mockMode ? 'Test mode: the photo never leaves this browser and sample details are used.' : 'Kept encrypted and deleted 90 days after the check.'}</small>
              </div>
              <label className="btn btn-outline btn-sm">
                <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void scanId(f); e.target.value = ''; }} disabled={busy} />
                {d.idCaptured ? 'Scan again' : 'Take or upload a photo'}
              </label>
              {mockMode && !d.idCaptured && <button type="button" className="linkish" onClick={() => void scanId()} disabled={busy}>Use a sample ID</button>}
              <SmartLoader plan={LOADER_PLANS.idScan} active={task === 'idScan'} expectedMs={1400} />
              {err('about.idscan') && <p className="field-error">{err('about.idscan')}</p>}
            </div>
          )}
          {settings.identity.nameMustMatchId && <p className="jf-idnote" id="f-about-idnote">{settings.identity.nameNote}</p>}
          <div className="grid-2">
            {(['firstName', 'lastName'] as const).map((k) => (
              <Field key={k} id={`f-about-${k}`} label={coreLabel(liveForm, k)} hint={coreHelp(liveForm, k)} tag={filledTag(`about.${k}`)} error={err(`about.${k}`)}>
                <input id={`f-about-${k}`} className="input" autoComplete={k === 'firstName' ? 'given-name' : 'family-name'} value={d.about[k]}
                  onChange={(e) => { clearFilled(`about.${k}`); set('about', { [k]: e.target.value }); }} onBlur={(e) => blurCheck('about', k, e.target.value)} aria-invalid={!!err(`about.${k}`) || undefined} aria-describedby={describedBy(`f-about-${k}`, false, err(`about.${k}`))} />
              </Field>
            ))}
            {coreShown(liveForm, 'middleName') && <Field id="f-about-middleName" label={coreLabel(liveForm, 'middleName')} hint={coreHelp(liveForm, 'middleName')} optional>
              <input id="f-about-middleName" className="input" autoComplete="additional-name" value={d.about.middleName} onChange={(e) => set('about', { middleName: e.target.value })} />
            </Field>}
            {coreShown(liveForm, 'preferredName') && <Field id="f-about-preferredName" label={coreLabel(liveForm, 'preferredName')} hint={coreHelp(liveForm, 'preferredName')} optional>
              <input id="f-about-preferredName" className="input" autoComplete="nickname" value={d.about.preferredName} onChange={(e) => set('about', { preferredName: e.target.value })} />
            </Field>}
            <Field id="f-about-dob" label={coreLabel(liveForm, 'dob')} hint={coreHelp(liveForm, 'dob', `You must be ${settings.minMemberAge} or older.`)} tag={filledTag('about.dob')} error={err('about.dob')}>
              <input id="f-about-dob" className="input" type="date" autoComplete="bday" value={d.about.dob} max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => { clearFilled('about.dob'); set('about', { dob: e.target.value }); }} onBlur={(e) => blurCheck('about', 'dob', e.target.value)} aria-invalid={!!err('about.dob') || undefined} aria-describedby={describedBy('f-about-dob', true, err('about.dob'))} />
            </Field>
            <Field id="f-about-phone" label={coreLabel(liveForm, 'phone')} hint={coreHelp(liveForm, 'phone', 'For important account notices.')} tag={filledTag('about.phone')} error={err('about.phone')}>
              <input id="f-about-phone" className="input" type="tel" autoComplete="tel-national" inputMode="tel" placeholder="(713) 555-0123" value={d.about.phone}
                onChange={(e) => set('about', { phone: formatPhone(e.target.value) })} onBlur={(e) => blurCheck('about', 'phone', e.target.value)} aria-invalid={!!err('about.phone') || undefined} aria-describedby={describedBy('f-about-phone', true, err('about.phone'))} />
            </Field>
          </div>

          <fieldset className="jf-fieldset">
            <legend>{coreLabel(liveForm, 'address')}</legend>
            {coreHelp(liveForm, 'address') && <p className="hint">{coreHelp(liveForm, 'address')}</p>}
            <Field id="f-about-street" label="Street address" tag={filledTag('about.street')} error={err('about.street')}>
              <div className="addr-wrap">
                <input id="f-about-street" className="input" autoComplete="address-line1" value={d.about.street} role="combobox"
                  aria-expanded={addrSuggestions.length > 0} aria-controls="addr-list" aria-autocomplete="list"
                  onFocus={() => setAddrFocus(true)} onBlur={() => setTimeout(() => setAddrFocus(false), 150)}
                  onChange={(e) => set('about', { street: e.target.value, centerId: '', zoneId: '' })} aria-invalid={!!err('about.street') || undefined} aria-describedby={describedBy('f-about-street', false, err('about.street'))} />
                {addrSuggestions.length > 0 && (
                  <ul className="addr-list" id="addr-list" role="listbox" aria-label="Address suggestions">
                    {addrSuggestions.map((x) => (
                      <li key={x.street} role="option" aria-selected="false">
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pickAddress(x)}>
                          <b>{x.street}</b><span>{x.city}, {x.state} {x.zip}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Field>
            <div className="grid-addr">
              {coreShown(liveForm, 'unit') ? <Field id="f-about-unit" label={coreLabel(liveForm, 'unit')} optional>
                <input id="f-about-unit" className="input" autoComplete="address-line2" value={d.about.unit} onChange={(e) => set('about', { unit: e.target.value })} />
              </Field> : <span />}
              <Field id="f-about-city" label="City" error={err('about.city')}>
                <input id="f-about-city" className="input" autoComplete="address-level2" value={d.about.city}
                  onChange={(e) => set('about', { city: e.target.value, centerId: '', zoneId: '' })} aria-invalid={!!err('about.city') || undefined} aria-describedby={describedBy('f-about-city', false, err('about.city'))} />
              </Field>
              <Field id="f-about-state" label="State" error={err('about.state')}>
                <select id="f-about-state" className="input" autoComplete="address-level1" value={d.about.state}
                  onChange={(e) => set('about', { state: e.target.value, centerId: '', zoneId: '' })}>
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field id="f-about-zip" label="ZIP code" error={err('about.zip')}>
                <input id="f-about-zip" className="input" autoComplete="postal-code" inputMode="numeric" maxLength={10} value={d.about.zip}
                  onChange={(e) => set('about', { zip: e.target.value.replace(/[^\d-]/g, ''), centerId: '', zoneId: '' })} onBlur={(e) => blurCheck('about', 'zip', e.target.value)} aria-invalid={!!err('about.zip') || undefined} aria-describedby={describedBy('f-about-zip', false, err('about.zip'))} />
              </Field>
            </div>
            <div id="f-about-centerId">
              {!d.about.centerId ? (
                <button type="button" className="btn btn-outline" onClick={() => void findCenter()} disabled={busy} data-busy={task === 'lookup' || undefined}>{task === 'lookup' ? 'Looking up…' : 'Find my Islamic Center'}</button>
              ) : d.lookup && (
                <CenterResult lookup={d.lookup} serviceArea={settings.serviceArea.label} borderChoice={d.about.borderRequestCenterId}
                  onBorder={(id) => set('about', { borderRequestCenterId: id })} />
              )}
              <SmartLoader plan={LOADER_PLANS.lookup} active={task === 'lookup'} expectedMs={1100} />
              {err('about.centerId') && <p className="field-error">{err('about.centerId')}</p>}
            </div>
          </fieldset>
          <CustomSections sections={sectionsAt(liveForm, 'about')} answers={d.custom} ctx={ctx} errors={errors} onChange={setCustom} filled={d.filled} />
          <StepNav onBack={() => goTo(prevOf('about'))} busy={busy} onSave={liveForm.helpers.saveForLater ? saveForLater : undefined} />
        </form>
      )}

      {/* ---------- 3. Plan ---------- */}
      {d.step === 'plan' && (
        <form className="jf-step" aria-labelledby="st-h" onSubmit={nextFromPlan} noValidate>
          <h2 id="st-h" tabIndex={-1} ref={headingRef}>Choose your membership</h2>
          {offeredClasses.length > 1 && <fieldset className="jf-fieldset" id="f-plan-memberClass">
            <legend>How are you joining?</legend>
            <div className="choice-row">
              {offeredClasses.map(([v, l, h]) => (
                <label key={v} className={`choice${d.plan.memberClass === v ? ' on' : ''}`}>
                  <input type="radio" name="memberClass" value={v} checked={d.plan.memberClass === v}
                    onChange={() => { const first = plans.find((p) => p.memberClass === v && (v !== 'natural' || p.featured)) ?? plans.find((p) => p.memberClass === v); set('plan', { memberClass: v, planId: first?.id ?? '', years: 1 }); }} />
                  <span><b>{l}</b><small>{h}</small></span>
                </label>
              ))}
            </div>
          </fieldset>}
          <fieldset className="jf-fieldset" id="f-plan-planId">
            <legend>Plan</legend>
            <div className="plan-choices">
              {plans.filter((p) => p.memberClass === d.plan.memberClass).map((p) => (
                <label key={p.id} className={`plan-choice${d.plan.planId === p.id ? ' on' : ''}`}>
                  <input type="radio" name="planId" value={p.id} checked={d.plan.planId === p.id} onChange={() => set('plan', { planId: p.id, years: 1 })} />
                  <span className="pc-name">{p.name}</span>
                  <span className="pc-price">{formatUSD(p.priceCents)} <small>{p.unit}</small></span>
                  <span className="pc-sum">{p.summary}</span>
                </label>
              ))}
            </div>
            {err('plan.planId') && <p className="field-error">{err('plan.planId')}</p>}
          </fieldset>

          {d.plan.memberClass === 'natural' && single && family && plan?.id === single.id && family.priceCents < single.priceCents * 2 && (
            <div className="jf-tip" role="note">
              <b>Married?</b> The {family.name} plan covers you and your spouse for {formatUSD(family.priceCents)} instead of {formatUSD(single.priceCents * 2)}, and each of you gets your own vote.
              <button type="button" className="linkish" onClick={() => set('plan', { planId: family.id, years: 1 })}>Switch to {family.name}</button>
            </div>
          )}
          {plan && plan.term === 'calendar_year' && plan.maxYearsAhead > 1 && (
            <Field id="f-plan-years" label="How many years?" hint={plan.multiYearDiscountPct ? `Save ${plan.multiYearDiscountPct}% when you pay 2 or more years.` : undefined} error={err('plan.years')}>
              <select id="f-plan-years" className="input narrow-input" value={d.plan.years} onChange={(e) => set('plan', { years: Number(e.target.value) })}>
                {Array.from({ length: plan.maxYearsAhead }, (_, i) => i + 1).map((y) => <option key={y} value={y}>{y} year{y > 1 ? 's' : ''} ({settings.year}{y > 1 ? `–${settings.year + y - 1}` : ''}, through {fmtDay(termFor(plan, { start: `${settings.year}-01-01`, years: y, saleYear: settings.year }).through ?? '')})</option>)}
              </select>
            </Field>
          )}

          {plan?.category === 'household' && (
            <fieldset className="jf-fieldset">
              <legend>Your spouse</legend>
              <p className="hint">We&apos;ll email your spouse an invitation to confirm their own details. Each of you has your own vote.</p>
              <div className="grid-2">
                {(['firstName', 'lastName'] as const).map((k) => (
                  <Field key={k} id={`f-plan-spouse-${k}`} label={k === 'firstName' ? "Spouse's first name" : "Spouse's last name"} error={err(`plan.spouse.${k}`)}>
                    <input id={`f-plan-spouse-${k}`} className="input" value={d.plan.spouse[k]} onChange={(e) => set('plan', { spouse: { ...d.plan.spouse, [k]: e.target.value } })}
                      aria-invalid={!!err(`plan.spouse.${k}`) || undefined} aria-describedby={describedBy(`f-plan-spouse-${k}`, false, err(`plan.spouse.${k}`))} />
                  </Field>
                ))}
              </div>
              <Field id="f-plan-spouse-email" label="Spouse's email" error={err('plan.spouse.email')}>
                <input id="f-plan-spouse-email" className="input" type="email" value={d.plan.spouse.email} onChange={(e) => set('plan', { spouse: { ...d.plan.spouse, email: e.target.value } })}
                  aria-invalid={!!err('plan.spouse.email') || undefined} aria-describedby={describedBy('f-plan-spouse-email', false, err('plan.spouse.email'))} />
              </Field>
            </fieldset>
          )}

          <CustomSections sections={sectionsAt(liveForm, 'plan')} answers={d.custom} ctx={ctx} errors={errors} onChange={setCustom} filled={d.filled} />
          {price && <PriceBox total={price.totalCents} gross={price.grossCents} discount={price.discountCents} years={price.years} />}
          <StepNav onBack={() => goTo(prevOf('plan'))} busy={busy} onSave={liveForm.helpers.saveForLater ? saveForLater : undefined} />
        </form>
      )}

      {/* ---------- 4. Pledge ---------- */}
      {d.step === 'pledge' && (
        <form className="jf-step" aria-labelledby="st-h" onSubmit={nextFromPledge} noValidate>
          <h2 id="st-h" tabIndex={-1} ref={headingRef}>Commitment and pledge</h2>
          {memberClass(settings.rules, d.plan.memberClass).canVote && (   /* only the class that votes chooses a commitment (the organization's rule) */
            <fieldset className="jf-fieldset">
              <legend>Your commitment to the community</legend>
              <p className="hint">Choose at least one to be eligible to vote.</p>
              {settings.commitments.map((c) => (
                <label key={c.id} className="check">
                  <input type="checkbox" checked={d.pledge.commitments.includes(c.id)}
                    onChange={(e) => set('pledge', { commitments: e.target.checked ? [...d.pledge.commitments, c.id] : d.pledge.commitments.filter((x) => x !== c.id) })} />
                  <span>{c.label}{c.help && <small className="block-hint">{c.help}</small>}</span>
                </label>
              ))}
            </fieldset>
          )}
          <fieldset className="jf-fieldset" id="f-pledge-pledgeAccepted">
            <legend>Pledge</legend>
            <blockquote className="pledge-text">{settings.pledge.text}</blockquote>
            <label className="check"><input type="checkbox" checked={d.pledge.pledgeAccepted} onChange={(e) => set('pledge', { pledgeAccepted: e.target.checked })} /> <span>I accept this pledge.</span></label>
            {err('pledge.pledgeAccepted') && <p className="field-error">{err('pledge.pledgeAccepted')}</p>}
          </fieldset>
          <Field id="f-pledge-signature" label="Sign with your full name" hint={`Type: ${d.about.firstName} ${d.about.lastName}`} error={err('pledge.signature')}>
            <input id="f-pledge-signature" className="input signature" autoComplete="name" value={d.pledge.signature} onChange={(e) => set('pledge', { signature: e.target.value })}
              aria-invalid={!!err('pledge.signature') || undefined} aria-describedby={describedBy('f-pledge-signature', true, err('pledge.signature'))} />
          </Field>
          <fieldset className="jf-fieldset">
            <legend>Messages from ISGH</legend>
            <label className="check"><input type="checkbox" checked={d.pledge.emailConsent} onChange={(e) => set('pledge', { emailConsent: e.target.checked })} /> <span>{settings.consents.email.text}</span></label>
            {settings.flags.sms && <label className="check"><input type="checkbox" checked={d.pledge.smsConsent} onChange={(e) => set('pledge', { smsConsent: e.target.checked })} /> <span>{settings.consents.sms.text}{(settings.legal.termsUrl || settings.legal.privacyUrl) && <> See our {settings.legal.termsUrl && <a href={settings.legal.termsUrl} target="_blank" rel="noreferrer">Terms</a>}{settings.legal.termsUrl && settings.legal.privacyUrl ? ' and ' : ''}{settings.legal.privacyUrl && <a href={settings.legal.privacyUrl} target="_blank" rel="noreferrer">Privacy Policy</a>}.</>}</span></label>}
            <p className="hint">We always email receipts and notices about your membership.</p>
          </fieldset>
          {settings.identity.policy.enabled && (
            <fieldset className="jf-fieldset" id="f-pledge-identityConsent">
              <legend>Identity check</legend>
              <p className="hint">Read the <a href={settings.identity.policy.url || '/membership/identity-policy'} target="_blank" rel="noreferrer">{settings.identity.policy.title}</a> – what we collect, why, and how it is kept.</p>
              {settings.identity.consentRequired && <label className="check"><input type="checkbox" checked={!!d.pledge.identityConsent} onChange={(e) => set('pledge', { identityConsent: e.target.checked })} aria-invalid={!!err('pledge.identityConsent') || undefined} /> <span>{settings.identity.consentText}</span></label>}
              {err('pledge.identityConsent') && <p className="field-error">{err('pledge.identityConsent')}</p>}
            </fieldset>
          )}
          <CustomSections sections={sectionsAt(liveForm, 'pledge')} answers={d.custom} ctx={ctx} errors={errors} onChange={setCustom} filled={d.filled} />
          <StepNav onBack={() => goTo(prevOf('pledge'))} busy={busy} onSave={liveForm.helpers.saveForLater ? saveForLater : undefined} />
        </form>
      )}

      {/* ---------- admin steps (form builder) ---------- */}
      {currentSection && (
        <form className="jf-step" aria-labelledby="st-h" onSubmit={nextFromSection} noValidate>
          <h2 id="st-h" tabIndex={-1} ref={headingRef}>{currentSection.title}</h2>
          <CustomSections sections={[currentSection]} answers={d.custom} ctx={ctx} errors={errors} onChange={setCustom} filled={d.filled} asStep />
          <StepNav onBack={() => goTo(prevOf(d.step))} busy={busy} onSave={liveForm.helpers.saveForLater ? saveForLater : undefined} />
        </form>
      )}

      {/* ---------- 5. Review & pay ---------- */}
      {d.step === 'review' && plan && price && (
        <form className="jf-step" aria-labelledby="st-h" onSubmit={submit} noValidate>
          <h2 id="st-h" tabIndex={-1} ref={headingRef}>{d.mode === 'renew' ? 'Review and renew' : 'Review and pay'}</h2>
          <div className="review-grid">
            <ReviewBlock title="Account" onEdit={() => goTo('account')} rows={[[d.account.email + (d.account.provider === 'google' ? ' (verified with Google)' : ' (verified)')]]} />
            <ReviewBlock title="About you" onEdit={() => goTo('about')} rows={[
              [`${d.about.firstName} ${d.about.middleName ? d.about.middleName + ' ' : ''}${d.about.lastName}`],
              [`Born ${new Date(d.about.dob + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`],
              [d.about.phone],
              [`${d.about.street}${d.about.unit ? ', ' + d.about.unit : ''}, ${d.about.city}, ${d.about.state} ${d.about.zip}`],
              [d.lookup?.center ? `${d.lookup.center.name} (${d.lookup.zone?.name} zone)${d.about.borderRequestCenterId ? ' – border change requested' : ''}` : 'Outside the service area'],
            ]} />
            <ReviewBlock title="Plan" onEdit={() => goTo('plan')} rows={[
              [`${plan.name} – ${formatUSD(plan.priceCents)} ${plan.unit}${price.years > 1 ? `, ${price.years} years` : ''}`],
              ...(plan.category === 'household' ? [[`Spouse: ${d.plan.spouse.firstName} ${d.plan.spouse.lastName} (${d.plan.spouse.email})`]] : []),
            ]} />
            {liveForm.sections.filter((sec) => !sec.hidden).map((sec) => {
              const rows = sec.fields.filter((f) => f.type !== 'info' && fieldShown(f, d.custom, ctx)).map((f) => [f.label, answerText(f, d.custom[f.id])] as const).filter(([, v]) => v);
              if (!rows.length) return null;
              const target = sec.placement.startsWith('step-') ? `s:${sec.id}` : sec.placement;
              return <ReviewBlock key={sec.id} title={sec.title} onEdit={() => goTo(target)} rows={rows.map(([l, v]) => [`${l}: ${v}`])} />;
            })}
            <ReviewBlock title="Pledge" onEdit={() => goTo('pledge')} rows={[
              [`Signed by ${d.pledge.signature}`],
              [d.pledge.commitments.length ? `Commitments: ${settings.commitments.filter((c) => d.pledge.commitments.includes(c.id)).map((c) => c.label).join('; ')}` : 'No commitment chosen'],
            ]} />
          </div>

          <div className={`callout eligibility`} data-tone={preview.eligible ? 'success' : 'warning'}>
            <b>{preview.eligible ? `You are on track to vote in ${settings.year}` : `Voting in ${settings.year}: not yet`}</b>
            {preview.eligible
              ? <p>After the Board approves your application and your dues are paid by June 30, you can vote. We will confirm by email.</p>
              : <ul>{preview.reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
          </div>

          <fieldset className="jf-fieldset" id="f-payment-payer">
            <legend>Who is paying?</legend>
            <div className="choice-row">
              {([['self', 'I am paying my own dues'], ['relative', 'A relative is paying for me']] as const).map(([v, l]) => (
                <label key={v} className={`choice${d.payment.payer === v ? ' on' : ''}`}>
                  <input type="radio" name="payer" checked={d.payment.payer === v} onChange={() => set('payment', { payer: v })} /> <span><b>{l}</b></span>
                </label>
              ))}
            </div>
            {d.payment.payer === 'relative' && (
              <div className="grid-2">
                <Field id="f-payment-payerName" label="Payer's full name" error={err('payment.payerName')}>
                  <input id="f-payment-payerName" className="input" value={d.payment.payerName} onChange={(e) => set('payment', { payerName: e.target.value })}
                    aria-invalid={!!err('payment.payerName') || undefined} aria-describedby={describedBy('f-payment-payerName', false, err('payment.payerName'))} />
                </Field>
                <Field id="f-payment-payerRelationship" label="How are they related to you?" hint="ISGH Bylaws allow dues to be paid only by a relative by blood or marriage." error={err('payment.payerRelationship')}>
                  <select id="f-payment-payerRelationship" className="input" value={d.payment.payerRelationship} onChange={(e) => set('payment', { payerRelationship: e.target.value })}
                    aria-invalid={!!err('payment.payerRelationship') || undefined} aria-describedby={describedBy('f-payment-payerRelationship', true, err('payment.payerRelationship'))}>
                    <option value="">Choose one</option>
                    {settings.payerRelationships.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
              </div>
            )}
          </fieldset>

          <PriceBox total={price.totalCents} gross={price.grossCents} discount={price.discountCents} years={price.years} />
          {config && (
            <PayOptions cfg={config} methods={methods} method={payMethod} onMethod={setPayMethod} cover={coverFees} onCover={setCoverFees} feeCents={feeCover(config, afterCode, payMethod === 'ach' ? 'ach' : 'card')}
              code={code} onCode={(c) => { setCode(c); setApplied(null); }} applied={applied}
              onApply={() => { const r = applyDiscount(config, code, price.totalCents, { kind: 'plan', planId: plan?.id }, new Date().toISOString().slice(0, 10)); if (r.ok) { setApplied({ code: code.trim().toUpperCase(), cents: r.cents, message: r.message }); setErrors((x) => { const n = { ...x }; delete n['payment.code']; return n; }); } else { setApplied(null); setErrors((x) => ({ ...x, 'payment.code': r.message })); } }}
              codeError={err('payment.code')} total={finalCents} />
          )}
          <p className="hint">{config?.payments.refundPolicy || 'Dues are not refundable.'} Card payments are processed securely by Stripe; ISGH never sees your card number.</p>
          {mockMode && <p className="jf-test">Test mode: no card is charged and no payment page opens.</p>}
          {err('form') && <p className="field-error" id="f-form">{err('form')}</p>}
          <div className="step-nav">
            <button type="button" className="btn btn-outline" onClick={() => goTo(prevOf('review'))}>Back</button>
            <button type="submit" className="btn btn-primary" disabled={busy} data-busy={task === 'submit' || undefined}>{task === 'submit' ? 'Submitting…' : finalCents === 0 ? 'Submit – nothing to pay' : offline ? `Submit – I will pay ${formatUSD(finalCents)} ${payMethod === 'check' ? 'by check' : payMethod === 'cash' ? 'in cash' : 'later'}` : `Pay ${formatUSD(finalCents)} and submit`}</button>
          </div>
        </form>
      )}

      {saved && (
        <div className="callout jf-saved" data-tone="info" role="status">
          <b>Saved. Finish on any device with this link</b>
          <p>{mockMode ? 'Test mode: in the live site we email this link to ' + (d.account.email || 'you') + (d.about.phone ? ' and text it to ' + d.about.phone : '') + '. It works for 30 days.' : 'We emailed and texted you this link. It works for 30 days.'}</p>
          <div className="input-group"><input className="input" readOnly value={saved} aria-label="Link to continue your application" onFocus={(e) => e.target.select()} />
            <button type="button" className="btn btn-outline" onClick={() => { void navigator.clipboard?.writeText(saved); setNotice('Link copied.'); }}>Copy link</button></div>
          <button type="button" className="linkish" onClick={() => setSaved(null)}>Keep going now</button>
        </div>
      )}

      {/* ---------- 6. Done ---------- */}
      {d.step === 'done' && result && (
        <section className="jf-step done" aria-labelledby="st-h">
          <h2 id="st-h" tabIndex={-1} ref={headingRef}>Application received</h2>
          <p className="jf-lead">Thank you, {d.about.preferredName || d.about.firstName}. Your application number is <b>{result.applicationId}</b>. We sent a receipt for {formatUSD(result.amountCents)} to {d.account.email}.</p>
          <ol className="timeline">
            <li className="done"><b>Application submitted</b><span>Today</span></li>
            {result.method === 'check' || result.method === 'cash' || result.method === 'payLater'
              ? <li className="current"><b>{result.method === 'check' ? 'Check – waiting to clear' : result.method === 'cash' ? 'Cash – pay at your center' : 'Invoice sent – pay later'}</b><span>{formatUSD(result.amountCents)}</span></li>
              : <li className="done"><b>Payment received</b><span>{formatUSD(result.amountCents)}</span></li>}
            <li className="current"><b>Board review</b><span>Usually 2–5 business days</span></li>
            {settings.flags.idUpload && (d.idCaptured
              ? <li className="done"><b>Photo ID received</b><span>Staff check it with your application</span></li>
              : <li><b>ID check</b><span>Upload a Texas ID or driver license from your member home</span></li>)}
            <li><b>Membership active</b><span>Your digital card appears in your member home</span></li>
          </ol>
          {plan?.category === 'household' && <p className="callout" data-tone="info"><b>Invitation sent</b> We emailed {d.plan.spouse.firstName} at {d.plan.spouse.email} to confirm their details.</p>}
          <div className="row-actions"><Link className="btn btn-primary" href="/portal">Go to my member home</Link><Link className="btn btn-outline" href="/">Back to the home page</Link></div>
        </section>
      )}
    </div>
    {d.step !== 'done' && (
      <LiveSummary settings={settings} draft={d} pastPlan={stepIndex > STEPS.findIndex((s) => s.id === 'plan')} planName={plan?.name} totalCents={price?.totalCents} unit={plan?.unit} years={price?.years ?? 1}
        centerName={d.lookup?.center?.name} zoneName={d.lookup?.zone?.name} inArea={d.lookup ? d.lookup.inServiceArea : null} />
    )}
    </div>
  );
}

/* ---------------- live summary (right column) ---------------- */
function LiveSummary({ settings, draft: d, pastPlan, planName, totalCents, unit, years, centerName, zoneName, inArea }: {
  settings: MembershipSettings; draft: Draft; pastPlan: boolean; planName?: string; totalCents?: number; unit?: string; years: number;
  centerName?: string; zoneName?: string; inArea: boolean | null;
}) {
  const age = d.about.dob ? ageOnRecord(d.about.dob, settings.recordDate) : null;
  const checks: [string, boolean | null][] = [
    ['Email verified', d.account.verified ? true : null],
    [`${settings.minVotingAge} or older by June 30`, age === null ? null : age >= settings.minVotingAge],
    [`Lives in ${settings.serviceArea.label}`, inArea],
    // the organization's own rule: which class votes (ISGH: the paid associate members vote, natural members do not)
    [`${memberClass(settings.rules, d.plan.memberClass).label} – a voting class`, memberClass(settings.rules, d.plan.memberClass).canVote],
    ['Commitment chosen', d.pledge.commitments.length > 0 ? true : null],
    ['Pledge signed', d.pledge.pledgeAccepted && d.pledge.signature.trim().length > 2 ? true : null],
    [`${settings.year} dues paid by June 30`, null],
  ];
  const done = [d.account.verified, !!d.about.centerId, !!planName && pastPlan, d.pledge.pledgeAccepted].filter(Boolean).length;
  const pct = Math.round((done / 5) * 100);
  return (
    <aside className="jf-summary" aria-label="Your membership so far">
      <div className="sum-progress"><span>Your membership</span><b>{pct}%</b></div>
      <div className="bar" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
      {pct === 0 && <p className="sum-help">Your choices appear here as you go.</p>}
      <dl>
        <div><dt>Name</dt><dd>{[d.about.preferredName || d.about.firstName, d.about.lastName].filter(Boolean).join(' ') || '—'}</dd></div>
        <div><dt>Islamic Center</dt><dd>{centerName ? `${centerName}${zoneName ? `, ${zoneName} zone` : ''}` : inArea === false ? 'Outside service area' : '—'}</dd></div>
        <div><dt>Plan</dt><dd>{planName ? `${planName}${years > 1 ? `, ${years} years` : ''}` : '—'}</dd></div>
        <div className="sum-total"><dt>Total</dt><dd>{totalCents !== undefined ? `${formatUSD(totalCents)}${years > 1 ? '' : unit ? ` ${unit}` : ''}` : '—'}</dd></div>
      </dl>
      <h3>Voting in {settings.year}</h3>
      <ul className="sum-checks">
        {checks.map(([label, ok]) => (
          <li key={label} data-state={ok === null ? 'pending' : ok ? 'ok' : 'no'}>
            <span aria-hidden="true">{ok === null ? '•' : ok ? '✓' : '✕'}</span>{label}
            <span className="sr-only">{ok === null ? ' – not yet' : ok ? ' – done' : ' – not met'}</span>
          </li>
        ))}
      </ul>
      <p className="sum-help">Questions? Call (713) 524-6615 ext. 105.</p>
    </aside>
  );
}
function ageOnRecord(dob: string, record: string) {
  const [by, bm, bd] = dob.split('-').map(Number), [y, m, dd] = record.slice(0, 10).split('-').map(Number);
  let a = y - by; if (m < bm || (m === bm && dd < bd)) a--; return a;
}

/* ---------------- sub components ---------------- */
function prefix(p: string, errs: Record<string, string>) {
  return Object.fromEntries(Object.entries(errs).map(([k, v]) => [`${p}.${k}`, v]));
}
/** field key "about.firstName" → input id "f-about-firstName" (error summary links) */
function fieldId(key: string) { return key === 'form' ? 'f-form' : 'f-' + key.replace(/\./g, '-'); }

function StepNav({ onBack, busy, onSave }: { onBack: () => void; busy: boolean; onSave?: () => void }) {
  return (
    <div className="step-nav">
      <button type="button" className="btn btn-outline" onClick={onBack}>Back</button>
      {onSave && <button type="button" className="linkish jf-save" onClick={onSave}>Save and finish later</button>}
      <button type="submit" className="btn btn-primary" disabled={busy}>Continue</button>
    </div>
  );
}

/** Ways to pay, optional gift to cover card fees, discount code – all switched in Admin › Settings › Configuration. */
function PayOptions({ cfg, methods, method, onMethod, cover, onCover, feeCents, code, onCode, applied, onApply, codeError, total }: {
  cfg: OrgConfig; methods: readonly string[]; method: string; onMethod: (m: string) => void; cover: boolean; onCover: (v: boolean) => void; feeCents: number;
  code: string; onCode: (c: string) => void; applied: { code: string; cents: number; message: string } | null; onApply: () => void; codeError?: string; total: number;
}) {
  return (
    <div className="pay-options">
      {methods.length > 1 && (
        <fieldset className="jf-fieldset" id="f-payment-method"><legend>How would you like to pay?</legend>
          <div className="choice-row compact">{methods.map((m) => (
            <label key={m} className={`choice${method === m ? ' on' : ''}`}><input type="radio" name="pay-method" value={m} checked={method === m} onChange={() => onMethod(m)} /> <span><b>{PAY_LABEL[m as keyof typeof PAY_LABEL]}</b></span></label>
          ))}</div>
          {method === 'check' && <p className="hint">Make the check payable to the organization and bring or mail it to the office. {cfg.payments.checkPendingStatus ? 'Your membership shows “Check – waiting to clear” until we receive it.' : ''}</p>}
        </fieldset>
      )}
      {cfg.discounts.enabled && (
        <div className="field" id="f-payment-code"><label htmlFor="pay-code">Discount code <span className="opt">(optional)</span></label>
          <div className="input-group"><input id="pay-code" className="input" value={code} onChange={(e) => onCode(e.target.value)} autoComplete="off" aria-invalid={!!codeError || undefined} />
            <button type="button" className="btn btn-outline" onClick={onApply} disabled={!code.trim()}>Apply</button></div>
          {applied && <p className="hint" role="status">{applied.message}</p>}
          {codeError && <p className="field-error">{codeError}</p>}
        </div>
      )}
      {cfg.payments.coverFees.enabled && (method === 'card' || method === 'ach') && feeCents > 0 && (
        <label className="check"><input type="checkbox" checked={cover} onChange={(e) => onCover(e.target.checked)} /> <span>Add {formatUSD(feeCents)} to cover card fees, so all of my dues reach the community</span></label>
      )}
      {(applied || (cover && feeCents > 0)) && <p className="pay-total" aria-live="polite">You pay <b>{formatUSD(total)}</b></p>}
    </div>
  );
}

function PriceBox({ total, gross, discount, years }: { total: number; gross: number; discount: number; years: number }) {
  return (
    <div className="price-box" aria-live="polite">
      {discount > 0 && <div><span>{years} years</span><span>{formatUSD(gross)}</span></div>}
      {discount > 0 && <div className="disc"><span>Multi-year savings</span><span>−{formatUSD(discount)}</span></div>}
      <div className="total"><span>Total today</span><span>{formatUSD(total)}</span></div>
    </div>
  );
}

function ReviewBlock({ title, rows, onEdit }: { title: string; rows: string[][]; onEdit: () => void }) {
  return (
    <section className="review-block">
      <div className="rb-head"><h3>{title}</h3><button type="button" className="linkish" onClick={onEdit}>Edit<span className="sr-only"> {title.toLowerCase()}</span></button></div>
      {rows.map((r, i) => <p key={i}>{r.join(' ')}</p>)}
    </section>
  );
}

function CenterResult({ lookup, serviceArea, borderChoice, onBorder }: { lookup: LookupResult; serviceArea: string; borderChoice: string; onBorder: (id: string) => void }) {
  if (!lookup.inServiceArea || !lookup.center) {
    return (
      <div className="callout" data-tone="warning">
        <b>This address is outside {serviceArea}</b>
        <p>You can still join, but only members who live in {serviceArea} can vote in ISGH elections. Check the address if this looks wrong.</p>
      </div>
    );
  }
  return (
    <div className="center-result">
      <svg width="28" height="28" viewBox="0 0 100 100" aria-hidden="true"><g fill="currentColor"><rect x="22" y="22" width="56" height="56" /><rect x="22" y="22" width="56" height="56" transform="rotate(45 50 50)" /></g></svg>
      <div>
        <p className="cr-title">{lookup.center.name}</p>
        <p className="cr-sub">{lookup.zone?.name} zone{lookup.estimate ? ' (estimate from your ZIP – confirmed by ISGH staff)' : ''}</p>
        {lookup.nearBorder && lookup.alternatives.length > 0 && (
          <fieldset className="border-choice">
            <legend>You live near a zone border. Which center do you want?</legend>
            <label className="check"><input type="radio" name="border" checked={!borderChoice} onChange={() => onBorder('')} /> <span>Keep {lookup.center.name}</span></label>
            {lookup.alternatives.map((a) => (
              <label key={a.id} className="check"><input type="radio" name="border" checked={borderChoice === a.id} onChange={() => onBorder(a.id)} />
                <span>Ask to join {a.name} ({a.zoneName} zone, {a.miles} miles away)<small className="block-hint">The Board reviews this request. If approved, it stays for 5 years.</small></span></label>
            ))}
          </fieldset>
        )}
      </div>
    </div>
  );
}
