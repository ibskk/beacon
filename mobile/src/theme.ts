import { Platform, type TextStyle } from 'react-native';

import type { Sport } from '@/constants/enums';

export const colors = {
  page: '#F2F4F6',
  card: '#FFFFFF',
  ink: '#0B0C0E',
  ink2: '#3F444B',
  ink3: '#8A9099',
  line: '#DDE1E6',
  lime: '#B5F000',
  danger: '#C62828',
  dangerBg: '#FDECEC',
  infoBg: '#E9F0FB',
  white: '#FFFFFF',
} as const;

export const sportColors: Record<Sport, string> = {
  soccer: '#1FA971',
  basketball: '#F07A2B',
  pickleball: '#3B8CF0',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

const family = Platform.select({ ios: 'System', default: undefined });

export const type = {
  largeTitle: { fontFamily: family, fontSize: 30, lineHeight: 36, fontWeight: '700', color: colors.ink },
  title: { fontFamily: family, fontSize: 22, lineHeight: 28, fontWeight: '700', color: colors.ink },
  headline: { fontFamily: family, fontSize: 17, lineHeight: 22, fontWeight: '600', color: colors.ink },
  body: { fontFamily: family, fontSize: 16, lineHeight: 22, fontWeight: '400', color: colors.ink },
  callout: { fontFamily: family, fontSize: 15, lineHeight: 20, fontWeight: '400', color: colors.ink2 },
  label: { fontFamily: family, fontSize: 14, lineHeight: 18, fontWeight: '600', color: colors.ink2 },
  caption: { fontFamily: family, fontSize: 13, lineHeight: 18, fontWeight: '400', color: colors.ink3 },
} satisfies Record<string, TextStyle>;

export const shadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  default: { elevation: 2 },
});
