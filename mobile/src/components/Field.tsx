import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { spacing, type } from '@/theme';

/** Labelled wrapper for non-text inputs (chips, steppers, pickers). */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.wrap}>
      <Text style={type.label}>{label}</Text>
      {children}
      {hint ? <Text style={type.caption}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
});
