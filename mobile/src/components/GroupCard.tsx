import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Group } from '@/api/types';
import { groupFormatLabels, labelFor, roleLabels, sportLabels } from '@/constants/labels';
import { formatDistance } from '@/lib/format';
import { colors, radius, spacing, type } from '@/theme';

import { SportIcon } from './SportIcon';
import { TagList } from './TagList';

export function GroupCard({ group, onPress }: { group: Group; onPress: () => void }) {
  const distance = group.format === 'in_person' ? formatDistance(group.distance_km) : null;
  const status = group.is_member
    ? group.my_role && group.my_role !== 'member'
      ? labelFor(roleLabels, group.my_role)
      : 'Member'
    : group.has_requested
      ? 'Requested'
      : null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${group.name}, ${labelFor(sportLabels, group.sport)} group, ${group.member_count} members`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <SportIcon sport={group.sport} size={44} outlined />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[type.headline, styles.title]} numberOfLines={1}>
            {group.name}
          </Text>
          {status ? (
            <View style={styles.status}>
              <Text style={styles.statusText}>{status}</Text>
            </View>
          ) : null}
        </View>
        <Text style={type.callout} numberOfLines={1}>
          {labelFor(sportLabels, group.sport)} · {labelFor(groupFormatLabels, group.format)} · {group.city}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="people-outline" size={14} color={colors.ink3} />
          <Text style={type.caption}>
            {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
            {group.games_this_week > 0 ? ` · ${group.games_this_week} games this week` : ''}
            {distance ? ` · ${distance}` : ''}
          </Text>
        </View>
        <TagList tags={group.tags} extra={group.min_age > 18 ? [`${group.min_age}+`] : []} />
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
  status: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm - 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  statusText: { fontSize: 11, fontWeight: '700', color: colors.ink2 },
});
