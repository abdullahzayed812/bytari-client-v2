import { useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { Chip, Icon } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useCapabilities } from '@/hooks';
import { useTheme } from '@/theme';

import { supportKeys } from '../api';
import { AiSettingsCard, ThreadCard, ThreadCardSkeleton } from '../components';
import { SUPPORT_KIND_META, kindFromSlug } from '../constants';
import { useAdminThreads, useAdminUnreadCount } from '../hooks';
import type { Thread, ThreadStatus } from '../types';

/**
 * Route `/support/[kind]/manage` — the CONSULTATION / INQUIRY system-supervisor
 * (or ADMIN) review queue (`GET /admin/<slug>`). Visibility is gated on the
 * backend permission / supervisor domain; the backend re-authorises every call
 * and a CONSULTATION supervisor cannot open the inquiry queue and vice-versa.
 */
export default function AdminThreadListScreen() {
  const theme = useTheme();
  const { t } = useTranslation('support');
  const caps = useCapabilities();
  const { kind: slug } = useLocalSearchParams<{ kind: string }>();
  const kind = kindFromSlug(slug);
  const meta = kind ? SUPPORT_KIND_META[kind] : null;

  const authorized =
    Boolean(meta) &&
    (caps.isAdmin || caps.isSupervisorOf(meta!.supervisorDomain) || caps.can(meta!.adminReadPerm));

  const [status, setStatus] = useState<ThreadStatus | undefined>(undefined);
  const [onlyNew, setOnlyNew] = useState(false);
  const q = useAdminThreads(kind ?? 'CONSULTATION', {
    status,
    unread: onlyNew,
    enabled: authorized,
  });
  const unread = useAdminUnreadCount(kind ?? 'CONSULTATION', { enabled: authorized });
  const newCount = unread.data?.count ?? 0;

  // Opening a thread marks it reviewed server-side; coming back refreshes the
  // queue + counter (skipping the first focus, which the queries already load).
  const queryClient = useQueryClient();
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!kind || !authorized) return;
      if (focusedOnce.current) {
        void queryClient.invalidateQueries({ queryKey: supportKeys.adminLists(kind) });
      }
      focusedOnce.current = true;
    }, [authorized, kind, queryClient]),
  );

  if (!kind || !meta) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('manage.title.CONSULTATION')} showBack />
        <EmptyState icon="help-circle-outline" title={t('list.unknownKind')} />
      </SafeAreaScreen>
    );
  }

  if (!authorized) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t(`manage.title.${kind}`)} showBack />
        <EmptyState
          icon="lock-closed-outline"
          title={t('manage.deniedTitle')}
          message={t('manage.deniedBody')}
        />
      </SafeAreaScreen>
    );
  }

  const goDetail = (thread: Thread) => router.push(Routes.supportThread(meta.slug, thread.id));

  // The AI auto-reply switch lives with the queue it controls. SUPPORT has no AI.
  const canManageAi = kind !== 'SUPPORT' && (caps.isAdmin || caps.can('ai.settings.manage'));

  const header = (
    <View style={{ paddingBottom: theme.spacing.md, rowGap: theme.spacing.sm }}>
      {canManageAi ? (
        <AiSettingsCard
          only={kind === 'CONSULTATION' ? 'consultationAiEnabled' : 'inquiryAiEnabled'}
        />
      ) : null}
      {/* "New messages" counter — creator messages no responder has opened yet. */}
      <View
        accessibilityRole="summary"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.sm,
          padding: theme.spacing.md,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: newCount > 0 ? theme.colors.primary : theme.colors.border,
          backgroundColor: newCount > 0 ? theme.colors.primarySoft : theme.colors.surface,
        }}
      >
        <Icon
          name={newCount > 0 ? 'mail-unread-outline' : 'mail-open-outline'}
          size="iconMd"
          color={newCount > 0 ? 'primary' : 'textMuted'}
        />
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          {newCount > 0 ? t('manage.newCount', { count: newCount }) : t('manage.noNewMessages')}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
        <Chip
          label={t('list.filterAll')}
          selected={!status && !onlyNew}
          onPress={() => {
            setStatus(undefined);
            setOnlyNew(false);
          }}
        />
        <Chip
          label={t('manage.filterNew', { count: newCount })}
          selected={onlyNew}
          onPress={() => setOnlyNew((v) => !v)}
        />
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
      {q.total > 0 ? <Caption>{t('list.count', { count: q.total })}</Caption> : null}
    </View>
  );

  return (
    <SafeAreaScreen>
      <AppHeader title={t(`manage.title.${kind}`)} showBack />

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
          renderItem={({ item }) => (
            <ThreadCard thread={item} showCreator onPress={() => goDetail(item)} />
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState
              icon={meta.icon}
              title={
                onlyNew
                  ? t('manage.emptyNew')
                  : status
                    ? t('list.emptyFiltered')
                    : t('manage.empty')
              }
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
