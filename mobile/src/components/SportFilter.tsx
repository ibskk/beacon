import { ScrollView, StyleSheet } from 'react-native';

import { SPORTS, type Sport } from '@/constants/enums';
import { sportLabels } from '@/constants/labels';
import { spacing, sportColors } from '@/theme';

import { Chip } from './Chip';

type Props = {
  value: Sport | null;
  onChange: (sport: Sport | null) => void;
};

export function SportFilter({ value, onChange }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      <Chip label="All sports" selected={value === null} onPress={() => onChange(null)} />
      {SPORTS.map((s) => (
        <Chip
          key={s}
          label={sportLabels[s]}
          selected={value === s}
          accentColor={sportColors[s]}
          onPress={() => onChange(value === s ? null : s)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingHorizontal: spacing.lg },
});
