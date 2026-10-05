import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

/** Calls `onFocus` when the screen regains focus, skipping the first mount. */
export function useFocusRefresh(onFocus: () => void) {
  const latest = useRef(onFocus);
  useEffect(() => {
    latest.current = onFocus;
  }, [onFocus]);

  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      latest.current();
    }, []),
  );
}
