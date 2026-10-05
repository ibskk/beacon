import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Sport } from '@/constants/enums';
import { colors, sportColors } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export const sportIconNames: Record<Sport, IconName> = {
  soccer: 'football',
  basketball: 'basketball',
  pickleball: 'tennisball',
};

/** Filled sport disc for games; outlined variant is used for groups. */
export function SportIcon({ sport, size = 40, outlined = false }: { sport: Sport; size?: number; outlined?: boolean }) {
  const color = sportColors[sport] ?? colors.ink2;
  return (
    <View
      style={[
        styles.disc,
        { width: size, height: size, borderRadius: size / 2 },
        outlined ? { backgroundColor: colors.card, borderColor: color, borderWidth: 2 } : { backgroundColor: color },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Ionicons name={sportIconNames[sport] ?? 'ellipse'} size={size * 0.5} color={outlined ? color : colors.white} />
    </View>
  );
}

const styles = StyleSheet.create({
  disc: { alignItems: 'center', justifyContent: 'center' },
});
