import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing, type } from '@/theme';

type Props = {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  mode: 'date' | 'datetime';
  placeholder: string;
  format: (date: Date) => string;
  minimumDate?: Date;
  maximumDate?: Date;
  /** Where the picker starts when no value is set yet. */
  initialDate?: Date;
  error?: string | null;
};

export function DateTimeField({
  label,
  value,
  onChange,
  mode,
  placeholder,
  format,
  minimumDate,
  maximumDate,
  initialDate,
  error,
}: Props) {
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(value ?? initialDate ?? new Date());

  const openAndroid = () => {
    const initial = value ?? initialDate ?? new Date();
    DateTimePickerAndroid.open({
      value: initial,
      mode: 'date',
      minimumDate,
      maximumDate,
      onValueChange: (_e, date) => {
        if (mode === 'date') {
          onChange(date);
          return;
        }
        // Opening the time dialog from inside the date dialog callback can be dropped.
        setTimeout(() => {
          DateTimePickerAndroid.open({
            value: date,
            mode: 'time',
            onValueChange: (_e2, time) => {
              const merged = new Date(date);
              merged.setHours(time.getHours(), time.getMinutes(), 0, 0);
              onChange(merged);
            },
          });
        }, 50);
      },
    });
  };

  const open = () => {
    if (Platform.OS === 'android') {
      openAndroid();
    } else {
      setDraft(value ?? initialDate ?? new Date());
      setIosOpen(true);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={type.label}>{label}</Text>
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${value ? format(value) : 'not set'}`}
        accessibilityHint="Opens a picker"
        style={[styles.input, error ? styles.inputError : null]}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>{value ? format(value) : placeholder}</Text>
        <Ionicons name={mode === 'date' ? 'calendar-outline' : 'time-outline'} size={20} color={colors.ink2} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {Platform.OS === 'ios' ? (
        <IosPickerModal
          visible={iosOpen}
          title={label}
          value={draft}
          mode={mode}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={setDraft}
          onCancel={() => setIosOpen(false)}
          onDone={() => {
            setIosOpen(false);
            onChange(draft);
          }}
        />
      ) : null}
    </View>
  );
}

function IosPickerModal(props: {
  visible: boolean;
  title: string;
  value: Date;
  mode: 'date' | 'datetime';
  minimumDate?: Date;
  maximumDate?: Date;
  onChange: (d: Date) => void;
  onCancel: () => void;
  onDone: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={props.visible} transparent animationType="slide" onRequestClose={props.onCancel}>
      <Pressable style={styles.backdrop} onPress={props.onCancel} accessibilityLabel="Cancel" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.sheetHeader}>
          <Pressable onPress={props.onCancel} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.sheetAction}>Cancel</Text>
          </Pressable>
          <Text style={type.headline}>{props.title}</Text>
          <Pressable onPress={props.onDone} accessibilityRole="button" hitSlop={8}>
            <Text style={[styles.sheetAction, styles.done]}>Done</Text>
          </Pressable>
        </View>
        <DateTimePicker
          value={props.value}
          mode={props.mode}
          display="spinner"
          minimumDate={props.minimumDate}
          maximumDate={props.maximumDate}
          minuteInterval={props.mode === 'datetime' ? 5 : undefined}
          themeVariant="light"
          textColor={colors.ink}
          onValueChange={(_e, date) => props.onChange(date)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs + 2 },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputError: { borderColor: colors.danger },
  value: { fontSize: 16, color: colors.ink, flexShrink: 1 },
  placeholder: { color: colors.ink3 },
  error: { color: colors.danger, fontSize: 13 },
  backdrop: { flex: 1, backgroundColor: 'rgba(11,12,14,0.35)' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  sheetAction: { fontSize: 16, color: colors.ink2 },
  done: { color: colors.ink, fontWeight: '700' },
});
