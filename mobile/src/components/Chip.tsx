import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing } from '@/theme';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  accentColor?: string;
  disabled?: boolean;
};

export function Chip({ label, selected, onPress, accentColor, disabled = false }: Props) {
  const selectedBg = accentColor ?? colors.ink;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => [
        styles.chip,
        selected && { backgroundColor: selectedBg, borderColor: selectedBg },
        pressed && styles.pressed,
        disabled && !selected && styles.disabled,
      ]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]} maxFontSizeMultiplier={1.4} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 14, fontWeight: '500', color: colors.ink2 },
  labelSelected: { color: colors.white, fontWeight: '600' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.4 },
});
