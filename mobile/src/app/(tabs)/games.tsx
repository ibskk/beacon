import { router } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { fetchMyGames } from '@/api/games';
import type { Game } from '@/api/types';
import { Button } from '@/components/Button';
import { GameCard } from '@/components/GameCard';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';
import { useAsync } from '@/hooks/useAsync';
import { useFocusRefresh } from '@/hooks/useFocusRefresh';
import { spacing } from '@/theme';

// my_games also returns games that ended in the last 24 hours; this tab lists upcoming ones.
function notEnded(game: Game): boolean {
  return new Date(game.starts_at).getTime() + game.duration_min * 60_000 > Date.now();
}

export default function GamesScreen() {
  const games = useAsync(fetchMyGames, []);
  useFocusRefresh(games.silent);

  const upcoming = useMemo(() => (games.data ?? []).filter(notEnded), [games.data]);

  let body;
  if (games.loading && !games.data) {
    body = <LoadingState label="Loading your games" />;
  } else if (games.error && !games.data) {
    body = <ErrorState message={games.error} onRetry={games.reload} />;
  } else {
    body = (
      <FlatList
        data={upcoming}
        keyExtractor={(g) => g.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        refreshControl={<RefreshControl refreshing={games.refreshing} onRefresh={games.refresh} />}
        renderItem={({ item }) => (
          <GameCard game={item} onPress={() => router.push({ pathname: '/game/[id]', params: { id: item.id } })} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title="No upcoming games"
            message="Games you join or host show up here. Find one on Explore or host your own."
            actionLabel="Host a game"
            onAction={() => router.push('/game/new')}
          />
        }
      />
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title="My games"
        right={<IconButton icon="add" label="Host a game" onPress={() => router.push('/game/new')} filled />}
      />
      <View style={styles.actions}>
        <Button
          title="Join with code"
          icon="keypad-outline"
          variant="outline"
          compact
          onPress={() => router.push({ pathname: '/join-code', params: { kind: 'game' } })}
        />
      </View>
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  list: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  sep: { height: spacing.sm },
});
