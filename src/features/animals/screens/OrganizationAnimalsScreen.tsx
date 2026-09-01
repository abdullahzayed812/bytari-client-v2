import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { IconButton } from '@/components/actions';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { orgCapabilities, useOrganization } from '@/features/organizations';
import { useCapabilities, useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import { AnimalCard, AnimalCardSkeleton } from '../components';
import { useOrganizationAnimals } from '../hooks';
import type { OrganizationAnimalGrant } from '../types';

/**
 * Route `/organizations/[organizationId]/animals` — the animals a CLINIC has
 * veterinary access to. The backend list endpoint takes only `page`/`pageSize`
 * (no server-side search — see §54), so the filter box narrows the already
 * loaded rows by name; it is a convenience over *this clinic's* animals, not a
 * database search.
 */
export default function OrganizationAnimalsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('orgAnimals');
  const { isAdmin } = useCapabilities();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const detail = useOrganization(orgId);
  const caps = orgCapabilities(detail.data?.myRole, isAdmin);
  const q = useOrganizationAnimals(orgId);

  const [rawFilter, setRawFilter] = useState('');
  const filter = useDebouncedValue(rawFilter).trim().toLowerCase();
  const visible = useMemo<OrganizationAnimalGrant[]>(
    () =>
      filter ? q.animals.filter((g) => g.animal.name.toLowerCase().includes(filter)) : q.animals,
    [q.animals, filter],
  );

  const goToDetail = (g: OrganizationAnimalGrant) =>
    router.push(Routes.organizationAnimalDetail(orgId, g.animalId));

  const header = (
    <View style={{ paddingBottom: theme.spacing.md, rowGap: theme.spacing.sm }}>
      <SearchInput
        value={rawFilter}
        onChangeText={setRawFilter}
        onClear={() => setRawFilter('')}
        placeholder={t('list.filterPlaceholder')}
        accessibilityLabel={t('list.filterPlaceholder')}
      />
      {q.total > 0 ? <Caption>{t('list.count', { count: q.total })}</Caption> : null}
    </View>
  );

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('list.title')}
        showBack
        right={
          caps.canManageOrganizationAnimalAccess ? (
            <IconButton
              icon="add"
              variant="soft"
              accessibilityLabel={t('list.grantCta')}
              onPress={() => router.push(Routes.organizationAnimalsGrant(orgId))}
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
          {header}
          {[0, 1, 2, 3].map((i) => (
            <AnimalCardSkeleton key={i} />
          ))}
        </View>
      ) : q.isError ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          {header}
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(g) => g.id}
          renderItem={({ item }) => <AnimalCard grant={item} onPress={() => goToDetail(item)} />}
          ListHeaderComponent={header}
          ListEmptyComponent={
            filter ? (
              <EmptyState icon="search-outline" title={t('list.noFilterMatch')} />
            ) : (
              <EmptyState
                icon="paw-outline"
                title={t('list.empty')}
                message={t('list.emptyHint')}
                actionLabel={
                  caps.canManageOrganizationAnimalAccess ? t('list.grantCta') : undefined
                }
                onAction={
                  caps.canManageOrganizationAnimalAccess
                    ? () => router.push(Routes.organizationAnimalsGrant(orgId))
                    : undefined
                }
              />
            )
          }
          ListFooterComponent={
            q.isFetchingNextPage ? <Loading label={t('list.loadingMore')} /> : null
          }
          contentContainerStyle={{
            paddingHorizontal: theme.screenPadding,
            paddingBottom: theme.spacing.huge,
            rowGap: theme.spacing.md,
            flexGrow: 1,
          }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (!filter && q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage();
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
