import { supabase } from '@/lib/supabase';

/** Calls an RPC and throws the server's error so callers can show error.message. */
export async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data as T;
}

/** Single-row RPCs may come back as an object or a one-element array. */
export function firstRow<T>(data: T | T[] | null): T | null {
  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
}

export function rows<T>(data: T[] | null): T[] {
  return Array.isArray(data) ? data : [];
}
