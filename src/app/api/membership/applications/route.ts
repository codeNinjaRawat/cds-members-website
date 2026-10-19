/**
 * POST /api/membership/applications – submit a membership application.
 * Server re-validates EVERYTHING with the same admin-driven rules and recomputes the price (never trusts the client).
 * Real: BE POST /public/membership/applications → { applicationId, checkoutUrl } → browser goes to Stripe Checkout.
 * Mock: returns a test application id and a simulated paid status.
 */
import { NextResponse } from 'next/server';
import { apiCall, apiConfig } from '@/lib/api/client';
import { getJoinForm, getMembershipSettings, getOrgConfig } from '@/lib/content/loaders';
import { payMethods } from '@/lib/community/org-config';
import { checkoutTotal, type PayMethod } from '@/lib/community/payments';
import { quote } from '@/lib/content/membership';
import { ageOn } from '@/lib/content/membership';
import { fieldErrors, makeJoinSchemas, todayISO } from '@/lib/join/schema';
import { cleanAnswers, type Answers } from '@/lib/join/form-def';

export async function POST(req: Request) {
  const [settings, form, config] = await Promise.all([getMembershipSettings(), getJoinForm(), getOrgConfig()]);
  const { application } = makeJoinSchemas(settings);
  const raw = await req.json().catch(() => null);
  const parsed = application.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_application', fields: fieldErrors(parsed.error) }, { status: 422 });

  const plan = settings.plans.find((p) => p.id === parsed.data.plan.planId)!;
  // admin-defined questions: same rules as the browser; answers to questions that were not shown are dropped
  const custom = cleanAnswers(form, (raw && typeof raw === 'object' && 'custom' in raw && raw.custom && typeof raw.custom === 'object' ? raw.custom : {}) as Answers,
    { planId: plan.id, planCategory: plan.category, memberClass: parsed.data.plan.memberClass, age: ageOn(parsed.data.about.dob, todayISO(settings.timezone)) });
  if (Object.keys(custom.errors).length) return NextResponse.json({ error: 'invalid_application', fields: custom.errors }, { status: 422 });
  const price = quote(plan, parsed.data.plan.years);
  // how they pay (Admin › Settings › Configuration): method must be switched on; code and fee cover recomputed here
  const co = (raw && typeof raw === 'object' && 'checkout' in raw && raw.checkout && typeof raw.checkout === 'object' ? raw.checkout : {}) as { method?: unknown; coverFees?: unknown; discountCode?: unknown };
  const method = typeof co.method === 'string' ? co.method : 'card';
  if (!(payMethods(config) as readonly string[]).includes(method)) return NextResponse.json({ error: 'invalid_application', fields: { 'payment.method': 'Choose one of the ways to pay shown.' } }, { status: 422 });
  // one shared calculation: dues → code → fee-cover gift (payments.ts); a $0 total needs no payment at all
  const co2 = checkoutTotal(config, { label: `${plan.name} membership`, kind: 'dues', priceCents: price.totalCents, planId: plan.id, method: method as PayMethod, coverFees: co.coverFees === true, code: typeof co.discountCode === 'string' ? co.discountCode : undefined, today: todayISO(settings.timezone) });
  if (!co2.codeOk) return NextResponse.json({ error: 'invalid_application', fields: { 'payment.code': co2.codeMessage } }, { status: 422 });
  const amount = co2.totalCents;
  const offline = method === 'check' || method === 'cash' || method === 'payLater';

  if (apiConfig.useMock) {
    const id = `APP-${settings.year}-${Math.floor(10000 + Math.random() * 89999)}`;
    return NextResponse.json({ applicationId: id, status: 'submitted', amountCents: amount, lines: co2.lines, payment: co2.needsPayment ? { mode: 'test', method, status: offline ? (method === 'check' && config.payments.checkPendingStatus ? 'check_pending' : 'pending') : 'paid' } : { mode: 'test', method: null, status: 'none' } }, { status: 201 });
  }
  try {
    const r = await apiCall('POST', '/public/membership/applications', {
      ...parsed.data, custom: custom.answers, joinFormVersion: form.version, quotedAmountCents: amount, checkout: { method, coverFees: co.coverFees === true, discountCode: co.discountCode },
      joinToken: raw && typeof raw === 'object' && 'joinToken' in raw ? String((raw as { joinToken: unknown }).joinToken) : '',
    });
    if (r.status >= 400) { const b = (r.body ?? {}) as { error?: string; detail?: unknown }; return NextResponse.json({ error: 'invalid_application', message: b.error, fields: b.detail }, { status: r.status }); }
    return NextResponse.json(r.body, { status: 201 });   // the API's own price and payment ids (card → POST /public/checkout)
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}
