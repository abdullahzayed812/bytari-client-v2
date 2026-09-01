import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useCurrentLocation, useDebouncedValue, type Coordinates } from '@/hooks';
import { useTheme } from '@/theme';

import { ClinicCard } from '../components';
import { useDiscoverOrganizations } from '../hooks';
import type { DiscoverSort, PublicOrganization } from '../types';

interface FilterButtonProps {
  icon?: IconName;
  label: string;
  active?: boolean;
  loading?: boolean;
  onPress: () => void;
}

/**
 * "تصفية" / "الأقرب" / "الكل" row from the reference — a mutually-exclusive
 * `sort` toggle (`default` / `nearest`, both real, backend-driven states) plus
 * "Filter". The discover API has no criteria beyond `type` / `search` / `sort`
 * yet (no specialty/price/hours field exists on an organization), so "Filter"
 * is flagged as coming soon rather than faking a dimension the backend
 * doesn't have — wiring it up is a one-line change once one exists.
 */
function FilterButton({ icon, label, active, loading, onPress }: FilterButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active, busy: loading }}
      accessibilityLabel={label}
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          columnGap: theme.spacing.xs,
          paddingVertical: theme.spacing.sm,
          borderRadius: theme.radius.lg,
          borderWidth: active ? 0 : 1.5,
          borderColor: theme.colors.border,
          backgroundColor: active ? theme.colors.primary : theme.colors.surface,
        },
        pressed && { opacity: 0.8 },
        loading && { opacity: 0.6 },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={active ? theme.colors.onPrimary : theme.colors.primary} />
      ) : icon ? (
        <Icon name={icon} size="iconSm" color={active ? 'onPrimary' : 'textSecondary'} />
      ) : null}
      <Text
        variant="label"
        style={{ color: active ? theme.colors.onPrimary : theme.colors.textSecondary }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * "Available clinics" — every ACTIVE clinic, open to any signed-in pet owner
 * (not membership-scoped). Backs the Home section's "View all" link.
 */
export default function DiscoverClinicsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('organizations');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const location = useCurrentLocation();

  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const [sort, setSort] = useState<DiscoverSort>('default');
  const [coords, setCoords] = useState<Coordinates | null>(null);

  const q = useDiscoverOrganizations({
    type: 'CLINIC',
    search: search || undefined,
    sort,
    near: sort === 'nearest' ? (coords ?? undefined) : undefined,
  });

  const goToDetail = (org: PublicOrganization) =>
    router.push(Routes.organizationDiscoverDetail(org.id));
  const comingSoon = () => toast.show({ message: tc('comingSoon'), tone: 'info' });

  const selectDefault = () => setSort('default');

  const selectNearest = async () => {
    const fix = await location.request();
    if (!fix) {
      const message =
        location.error === 'permission_denied'
          ? t('discover.locationPermissionDenied')
          : location.error === 'unavailable'
            ? t('discover.locationUnavailable')
            : t('discover.locationError');
      toast.show({ message, tone: 'warning' });
      return;
    }
    setCoords(fix);
    setSort('nearest');
  };

  const emptyTitle =
    sort === 'nearest'
      ? t('discover.emptyNearest')
      : search
        ? t('discover.emptySearch')
        : t('discover.empty');

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('discover.title')}
        subtitle={t('discover.subtitle')}
        showBack
        backAlign="left"
      />

      <View
        style={{
          paddingHorizontal: theme.screenPadding,
          paddingTop: theme.spacing.md,
          rowGap: theme.spacing.md,
        }}
      >
        <SearchInput
          value={rawSearch}
          onChangeText={setRawSearch}
          onClear={() => setRawSearch('')}
          placeholder={t('discover.searchPlaceholder')}
          accessibilityLabel={t('discover.searchPlaceholder')}
        />
        <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
          <FilterButton icon="funnel-outline" label={t('discover.filter')} onPress={comingSoon} />
          <FilterButton
            icon="locate-outline"
            label={t('discover.nearest')}
            active={sort === 'nearest'}
            loading={location.isLoading}
            onPress={() => void selectNearest()}
          />
          <FilterButton label={t('discover.all')} active={sort === 'default'} onPress={selectDefault} />
        </View>
      </View>

      {q.isLoading ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          <Loading fill />
        </View>
      ) : q.isError ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.organizations}
          keyExtractor={(o) => o.id}
          renderItem={({ item }) => (
            <ClinicCard organization={item} width="100%" onPress={() => goToDetail(item)} />
          )}
          ListEmptyComponent={<EmptyState icon="medkit-outline" title={emptyTitle} />}
          ListFooterComponent={
            q.isFetchingNextPage ? <Loading label={t('discover.loadingMore')} /> : null
          }
          contentContainerStyle={{
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.lg,
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
