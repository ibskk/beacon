import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/theme';

export type SheetAction = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

type Props = {
  visible: boolean;
  title?: string;
  actions: SheetAction[];
  onClose: () => void;
};

export function ActionSheet({ visible, title, actions, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close menu" accessibilityRole="button">
        <View />
      </Pressable>
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <View style={styles.group}>
          {title ? (
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
          ) : null}
          {actions.map((a, i) => (
            <Pressable
              key={a.label}
              onPress={() => {
                onClose();
                // Let the modal dismiss before the next one (alert or sheet) opens.
                setTimeout(a.onPress, 250);
              }}
              accessibilityRole="button"
              accessibilityLabel={a.label}
              style={({ pressed }) => [styles.action, (i > 0 || title) && styles.divider, pressed && styles.pressed]}
            >
              <Text style={[styles.actionText, a.destructive && { color: colors.danger }]}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          style={({ pressed }) => [styles.group, styles.action, pressed && styles.pressed]}
        >
          <Text style={[styles.actionText, styles.cancel]}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11,12,14,0.35)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.sm, gap: spacing.sm },
  group: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden' },
  title: {
    textAlign: 'center',
    fontSize: 13,
    color: colors.ink3,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  action: { minHeight: 56, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  actionText: { fontSize: 17, color: colors.ink },
  cancel: { fontWeight: '600' },
  pressed: { backgroundColor: colors.page },
});
