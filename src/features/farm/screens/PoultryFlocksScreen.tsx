import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { IconButton } from '@/components/actions';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { orgCapabilities, useOrganization } from '@/features/organizations';
import { useCapabilities } from '@/hooks';
import { useTheme } from '@/theme';

import { PoultryCard, PoultryCardSkeleton } from '../components';
import { usePoultryFlocks } from '../hooks';
import type { PoultryFlock } from '../types';

/** Route `/organizations/[organizationId]/poultry` — a FARM's poultry flocks. */
export default function PoultryFlocksScreen() {
  const theme = useTheme();
  const { t } = useTranslation('farm');
  const { isAdmin } = useCapabilities();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const detail = useOrganization(orgId);
  const caps = orgCapabilities(detail.data?.myRole, isAdmin);
  const canAdd = caps.canManageFarmPoultry;

  const q = usePoultryFlocks(orgId);

  const goToDetail = (f: PoultryFlock) => router.push(Routes.organizationPoultryFlock(orgId, f.id));
  const goToCreate = () => router.push(Routes.organizationPoultryCreate(orgId));

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('poultry.title')}
        showBack
        right={
          canAdd ? (
            <IconButton
              icon="add"
              variant="soft"
              accessibilityLabel={t('poultry.addCta')}
              onPress={goToCreate}
            />
          ) : undefined
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
          {[0, 1, 2, 3].map((i) => (
            <PoultryCardSkeleton key={i} />
          ))}
        </View>
      ) : q.isError ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.flocks}
          keyExtractor={(f) => f.id}
          renderItem={({ item }) => <PoultryCard flock={item} onPress={() => goToDetail(item)} />}
          ListHeaderComponent={
            q.total > 0 ? (
              <Caption style={{ paddingBottom: theme.spacing.sm }}>
                {t('poultry.count', { count: q.total })}
              </Caption>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="egg-outline"
              title={t('poultry.empty')}
              message={canAdd ? t('poultry.emptyHintManage') : t('poultry.emptyHint')}
              actionLabel={canAdd ? t('poultry.addCta') : undefined}
              onAction={canAdd ? goToCreate : undefined}
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
