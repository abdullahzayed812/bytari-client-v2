import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import { Chip } from '@/components/content';
import { ConversationCard, useConversations } from '@/features/chat';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { Routes } from '@/constants/routes';
import { AppHeader } from '@/components/navigation';
import { useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import { VeterinaryOfficeDashboardShell } from '../components';

type Filter = 'all' | 'unread';

/** Route `/vet-office-dashboard/[organizationId]/conversations` — "المحادثات". */
export default function VeterinaryOfficeConversationsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryOfficeDashboard');
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const [filter, setFilter] = useState<Filter>('all');

  const q = useConversations({ organizationId: orgId });
  const items = useMemo(
    () =>
      q.conversations.filter((c) => {
        if (filter === 'unread' && !((c.unreadCount ?? 0) > 0)) return false;
        return true;
      }),
    [q.conversations, filter],
  );

  return (
    <VeterinaryOfficeDashboardShell organizationId={orgId} active="home">
      <AppHeader title={t('conversations.title')} showBack />

      <View style={{ paddingHorizontal: theme.screenPadding, paddingBottom: theme.spacing.md, rowGap: theme.spacing.sm }}>
        <SearchInput
          value={rawSearch}
          onChangeText={setRawSearch}
          onClear={() => setRawSearch('')}
          placeholder={t('conversations.searchPlaceholder')}
          accessibilityLabel={t('conversations.searchPlaceholder')}
        />
        <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
          <Chip
            label={t('conversations.filterUnread')}
            selected={filter === 'unread'}
            onPress={() => setFilter('unread')}
          />
          <Chip
            label={t('conversations.filterAll')}
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
          />
        </View>
      </View>

      {q.isLoading ? (
        <View style={{ paddingHorizontal: theme.screenPadding }}>
          <Loading />
        </View>
      ) : q.isError ? (
        <View style={{ paddingHorizontal: theme.screenPadding }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <ConversationCard conversation={item} onPress={() => router.push(Routes.chatThread(item.id))} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title={t('conversations.empty')}
              message={t('conversations.emptyHint')}
            />
          }
          contentContainerStyle={{
            paddingHorizontal: theme.screenPadding,
            paddingBottom: theme.spacing.huge,
            rowGap: theme.spacing.md,
            flexGrow: 1,
          }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage();
          }}
        />
      )}
    </VeterinaryOfficeDashboardShell>
  );
}
