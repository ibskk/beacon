import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { Platform } from 'react-native';

import type { Game, Group } from '@/api/types';
import { colors, spacing } from '@/theme';

import { GameCard } from './GameCard';
import { GroupCard } from './GroupCard';
import { MapPin } from './MapPin';

type Props = {
  center: { lat: number; lng: number };
  games: Game[];
  groups: Group[];
  showsUserLocation: boolean;
  onOpenGame: (id: string) => void;
  onOpenGroup: (id: string) => void;
};

const DELTA = 0.18;

export function ExploreMap({ center, games, groups, showsUserLocation, onOpenGame, onOpenGroup }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const initialRegion = useMemo<Region>(
    () => ({ latitude: center.lat, longitude: center.lng, latitudeDelta: DELTA, longitudeDelta: DELTA }),
    [center.lat, center.lng],
  );

  // Remote groups have no place on the map.
  const mappedGroups = groups.filter((g) => g.format === 'in_person' && g.lat != null && g.lng != null);
  const selectedGame = games.find((g) => `game:${g.id}` === selected);
  const selectedGroup = mappedGroups.find((g) => `group:${g.id}` === selected);

  return (
    <View style={styles.fill}>
      <MapView
        style={styles.fill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={false}
        showsPointsOfInterests={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        onPress={() => setSelected(null)}
        accessibilityLabel="Map of games and groups"
      >
        {mappedGroups.map((g) => (
          <MapPin
            key={`group:${g.id}`}
            id={`group:${g.id}`}
            lat={g.lat as number}
            lng={g.lng as number}
            sport={g.sport}
            outlined
            selected={selected === `group:${g.id}`}
            title={`${g.name} group`}
            onPress={setSelected}
          />
        ))}
        {games.map((g) => (
          <MapPin
            key={`game:${g.id}`}
            id={`game:${g.id}`}
            lat={g.lat}
            lng={g.lng}
            sport={g.sport}
            outlined={false}
            selected={selected === `game:${g.id}`}
            title={`${g.venue_name} game`}
            onPress={setSelected}
          />
        ))}
      </MapView>
      {selectedGame ? (
        <View style={styles.preview}>
          <GameCard game={selectedGame} onPress={() => onOpenGame(selectedGame.id)} />
        </View>
      ) : null}
      {selectedGroup ? (
        <View style={styles.preview}>
          <GroupCard group={selectedGroup} onPress={() => onOpenGroup(selectedGroup.id)} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.page },
  preview: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
