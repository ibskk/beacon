import type { Sport } from '@/constants/enums';
import type { Coords } from '@/lib/location';
import { supabase } from '@/lib/supabase';

import { fetchDisplayNames } from './profiles';
import { firstRow, rows, rpc } from './rpc';
import type { Group, GroupDetail, GroupMessage, GroupRequest, JoinGroupResult, NewGroup } from './types';

export async function fetchNearbyGroups(opts: {
  coords?: Coords | null;
  city?: string;
  sport?: Sport | null;
}): Promise<Group[]> {
  const data = await rpc<Group[]>('nearby_groups', {
    p_lat: opts.coords?.lat ?? null,
    p_lng: opts.coords?.lng ?? null,
    p_city: opts.city ?? 'Toronto',
    p_sport: opts.sport ?? null,
  });
  return rows(data);
}

export async function fetchMyGroups(): Promise<Group[]> {
  return rows(await rpc<Group[]>('my_groups'));
}

export async function fetchGroupDetail(groupId: string): Promise<GroupDetail | null> {
  const data = await rpc<GroupDetail | GroupDetail[]>('group_detail', { p_group_id: groupId });
  const row = firstRow(data);
  if (!row) return null;
  return { ...row, members: Array.isArray(row.members) ? row.members : [] };
}

export function createGroup(group: NewGroup): Promise<string> {
  return rpc<string>('create_group', {
    p_name: group.name.trim(),
    p_sport: group.sport,
    p_format: group.format,
    p_city: group.city,
    p_lat: group.format === 'in_person' ? group.lat : null,
    p_lng: group.format === 'in_person' ? group.lng : null,
    p_radius_km: group.radiusKm,
    p_min_age: group.minAge,
    p_visibility: group.visibility,
    p_gender_rule: group.genderRule,
    p_tags: group.tags,
  });
}

export function joinGroup(groupId: string): Promise<JoinGroupResult> {
  return rpc<JoinGroupResult>('join_group', { p_group_id: groupId });
}

export function joinGroupByCode(code: string): Promise<string> {
  return rpc<string>('join_group_by_code', { p_code: code });
}

export function leaveGroup(groupId: string): Promise<void> {
  return rpc<void>('leave_group', { p_group_id: groupId });
}

export function approveRequest(groupId: string, userId: string): Promise<void> {
  return rpc<void>('approve_request', { p_group_id: groupId, p_user_id: userId });
}

export function declineRequest(groupId: string, userId: string): Promise<void> {
  return rpc<void>('decline_request', { p_group_id: groupId, p_user_id: userId });
}

export function removeMember(groupId: string, userId: string): Promise<void> {
  return rpc<void>('remove_member', { p_group_id: groupId, p_user_id: userId });
}

export async function fetchGroupRequests(groupId: string): Promise<GroupRequest[]> {
  const { data, error } = await supabase
    .from('group_requests')
    .select('user_id, created_at')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  const list = (data ?? []) as { user_id: string; created_at: string }[];
  const names = await fetchDisplayNames(list.map((r) => r.user_id));
  return list.map((r) => ({ ...r, display_name: names.get(r.user_id) ?? 'Player' }));
}

const MESSAGE_COLUMNS = 'id, group_id, sender_id, sender_name, body, created_at';
export const MESSAGE_PAGE_SIZE = 50;

/** Newest first, matching the inverted chat list. */
export async function fetchMessages(groupId: string, beforeId?: number): Promise<GroupMessage[]> {
  let query = supabase
    .from('group_messages')
    .select(MESSAGE_COLUMNS)
    .eq('group_id', groupId)
    .order('id', { ascending: false })
    .limit(MESSAGE_PAGE_SIZE);
  if (beforeId != null) query = query.lt('id', beforeId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as GroupMessage[];
}

export async function sendMessage(groupId: string, body: string): Promise<GroupMessage> {
  const { data, error } = await supabase
    .from('group_messages')
    .insert({ group_id: groupId, body })
    .select(MESSAGE_COLUMNS)
    .single();
  if (error) throw error;
  return data as GroupMessage;
}
