import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

import type { Sport } from '@/constants/enums';
import { colors, sportColors } from '@/theme';

import { sportIconNames } from './SportIcon';

type Props = {
  id: string;
  lat: number;
  lng: number;
  sport: Sport;
  /** Groups render as outlined pins, games as filled. */
  outlined: boolean;
  selected: boolean;
  title: string;
  onPress: (id: string) => void;
};

export function MapPin({ id, lat, lng, sport, outlined, selected, title, onPress }: Props) {
  // Custom marker views must track changes until laid out, then stop for performance.
  const [tracks, setTracks] = useState(true);
  useEffect(() => {
    setTracks(true);
    const t = setTimeout(() => setTracks(false), 600);
    return () => clearTimeout(t);
  }, [selected]);

  const color = sportColors[sport] ?? colors.ink2;
  const size = selected ? 40 : 32;

  return (
    <Marker
      identifier={id}
      coordinate={{ latitude: lat, longitude: lng }}
      onPress={(e) => {
        e.stopPropagation();
        onPress(id);
      }}
      tracksViewChanges={tracks}
      anchor={{ x: 0.5, y: 0.5 }}
      accessibilityLabel={title}
      zIndex={selected ? 10 : outlined ? 1 : 2}
    >
      <View
        style={[
          styles.pin,
          { width: size, height: size, borderRadius: size / 2 },
          outlined
            ? { backgroundColor: colors.card, borderColor: color, borderWidth: 3 }
            : { backgroundColor: color, borderColor: colors.white, borderWidth: 2 },
          selected && styles.selected,
        ]}
      >
        <Ionicons name={sportIconNames[sport] ?? 'ellipse'} size={size * 0.5} color={outlined ? color : colors.white} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  pin: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  selected: { borderColor: colors.ink },
});
