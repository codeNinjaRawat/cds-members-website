import type { Metadata } from 'next';
import { MemberHome } from '@/components/account/MemberHome';

export const metadata: Metadata = { title: 'Member home', robots: { index: false } };

/** W5 member home – DEMO (session in this browser tab; live: session cookie + GET /member/me). */
export default function PortalPage() {
  return <MemberHome />;
}
