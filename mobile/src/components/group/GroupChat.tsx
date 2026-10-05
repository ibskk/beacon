import { useHeaderHeight } from 'expo-router/react-navigation';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import type { GroupMessage } from '@/api/types';
import { ActionSheet, type SheetAction } from '@/components/ActionSheet';
import { Banner } from '@/components/Banner';
import { LoadingState } from '@/components/States';
import { useGroupMessages } from '@/hooks/useGroupMessages';
import { confirmBlock, onReported, openReport } from '@/lib/safetyActions';
import { colors, spacing, type } from '@/theme';

import { Composer } from './Composer';
import { MessageBubble } from './MessageBubble';

type Props = {
  groupId: string;
  userId: string;
};

export function GroupChat({ groupId, userId }: Props) {
  const headerHeight = useHeaderHeight();
  const chat = useGroupMessages(groupId, true);
  const { removeMessage } = chat;

  // A reported message leaves the chat as soon as the report is sent.
  useEffect(
    () =>
      onReported((targetType, targetId) => {
        if (targetType === 'message') removeMessage(Number(targetId));
      }),
    [removeMessage],
  );
  const [sheet, setSheet] = useState<{ title: string; actions: SheetAction[] } | null>(null);

  const onLongPress = useCallback(
    (m: GroupMessage) => {
      setSheet({
        title: `Message from ${m.sender_name}`,
        actions: [
          { label: 'Report message', onPress: () => openReport('message', String(m.id), `"${m.body}"`) },
          {
            label: `Block ${m.sender_name}`,
            destructive: true,
            onPress: () => confirmBlock(m.sender_id, m.sender_name, () => chat.hideSender(m.sender_id)),
          },
        ],
      });
    },
    [chat],
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
    >
      {chat.loadError && chat.messages.length > 0 ? (
        <View style={styles.banner}>
          <Banner tone="error" message={chat.loadError} actionLabel="Retry" onAction={chat.reload} />
        </View>
      ) : null}
      {chat.loading && chat.messages.length === 0 ? (
        <LoadingState label="Loading messages" />
      ) : (
        <FlatList
          data={chat.messages}
          inverted
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={styles.list}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onEndReached={chat.loadOlder}
          onEndReachedThreshold={0.3}
          renderItem={({ item, index }) => {
            const older = chat.messages[index + 1];
            const mine = item.sender_id === userId;
            return (
              <MessageBubble
                message={item}
                mine={mine}
                showSender={!older || older.sender_id !== item.sender_id}
                onLongPress={mine ? undefined : onLongPress}
              />
            );
          }}
          ListFooterComponent={chat.loadingMore ? <ActivityIndicator style={styles.more} color={colors.ink3} /> : null}
          ListEmptyComponent={
            <View style={styles.empty}>
              {chat.loadError ? (
                <Banner tone="error" message={chat.loadError} actionLabel="Retry" onAction={chat.reload} />
              ) : (
                <>
                  <Text style={type.headline}>No messages yet</Text>
                  <Text style={[type.callout, styles.center]}>
                    Say hello and plan your next game. Keep it friendly; long press a message to report or block.
                  </Text>
                </>
              )}
            </View>
          }
        />
      )}
      <Composer onSend={chat.send} />
      <ActionSheet
        visible={sheet !== null}
        title={sheet?.title}
        actions={sheet?.actions ?? []}
        onClose={() => setSheet(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { flexGrow: 1, paddingVertical: spacing.md },
  banner: { padding: spacing.md },
  more: { marginVertical: spacing.md },
  // Inverted list: transform flips the empty state back upright.
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
    transform: [{ scaleY: -1 }],
  },
  center: { textAlign: 'center' },
});
