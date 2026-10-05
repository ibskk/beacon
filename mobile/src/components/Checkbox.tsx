import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  accessibilityLabel: string;
  children: ReactNode;
};

/** The label is passed as children so it can contain tappable links. */
export function Checkbox({ checked, onChange, accessibilityLabel, children }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChange(!checked)}
        accessibilityRole="checkbox"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ checked }}
        hitSlop={10}
        style={[styles.box, checked && styles.boxChecked]}
      >
        {checked ? <Ionicons name="checkmark" size={18} color={colors.white} /> : null}
      </Pressable>
      <View style={styles.label}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  box: {
    width: 26,
    height: 26,
    marginTop: 1,
    borderRadius: radius.sm - 2,
    borderWidth: 1.5,
    borderColor: colors.ink3,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: colors.ink, borderColor: colors.ink },
  label: { flex: 1 },
});
