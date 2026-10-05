import { StyleSheet, Text, View } from 'react-native';

import { labelFor, tagLabels } from '@/constants/labels';
import { colors, radius, spacing } from '@/theme';

export function TagList({ tags, extra = [] }: { tags: string[] | null | undefined; extra?: string[] }) {
  const items = [...extra, ...(tags ?? []).map((t) => labelFor(tagLabels, t))].filter(Boolean);
  if (items.length === 0) return null;
  return (
    <View style={styles.row}>
      {items.map((label) => (
        <View key={label} style={styles.tag}>
          <Text style={styles.text} maxFontSizeMultiplier={1.3}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2 },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm - 2,
    backgroundColor: colors.page,
  },
  text: { fontSize: 12, fontWeight: '500', color: colors.ink2 },
});
