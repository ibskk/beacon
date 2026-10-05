import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

type Props = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (value: number) => string;
};

export function Stepper({ label, value, onChange, min, max, step = 1, format = String }: Props) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value, text: format(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => (e.nativeEvent.actionName === 'increment' ? inc() : dec())}
    >
      <StepButton icon="remove" onPress={dec} disabled={value <= min} label={`Decrease ${label}`} />
      <Text style={styles.value} maxFontSizeMultiplier={1.4}>
        {format(value)}
      </Text>
      <StepButton icon="add" onPress={inc} disabled={value >= max} label={`Increase ${label}`} />
    </View>
  );
}

function StepButton({
  icon,
  onPress,
  disabled,
  label,
}: {
  icon: 'add' | 'remove';
  onPress: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Ionicons name={icon} size={20} color={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.xs + 2,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.page,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: colors.ink },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.35 },
});
