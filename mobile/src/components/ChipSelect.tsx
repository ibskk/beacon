import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { Chip } from './Chip';

type Option<T extends string | number> = { value: T; label: string; color?: string };

type SingleProps<T extends string | number> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function ChipSelect<T extends string | number>({ options, value, onChange }: SingleProps<T>) {
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup">
      {options.map((o) => (
        <Chip
          key={String(o.value)}
          label={o.label}
          selected={o.value === value}
          accentColor={o.color}
          onPress={() => onChange(o.value)}
        />
      ))}
    </View>
  );
}

type MultiProps<T extends string> = {
  options: readonly Option<T>[];
  values: T[];
  onChange: (values: T[]) => void;
  max: number;
};

export function MultiChipSelect<T extends string>({ options, values, onChange, max }: MultiProps<T>) {
  const atMax = values.length >= max;
  return (
    <View style={styles.wrap}>
      {options.map((o) => {
        const selected = values.includes(o.value);
        return (
          <Chip
            key={o.value}
            label={o.label}
            selected={selected}
            disabled={!selected && atMax}
            onPress={() => onChange(selected ? values.filter((v) => v !== o.value) : [...values, o.value])}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
