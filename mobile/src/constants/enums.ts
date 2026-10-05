// Mirrors the enums in docs/API_CONTRACT.md. Keep values in sync with the backend.

export const SPORTS = ['soccer', 'basketball', 'pickleball'] as const;
export type Sport = (typeof SPORTS)[number];

export const TAGS = [
  'beginner',
  'intermediate',
  'competitive',
  '5v5',
  '7v7',
  '11v11',
  '3v3',
  'doubles',
  'after_work',
  'early_morning',
  'weekend',
  'coed',
  'indoor',
  'outdoor',
] as const;
export type Tag = (typeof TAGS)[number];
export const MAX_TAGS = 3;

export const LEVELS = ['any', 'beginner', 'intermediate', 'advanced'] as const;
export type Level = (typeof LEVELS)[number];

export const GENDER_RULES = ['open', 'women_nb'] as const;
export type GenderRule = (typeof GENDER_RULES)[number];

export const GENDERS = ['woman', 'man', 'non_binary', 'prefer_not'] as const;
export type Gender = (typeof GENDERS)[number];

export const GAME_VISIBILITIES = ['public', 'code'] as const;
export type GameVisibility = (typeof GAME_VISIBILITIES)[number];

export const GROUP_FORMATS = ['in_person', 'remote'] as const;
export type GroupFormat = (typeof GROUP_FORMATS)[number];

export const GROUP_VISIBILITIES = ['public', 'request', 'invite'] as const;
export type GroupVisibility = (typeof GROUP_VISIBILITIES)[number];

export const MIN_AGES = [18, 21, 25, 30, 35, 40] as const;
export type MinAge = (typeof MIN_AGES)[number];

export type MemberRole = 'host' | 'cohost' | 'member';

export const REPORT_TARGETS = ['message', 'user', 'game', 'group'] as const;
export type ReportTarget = (typeof REPORT_TARGETS)[number];

export const REPORT_REASONS = ['spam', 'harassment', 'hate', 'sexual', 'violence', 'scam', 'underage', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const TERMS_VERSION = '2026-10-04';
export const MIN_SIGNUP_AGE = 18;

export const GAME_LIMITS = {
  durationMin: 30,
  durationMax: 240,
  spotsMin: 2,
  spotsMax: 40,
  maxDaysAhead: 30,
} as const;

export const GROUP_LIMITS = {
  radiusMin: 1,
  radiusMax: 25,
} as const;
