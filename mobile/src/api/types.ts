import type {
  GameVisibility,
  GenderRule,
  GroupFormat,
  GroupVisibility,
  Level,
  MemberRole,
  ReportReason,
  ReportTarget,
  Sport,
  Tag,
} from '@/constants/enums';

export type Game = {
  id: string;
  sport: Sport;
  tags: Tag[];
  level: Level;
  venue_name: string;
  city: string;
  lat: number;
  lng: number;
  starts_at: string;
  duration_min: number;
  spots_total: number;
  spots_taken: number;
  gender_rule: GenderRule;
  host_id: string;
  host_name: string;
  distance_km: number | null;
  is_joined: boolean;
  is_host: boolean;
};

export type RosterEntry = {
  user_id: string;
  display_name: string;
  checked_in: boolean;
};

export type GameDetail = Game & {
  join_code: string | null;
  status: string;
  checked_in: boolean;
  roster: RosterEntry[];
};

export type Group = {
  id: string;
  name: string;
  sport: Sport;
  tags: Tag[];
  city: string;
  lat: number | null;
  lng: number | null;
  radius_km: number;
  format: GroupFormat;
  min_age: number;
  visibility: GroupVisibility;
  gender_rule: GenderRule;
  member_count: number;
  games_this_week: number;
  distance_km: number | null;
  is_member: boolean;
  my_role: MemberRole | null;
  has_requested: boolean;
};

export type GroupMember = {
  user_id: string;
  display_name: string;
  role: MemberRole;
};

export type GroupDetail = Group & {
  join_code: string | null;
  members: GroupMember[];
};

export type GroupMessage = {
  id: number;
  group_id: string;
  sender_id: string;
  sender_name: string;
  body: string;
  created_at: string;
};

export type GroupRequest = {
  user_id: string;
  created_at: string;
  display_name: string;
};

export type BlockedUser = {
  blocked_id: string;
  display_name: string;
  created_at: string;
};

export type Profile = {
  id: string;
  display_name: string;
  birth_date: string;
  gender: string | null;
  city: string | null;
  is_reviewer: boolean;
};

export type NewGame = {
  sport: Sport;
  venueName: string;
  lat: number;
  lng: number;
  startsAt: Date;
  durationMin: number;
  spotsTotal: number;
  level: Level;
  tags: Tag[];
  genderRule: GenderRule;
  visibility: GameVisibility;
  city: string;
};

export type NewGroup = {
  name: string;
  sport: Sport;
  format: GroupFormat;
  city: string;
  lat: number | null;
  lng: number | null;
  radiusKm: number;
  minAge: number;
  visibility: GroupVisibility;
  genderRule: GenderRule;
  tags: Tag[];
};

export type NewReport = {
  targetType: ReportTarget;
  targetId: string;
  reason: ReportReason;
  details?: string;
};

export type JoinGroupResult = 'joined' | 'requested';
