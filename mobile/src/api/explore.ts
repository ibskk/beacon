import type { Sport } from '@/constants/enums';
import type { Coords } from '@/lib/location';

import { fetchNearbyGames } from './games';
import { fetchNearbyGroups } from './groups';
import type { Game, Group } from './types';

export const NEARBY_RADIUS_KM = 50;

export type ExploreResult = {
  games: Game[];
  groups: Group[];
  /** 'nearby' when results are around the user, 'city' when browsing a city. */
  source: 'nearby' | 'city';
};

/**
 * With a location, search within 50 km; if nothing is there (or no location), browse the
 * chosen city instead, as the contract describes.
 */
export async function fetchExplore(opts: { coords: Coords | null; city: string; sport: Sport | null }): Promise<ExploreResult> {
  if (opts.coords) {
    const [games, groups] = await Promise.all([
      fetchNearbyGames({ coords: opts.coords, radiusKm: NEARBY_RADIUS_KM, sport: opts.sport, city: opts.city }),
      fetchNearbyGroups({ coords: opts.coords, sport: opts.sport, city: opts.city }),
    ]);
    if (games.length > 0) return { games, groups, source: 'nearby' };
  }
  const [games, groups] = await Promise.all([
    fetchNearbyGames({ city: opts.city, sport: opts.sport }),
    fetchNearbyGroups({ city: opts.city, sport: opts.sport }),
  ]);
  return { games, groups, source: 'city' };
}
