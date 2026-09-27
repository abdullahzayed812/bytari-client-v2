import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';

import { ConversationCard } from '../components';
import { useConversations } from '../hooks';

/**
 * Route `/chat` — the caller's conversations: every clinic / office / farm /
 * vet-marketplace thread plus the Global Chat rooms they have joined. Opened
 * from the Messages icon of BOTH the Pet Owner and Veterinarian Home headers.
 */
export default function ConversationListScreen() {
  const theme = useTheme();
  const { t } = useTranslation('chat');
  const q = useConversations();

  return (
    <SafeAreaScreen>
      <AppHeader title={t('list.title')} showBack />

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
          data={q.conversations}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <ConversationCard
              conversation={item}
              onPress={() =>
                // A joined Global Chat room opens its own room thread (pinned
                // message, member names, moderation) — same backing conversation.
                item.type === 'CHAT_ROOM' && item.organizationId
                  ? router.push(Routes.globalChatRoomThread(item.organizationId))
                  : router.push(Routes.chatThread(item.id))
              }
            />
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
          ListFooterComponent={
            q.isFetchingNextPage ? <Loading label={t('list.loadingMore')} /> : null
          }
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
