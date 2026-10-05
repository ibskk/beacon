import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { deleteMyAccount, fetchMyProfile, updateDisplayName } from '@/api/profiles';
import { Avatar } from '@/components/Avatar';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ListRow } from '@/components/ListRow';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionTitle } from '@/components/SectionTitle';
import { ErrorState, LoadingState } from '@/components/States';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthProvider';
import { useAsync } from '@/hooks/useAsync';
import { appVersion, legal } from '@/lib/env';
import { errorMessage } from '@/lib/errors';
import { openInAppBrowser } from '@/lib/links';
import { supabase } from '@/lib/supabase';
import { colors, radius, spacing, type } from '@/theme';

export default function ProfileScreen() {
  const { userId, email } = useAuth();
  const profile = useAsync(() => fetchMyProfile(userId ?? ''), [userId], Boolean(userId));
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (profile.data) setName(profile.data.display_name);
  }, [profile.data]);

  const trimmed = name.trim();
  const dirty = profile.data != null && trimmed !== profile.data.display_name;
  const nameValid = trimmed.length >= 2 && trimmed.length <= 40;

  const saveName = async () => {
    if (!userId || !dirty || !nameValid) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateDisplayName(userId, trimmed);
      profile.setData((p) => (p ? { ...p, display_name: trimmed } : p));
      setSavedAt(Date.now());
    } catch (e) {
      setSaveError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const signOut = () => {
    Alert.alert('Sign out?', 'You can sign back in any time with your email and password.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete your account?',
      'This permanently and immediately deletes your account, profile, messages, group memberships, and any games or groups you host. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', style: 'destructive', onPress: finalConfirmDelete },
      ],
    );
  };

  const finalConfirmDelete = () => {
    Alert.alert('Are you sure?', 'Your account will be deleted right now. You will be signed out.', [
      { text: 'Keep my account', style: 'cancel' },
      { text: 'Delete permanently', style: 'destructive', onPress: runDelete },
    ]);
  };

  const runDelete = async () => {
    setDeleting(true);
    try {
      await deleteMyAccount();
    } catch (e) {
      // Nothing was deleted, so keep the user signed in and explain what happened.
      setDeleting(false);
      Alert.alert('Could not delete account', errorMessage(e));
      return;
    }
    // The auth user is gone, so only clear the local session; no network call is needed.
    // The auth listener then returns to the welcome screen.
    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
  };

  if (profile.loading && !profile.data) {
    return (
      <Screen>
        <ScreenHeader title="Profile" />
        <LoadingState />
      </Screen>
    );
  }

  if (profile.error && !profile.data) {
    return (
      <Screen>
        <ScreenHeader title="Profile" />
        <ErrorState message={profile.error} onRetry={profile.reload} />
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ScreenHeader title="Profile" />
          <View style={styles.body}>
            <Card style={styles.identity}>
              <Avatar name={profile.data?.display_name ?? ''} size={56} />
              <View style={styles.flex}>
                <Text style={type.headline} numberOfLines={1}>
                  {profile.data?.display_name}
                </Text>
                {email ? (
                  <Text style={type.caption} numberOfLines={1}>
                    {email}
                  </Text>
                ) : null}
              </View>
            </Card>

            <SectionTitle>Display name</SectionTitle>
            <Card style={styles.nameCard}>
              <TextField
                label="Name other players see"
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  setSavedAt(null);
                }}
                maxLength={40}
                error={trimmed.length > 0 && !nameValid ? 'Use 2 to 40 characters.' : saveError}
                returnKeyType="done"
                onSubmitEditing={saveName}
              />
              {savedAt && !dirty ? <Text style={type.caption}>Saved.</Text> : null}
              <Button title="Save name" onPress={saveName} loading={saving} disabled={!dirty || !nameValid} compact />
            </Card>

            <SectionTitle>Safety</SectionTitle>
            <View style={styles.group}>
              <ListRow
                icon="hand-left-outline"
                title="Blocked users"
                subtitle="Manage people whose messages, games and groups are hidden from you."
                onPress={() => router.push('/blocked')}
                last
              />
            </View>

            <SectionTitle>About</SectionTitle>
            <View style={styles.group}>
              <ListRow
                icon="shield-checkmark-outline"
                title="Community Guidelines"
                external
                onPress={() => openInAppBrowser(legal.guidelines)}
              />
              <ListRow icon="document-text-outline" title="Terms of Service" external onPress={() => openInAppBrowser(legal.terms)} />
              <ListRow icon="lock-closed-outline" title="Privacy Policy" external onPress={() => openInAppBrowser(legal.privacy)} />
              <ListRow icon="help-circle-outline" title="Support" external onPress={() => openInAppBrowser(legal.support)} last />
            </View>

            <SectionTitle>Account</SectionTitle>
            <View style={styles.group}>
              <ListRow icon="log-out-outline" title="Sign out" onPress={signOut} />
              <ListRow
                icon="trash-outline"
                title={deleting ? 'Deleting account' : 'Delete account'}
                subtitle="Permanently deletes your account and data."
                destructive
                onPress={deleting ? undefined : confirmDelete}
                last
              />
            </View>
            {deleting ? <Banner message="Deleting your account. This takes a moment." /> : null}

            <Text style={[type.caption, styles.version]}>Beacon version {appVersion}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: spacing.xxl },
  body: { paddingHorizontal: spacing.lg },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  nameCard: { gap: spacing.md },
  group: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  version: { textAlign: 'center', marginTop: spacing.xl },
});
