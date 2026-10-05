import { router } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { LegalFooter } from '@/components/LegalLinks';
import { Screen } from '@/components/Screen';
import { colors, radius, spacing, type } from '@/theme';

export default function WelcomeScreen() {
  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <View style={styles.hero}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.logo}
            accessibilityIgnoresInvertColors
            accessibilityLabel="Beacon logo"
          />
          <Text style={[type.largeTitle, styles.center]} accessibilityRole="header">
            Beacon
          </Text>
          <Text style={[type.body, styles.center, styles.tagline]}>
            Find pickup soccer, basketball and pickleball near you. Join a game, meet your crew, and show up.
          </Text>
        </View>
        <View style={styles.actions}>
          <Button title="Create account" onPress={() => router.push('/sign-up')} />
          <Button title="Sign in" variant="outline" onPress={() => router.push('/sign-in')} />
          <Text style={[type.caption, styles.center]}>Beacon is for adults 18 and older.</Text>
          <LegalFooter />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: spacing.xl, justifyContent: 'space-between', gap: spacing.xxl },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingTop: spacing.xxl },
  logo: { width: 96, height: 96, borderRadius: radius.lg + 6, marginBottom: spacing.sm },
  tagline: { color: colors.ink2, maxWidth: 320 },
  center: { textAlign: 'center' },
  actions: { gap: spacing.md },
});
