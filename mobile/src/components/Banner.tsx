import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

type Props = {
  message: string;
  tone?: 'info' | 'error';
  actionLabel?: string;
  onAction?: () => void;
};

export function Banner({ message, tone = 'info', actionLabel, onAction }: Props) {
  const isError = tone === 'error';
  return (
    <View
      style={[styles.wrap, isError ? styles.error : styles.info]}
      accessibilityRole={isError ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
    >
      <Ionicons
        name={isError ? 'alert-circle' : 'location-outline'}
        size={18}
        color={isError ? colors.danger : colors.ink2}
      />
      <Text style={[styles.text, isError && { color: colors.danger }]}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" accessibilityLabel={actionLabel} hitSlop={8}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
  },
  info: { backgroundColor: colors.infoBg },
  error: { backgroundColor: colors.dangerBg },
  text: { flex: 1, fontSize: 14, color: colors.ink2 },
  action: { fontSize: 14, fontWeight: '700', color: colors.ink, textDecorationLine: 'underline' },
});
