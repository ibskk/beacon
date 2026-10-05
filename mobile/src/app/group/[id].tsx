import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { fetchGroupDetail } from '@/api/groups';
import { SegmentedControl } from '@/components/SegmentedControl';
import { ErrorState, LoadingState } from '@/components/States';
import { GroupAbout } from '@/components/group/GroupAbout';
import { GroupChat } from '@/components/group/GroupChat';
import { useUserId } from '@/context/AuthProvider';
import { useAsync } from '@/hooks/useAsync';
import { spacing } from '@/theme';

type Tab = 'chat' | 'about';

export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useUserId();
  const detail = useAsync(() => fetchGroupDetail(id), [id], Boolean(id));
  const [tab, setTab] = useState<Tab>('chat');
  const group = detail.data;

  // Non-members only see the About panel (with Join / Request).
  useEffect(() => {
    if (group && !group.is_member) setTab('about');
  }, [group]);

  if (detail.loading && !group) return <LoadingState label="Loading group" />;
  if (detail.error && !group) return <ErrorState message={detail.error} onRetry={detail.reload} />;
  if (!group) {
    return <ErrorState message="This group is no longer available." onRetry={detail.reload} />;
  }

  return (
    <View style={styles.flex}>
      <Stack.Screen options={{ title: group.name }} />
      {group.is_member ? (
        <View style={styles.tabs}>
          <SegmentedControl
            segments={[
              { value: 'chat', label: 'Chat' },
              { value: 'about', label: 'About' },
            ]}
            value={tab}
            onChange={setTab}
          />
        </View>
      ) : null}
      {group.is_member && tab === 'chat' ? (
        <GroupChat groupId={group.id} userId={userId} />
      ) : (
        <GroupAbout
          group={group}
          userId={userId}
          refreshing={detail.refreshing}
          onRefresh={detail.refresh}
          onChanged={detail.silent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tabs: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
});
