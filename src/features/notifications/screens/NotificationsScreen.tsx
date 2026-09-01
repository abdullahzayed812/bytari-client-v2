import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { IconButton } from '@/components/actions';
import { Chip } from '@/components/content';
import { EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { useTheme } from '@/theme';

import { NotificationCard } from '../components';
import { useMarkAllNotificationsRead, useNotifications, useOpenNotification } from '../hooks';

type Tab = 'all' | 'unread';

/** Route `/notifications` — the caller's own in-app notification inbox. */
export default function NotificationsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('notifications');
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('all');
  const open = useOpenNotification();
  const markAll = useMarkAllNotificationsRead();

  const q = useNotifications({ read: tab === 'unread' ? false : undefined });

  const onMarkAll = (): void => {
    markAll.mutate(undefined, {
      onSuccess: ({ updated }) =>
        toast.show({
          tone: updated > 0 ? 'success' : 'info',
          message: updated > 0 ? t('markAll.done', { count: updated }) : t('markAll.none'),
        }),
      onError: () => toast.show({ tone: 'danger', message: t('markAll.failed') }),
    });
  };

  const header = (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.xs,
        paddingBottom: theme.spacing.md,
      }}
    >
      <Chip label={t('filter.all')} selected={tab === 'all'} onPress={() => setTab('all')} />
      <Chip
        label={t('filter.unread')}
        selected={tab === 'unread'}
        onPress={() => setTab('unread')}
      />
      {q.total > 0 ? (
        <Caption style={{ alignSelf: 'center' }}>{t('count', { count: q.total })}</Caption>
      ) : null}
    </View>
  );

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('title')}
        showBack
        right={
          <IconButton
            icon="checkmark-done-outline"
            variant="plain"
            accessibilityLabel={t('markAll.cta')}
            disabled={markAll.isPending || q.total === 0}
            onPress={onMarkAll}
          />
        }
      />

      {q.isLoading ? (
        <View style={{ padding: theme.screenPadding }}>
          {header}
          <Loading label={t('loading')} />
        </View>
      ) : q.isError ? (
        <View style={{ padding: theme.screenPadding }}>
          {header}
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.items}
          keyExtractor={(n) => n.id}
          renderItem={({ item }) => (
            <NotificationCard notification={item} onPress={() => open(item)} />
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState
              icon="notifications-outline"
              title={tab === 'unread' ? t('empty.unreadTitle') : t('empty.title')}
              message={tab === 'unread' ? undefined : t('empty.message')}
            />
          }
          ListFooterComponent={q.isFetchingNextPage ? <Loading label={t('loadingMore')} /> : null}
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
