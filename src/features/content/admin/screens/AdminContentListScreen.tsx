import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { IconButton } from '@/components/actions';
import { Badge, Card, Chip } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import type { ContentStatus } from '../../types';
import { useAdminContentList } from '../hooks';

const STATUS_TONE: Record<ContentStatus, 'neutral' | 'success' | 'warning'> = {
  DRAFT: 'neutral',
  PUBLISHED: 'success',
  ARCHIVED: 'warning',
};

/** Route `/(app)/admin/veterinary-content/[type]` — MAGAZINE or BOOK content list. */
export default function AdminContentListScreen() {
  const theme = useTheme();
  const { t } = useTranslation('content');
  const { type } = useLocalSearchParams<{ type: 'MAGAZINE' | 'BOOK' }>();

  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const [status, setStatus] = useState<ContentStatus | undefined>();

  const q = useAdminContentList({ type, status, search });

  const header = (
    <View style={{ rowGap: theme.spacing.sm, paddingBottom: theme.spacing.md }}>
      <SearchInput
        value={rawSearch}
        onChangeText={setRawSearch}
        onClear={() => setRawSearch('')}
        placeholder={t('admin.list.searchPlaceholder')}
      />
      <View style={{ flexDirection: 'row', columnGap: theme.spacing.xs }}>
        <Chip label={t('admin.list.filterAll')} selected={!status} onPress={() => setStatus(undefined)} />
        <Chip
          label={t('admin.list.filterDraft')}
          selected={status === 'DRAFT'}
          onPress={() => setStatus('DRAFT')}
        />
        <Chip
          label={t('admin.list.filterPublished')}
          selected={status === 'PUBLISHED'}
          onPress={() => setStatus('PUBLISHED')}
        />
        <Chip
          label={t('admin.list.filterArchived')}
          selected={status === 'ARCHIVED'}
          onPress={() => setStatus('ARCHIVED')}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('admin.list.title', { type: t(`type.${type}`) })}
        showBack
        right={
          <IconButton
            icon="add"
            accessibilityLabel={t('admin.list.add')}
            onPress={() => router.push(Routes.adminVeterinaryContentCreate(type ?? 'MAGAZINE'))}
          />
        }
      />

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : (
        <FlatList
          data={q.items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card
              variant="outlined"
              padding="md"
              onPress={() =>
                router.push(Routes.adminVeterinaryContentDetail(item.type as 'MAGAZINE' | 'BOOK', item.id))
              }
              accessibilityLabel={item.title}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}>
                <View style={{ flex: 1, rowGap: 4 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Caption numberOfLines={1}>
                    {item.authorName ?? '—'} · {t('admin.list.commentCount', { count: item.commentCount })} ·{' '}
                    {t('admin.list.likeCount', { count: item.likeCount })}
                  </Caption>
                </View>
                <Badge
                  label={t(`admin.status.${item.status}`)}
                  tone={STATUS_TONE[item.status]}
                  size="sm"
                />
              </View>
            </Card>
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState
              icon="document-text-outline"
              title={t('admin.list.empty')}
              actionLabel={t('admin.list.add')}
              onAction={() => router.push(Routes.adminVeterinaryContentCreate(type ?? 'MAGAZINE'))}
            />
          }
          ListFooterComponent={
            q.isFetchingNextPage ? <Loading label={t('common.loadingMore')} /> : null
          }
          contentContainerStyle={{
            padding: theme.screenPadding,
            rowGap: theme.spacing.sm,
            flexGrow: 1,
            paddingBottom: theme.spacing.huge,
          }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage();
          }}
          refreshControl={
            <RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} />
          }
        />
      )}
    </SafeAreaScreen>
  );
}
