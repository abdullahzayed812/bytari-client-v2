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

import { LivestockBatchRow } from '../components';
import { useCattleBatches } from '../hooks';
import type { CattleBatch } from '../types';

/** Route `/(app)/livestock/cattle/[organizationId]/batches` — a FARM's cattle batches. Mirrors `SheepBatchesScreen`. */
export default function CattleBatchesScreen() {
  const theme = useTheme();
  const { t } = useTranslation('sheepCattleFarm');
  const { isAdmin } = useCapabilities();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const detail = useOrganization(orgId);
  const caps = orgCapabilities(detail.data?.myRole, isAdmin);
  const canAdd = caps.canManageFarmPoultry;

  const q = useCattleBatches(orgId);
  const goToDetail = (b: CattleBatch) => router.push(Routes.cattleBatchDetail(orgId, b.id));
  const goToCreate = () => router.push(Routes.cattleBatchCreate(orgId));

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('batchList.title')}
        showBack
        right={canAdd ? <IconButton icon="add" variant="soft" accessibilityLabel={t('batchList.addCta')} onPress={goToCreate} /> : undefined}
      />

      {q.isLoading ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          <Loading label={t('common.loading')} />
        </View>
      ) : q.isError ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.batches}
          keyExtractor={(b) => b.id}
          renderItem={({ item }) => (
            <LivestockBatchRow
              batch={item}
              headCountLabel={`${item.headCount} ${t('batch.headUnit')}`}
              statusLabel={t(`batch.status${item.status === 'ACTIVE' ? 'Active' : 'Closed'}`)}
              onPress={() => goToDetail(item)}
            />
          )}
          ListHeaderComponent={q.total > 0 ? <Caption style={{ paddingBottom: theme.spacing.sm }}>{t('batchList.count', { count: q.total })}</Caption> : null}
          ListEmptyComponent={
            <EmptyState icon="paw-outline" title={t('batchList.empty')} message={canAdd ? t('batchList.emptyHintManage') : t('batchList.emptyHint')} actionLabel={canAdd ? t('batchList.addCta') : undefined} onAction={canAdd ? goToCreate : undefined} />
          }
          ListFooterComponent={q.isFetchingNextPage ? <Loading label={t('common.loadingMore')} /> : null}
          contentContainerStyle={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md, paddingBottom: theme.spacing.huge, rowGap: theme.spacing.md, flexGrow: 1 }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage();
          }}
          refreshControl={<RefreshControl refreshing={q.isRefetching && !q.isFetchingNextPage} onRefresh={() => void q.refetch()} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
        />
      )}
    </SafeAreaScreen>
  );
}
