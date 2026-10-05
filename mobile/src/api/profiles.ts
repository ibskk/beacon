import { supabase } from '@/lib/supabase';

import { rpc } from './rpc';
import type { Profile } from './types';

export async function fetchMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, birth_date, gender, city, is_reviewer')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

export async function updateDisplayName(userId: string, displayName: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ display_name: displayName.trim() }).eq('id', userId);
  if (error) throw error;
}

export async function fetchDisplayNames(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids)];
  const names = new Map<string, string>();
  if (unique.length === 0) return names;
  const { data, error } = await supabase.from('public_profiles').select('id, display_name').in('id', unique);
  if (error) throw error;
  for (const row of (data ?? []) as { id: string; display_name: string }[]) {
    names.set(row.id, row.display_name);
  }
  return names;
}

export function deleteMyAccount(): Promise<void> {
  return rpc<void>('delete_my_account');
}
