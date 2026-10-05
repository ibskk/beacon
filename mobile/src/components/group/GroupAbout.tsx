import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  approveRequest,
  declineRequest,
  fetchGroupRequests,
  joinGroup,
  leaveGroup,
  removeMember,
} from '@/api/groups';
import type { GroupDetail, GroupMember } from '@/api/types';
import { ActionSheet, type SheetAction } from '@/components/ActionSheet';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CodeShareCard } from '@/components/CodeShareCard';
import { InfoRow } from '@/components/InfoRow';
import { PersonRow } from '@/components/PersonRow';
import { SectionTitle } from '@/components/SectionTitle';
import { SportIcon } from '@/components/SportIcon';
import { TagList } from '@/components/TagList';
import {
  genderRuleLabels,
  groupFormatLabels,
  groupVisibilityLabels,
  labelFor,
  roleLabels,
  sportLabels,
} from '@/constants/labels';
import { useAsync } from '@/hooks/useAsync';
import { errorMessage } from '@/lib/errors';
import { formatDistance } from '@/lib/format';
import { confirmBlock, openReport } from '@/lib/safetyActions';
import { colors, spacing, type } from '@/theme';

type Props = {
  group: GroupDetail;
  userId: string;
  refreshing: boolean;
  onRefresh: () => void;
  /** Re-fetch the group after a change (join, approve, remove). */
  onChanged: () => Promise<void>;
};

