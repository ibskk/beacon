import { useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { fetchBlockedUsers, unblockUser } from '@/api/safety';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';
import { useUserId } from '@/context/AuthProvider';
import { useAsync } from '@/hooks/useAsync';
import { errorMessage } from '@/lib/errors';
import { colors, radius, spacing, type } from '@/theme';

export default function BlockedUsersScreen() {
  const userId = useUserId();
  const blocked = useAsync(fetchBlockedUsers, []);
  const [busyId, setBusyId] = useState<string | null>(null);

  const confirmUnblock = (id: string, name: string) => {
    Alert.alert(`Unblock ${name}?`, 'Their messages, games and groups will be visible to you again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: async () => {
          setBusyId(id);
          try {
            await unblockUser(userId, id);
            blocked.setData((list) => (list ? list.filter((b) => b.blocked_id !== id) : list));
          } catch (e) {
            Alert.alert('Could not unblock', errorMessage(e));
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  if (blocked.loading && !blocked.data) return <LoadingState />;
  if (blocked.error && !blocked.data) return <ErrorState message={blocked.error} onRetry={blocked.reload} />;

  return (
    <FlatList
      data={blocked.data ?? []}
      keyExtractor={(b) => b.blocked_id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={blocked.refreshing} onRefresh={blocked.refresh} />}
      ListHeaderComponent={
        <Text style={[type.callout, styles.intro]}>
          You will not see messages, games or groups from people you block. They are not notified. Unblock someone
          to see their content again.
        </Text>
      }
      ItemSeparatorComponent={() => <View style={styles.sep} />}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Avatar name={item.display_name} />
          <Text style={[type.body, styles.name]} numberOfLines={1}>
            {item.display_name}
          </Text>
          <Button
            title="Unblock"
            variant="outline"
            compact
            loading={busyId === item.blocked_id}
            onPress={() => confirmUnblock(item.blocked_id, item.display_name)}
          />
        </View>
      )}
      ListEmptyComponent={<EmptyState icon="hand-left-outline" title="You have not blocked anyone" />}
    />
  );
}

const styles = StyleSheet.create({
  list: { flexGrow: 1, padding: spacing.lg },
  intro: { marginBottom: spacing.lg },
  sep: { height: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  name: { flex: 1 },
});
