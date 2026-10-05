import { router } from 'expo-router';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { fetchExplore, NEARBY_RADIUS_KM } from '@/api/explore';
import type { Game, Group } from '@/api/types';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { CityPicker } from '@/components/CityPicker';
import { ExploreMap } from '@/components/ExploreMap';
import { GameCard } from '@/components/GameCard';
import { GroupCard } from '@/components/GroupCard';
import { IconButton } from '@/components/IconButton';
import { LocationPrePrompt } from '@/components/LocationPrePrompt';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionTitle } from '@/components/SectionTitle';
import { SegmentedControl } from '@/components/SegmentedControl';
import { SportFilter } from '@/components/SportFilter';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';
import { DEFAULT_CITY, findCity } from '@/constants/cities';
import type { Sport } from '@/constants/enums';
import { useAsync } from '@/hooks/useAsync';
import { useDeviceLocation } from '@/hooks/useDeviceLocation';
import { useFocusRefresh } from '@/hooks/useFocusRefresh';
import { isMapAvailable } from '@/lib/env';
import { colors, spacing, type } from '@/theme';

type ViewMode = 'map' | 'list';

type Row =
  | { kind: 'title'; key: string; title: string }
  | { kind: 'game'; key: string; game: Game }
  | { kind: 'group'; key: string; group: Group }
  | { kind: 'noGames'; key: string };

export default function ExploreScreen() {
  const location = useDeviceLocation();
  const [mode, setMode] = useState<ViewMode>(isMapAvailable ? 'map' : 'list');
  const [sport, setSport] = useState<Sport | null>(null);
  const [city, setCity] = useState(DEFAULT_CITY.name);
  const [pickingCity, setPickingCity] = useState(false);

  const ready = location.permission !== 'checking' && location.permission !== 'undetermined' && !location.locating;
  const coords = location.coords;

  const explore = useAsync(() => fetchExplore({ coords, city, sport }), [coords?.lat, coords?.lng, city, sport], ready);
  useFocusRefresh(explore.silent);

  const openGame = useCallback((id: string) => router.push({ pathname: '/game/[id]', params: { id } }), []);
  const openGroup = useCallback((id: string) => router.push({ pathname: '/group/[id]', params: { id } }), []);
  const hostGame = useCallback(() => router.push('/game/new'), []);

  const result = explore.data;
  const rows = useMemo<Row[]>(() => {
    if (!result) return [];
    const out: Row[] = [{ kind: 'title', key: 't-games', title: 'Games' }];
    if (result.games.length === 0) out.push({ kind: 'noGames', key: 'no-games' });
    result.games.forEach((g) => out.push({ kind: 'game', key: `g-${g.id}`, game: g }));
    if (result.groups.length > 0) {
      out.push({ kind: 'title', key: 't-groups', title: 'Groups' });
      result.groups.forEach((g) => out.push({ kind: 'group', key: `gr-${g.id}`, group: g }));
    }
    return out;
  }, [result]);

  if (location.permission === 'undetermined') {
    return (
      <Screen>
        <LocationPrePrompt onContinue={location.request} />
      </Screen>
    );
  }

  const inCity = result?.source === 'city';
  const cityCenter = findCity(city);
  const mapCenter = !inCity && coords ? coords : { lat: cityCenter.lat, lng: cityCenter.lng };

  const header = (
    <View style={styles.headerBlock}>
      <ScreenHeader
        title="Explore"
        subtitle={result && !inCity ? `Within ${NEARBY_RADIUS_KM} km of you` : undefined}
        right={<IconButton icon="add" label="Host a game" onPress={hostGame} filled />}
      />
      <SportFilter value={sport} onChange={setSport} />
      {isMapAvailable || inCity ? (
        <View style={styles.controls}>
          {inCity ? (
            <Banner
              message={`Showing games in ${city}`}
              actionLabel="Change"
              onAction={() => setPickingCity(true)}
            />
          ) : null}
          {inCity && location.permission === 'denied' ? (
            <Pressable
              onPress={() => (location.canAskAgain ? location.request() : Linking.openSettings())}
              accessibilityRole="button"
              hitSlop={6}
            >
              <Text style={styles.settingsLink}>Use my location instead</Text>
            </Pressable>
          ) : null}
          {isMapAvailable ? (
            <SegmentedControl
              segments={[
                { value: 'map', label: 'Map' },
                { value: 'list', label: 'List' },
              ]}
              value={mode}
              onChange={setMode}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );

  let body: ReactNode;
  if (!result && (!ready || explore.loading)) {
    body = <LoadingState label="Loading games" />;
  } else if (explore.error && !result) {
    body = <ErrorState message={explore.error} onRetry={explore.reload} />;
  } else if (result && mode === 'map' && isMapAvailable) {
    body = (
      <View style={styles.fill}>
        <ExploreMap
          key={`${mapCenter.lat.toFixed(3)},${mapCenter.lng.toFixed(3)}`}
          center={mapCenter}
          games={result.games}
          groups={result.groups}
          showsUserLocation={location.permission === 'granted'}
          onOpenGame={openGame}
          onOpenGroup={openGroup}
        />
        {result.games.length === 0 ? (
          <View style={styles.mapEmpty}>
            <Text style={type.headline}>No games here yet. Host the first one.</Text>
            <Button title="Host a game" icon="add" onPress={hostGame} compact />
          </View>
        ) : null}
      </View>
    );
  } else {
    body = (
      <FlatList
        data={rows}
        keyExtractor={(r) => r.key}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={explore.refreshing} onRefresh={explore.refresh} />}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item }) => {
          switch (item.kind) {
            case 'title':
              return <SectionTitle>{item.title}</SectionTitle>;
            case 'game':
              return <GameCard game={item.game} onPress={() => openGame(item.game.id)} />;
            case 'group':
              return <GroupCard group={item.group} onPress={() => openGroup(item.group.id)} />;
            case 'noGames':
              return (
                <EmptyState
                  icon="football-outline"
                  title="No games here yet. Host the first one."
                  message="Pick a time and a spot, and players nearby will see it."
                  actionLabel="Host a game"
                  onAction={hostGame}
                />
              );
          }
        }}
      />
    );
  }

  return (
    <Screen>
      {header}
      {explore.error && result ? (
        <View style={styles.inlineError}>
          <Banner tone="error" message={explore.error} actionLabel="Retry" onAction={explore.reload} />
        </View>
      ) : null}
      {body}
      <CityPicker visible={pickingCity} selected={city} onSelect={setCity} onClose={() => setPickingCity(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  headerBlock: { gap: spacing.md, paddingBottom: spacing.md },
  controls: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  settingsLink: { fontSize: 14, fontWeight: '600', color: colors.ink, textDecorationLine: 'underline' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  sep: { height: spacing.sm },
  inlineError: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  mapEmpty: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
});
