import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, type } from '@/theme';

type Props = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
};

export function InfoRow({ icon, label, value }: Props) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${value}`}>
      <Ionicons name={icon} size={18} color={colors.ink3} style={styles.icon} />
      <View style={styles.text}>
        <Text style={type.caption}>{label}</Text>
        <Text style={type.body}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  icon: { marginTop: 2 },
  text: { flex: 1 },
});
