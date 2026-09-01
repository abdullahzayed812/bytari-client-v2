import { router } from 'expo-router';
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

import { RecordCardSkeleton, VaccinationCard } from '../components';
import { useVaccinations } from '../hooks';
import type { Vaccination } from '../types';

import { useMedicalRouteScope } from './useMedicalRouteScope';

/** Vaccination history list. CLINIC context can add; OWNER context is read-only. */
export default function VaccinationsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('medical');
  const { animalId, organizationId, isClinic } = useMedicalRouteScope();
  const { isAdmin } = useCapabilities();

  const orgDetail = useOrganization(organizationId, { enabled: isClinic });
  const caps = orgCapabilities(orgDetail.data?.myRole, isAdmin);
  const canAdd = isClinic && caps.canManageOrganizationMedical;

  const q = useVaccinations({ animalId, organizationId });

  const goToDetail = (v: Vaccination) =>
    router.push(
      isClinic
        ? Routes.orgAnimalVaccination(organizationId as string, animalId, v.id)
        : Routes.petVaccination(animalId, v.id),
    );
  const goToCreate = () =>
    router.push(Routes.orgAnimalVaccinationCreate(organizationId as string, animalId));

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('vaccinations.title')}
        showBack
        right={
          canAdd ? (
            <IconButton
              icon="add"
              variant="soft"
              accessibilityLabel={t('vaccinations.addCta')}
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
          {[0, 1, 2].map((i) => (
            <RecordCardSkeleton key={i} />
          ))}
        </View>
      ) : q.isError ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.vaccinations}
          keyExtractor={(v) => v.id}
          renderItem={({ item }) => (
            <VaccinationCard
              vaccination={item}
              organizationId={organizationId}
              onPress={() => goToDetail(item)}
            />
          )}
          ListHeaderComponent={
            q.total > 0 ? (
              <Caption style={{ paddingBottom: theme.spacing.sm }}>
                {t('vaccinations.count', { count: q.total })}
              </Caption>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="shield-checkmark-outline"
              title={t('vaccinations.empty')}
              message={canAdd ? t('vaccinations.emptyHintClinic') : t('vaccinations.emptyHint')}
              actionLabel={canAdd ? t('vaccinations.addCta') : undefined}
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
