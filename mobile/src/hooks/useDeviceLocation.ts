import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import {
  getCurrentCoords,
  getPermissionState,
  requestPermission,
  type Coords,
  type PermissionState,
} from '@/lib/location';

type DeviceLocation = {
  permission: PermissionState | 'checking';
  canAskAgain: boolean;
  coords: Coords | null;
  locating: boolean;
  request: () => Promise<Coords | null>;
  refresh: () => Promise<Coords | null>;
};

/** Foreground-only location. Coordinates stay in memory and are only sent with a query. */
export function useDeviceLocation(): DeviceLocation {
  const [permission, setPermission] = useState<PermissionState | 'checking'>('checking');
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(false);

  const locate = useCallback(async () => {
    setLocating(true);
    try {
      const next = await getCurrentCoords();
      setCoords(next);
      return next;
    } finally {
      setLocating(false);
    }
  }, []);

  const sync = useCallback(async () => {
    try {
      const res = await getPermissionState();
      setPermission(res.state);
      setCanAskAgain(res.canAskAgain);
      if (res.state === 'granted') return await locate();
    } catch {
      // Treat an unreadable permission state as denied so screens fall back to city browsing.
      setPermission('denied');
    }
    setCoords(null);
    return null;
  }, [locate]);

  useEffect(() => {
    sync();
    // Pick up a permission change made in Settings when the user returns to the app.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => sub.remove();
  }, [sync]);

  const request = useCallback(async () => {
    const res = await requestPermission();
    setPermission(res.state);
    setCanAskAgain(res.canAskAgain);
    return res.state === 'granted' ? locate() : null;
  }, [locate]);

  return { permission, canAskAgain, coords, locating, request, refresh: sync };
}
