import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { fetchMyGroups, fetchNearbyGroups } from '@/api/groups';
import type { Group } from '@/api/types';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { CityPicker } from '@/components/CityPicker';
import { GroupCard } from '@/components/GroupCard';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SegmentedControl } from '@/components/SegmentedControl';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';
import { DEFAULT_CITY } from '@/constants/cities';
import { useAsync } from '@/hooks/useAsync';
import { useDeviceLocation } from '@/hooks/useDeviceLocation';
import { useFocusRefresh } from '@/hooks/useFocusRefresh';
import { spacing } from '@/theme';

type Tab = 'mine' | 'discover';

export default function GroupsScreen() {
  const [tab, setTab] = useState<Tab>('mine');
  const [pickedCity, setPickedCity] = useState<string | null>(null);
  const [pickingCity, setPickingCity] = useState(false);
  const location = useDeviceLocation();
  const coords = location.coords;
  const locReady = location.permission !== 'checking' && !location.locating;
  const useCoords = coords && !pickedCity;
  // Same rule as Explore: nearby first, then the chosen city (Toronto by default) when nothing is
  // nearby, so users outside a launch city still see real groups instead of an empty list.
  const city = pickedCity ?? DEFAULT_CITY.name;

  const mine = useAsync(fetchMyGroups, []);
  const discover = useAsync(
    async () => {
      if (useCoords) {
        const nearby = await fetchNearbyGroups({ coords, city });
        if (nearby.some((g) => !g.is_member)) return { groups: nearby, inCity: false };
      }
      return { groups: await fetchNearbyGroups({ coords: null, city }), inCity: true };
    },
    [useCoords, coords?.lat, coords?.lng, city],
    tab === 'discover' && locReady,
  );
  const showingCity = discover.data?.inCity ?? !useCoords;
  const active = tab === 'mine' ? mine : discover;
  useFocusRefresh(active.silent);

  // Discover hides groups the user already belongs to; those live under My groups.
  const list = useMemo<Group[]>(
    () => (tab === 'mine' ? (mine.data ?? []) : (discover.data?.groups ?? []).filter((g) => !g.is_member)),
    [tab, mine.data, discover.data],
  );

  const open = (id: string) => router.push({ pathname: '/group/[id]', params: { id } });

  let body;
  if (active.loading && !active.data) {
    body = <LoadingState label="Loading groups" />;
  } else if (active.error && !active.data) {
    body = <ErrorState message={active.error} onRetry={active.reload} />;
  } else {
    body = (
      <FlatList
        data={list}
        keyExtractor={(g) => g.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        refreshControl={<RefreshControl refreshing={active.refreshing} onRefresh={active.refresh} />}
        renderItem={({ item }) => <GroupCard group={item} onPress={() => open(item.id)} />}
        ListHeaderComponent={
          tab === 'discover' && showingCity ? (
            <View style={styles.banner}>
              <Banner message={`Showing groups in ${city}`} actionLabel="Change" onAction={() => setPickingCity(true)} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          tab === 'mine' ? (
            <EmptyState
              icon="people-outline"
              title="You are not in any groups yet"
              message="Groups are regular crews with a chat. Find one in Discover or start your own."
              actionLabel="Create a group"
              onAction={() => router.push('/group/new')}
            />
          ) : (
            <EmptyState
              icon="search-outline"
              title="No groups nearby yet"
              message="Start one and players in your area can find it here."
              actionLabel="Create a group"
              onAction={() => router.push('/group/new')}
            />
          )
        }
      />
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title="Groups"
        right={<IconButton icon="add" label="Create a group" onPress={() => router.push('/group/new')} filled />}
      />
      <View style={styles.controls}>
        <SegmentedControl
          segments={[
            { value: 'mine', label: 'My groups' },
            { value: 'discover', label: 'Discover' },
          ]}
          value={tab}
          onChange={setTab}
        />
        <View style={styles.row}>
          <Button
            title="Join with code"
            icon="keypad-outline"
            variant="outline"
            compact
            onPress={() => router.push({ pathname: '/join-code', params: { kind: 'group' } })}
          />
          {tab === 'discover' && !showingCity ? (
            <Button title="Browse a city" icon="business-outline" variant="outline" compact onPress={() => setPickingCity(true)} />
          ) : null}
        </View>
      </View>
      {body}
      <CityPicker
        visible={pickingCity}
        selected={city}
        onSelect={setPickedCity}
        onClose={() => setPickingCity(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  controls: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  list: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  sep: { height: spacing.sm },
  banner: { marginBottom: spacing.md },
});
