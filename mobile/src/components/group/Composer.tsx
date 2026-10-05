import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { errorMessage } from '@/lib/errors';
import { colors, radius, spacing } from '@/theme';

const MAX_LENGTH = 1000;

export function Composer({ onSend }: { onSend: (body: string) => Promise<void> }) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const body = text.trim();
  const canSend = body.length > 0 && !sending;

  const send = async () => {
    if (!canSend) return;
    setSending(true);
    setError(null);
    try {
      await onSend(body);
      setText('');
    } catch (e) {
      // Server messages (content filter, link limits, rate limit, mute) are shown verbatim.
      setError(errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {error ? (
        <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <View style={styles.row}>
        <TextInput
          value={text}
          onChangeText={(t) => {
            setText(t);
            if (error) setError(null);
          }}
          placeholder="Message the group"
          placeholderTextColor={colors.ink3}
          accessibilityLabel="Message"
          multiline
          maxLength={MAX_LENGTH}
          style={styles.input}
        />
        <Pressable
          onPress={send}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          accessibilityState={{ disabled: !canSend, busy: sending }}
          style={[styles.send, !canSend && styles.sendDisabled]}
        >
          {sending ? <ActivityIndicator color={colors.ink} /> : <Ionicons name="arrow-up" size={20} color={colors.ink} />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    gap: spacing.xs + 2,
  },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderRadius: radius.lg + 4,
    backgroundColor: colors.page,
    paddingHorizontal: spacing.md + 2,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 16,
    color: colors.ink,
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },
  error: { color: colors.danger, fontSize: 13 },
});
