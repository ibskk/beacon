import type {
  Gender,
  GenderRule,
  GameVisibility,
  GroupFormat,
  GroupVisibility,
  Level,
  MemberRole,
  ReportReason,
  Sport,
  Tag,
} from './enums';

export const sportLabels: Record<Sport, string> = {
  soccer: 'Soccer',
  basketball: 'Basketball',
  pickleball: 'Pickleball',
};

export const tagLabels: Record<Tag, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  competitive: 'Competitive',
  '5v5': '5v5',
  '7v7': '7v7',
  '11v11': '11v11',
  '3v3': '3v3',
  doubles: 'Doubles',
  after_work: 'After work',
  early_morning: 'Early morning',
  weekend: 'Weekend',
  coed: 'Co-ed',
  indoor: 'Indoor',
  outdoor: 'Outdoor',
};

export const levelLabels: Record<Level, string> = {
  any: 'Any level',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const genderRuleLabels: Record<GenderRule, string> = {
  open: 'Open to everyone',
  women_nb: 'Women and non-binary',
};

export const genderLabels: Record<Gender, string> = {
  woman: 'Woman',
  man: 'Man',
  non_binary: 'Non-binary',
  prefer_not: 'Prefer not to say',
};

export const gameVisibilityLabels: Record<GameVisibility, string> = {
  public: 'Public',
  code: 'Code only',
};

export const groupFormatLabels: Record<GroupFormat, string> = {
  in_person: 'In person',
  remote: 'Remote',
};

export const groupVisibilityLabels: Record<GroupVisibility, string> = {
  public: 'Public',
  request: 'Request to join',
  invite: 'Invite only',
};

export const roleLabels: Record<MemberRole, string> = {
  host: 'Host',
  cohost: 'Co-host',
  member: 'Member',
};

export const reportReasonLabels: Record<ReportReason, string> = {
  spam: 'Spam',
  harassment: 'Harassment or bullying',
  hate: 'Hate speech',
  sexual: 'Sexual content',
  violence: 'Violence or threats',
  scam: 'Scam or fraud',
  underage: 'Under 18',
  other: 'Something else',
};

export function labelFor<K extends string>(map: Record<K, string>, value: string | null | undefined): string {
  if (value && value in map) return map[value as K];
  return value ?? '';
}
