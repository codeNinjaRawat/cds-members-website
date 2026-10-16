import type { Metadata } from 'next';
import { EmailPreferences } from '@/components/account/EmailPreferences';
import { mockCommunication } from '@/lib/community/communication';

export const metadata: Metadata = { title: 'Email and text choices', robots: { index: false } };

/** The "change what you get" link in every bulk email (Link.Unsubscribe). */
export default function EmailPreferencesPage() {
  return <EmailPreferences smsConsentText={mockCommunication.sms.consentText} />;
}
