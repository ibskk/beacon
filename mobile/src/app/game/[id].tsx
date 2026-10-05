import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { cancelGame, checkIn, fetchGameDetail, joinGame, leaveGame } from '@/api/games';
import { fetchMyProfile } from '@/api/profiles';
import type { GameDetail, RosterEntry } from '@/api/types';
import { ActionSheet, type SheetAction } from '@/components/ActionSheet';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CodeShareCard } from '@/components/CodeShareCard';
import { IconButton } from '@/components/IconButton';
import { InfoRow } from '@/components/InfoRow';
import { PersonRow } from '@/components/PersonRow';
import { SectionTitle } from '@/components/SectionTitle';
import { SportIcon } from '@/components/SportIcon';
import { ErrorState, LoadingState } from '@/components/States';
import { TagList } from '@/components/TagList';
import { genderRuleLabels, labelFor, levelLabels, sportLabels } from '@/constants/labels';
import { useUserId } from '@/context/AuthProvider';
import { useAsync } from '@/hooks/useAsync';
import { errorMessage } from '@/lib/errors';
import { formatDistance, formatDuration, formatGameTime } from '@/lib/format';
import { openDirections } from '@/lib/links';
import { getCurrentCoords, getPermissionState, requestPermission } from '@/lib/location';
import { confirmBlock, openReport } from '@/lib/safetyActions';
import { colors, spacing, type } from '@/theme';

type Busy = 'join' | 'leave' | 'checkin' | 'cancel' | null;

