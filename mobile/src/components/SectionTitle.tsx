import { StyleSheet, Text } from 'react-native';

import { colors, spacing } from '@/theme';

export function SectionTitle({ children }: { children: string }) {
  return (
    <Text style={styles.title} accessibilityRole="header">
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.ink3,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
});
