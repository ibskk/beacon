import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme';

type Variant = 'primary' | 'dark' | 'outline' | 'danger' | 'plain';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  icon?: ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
};

const palette: Record<Variant, { bg: string; fg: string; border: string }> = {
  // Lime is only ever a background with ink text, never text on white.
  primary: { bg: colors.lime, fg: colors.ink, border: colors.lime },
  dark: { bg: colors.ink, fg: colors.white, border: colors.ink },
  outline: { bg: colors.card, fg: colors.ink, border: colors.line },
  danger: { bg: colors.card, fg: colors.danger, border: colors.line },
  plain: { bg: 'transparent', fg: colors.ink, border: 'transparent' },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  compact = false,
  style,
  accessibilityHint,
}: Props) {
  const p = palette[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        { backgroundColor: p.bg, borderColor: p.border },
        pressed && !inactive && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <View style={styles.content}>
          {icon ? <Ionicons name={icon} size={compact ? 16 : 18} color={p.fg} /> : null}
          <Text
            style={[styles.label, compact && styles.labelCompact, { color: p.fg }]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.4}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: { minHeight: 38, paddingHorizontal: spacing.md, borderRadius: radius.sm + 2 },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { fontSize: 16, fontWeight: '600' },
  labelCompact: { fontSize: 14 },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.45 },
});
