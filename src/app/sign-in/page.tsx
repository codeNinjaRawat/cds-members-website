import type { Metadata } from 'next';
import { SignInView } from '@/components/account/SignInView';

export const metadata: Metadata = { title: 'Sign in', description: 'Sign in to your ISGH membership with Google or a code sent to your email.', robots: { index: false } };

/** W5 sign-in – DEMO (no API). */
export default function SignInPage() {
  return <SignInView />;
}
