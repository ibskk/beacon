import Ionicons from '@expo/vector-icons/Ionicons';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { isMapAvailable } from '@/lib/env';
import type { Coords } from '@/lib/location';
import { colors, radius, spacing, type } from '@/theme';

import { Button } from './Button';

type Props = {
  value: Coords;
  onChange: (coords: Coords) => void;
  /** Present when location is allowed; recentres the pin on the user. */
  onUseCurrent?: () => void;
  locating?: boolean;
  /** Key that, when changed, recentres the map (for example a new city). */
  centerKey: string;
  pinColor: string;
};

export function LocationPicker({ value, onChange, onUseCurrent, locating, centerKey, pinColor }: Props) {
  return (
    <View style={styles.wrap}>
      {isMapAvailable ? (
        <View style={styles.mapWrap}>
          <MapView
            key={centerKey}
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={{ latitude: value.lat, longitude: value.lng, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
            onPress={(e) => onChange({ lat: e.nativeEvent.coordinate.latitude, lng: e.nativeEvent.coordinate.longitude })}
            showsPointsOfInterests={false}
            toolbarEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            accessibilityLabel="Map for choosing the venue location. Tap or drag the pin to move it."
          >
            <Marker
              coordinate={{ latitude: value.lat, longitude: value.lng }}
              draggable
              pinColor={pinColor}
              onDragEnd={(e) =>
                onChange({ lat: e.nativeEvent.coordinate.latitude, lng: e.nativeEvent.coordinate.longitude })
              }
            />
          </MapView>
        </View>
      ) : (
        <View style={styles.noMap}>
          <Ionicons name="location" size={20} color={colors.ink2} />
          <Text style={type.callout}>
            Pin set at {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
          </Text>
        </View>
      )}
      <Text style={type.caption}>
        {isMapAvailable ? 'Tap the map or drag the pin to the exact spot players should meet.' : 'Players get directions to this point.'}
      </Text>
      {onUseCurrent ? (
        <Button
          title="Use my current location"
          icon="navigate-outline"
          variant="outline"
          compact
          onPress={onUseCurrent}
          loading={locating}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  mapWrap: { height: 200, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  map: { flex: 1 },
  noMap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
});
