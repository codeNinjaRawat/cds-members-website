import type { Metadata } from 'next';
import { EmailPreferences } from '@/components/account/EmailPreferences';
import { CommunicationSchema, mockCommunication } from '@/lib/community/communication';
import { loadPublic } from '@/lib/api/load-public';

export const metadata: Metadata = { title: 'Email and text choices', robots: { index: false } };

/** The "change what you get" link in every bulk email (Link.Unsubscribe). The text-message consent wording is the
 *  organization's own (Admin › Communication). */
export default async function EmailPreferencesPage() {
  const c = await loadPublic('/communication', CommunicationSchema, mockCommunication, ['doc:communication'], 'communication');
  return <EmailPreferences smsConsentText={c.sms.consentText} />;
}
