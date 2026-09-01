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

import { MedicalRecordCard, RecordCardSkeleton } from '../components';
import { useMedicalRecords } from '../hooks';
import type { MedicalRecord } from '../types';

import { useMedicalRouteScope } from './useMedicalRouteScope';

/**
 * Medical records list. CLINIC context (`organizationId` in the route) can add
 * records and see the "recorded here / elsewhere" badge; OWNER context
 * (`/pets/[petId]/...`) is read-only. Backend authorises every request.
 */
export default function MedicalRecordsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('medical');
  const { animalId, organizationId, isClinic } = useMedicalRouteScope();
  const { isAdmin } = useCapabilities();

  const orgDetail = useOrganization(organizationId, { enabled: isClinic });
  const caps = orgCapabilities(orgDetail.data?.myRole, isAdmin);
  const canAdd = isClinic && caps.canManageOrganizationMedical;

  const q = useMedicalRecords({ animalId, organizationId });

  const goToDetail = (r: MedicalRecord) =>
    router.push(
      isClinic
        ? Routes.orgAnimalMedicalRecord(organizationId as string, animalId, r.id)
        : Routes.petMedicalRecord(animalId, r.id),
    );
  const goToCreate = () =>
    router.push(Routes.orgAnimalMedicalRecordCreate(organizationId as string, animalId));

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('records.title')}
        showBack
        right={
          canAdd ? (
            <IconButton
              icon="add"
              variant="soft"
              accessibilityLabel={t('records.addCta')}
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
          data={q.records}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => (
            <MedicalRecordCard
              record={item}
              organizationId={organizationId}
              onPress={() => goToDetail(item)}
            />
          )}
          ListHeaderComponent={
            q.total > 0 ? (
              <Caption style={{ paddingBottom: theme.spacing.sm }}>
                {t('records.count', { count: q.total })}
              </Caption>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="medkit-outline"
              title={t('records.empty')}
              message={canAdd ? t('records.emptyHintClinic') : t('records.emptyHint')}
              actionLabel={canAdd ? t('records.addCta') : undefined}
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
