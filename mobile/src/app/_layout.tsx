import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/context/AuthProvider';
import { isBackendConfigured } from '@/lib/env';
import { colors, spacing, type } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden (for example after a fast refresh); nothing to do.
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { session, initializing } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (!initializing) SplashScreen.hideAsync().catch(() => undefined);
  }, [initializing]);

  // Keep signed-out users in the auth flow and signed-in users out of it.
  useEffect(() => {
    if (initializing || !isBackendConfigured) return;
    const inAuthFlow = segments[0] === '(auth)';
    if (!session && !inAuthFlow) {
      router.replace('/welcome');
    } else if (session && inAuthFlow) {
      router.replace('/explore');
    }
  }, [session, initializing, segments]);

  if (!isBackendConfigured) return <MissingConfig />;
  if (initializing) return <View style={styles.fill} />;

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.page },
        headerTitleStyle: { fontWeight: '600' },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.page },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="game/[id]" options={{ title: 'Game' }} />
      <Stack.Screen name="game/new" options={{ title: 'Host a game', presentation: 'modal' }} />
      <Stack.Screen name="group/[id]" options={{ title: 'Group' }} />
      <Stack.Screen name="group/new" options={{ title: 'Create a group', presentation: 'modal' }} />
      <Stack.Screen name="join-code" options={{ title: 'Join with code', presentation: 'modal' }} />
      <Stack.Screen name="report" options={{ title: 'Report', presentation: 'modal' }} />
      <Stack.Screen name="blocked" options={{ title: 'Blocked users' }} />
    </Stack>
  );
}

function MissingConfig() {
  return (
    <View style={[styles.fill, styles.center]}>
      <Text style={type.title}>Beacon is not configured</Text>
      <Text style={[type.callout, styles.text]}>
        Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, then restart the bundler.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.page },
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  text: { textAlign: 'center' },
});
