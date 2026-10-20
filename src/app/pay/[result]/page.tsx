/** /pay/done, /pay/cancelled and /pay/fake – where the card page sends people back. The payment itself is
 *  confirmed by the provider's webhook, so these pages only explain what happens next. `fake` is the test
 *  page used while no card provider is set up (PAYMENTS_PROVIDER is not "stripe"). */
import Link from 'next/link';
import { notFound } from 'next/navigation';
export const dynamic = 'force-dynamic';

const TEXT: Record<string, { title: string; body: string }> = {
  done: { title: 'Thank you – your payment went through', body: 'Your receipt is on its way by email. It can take a minute for your membership to show as paid.' },
  cancelled: { title: 'Your payment was not finished', body: 'Nothing was charged. Your application is saved – open the link in your email or start again with the same email address to pay.' },
  fake: { title: 'Card payments are not switched on yet', body: 'This is the test payment page – no card was charged. Your application is saved and waits for payment; the office will be in touch.' },
};

export default async function PayResult({ params }: { params: Promise<{ result: string }> }) {
  const t = TEXT[(await params).result];
  if (!t) notFound();
  return (
    <div className="wrap page-head">
      <h1>{t.title}</h1>
      <p>{t.body}</p>
      <p><Link href="/">Go to the home page</Link> · <Link href="/sign-in">Sign in</Link></p>
    </div>
  );
}
