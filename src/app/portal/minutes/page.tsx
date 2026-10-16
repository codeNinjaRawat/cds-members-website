import type { Metadata } from 'next';
import { MeetingMinutes } from '@/components/account/MeetingMinutes';
import { memberMinutes, mockMeetings } from '@/lib/community/minutes';

export const metadata: Metadata = { title: 'Meeting minutes', robots: { index: false } };

/** Member portal › Meeting minutes (F6). DEMO: sample meetings; live: GET /member/minutes (published, for members). */
export default function MinutesPage() {
  return <MeetingMinutes items={memberMinutes(mockMeetings)} />;
}
