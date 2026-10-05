import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme';

type Props = {
  title: string;
  subtitle?: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  onPress?: () => void;
  right?: ReactNode;
  destructive?: boolean;
  external?: boolean;
  last?: boolean;
};

export function ListRow({ title, subtitle, icon, onPress, right, destructive, external, last }: Props) {
  const color = destructive ? colors.danger : colors.ink;
  const content = (
    <View style={[styles.row, !last && styles.divider]}>
      {icon ? <Ionicons name={icon} size={20} color={destructive ? colors.danger : colors.ink2} /> : null}
      <View style={styles.text}>
        <Text style={[styles.title, { color }]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
      {onPress && !right ? (
        <Ionicons name={external ? 'open-outline' : 'chevron-forward'} size={18} color={colors.ink3} />
      ) : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={external ? 'link' : 'button'}
      accessibilityLabel={title}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 16 },
  subtitle: { fontSize: 13, color: colors.ink3 },
  pressed: { backgroundColor: colors.page },
});
