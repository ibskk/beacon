import type { Sport } from '@/constants/enums';
import type { Coords } from '@/lib/location';

import { firstRow, rows, rpc } from './rpc';
import type { Game, GameDetail, NewGame } from './types';

export async function fetchNearbyGames(opts: {
  coords?: Coords | null;
  city?: string;
  radiusKm?: number;
  sport?: Sport | null;
}): Promise<Game[]> {
  const data = await rpc<Game[]>('nearby_games', {
    p_lat: opts.coords?.lat ?? null,
    p_lng: opts.coords?.lng ?? null,
    p_radius_km: opts.radiusKm ?? 25,
    p_city: opts.city ?? 'Toronto',
    p_sport: opts.sport ?? null,
  });
  return rows(data);
}

/** Games the caller hosts or joined, any visibility, ordered by start time. */
export async function fetchMyGames(): Promise<Game[]> {
  return rows(await rpc<Game[]>('my_games'));
}

export async function fetchGameDetail(gameId: string): Promise<GameDetail | null> {
  const data = await rpc<GameDetail | GameDetail[]>('game_detail', { p_game_id: gameId });
  const row = firstRow(data);
  if (!row) return null;
  return { ...row, roster: Array.isArray(row.roster) ? row.roster : [] };
}

export function createGame(game: NewGame): Promise<string> {
  return rpc<string>('create_game', {
    p_sport: game.sport,
    p_venue_name: game.venueName.trim(),
    p_lat: game.lat,
    p_lng: game.lng,
    p_starts_at: game.startsAt.toISOString(),
    p_duration_min: game.durationMin,
    p_spots_total: game.spotsTotal,
    p_level: game.level,
    p_tags: game.tags,
    p_gender_rule: game.genderRule,
    p_visibility: game.visibility,
    p_city: game.city,
  });
}

export function joinGame(gameId: string): Promise<void> {
  return rpc<void>('join_game', { p_game_id: gameId });
}

export function joinGameByCode(code: string): Promise<string> {
  return rpc<string>('join_game_by_code', { p_code: code });
}

export function leaveGame(gameId: string): Promise<void> {
  return rpc<void>('leave_game', { p_game_id: gameId });
}

export function cancelGame(gameId: string): Promise<void> {
  return rpc<void>('cancel_game', { p_game_id: gameId });
}

/** Coords may be null only for the App Review account; the server enforces distance for everyone else. */
export function checkIn(gameId: string, coords: Coords | null): Promise<void> {
  return rpc<void>('check_in', { p_game_id: gameId, p_lat: coords?.lat ?? null, p_lng: coords?.lng ?? null });
}
