import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, type } from '@/theme';

import { Avatar } from './Avatar';

type Props = {
  name: string;
  detail?: string;
  right?: ReactNode;
  /** Opens the per-person menu (report, block, remove). */
  onMore?: () => void;
  last?: boolean;
};

export function PersonRow({ name, detail, right, onMore, last }: Props) {
  return (
    <View style={[styles.row, !last && styles.divider]}>
      <Avatar name={name} />
      <View style={styles.text}>
        <Text style={type.body} numberOfLines={1}>
          {name}
        </Text>
        {detail ? <Text style={type.caption}>{detail}</Text> : null}
      </View>
      {right}
      {onMore ? (
        <Pressable
          onPress={onMore}
          accessibilityRole="button"
          accessibilityLabel={`More options for ${name}`}
          hitSlop={10}
          style={styles.more}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.ink2} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  text: { flex: 1 },
  more: { padding: spacing.xs },
});
