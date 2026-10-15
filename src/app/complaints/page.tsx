import type { Metadata } from 'next';
import { ComplaintsView } from '@/components/forms/FormViews';

export const metadata: Metadata = { title: 'File a complaint' };

export default function ComplaintsPage() { return <ComplaintsView />; }
