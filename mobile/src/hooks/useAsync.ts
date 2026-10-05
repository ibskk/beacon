import { useCallback, useEffect, useRef, useState } from 'react';

import { errorMessage } from '@/lib/errors';

type AsyncState<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
  /** Re-fetch without any spinner, e.g. when a screen regains focus. */
  silent: () => Promise<void>;
  setData: (updater: (prev: T | null) => T | null) => void;
};

/**
 * Runs a loader whenever its dependencies change. `refresh` is for pull-to-refresh
 * (keeps current data visible), `reload` shows the full loading state.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: readonly unknown[], enabled = true): AsyncState<T> {
  const [data, setDataState] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);
  const latest = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(loader, deps);

  const execute = useCallback(
    async (mode: 'load' | 'refresh' | 'silent') => {
      const ticket = ++latest.current;
      if (mode === 'load') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);
      try {
        const result = await run();
        if (ticket !== latest.current) return;
        setDataState(result);
        setError(null);
      } catch (e) {
        if (ticket !== latest.current) return;
        setError(errorMessage(e));
      } finally {
        if (ticket === latest.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [run],
  );

  useEffect(() => {
    if (enabled) execute('load');
  }, [execute, enabled]);

  const reload = useCallback(() => execute('load'), [execute]);
  const refresh = useCallback(() => execute('refresh'), [execute]);
  const silent = useCallback(() => execute('silent'), [execute]);
  const setData = useCallback((updater: (prev: T | null) => T | null) => setDataState(updater), []);

  return { data, error, loading, refreshing, reload, refresh, silent, setData };
}