function hasEnded(game: GameDetail): boolean {
  return new Date(game.starts_at).getTime() + game.duration_min * 60_000 <= Date.now();
}

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useUserId();
  const detail = useAsync(() => fetchGameDetail(id), [id], Boolean(id));
  // The App Review account checks in without location; the server verifies the flag.
  const profile = useAsync(() => fetchMyProfile(userId), [userId], Boolean(userId));
  const isReviewer = profile.data?.is_reviewer === true;
  const [busy, setBusy] = useState<Busy>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<{ title?: string; actions: SheetAction[] } | null>(null);

  const game = detail.data;

  const run = useCallback(
    async (kind: Exclude<Busy, null>, task: () => Promise<void>) => {
      setBusy(kind);
      setActionError(null);
      try {
        await task();
        await detail.silent();
      } catch (e) {
        setActionError(errorMessage(e));
      } finally {
        setBusy(null);
      }
    },
    [detail],
  );

  if (detail.loading && !game) return <LoadingState label="Loading game" />;
  if (detail.error && !game) return <ErrorState message={detail.error} onRetry={detail.reload} />;
  if (!game) {
    return (
      <ErrorState message="This game is no longer available. It may have been cancelled." onRetry={detail.reload} />
    );
  }

  const sportName = labelFor(sportLabels, game.sport);
  const cancelled = game.status === 'cancelled';
  const ended = hasEnded(game);
  const active = !cancelled && !ended;
  const left = Math.max(0, game.spots_total - game.spots_taken);
  const canSeeRoster = game.is_host || game.is_joined;
  const distance = formatDistance(game.distance_km);

  const join = () =>
    run('join', () => joinGame(game.id));

  const leave = () =>
    Alert.alert('Leave this game?', 'Your spot will open up for someone else.', [
      { text: 'Stay', style: 'cancel' },
      {
        text: 'Leave game',
        style: 'destructive',
        onPress: () =>
          run('leave', () => leaveGame(game.id)),
      },
    ]);

  const cancel = () =>
    Alert.alert('Cancel this game?', 'Everyone who joined will see it as cancelled. This cannot be undone.', [
      { text: 'Keep game', style: 'cancel' },
      {
        text: 'Cancel game',
        style: 'destructive',
        onPress: () =>
          run('cancel', async () => {
            await cancelGame(game.id);
            router.back();
          }),
      },
    ]);

  const doCheckIn = () =>
    run('checkin', async () => {
      if (isReviewer) {
        await checkIn(game.id, null);
        Alert.alert('You are checked in', 'Have a great game.');
        return;
      }
      let { state } = await getPermissionState();
      if (state !== 'granted') state = (await requestPermission()).state;
      if (state !== 'granted') {
        throw new Error('Check-in needs your location while the app is open. Turn on location for Beacon in Settings.');
      }
      const coords = await getCurrentCoords(true);
      if (!coords) throw new Error('Could not get your location. Move outside or try again in a moment.');
      await checkIn(game.id, coords);
      Alert.alert('You are checked in', 'Have a great game.');
    });

  const openMenu = () => {
    const actions: SheetAction[] = [
      { label: 'Report game', onPress: () => openReport('game', game.id, `${sportName} at ${game.venue_name}`) },
    ];
    if (!game.is_host) {
      actions.push({
        label: `Block ${game.host_name}`,
        destructive: true,
        onPress: () => confirmBlock(game.host_id, game.host_name, () => router.back()),
      });
    }
    setSheet({ actions });
  };

  const openPlayerMenu = (p: RosterEntry) =>
    setSheet({
      title: p.display_name,
      actions: [
        { label: 'Report player', onPress: () => openReport('user', p.user_id, p.display_name) },
        {
          label: `Block ${p.display_name}`,
          destructive: true,
          onPress: () => confirmBlock(p.user_id, p.display_name, () => detail.silent()),
        },
      ],
    });

  return (
    <>
      <Stack.Screen
        options={{
          title: sportName,
          headerRight: () => <IconButton icon="ellipsis-horizontal" label="More options" onPress={openMenu} />,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={detail.refreshing} onRefresh={detail.refresh} />}
      >
        <View style={styles.hero}>
          <SportIcon sport={game.sport} size={56} />
          <View style={styles.heroText}>
            <Text style={type.title}>{game.venue_name}</Text>
            <Text style={type.callout}>
              {sportName}
              {game.city ? ` · ${game.city}` : ''}
              {distance ? ` · ${distance}` : ''}
            </Text>
          </View>
        </View>
        <TagList tags={game.tags} />

        {cancelled ? <Banner tone="error" message="This game was cancelled by the host." /> : null}
        {!cancelled && ended ? <Banner message="This game has ended." /> : null}
        {actionError ? <Banner tone="error" message={actionError} /> : null}

        <Card style={styles.info}>
          <InfoRow icon="time-outline" label="When" value={formatGameTime(game.starts_at, game.duration_min)} />
          <InfoRow icon="hourglass-outline" label="Duration" value={formatDuration(game.duration_min)} />
          <InfoRow
            icon="people-outline"
            label="Spots"
            value={`${game.spots_taken} of ${game.spots_total} taken${left === 0 ? ' (full)' : `, ${left} open`}`}
          />
          <InfoRow icon="speedometer-outline" label="Level" value={labelFor(levelLabels, game.level)} />
          <InfoRow icon="person-outline" label="Who can join" value={labelFor(genderRuleLabels, game.gender_rule)} />
          <InfoRow icon="star-outline" label="Host" value={game.is_host ? `${game.host_name} (you)` : game.host_name} />
        </Card>

        <View style={styles.actions}>
          {active && !game.is_joined && !game.is_host ? (
            <Button
              title={left === 0 ? 'Game is full' : 'Join game'}
              onPress={join}
              loading={busy === 'join'}
              disabled={left === 0}
            />
          ) : null}
          {active && game.is_joined && !game.checked_in ? (
            <Button
              title="Check in"
              icon="location-outline"
              variant="dark"
              onPress={doCheckIn}
              loading={busy === 'checkin'}
              accessibilityHint="Uses your current location to confirm you are at the venue"
            />
          ) : null}
          {game.checked_in ? <Banner message="You are checked in." /> : null}
          <Button
            title="Directions"
            icon="navigate-outline"
            variant="outline"
            onPress={() => openDirections(game.lat, game.lng, game.venue_name)}
          />
          {active && game.is_joined && !game.is_host ? (
            <Button title="Leave game" variant="danger" onPress={leave} loading={busy === 'leave'} />
          ) : null}
        </View>
        {active && game.is_joined && !game.checked_in ? (
          <Text style={type.caption}>
            Check-in opens 30 minutes before start. You need to be at the venue; your location is only used for this
            check and is not stored.
          </Text>
        ) : null}

        {game.is_host && game.join_code && active ? (
          <CodeShareCard
            title="Join code"
            code={game.join_code}
            hint="Anyone with this code can join, even if the game is not public."
            shareMessage={`Join my ${sportName.toLowerCase()} game at ${game.venue_name} on Beacon (${formatGameTime(
              game.starts_at,
            )}). Open Beacon, go to Games, tap Join with code and enter ${game.join_code}.`}
          />
        ) : null}

        {canSeeRoster ? (
          <>
            <SectionTitle>{`Players (${game.roster.length})`}</SectionTitle>
            <Card style={styles.roster}>
              {game.roster.length === 0 ? (
                <Text style={type.callout}>No players yet.</Text>
              ) : (
                game.roster.map((p, i) => (
                  <PersonRow
                    key={p.user_id}
                    name={p.user_id === userId ? `${p.display_name} (you)` : p.display_name}
                    detail={p.user_id === game.host_id ? 'Host' : undefined}
                    right={p.checked_in ? <Text style={styles.checked}>Checked in</Text> : null}
                    onMore={p.user_id === userId ? undefined : () => openPlayerMenu(p)}
                    last={i === game.roster.length - 1}
                  />
                ))
              )}
            </Card>
          </>
        ) : null}

        {game.is_host && active ? (
          <Button title="Cancel game" variant="danger" onPress={cancel} loading={busy === 'cancel'} style={styles.cancel} />
        ) : null}
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
  actions: { gap: spacing.sm },
  roster: { paddingVertical: spacing.xs },
  checked: { fontSize: 12, fontWeight: '700', color: colors.ink2 },
  cancel: { marginTop: spacing.lg },
});
