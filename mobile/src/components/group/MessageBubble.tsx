import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { GroupMessage } from '@/api/types';
import { formatMessageTime } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';

type Props = {
  message: GroupMessage;
  mine: boolean;
  showSender: boolean;
  onLongPress?: (message: GroupMessage) => void;
};

function MessageBubbleBase({ message, mine, showSender, onLongPress }: Props) {
  const time = formatMessageTime(message.created_at);
  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
      <Pressable
        onLongPress={onLongPress ? () => onLongPress(message) : undefined}
        delayLongPress={350}
        accessibilityRole={onLongPress ? 'button' : undefined}
        accessibilityLabel={`${mine ? 'You' : message.sender_name}: ${message.body}. ${time}`}
        accessibilityHint={onLongPress ? 'Long press to report or block' : undefined}
        accessibilityActions={onLongPress ? [{ name: 'longpress', label: 'Report or block' }] : undefined}
        onAccessibilityAction={onLongPress ? () => onLongPress(message) : undefined}
        style={({ pressed }) => [styles.bubble, mine ? styles.mine : styles.theirs, pressed && onLongPress && styles.pressed]}
      >
        {showSender && !mine ? (
          <Text style={styles.sender} numberOfLines={1}>
            {message.sender_name}
          </Text>
        ) : null}
        <Text style={styles.body} selectable={!onLongPress}>
          {message.body}
        </Text>
        <Text style={styles.time}>{time}</Text>
      </Pressable>
    </View>
  );
}

export const MessageBubble = memo(MessageBubbleBase);

const styles = StyleSheet.create({
  row: { paddingHorizontal: spacing.md, marginVertical: 2, flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '82%',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs + 2,
    gap: 2,
  },
  mine: { backgroundColor: colors.lime, borderBottomRightRadius: 4 },
  theirs: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  pressed: { opacity: 0.8 },
  sender: { fontSize: 12, fontWeight: '700', color: colors.ink2 },
  body: { fontSize: 16, lineHeight: 21, color: colors.ink },
  time: { fontSize: 11, color: colors.ink2, alignSelf: 'flex-end', opacity: 0.8 },
});
