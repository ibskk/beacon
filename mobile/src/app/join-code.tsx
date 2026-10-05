import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { joinGameByCode } from '@/api/games';
import { joinGroupByCode } from '@/api/groups';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { SegmentedControl } from '@/components/SegmentedControl';
import { TextField } from '@/components/TextField';
import { errorMessage } from '@/lib/errors';
import { spacing, type } from '@/theme';

type Kind = 'game' | 'group';

function normalize(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export default function JoinCodeScreen() {
  const params = useLocalSearchParams<{ kind?: string }>();
  const [kind, setKind] = useState<Kind>(params.kind === 'group' ? 'group' : 'game');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clean = normalize(code);
  const valid = clean.length >= 4 && clean.length <= 12;

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      if (kind === 'game') {
        const id = await joinGameByCode(clean);
        router.replace({ pathname: '/game/[id]', params: { id } });
      } else {
        const id = await joinGroupByCode(clean);
        router.replace({ pathname: '/group/[id]', params: { id } });
      }
    } catch (e) {
      setError(errorMessage(e));
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SegmentedControl
          segments={[
            { value: 'game', label: 'Game' },
            { value: 'group', label: 'Group' },
          ]}
          value={kind}
          onChange={(k) => {
            setKind(k);
            setError(null);
          }}
        />
        <Text style={type.callout}>
          {kind === 'game'
            ? 'Enter the code the host shared with you to join a private game.'
            : 'Enter the 6-character code a group host or co-host shared with you.'}
        </Text>
        <TextField
          label={kind === 'game' ? 'Game code' : 'Group code'}
          value={code}
          onChangeText={(t) => setCode(normalize(t))}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          maxLength={12}
          placeholder="ABC234"
          style={styles.code}
          returnKeyType="go"
          onSubmitEditing={submit}
          autoFocus
        />
        {error ? <Banner tone="error" message={error} /> : null}
        <Button title={kind === 'game' ? 'Join game' : 'Join group'} onPress={submit} loading={submitting} disabled={!valid} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.lg },
  code: { fontSize: 22, letterSpacing: 4, fontWeight: '600', textAlign: 'center' },
});
