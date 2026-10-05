import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { submitReport } from '@/api/safety';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { REPORT_REASONS, REPORT_TARGETS, type ReportReason, type ReportTarget } from '@/constants/enums';
import { reportReasonLabels } from '@/constants/labels';
import { errorMessage } from '@/lib/errors';
import { notifyReported } from '@/lib/safetyActions';
import { colors, radius, spacing, type } from '@/theme';

const targetNouns: Record<ReportTarget, string> = {
  message: 'message',
  user: 'player',
  game: 'game',
  group: 'group',
};

export default function ReportScreen() {
  const params = useLocalSearchParams<{ targetType: string; targetId: string; subject?: string }>();
  const targetType = REPORT_TARGETS.find((t) => t === params.targetType);
  const targetId = params.targetId;

  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!targetType || !targetId) {
    return (
      <View style={styles.center}>
        <Text style={type.headline}>This item can no longer be reported.</Text>
        <Button title="Close" variant="outline" onPress={() => router.back()} style={styles.stretch} />
      </View>
    );
  }

  const submit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitReport({ targetType, targetId, reason, details });
      notifyReported(targetType, targetId);
      setDone(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <View style={styles.center}>
        <View style={styles.doneIcon}>
          <Ionicons name="checkmark" size={30} color={colors.ink} />
        </View>
        <Text style={[type.title, styles.textCenter]} accessibilityRole="header">
          Report sent
        </Text>
        <Text style={[type.callout, styles.textCenter]}>Thanks. Our team reviews reports within 24 hours.</Text>
        <Button title="Done" onPress={() => router.back()} style={styles.stretch} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={type.title} accessibilityRole="header">
          Report this {targetNouns[targetType]}
        </Text>
        {params.subject ? (
          <Text style={type.callout} numberOfLines={3}>
            {params.subject}
          </Text>
        ) : null}
        <Text style={type.label}>What is wrong?</Text>
        <View style={styles.reasons} accessibilityRole="radiogroup">
          {REPORT_REASONS.map((r, i) => {
            const selected = reason === r;
            return (
              <Pressable
                key={r}
                onPress={() => setReason(r)}
                accessibilityRole="radio"
                accessibilityLabel={reportReasonLabels[r]}
                accessibilityState={{ checked: selected }}
                style={({ pressed }) => [styles.reason, i > 0 && styles.divider, pressed && styles.pressed]}
              >
                <Text style={[type.body, styles.flex]}>{reportReasonLabels[r]}</Text>
                <Ionicons
                  name={selected ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={selected ? colors.ink : colors.ink3}
                />
              </Pressable>
            );
          })}
        </View>
        <TextField
          label="Details (optional)"
          value={details}
          onChangeText={setDetails}
          multiline
          maxLength={1000}
          placeholder="Anything that helps our team understand what happened"
          style={styles.details}
          textAlignVertical="top"
        />
        {error ? <Banner tone="error" message={error} /> : null}
        <Button title="Send report" onPress={submit} loading={submitting} disabled={!reason} />
        <Text style={type.caption}>
          If someone is in immediate danger, contact local emergency services first.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxl * 2 },
  reasons: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  pressed: { backgroundColor: colors.page },
  details: { minHeight: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  doneIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCenter: { textAlign: 'center' },
  stretch: { alignSelf: 'stretch', marginTop: spacing.md },
});
