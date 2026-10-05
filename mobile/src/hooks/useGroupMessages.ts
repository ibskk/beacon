import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { fetchMessages, MESSAGE_PAGE_SIZE, sendMessage } from '@/api/groups';
import { fetchBlockedIds } from '@/api/safety';
import type { GroupMessage } from '@/api/types';
import { errorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

/** Merge newest-first lists, dropping duplicates by id. */
function merge(current: GroupMessage[], incoming: GroupMessage[]): GroupMessage[] {
  const byId = new Map<number, GroupMessage>();
  for (const m of [...incoming, ...current]) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) => b.id - a.id);
}

// Messages this user reported stay hidden for the rest of the app session, even after a reload,
// while moderators review them (the server hides a message for everyone after 3 reports).
const reportedMessageIds = new Set<number>();

export function useGroupMessages(groupId: string, enabled: boolean) {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const blocked = useRef<Set<string>>(new Set());

  const visible = useCallback(
    (list: GroupMessage[]) =>
      list.filter((m) => !blocked.current.has(m.sender_id) && !reportedMessageIds.has(m.id)),
    [],
  );

  const loadLatest = useCallback(async () => {
    try {
      const [latest, blockedIds] = await Promise.all([fetchMessages(groupId), fetchBlockedIds()]);
      blocked.current = new Set(blockedIds);
      setMessages((cur) => visible(merge(cur, latest)));
      setHasMore(latest.length === MESSAGE_PAGE_SIZE);
      setLoadError(null);
    } catch (e) {
      setLoadError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [groupId, visible]);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    loadLatest();

    const channel = supabase
      .channel(`group-messages:${groupId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${groupId}` },
        (payload) => {
          const message = payload.new as GroupMessage;
          if (blocked.current.has(message.sender_id)) return;
          setMessages((cur) => merge(cur, [message]));
        },
      )
      .subscribe();

    // Catch up on anything missed while the app was in the background.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') loadLatest();
    });

    return () => {
      sub.remove();
      supabase.removeChannel(channel);
    };
  }, [enabled, groupId, loadLatest]);

  const loadOlder = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    try {
      const oldest = messages[messages.length - 1].id;
      const older = await fetchMessages(groupId, oldest);
      setMessages((cur) => visible(merge(cur, older)));
      setHasMore(older.length === MESSAGE_PAGE_SIZE);
    } catch {
      // Older history is optional; the user can scroll again to retry.
    } finally {
      setLoadingMore(false);
    }
  }, [groupId, hasMore, loadingMore, messages, visible]);

  /** Throws the server's message (content filter, rate limit, mute) for inline display. */
  const send = useCallback(
    async (body: string) => {
      const message = await sendMessage(groupId, body);
      setMessages((cur) => merge(cur, [message]));
    },
    [groupId],
  );

  const hideSender = useCallback((senderId: string) => {
    blocked.current.add(senderId);
    setMessages((cur) => cur.filter((m) => m.sender_id !== senderId));
  }, []);

  const removeMessage = useCallback((id: number) => {
    reportedMessageIds.add(id);
    setMessages((cur) => cur.filter((m) => m.id !== id));
  }, []);

  return { messages, loading, loadError, loadingMore, loadOlder, reload: loadLatest, send, hideSender, removeMessage };
}
