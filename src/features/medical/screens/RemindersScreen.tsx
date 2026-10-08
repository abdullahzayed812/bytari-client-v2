import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { IconButton } from '@/components/actions';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Routes } from '@/constants/routes';
import { useMarkPetSectionSeen } from '@/features/notifications/hooks';
import { orgCapabilities, useOrganization } from '@/features/organizations';
import { useCapabilities } from '@/hooks';
import { useTheme } from '@/theme';

import { ReminderCard } from '../components';
import { ReminderActions } from '../components/ReminderActions';
import { recordedByThisClinic } from '../constants';
import { useAnimalReminders } from '../hooks';

import { useMedicalRouteScope } from './useMedicalRouteScope';

/**
 * An animal's reminders (legacy "التذكيرات" tab). CLINIC context
 * (`/organizations/[orgId]/animals/[animalId]/reminders`): add + manage this
 * clinic's own reminders (the API returns only this clinic's). OWNER context
 * (`/pets/[petId]/reminders`): read every clinic's reminders — read-only.
 */
export default function RemindersScreen() {
  const theme = useTheme();
  const { t } = useTranslation('medical');
  const { animalId, organizationId, isClinic } = useMedicalRouteScope();
  const { isAdmin } = useCapabilities();
  const orgDetail = useOrganization(organizationId, { enabled: isClinic });
  const caps = orgCapabilities(orgDetail.data?.myRole, isAdmin);
  const canAdd = isClinic && caps.canManageOrganizationMedical;

  const q = useAnimalReminders({ animalId, organizationId });
  // Owner opened this section → clear only its "new" badge on Pet Details.
  useMarkPetSectionSeen(animalId, 'reminders', !isClinic);
  const items = q.data?.items ?? [];

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('reminders.title')}
        showBack
        right={
          canAdd ? (
            <IconButton
              icon="add"
              variant="soft"
              accessibilityLabel={t('reminders.addCta')}
              onPress={() =>
                router.push(Routes.orgAnimalReminderCreate(organizationId as string, animalId))
              }
            />
          ) : undefined
        }
      />
      {q.isLoading ? (
        <Loading fill />
      ) : q.isError ? (
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{
            padding: theme.screenPadding,
            rowGap: theme.spacing.md,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={q.isRefetching}
              onRefresh={() => void q.refetch()}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="notifications-outline"
              title={t('reminders.empty')}
              message={canAdd ? t('reminders.emptyHintClinic') : undefined}
            />
          }
          renderItem={({ item }) => (
            <ReminderCard
              reminder={item}
              organizationId={organizationId}
              footer={
                <ReminderActions
                  reminder={item}
                  organizationId={organizationId}
                  // Only the clinic that created a reminder may change it; the owner is read-only.
                  canManage={
                    isClinic &&
                    caps.canManageOrganizationMedical &&
                    recordedByThisClinic(item, organizationId)
                  }
                />
              }
            />
          )}
        />
      )}
    </SafeAreaScreen>
  );
}
