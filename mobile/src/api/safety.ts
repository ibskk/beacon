import { supabase } from '@/lib/supabase';

import { fetchDisplayNames } from './profiles';
import type { BlockedUser, NewReport } from './types';

export async function submitReport(report: NewReport): Promise<void> {
  const details = report.details?.trim();
  const { error } = await supabase.from('reports').insert({
    target_type: report.targetType,
    target_id: report.targetId,
    reason: report.reason,
    ...(details ? { details } : {}),
  });
  if (error) throw error;
}

export async function blockUser(blockedId: string): Promise<void> {
  const { error } = await supabase.from('blocks').insert({ blocked_id: blockedId });
  // Already blocked is fine: the outcome the user wants is in place.
  if (error && error.code !== '23505') throw error;
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  const { error } = await supabase.from('blocks').delete().eq('blocker_id', blockerId).eq('blocked_id', blockedId);
  if (error) throw error;
}

export async function fetchBlockedIds(): Promise<string[]> {
  const { data, error } = await supabase.from('blocks').select('blocked_id');
  if (error) throw error;
  return ((data ?? []) as { blocked_id: string }[]).map((r) => r.blocked_id);
}

export async function fetchBlockedUsers(): Promise<BlockedUser[]> {
  const { data, error } = await supabase
    .from('blocks')
    .select('blocked_id, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  const list = (data ?? []) as { blocked_id: string; created_at: string }[];
  const names = await fetchDisplayNames(list.map((b) => b.blocked_id));
  return list.map((b) => ({ ...b, display_name: names.get(b.blocked_id) ?? 'Former player' }));
}
