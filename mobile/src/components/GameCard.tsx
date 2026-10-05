import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Game } from '@/api/types';
import { labelFor, levelLabels, sportLabels } from '@/constants/labels';
import { formatDistance, formatGameTime } from '@/lib/format';
import { colors, radius, spacing, type } from '@/theme';

import { SportIcon } from './SportIcon';
import { TagList } from './TagList';

export function GameCard({ game, onPress }: { game: Game; onPress: () => void }) {
  const left = Math.max(0, game.spots_total - game.spots_taken);
  const distance = formatDistance(game.distance_km);
  const status = game.is_host ? 'Hosting' : game.is_joined ? 'Joined' : null;
  const sportName = labelFor(sportLabels, game.sport);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${sportName} at ${game.venue_name}, ${formatGameTime(game.starts_at)}, ${left} spots left`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <SportIcon sport={game.sport} size={44} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[type.headline, styles.title]} numberOfLines={1}>
            {game.venue_name}
          </Text>
          {status ? (
            <View style={styles.status}>
              <Text style={styles.statusText}>{status}</Text>
            </View>
          ) : null}
        </View>
        <Text style={type.callout} numberOfLines={1}>
          {sportName} · {formatGameTime(game.starts_at, game.duration_min)}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="people-outline" size={14} color={colors.ink3} />
          <Text style={type.caption}>
            {game.spots_taken}/{game.spots_total} {left === 0 ? '· Full' : `· ${left} left`}
            {distance ? ` · ${distance}` : ''}
          </Text>
        </View>
        <TagList tags={game.tags} extra={game.level !== 'any' ? [labelFor(levelLabels, game.level)] : []} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: spacing.md + 2,
  },
  pressed: { opacity: 0.85 },
  body: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flexShrink: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  status: { backgroundColor: colors.lime, borderRadius: radius.sm - 2, paddingHorizontal: 6, paddingVertical: 2 },
  statusText: { fontSize: 11, fontWeight: '700', color: colors.ink },
});
