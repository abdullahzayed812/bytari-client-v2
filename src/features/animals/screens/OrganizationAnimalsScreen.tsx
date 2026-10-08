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
import { useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import { AnimalCard, AnimalCardSkeleton } from '../components';
import { useOrganizationAnimals } from '../hooks';
import type { ClinicPet } from '../types';

/**
 * Route `/organizations/[organizationId]/animals` — "All Pets": the pets this
 * clinic has its own records for, latest activity first (no link list — the
 * clinic's records are the relationship). The filter box narrows the loaded
 * rows by name / short ID; "+" opens any pet by its short ID / QR.
 */
export default function OrganizationAnimalsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('orgAnimals');
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const q = useOrganizationAnimals(orgId);

  const [rawFilter, setRawFilter] = useState('');
  const filter = useDebouncedValue(rawFilter).trim().toLowerCase();
  const visible = useMemo<ClinicPet[]>(
    () =>
      filter
        ? q.animals.filter(
            (p) =>
              p.animal.name.toLowerCase().includes(filter) ||
              p.publicCode.toLowerCase().includes(filter.replace(/[\s-]/g, '')),
          )
        : q.animals,
    [q.animals, filter],
  );

  const goToDetail = (p: ClinicPet) =>
    router.push(Routes.organizationAnimalDetail(orgId, p.animalId));

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
          <IconButton
            icon="qr-code-outline"
            variant="soft"
            accessibilityLabel={t('list.openCta')}
            onPress={() => router.push(Routes.organizationAnimalsOpen(orgId))}
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
          keyExtractor={(p) => p.animalId}
          renderItem={({ item }) => <AnimalCard pet={item} onPress={() => goToDetail(item)} />}
          ListHeaderComponent={header}
          ListEmptyComponent={
            filter ? (
              <EmptyState icon="search-outline" title={t('list.noFilterMatch')} />
            ) : (
              <EmptyState
                icon="paw-outline"
                title={t('list.empty')}
                message={t('list.emptyHint')}
                actionLabel={t('list.openCta')}
                onAction={() => router.push(Routes.organizationAnimalsOpen(orgId))}
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
