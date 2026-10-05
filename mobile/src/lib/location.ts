import * as Location from 'expo-location';

export type Coords = { lat: number; lng: number };

export type PermissionState = 'undetermined' | 'granted' | 'denied';

function toState(status: Location.PermissionStatus): PermissionState {
  if (status === Location.PermissionStatus.GRANTED) return 'granted';
  if (status === Location.PermissionStatus.DENIED) return 'denied';
  return 'undetermined';
}

export async function getPermissionState(): Promise<{ state: PermissionState; canAskAgain: boolean }> {
  const res = await Location.getForegroundPermissionsAsync();
  return { state: toState(res.status), canAskAgain: res.canAskAgain };
}

export async function requestPermission(): Promise<{ state: PermissionState; canAskAgain: boolean }> {
  const res = await Location.requestForegroundPermissionsAsync();
  return { state: toState(res.status), canAskAgain: res.canAskAgain };
}

// Devices without a fix (simulators, iPads indoors) can hang on a position request.
// Every caller treats null as "no location", so a timeout keeps screens from loading forever.
const LOCATION_TIMEOUT_MS = 8_000;

function withTimeout<T>(task: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    task.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
    );
  });
}

/**
 * One-shot position read for a query. Nothing is cached or uploaded beyond the
 * request that uses it.
 */
export async function getCurrentCoords(precise = false): Promise<Coords | null> {
  try {
    if (!precise) {
      const last = await withTimeout(
        Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000, requiredAccuracy: 1000 }),
        LOCATION_TIMEOUT_MS,
      );
      if (last) return { lat: last.coords.latitude, lng: last.coords.longitude };
    }
    const pos = await withTimeout(
      Location.getCurrentPositionAsync({
        accuracy: precise ? Location.Accuracy.High : Location.Accuracy.Balanced,
      }),
      LOCATION_TIMEOUT_MS,
    );
    return pos ? { lat: pos.coords.latitude, lng: pos.coords.longitude } : null;
  } catch {
    return null;
  }
}
