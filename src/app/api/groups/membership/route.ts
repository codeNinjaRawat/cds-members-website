/**
 * POST /api/groups/membership – a member joins, asks to join or leaves a group from their profile.
 * The server decides with memberAction(): only groups shown on profiles, never automatic groups, and only what the
 * group's join policy allows. Demo: answers only (BE: POST /member/groups/{id} with the session's member).
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getGroups } from '@/lib/content/loaders';
import { memberAction } from '@/lib/community/groups';

const Body = z.object({
  groupId: z.string().max(40), action: z.enum(['join', 'request', 'leave']),
  member: z.object({ groupIds: z.array(z.string().max(40)).max(100), requested: z.array(z.string().max(40)).max(100).default([]) }), // demo session; BE: from the session cookie
});
const no = (message: string, status = 422) => NextResponse.json({ message }, { status });

export async function POST(req: Request) {
  let json: unknown; try { json = await req.json(); } catch { return no('Invalid request.', 400); }
  const p = Body.safeParse(json); if (!p.success) return no('Please check the request.');
  const doc = await getGroups();
  const g = doc.enabled ? doc.groups.find((x) => x.id === p.data.groupId) : undefined;
  if (!g || g.archived || !g.showInProfile) return no('Group not found.', 404);
  const allowed = memberAction(g, p.data.member.groupIds.includes(g.id), p.data.member.requested.includes(g.id));
  if (allowed !== p.data.action) return no(g.kind === 'automatic' ? 'This group updates itself – you cannot join or leave it.' : allowed === null ? 'Only the group’s admins can change this.' : `You can ${allowed} this group, not ${p.data.action}.`, 409);
  const status = p.data.action === 'join' ? 'joined' : p.data.action === 'leave' ? 'left' : 'requested';
  return NextResponse.json({ status, message: status === 'requested' ? `Your request was sent${g.leaders.length ? ' to the group leader' : ''}.` : status === 'joined' ? `You joined ${g.name}.` : `You left ${g.name}.` });
}
