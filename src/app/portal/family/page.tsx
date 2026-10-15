import type { Metadata } from 'next';
import { MyFamily } from '@/components/family/MyFamily';

export const metadata: Metadata = { title: 'Family tree', robots: { index: false } };

/** Member portal › family tree – DEMO (browser only; live: GET/PUT /member/family). */
export default function FamilyPage() {
  return <MyFamily />;
}