export function GroupAbout({ group, userId, refreshing, onRefresh, onChanged }: Props) {
  const isManager = group.my_role === 'host' || group.my_role === 'cohost';
  const requests = useAsync(() => fetchGroupRequests(group.id), [group.id, group.member_count], isManager);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<{ title?: string; actions: SheetAction[] } | null>(null);

  const act = async (key: string, task: () => Promise<unknown>) => {
    setBusy(key);
    setError(null);
    try {
      await task();
      await Promise.all([onChanged(), isManager ? requests.silent() : Promise.resolve()]);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const join = () =>
    act('join', async () => {
      const result = await joinGroup(group.id);
      if (result === 'requested') {
        Alert.alert('Request sent', 'A host will review your request. You will see the chat once you are approved.');
      }
    });

  const leave = () =>
    Alert.alert(
      'Leave this group?',
      group.my_role === 'host'
        ? 'You are the host. Hosting passes to a co-host or the longest-standing member. If you are the only member, the group is archived.'
        : 'You will lose access to the chat. You can rejoin later if the group allows it.',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Leave group',
          style: 'destructive',
          onPress: () =>
            act('leave', async () => {
              await leaveGroup(group.id);
              router.back();
            }),
        },
      ],
    );

  const confirmRemove = (m: GroupMember) =>
    Alert.alert(`Remove ${m.display_name}?`, 'They will be removed from the group and cannot rejoin.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => act(`remove-${m.user_id}`, () => removeMember(group.id, m.user_id)),
      },
    ]);

  const openMemberMenu = (m: GroupMember) => {
    const actions: SheetAction[] = [];
    if (isManager && m.role !== 'host') {
      actions.push({ label: 'Remove from group', destructive: true, onPress: () => confirmRemove(m) });
    }
    actions.push({ label: 'Report player', onPress: () => openReport('user', m.user_id, m.display_name) });
    actions.push({
      label: `Block ${m.display_name}`,
      destructive: true,
      onPress: () => confirmBlock(m.user_id, m.display_name),
    });
    setSheet({ title: m.display_name, actions });
  };

  const distance = group.format === 'in_person' ? formatDistance(group.distance_km) : null;
  const sportName = labelFor(sportLabels, group.sport);

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.hero}>
          <SportIcon sport={group.sport} size={56} outlined />
          <View style={styles.heroText}>
            <Text style={type.title}>{group.name}</Text>
            <Text style={type.callout}>
              {sportName} {'·'} {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
            </Text>
          </View>
        </View>
        <TagList tags={group.tags} />
        {error ? <Banner tone="error" message={error} /> : null}

        {!group.is_member ? (
          group.has_requested ? (
            <Banner message="Request sent. A host will review it soon." />
          ) : (
            <Button
              title={group.visibility === 'request' ? 'Request to join' : 'Join group'}
              onPress={join}
              loading={busy === 'join'}
            />
          )
        ) : null}

        <Card style={styles.info}>
          <InfoRow
            icon={group.format === 'remote' ? 'globe-outline' : 'location-outline'}
            label="Format"
            value={`${labelFor(groupFormatLabels, group.format)} in ${group.city}${
              group.format === 'in_person' ? `, within ${group.radius_km} km` : ''
            }${distance ? ` (${distance})` : ''}`}
          />
          <InfoRow icon="lock-open-outline" label="Visibility" value={labelFor(groupVisibilityLabels, group.visibility)} />
          <InfoRow icon="person-outline" label="Who can join" value={labelFor(genderRuleLabels, group.gender_rule)} />
          <InfoRow icon="calendar-number-outline" label="Minimum age" value={`${group.min_age}+`} />
          {group.games_this_week > 0 ? (
            <InfoRow icon="football-outline" label="This week" value={`${group.games_this_week} games`} />
          ) : null}
        </Card>

        {isManager && group.join_code ? (
          <CodeShareCard
            title="Group join code"
            code={group.join_code}
            hint="Anyone with this code can join, as long as they meet the age and gender settings."
            shareMessage={`Join ${group.name} on Beacon. Open Beacon, go to Groups, tap Join with code and enter ${group.join_code}.`}
          />
        ) : null}

        {isManager && (requests.data?.length ?? 0) > 0 ? (
          <>
            <SectionTitle>{`Requests (${requests.data?.length ?? 0})`}</SectionTitle>
            <Card style={styles.list}>
              {(requests.data ?? []).map((r, i, all) => (
                <View key={r.user_id} style={[styles.request, i < all.length - 1 && styles.divider]}>
                  <PersonRow name={r.display_name} detail="Asked to join" last />
                  <View style={styles.requestActions}>
                    <Button
                      title="Decline"
                      variant="outline"
                      compact
                      style={styles.flex}
                      loading={busy === `decline-${r.user_id}`}
                      onPress={() => act(`decline-${r.user_id}`, () => declineRequest(group.id, r.user_id))}
                    />
                    <Button
                      title="Approve"
                      compact
                      style={styles.flex}
                      loading={busy === `approve-${r.user_id}`}
                      onPress={() => act(`approve-${r.user_id}`, () => approveRequest(group.id, r.user_id))}
                    />
                  </View>
                </View>
              ))}
            </Card>
          </>
        ) : null}
        {isManager && requests.error ? (
          <Banner tone="error" message={requests.error} actionLabel="Retry" onAction={requests.reload} />
        ) : null}

        {group.is_member ? (
          <>
            <SectionTitle>{`Members (${group.members.length})`}</SectionTitle>
            <Card style={styles.list}>
              {group.members.map((m, i) => (
                <PersonRow
                  key={m.user_id}
                  name={m.user_id === userId ? `${m.display_name} (you)` : m.display_name}
                  detail={m.role !== 'member' ? labelFor(roleLabels, m.role) : undefined}
                  onMore={m.user_id === userId ? undefined : () => openMemberMenu(m)}
                  last={i === group.members.length - 1}
                  right={busy === `remove-${m.user_id}` ? <Text style={type.caption}>Removing</Text> : null}
                />
              ))}
            </Card>
          </>
        ) : null}

        <View style={styles.footer}>
          <Button
            title="Report group"
            icon="flag-outline"
            variant="outline"
            onPress={() => openReport('group', group.id, group.name)}
          />
          {group.is_member ? (
            <Button title="Leave group" variant="danger" onPress={leave} loading={busy === 'leave'} />
          ) : null}
        </View>
      </ScrollView>
      <ActionSheet
        visible={sheet !== null}
        title={sheet?.title}
        actions={sheet?.actions ?? []}
        onClose={() => setSheet(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl * 2 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroText: { flex: 1, gap: 2 },
  info: { gap: spacing.md },
  list: { paddingVertical: spacing.xs },
  request: { paddingBottom: spacing.md },
  requestActions: { flexDirection: 'row', gap: spacing.sm },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  flex: { flex: 1 },
  footer: { gap: spacing.sm, marginTop: spacing.lg },
});
