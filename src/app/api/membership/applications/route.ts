/**
 * POST /api/membership/applications – submit a membership application.
 * Server re-validates EVERYTHING with the same admin-driven rules and recomputes the price (never trusts the client).
 * Real: BE POST /public/membership/applications → { applicationId, checkoutUrl } → browser goes to Stripe Checkout.
 * Mock: returns a test application id and a simulated paid status.
 */
import { NextResponse } from 'next/server';
import { apiConfig, apiPost } from '@/lib/api/client';
import { getJoinForm, getMembershipSettings } from '@/lib/content/loaders';
import { quote } from '@/lib/content/membership';
import { ageOn } from '@/lib/content/membership';
import { fieldErrors, makeJoinSchemas, todayISO } from '@/lib/join/schema';
import { cleanAnswers, type Answers } from '@/lib/join/form-def';

export async function POST(req: Request) {
  const [settings, form] = await Promise.all([getMembershipSettings(), getJoinForm()]);
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

  if (apiConfig.useMock) {
    const id = `APP-${settings.year}-${Math.floor(10000 + Math.random() * 89999)}`;
    return NextResponse.json({ applicationId: id, status: 'submitted', amountCents: price.totalCents, payment: { mode: 'test', status: 'paid' } }, { status: 201 });
  }
  try {
    const r = await apiPost<{ applicationId: string; checkoutUrl?: string }>('/public/membership/applications', {
      ...parsed.data, custom: custom.answers, joinFormVersion: form.version, quotedAmountCents: price.totalCents,
    });
    return NextResponse.json({ ...r, amountCents: price.totalCents }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}
