import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { spacing, type } from '@/theme';

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
};

export function ScreenHeader({ title, subtitle, right }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.titles}>
        <Text style={type.largeTitle} accessibilityRole="header" maxFontSizeMultiplier={1.3} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? <Text style={type.caption}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  titles: { flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
