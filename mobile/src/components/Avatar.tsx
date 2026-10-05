import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
  return (
    <View
      style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Text style={[styles.text, { fontSize: size * 0.38 }]} maxFontSizeMultiplier={1}>
        {initials || '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { backgroundColor: '#E4E7EB', alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '700', color: colors.ink2 },
});
