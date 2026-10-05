import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { errorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { colors, spacing, type } from '@/theme';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);

  const canSubmit = email.trim().length > 3 && password.length > 0;

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    // On success the root layout sees the new session and opens the app.
    if (signInError) setError(errorMessage(signInError));
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={type.callout}>Welcome back. Sign in with the email you used to create your account.</Text>
        {error ? <Banner tone="error" message={error} /> : null}
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <TextField
          ref={passwordRef}
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        <Button title="Sign in" onPress={submit} loading={submitting} disabled={!canSubmit} />
        <View style={styles.footer}>
          <Text style={type.callout}>New to Beacon?</Text>
          <Text
            style={styles.link}
            onPress={() => router.replace('/sign-up')}
            accessibilityRole="link"
            suppressHighlighting={false}
          >
            Create an account
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.lg },
  footer: { flexDirection: 'row', gap: spacing.xs + 2, justifyContent: 'center', flexWrap: 'wrap' },
  link: { fontSize: 15, fontWeight: '700', color: colors.ink, textDecorationLine: 'underline' },
});
