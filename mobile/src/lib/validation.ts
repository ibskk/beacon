import { GAME_LIMITS, MAX_TAGS } from '@/constants/enums';
import type { NewGame, NewGroup } from '@/api/types';

export type FormErrors<K extends string> = Partial<Record<K, string>>;

export function validateGame(game: Omit<NewGame, 'startsAt'> & { startsAt: Date | null }) {
  const errors: FormErrors<'venueName' | 'startsAt' | 'tags'> = {};
  const venue = game.venueName.trim();
  if (venue.length < 2) errors.venueName = 'Enter the venue name, for example Christie Pits.';
  else if (venue.length > 80) errors.venueName = 'Venue name must be 80 characters or fewer.';

  if (!game.startsAt) {
    errors.startsAt = 'Choose when the game starts.';
  } else {
    const now = Date.now();
    const latest = now + GAME_LIMITS.maxDaysAhead * 24 * 60 * 60_000;
    if (game.startsAt.getTime() <= now) errors.startsAt = 'Start time must be in the future.';
    else if (game.startsAt.getTime() > latest) errors.startsAt = 'Games can be scheduled up to 30 days ahead.';
  }
  if (game.tags.length > MAX_TAGS) errors.tags = `Choose up to ${MAX_TAGS} tags.`;
  return errors;
}

export function validateGroup(group: NewGroup) {
  const errors: FormErrors<'name' | 'tags'> = {};
  const name = group.name.trim();
  if (name.length < 3) errors.name = 'Group name must be at least 3 characters.';
  else if (name.length > 60) errors.name = 'Group name must be 60 characters or fewer.';
  if (group.tags.length > MAX_TAGS) errors.tags = `Choose up to ${MAX_TAGS} tags.`;
  return errors;
}
