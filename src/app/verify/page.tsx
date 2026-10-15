import type { Metadata } from 'next';
import { VerifyView } from '@/components/forms/FormViews';

export const metadata: Metadata = { title: 'Verify a membership' };

export default function VerifyPage() { return <VerifyView />; }
