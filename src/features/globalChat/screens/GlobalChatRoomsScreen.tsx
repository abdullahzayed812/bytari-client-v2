import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { IconButton } from '@/components/actions';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import { ChatRoomCard } from '../components';
import { useChatRooms } from '../hooks';

/**
 * Route `/(app)/global-chat` — public discussion rooms. Replaces the vet-mode
 * Home chat box's previous destination (`/chat`, the 1:1 conversation list),
 * which is still reachable via the header's "1:1" icon so nothing is lost.
 */
export default function GlobalChatRoomsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('globalChat');
  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const q = useChatRooms({ search: search || undefined });

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('list.title')}
        showBack
        right={
          <IconButton
            icon="chatbox-ellipses-outline"
            variant="soft"
            accessibilityLabel={t('list.directChatA11y')}
            onPress={() => router.push(Routes.chat)}
          />
        }
      />

      <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
        <SearchInput
          value={rawSearch}
          onChangeText={setRawSearch}
          onClear={() => setRawSearch('')}
          placeholder={t('list.searchPlaceholder')}
        />
      </View>

      {q.isLoading ? (
        <View style={{ padding: theme.screenPadding }}>
          <Loading label={t('list.loading')} />
        </View>
      ) : q.isError ? (
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.rooms}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => (
            <ChatRoomCard room={item} onPress={() => router.push(Routes.globalChatRoom(item.id))} />
          )}
          ListHeaderComponent={
            q.total > 0 ? (
              <Caption style={{ paddingBottom: theme.spacing.sm }}>
                {t('list.count', { count: q.total })}
              </Caption>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title={t('list.emptyTitle')}
              message={t('list.emptyMessage')}
            />
          }
          ListFooterComponent={q.isFetchingNextPage ? <Loading label={t('list.loadingMore')} /> : null}
          contentContainerStyle={{
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.md,
            paddingBottom: theme.spacing.huge,
            rowGap: theme.spacing.md,
            flexGrow: 1,
          }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage();
          }}
          refreshControl={
            <RefreshControl
              refreshing={q.isRefetching && !q.isFetchingNextPage}
              onRefresh={() => void q.refetch()}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}
    </SafeAreaScreen>
  );
}
