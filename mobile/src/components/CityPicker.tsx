import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CITIES } from '@/constants/cities';
import { colors, radius, spacing, type } from '@/theme';

type Props = {
  visible: boolean;
  selected: string;
  onSelect: (city: string) => void;
  onClose: () => void;
};

export function CityPicker({ visible, selected, onSelect, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close city picker" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
        <Text style={[type.headline, styles.title]} accessibilityRole="header">
          Choose a city
        </Text>
        {CITIES.map((c) => {
          const isSelected = c.name === selected;
          return (
            <Pressable
              key={c.name}
              onPress={() => {
                onSelect(c.name);
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel={c.name}
              accessibilityState={{ selected: isSelected }}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <Text style={[styles.city, isSelected && styles.citySelected]}>{c.name}</Text>
              {isSelected ? <Ionicons name="checkmark" size={20} color={colors.ink} /> : null}
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(11,12,14,0.35)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.lg,
  },
  title: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  row: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  city: { fontSize: 17, color: colors.ink },
  citySelected: { fontWeight: '600' },
  pressed: { backgroundColor: colors.page },
});
