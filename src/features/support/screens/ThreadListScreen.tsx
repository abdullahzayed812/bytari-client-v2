import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { IconButton } from '@/components/actions';
import { Chip } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useCapabilities } from '@/hooks';
import { useTheme } from '@/theme';

import { ThreadCard, ThreadCardSkeleton } from '../components';
import { SUPPORT_KIND_META, kindFromSlug } from '../constants';
import { useMyThreads } from '../hooks';
import type { Thread, ThreadStatus } from '../types';

/** Route `/support/[kind]` — the caller's own consultations / inquiries. */
export default function ThreadListScreen() {
  const theme = useTheme();
  const { t } = useTranslation('support');
  const caps = useCapabilities();
  const { kind: slug } = useLocalSearchParams<{ kind: string }>();
  const kind = kindFromSlug(slug);
  const [status, setStatus] = useState<ThreadStatus | undefined>(undefined);

  const q = useMyThreads(kind ?? 'CONSULTATION', { status, enabled: Boolean(kind) });

  if (!kind) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('list.title.CONSULTATION')} showBack />
        <EmptyState icon="help-circle-outline" title={t('list.unknownKind')} />
      </SafeAreaScreen>
    );
  }

  const meta = SUPPORT_KIND_META[kind];
  const canManage =
    caps.isAdmin || caps.isSupervisorOf(meta.supervisorDomain) || caps.can(meta.adminReadPerm);
  const goDetail = (thread: Thread) => router.push(Routes.supportThread(meta.slug, thread.id));

  const header = (
    <View style={{ paddingBottom: theme.spacing.md, rowGap: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
        <Chip label={t('list.filterAll')} selected={!status} onPress={() => setStatus(undefined)} />
        <Chip
          label={t('status.OPEN')}
          selected={status === 'OPEN'}
          onPress={() => setStatus((s) => (s === 'OPEN' ? undefined : 'OPEN'))}
        />
        <Chip
          label={t('status.CLOSED')}
          selected={status === 'CLOSED'}
          onPress={() => setStatus((s) => (s === 'CLOSED' ? undefined : 'CLOSED'))}
        />
      </View>
      {canManage ? (
        <Chip
          icon="shield-checkmark-outline"
          label={t('list.manageCta')}
          onPress={() => router.push(Routes.supportManage(meta.slug))}
        />
      ) : null}
      {q.total > 0 ? <Caption>{t('list.count', { count: q.total })}</Caption> : null}
    </View>
  );

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t(`list.title.${kind}`)}
        showBack
        right={
          <IconButton
            icon="add"
            variant="soft"
            accessibilityLabel={t('list.createCta')}
            onPress={() => router.push(Routes.supportCreate(meta.slug))}
          />
        }
      />

      {q.isLoading ? (
        <View
          style={{
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.md,
            rowGap: theme.spacing.md,
          }}
        >
          {header}
          {[0, 1, 2].map((i) => (
            <ThreadCardSkeleton key={i} />
          ))}
        </View>
      ) : q.isError ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          {header}
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.threads}
          keyExtractor={(x) => x.id}
          renderItem={({ item }) => <ThreadCard thread={item} onPress={() => goDetail(item)} />}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState
              icon={meta.icon}
              title={status ? t('list.emptyFiltered') : t(`list.empty.${kind}`)}
              message={status ? undefined : t('list.emptyHint')}
              actionLabel={!status ? t('list.createCta') : undefined}
              onAction={!status ? () => router.push(Routes.supportCreate(meta.slug)) : undefined}
            />
          }
          ListFooterComponent={
            q.isFetchingNextPage ? <Loading label={t('common.loadingMore')} /> : null
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
