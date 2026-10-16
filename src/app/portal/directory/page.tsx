import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getOrgConfig } from '@/lib/content/loaders';
import { MemberDirectory } from '@/components/account/MemberDirectory';

export const metadata: Metadata = { title: 'Member directory', robots: { index: false } };

/** Admin › Settings › Configuration › Member directory (off by default). */
export default async function DirectoryPage() {
  const cfg = await getOrgConfig();
  if (!cfg.members.directory.enabled) notFound();
  return <MemberDirectory config={cfg} />;
}
