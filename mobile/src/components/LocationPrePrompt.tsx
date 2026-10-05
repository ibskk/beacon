import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, type } from '@/theme';

import { Button } from './Button';

/**
 * Shown once before the system permission dialog. It has a single Continue button that
 * always leads to the system prompt, as Apple requires for pre-permission screens.
 */
export function LocationPrePrompt({ onContinue }: { onContinue: () => void }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <Ionicons name="navigate" size={28} color={colors.ink} />
      </View>
      <Text style={[type.title, styles.center]}>Find games near you</Text>
      <Text style={[type.callout, styles.center]}>
        Beacon uses your location while the app is open to show pickup games and groups nearby and to check you in at
        the venue. Your location is never shown to other players or stored.
      </Text>
      <Button title="Continue" onPress={onContinue} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  center: { textAlign: 'center' },
  button: { alignSelf: 'stretch', marginTop: spacing.md },
});
