import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, ScrollView, View } from 'react-native';

import { Chip, Icon } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';

import { AppointmentCard } from '../components';
import { usePetOwnerAppointments } from '../hooks';
import {
  APPOINTMENT_STATUS_FILTERS,
  type AppointmentStatus,
  type AppointmentStatusFilter,
} from '../types';

/** Route: `/(app)/clinic-appointments` — the Pet Owner's appointment list ("مواعيدي"). */
export default function PetOwnerAppointmentsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('clinicAppointments');
  const [filter, setFilter] = useState<AppointmentStatusFilter>('ALL');

  const status: AppointmentStatus | undefined = filter === 'ALL' ? undefined : filter;
  const q = usePetOwnerAppointments(status);

  const chips = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{
        alignItems: 'center',
        columnGap: theme.spacing.sm,
        paddingHorizontal: theme.screenPadding,
        paddingVertical: theme.spacing.sm,
      }}
    >
      {APPOINTMENT_STATUS_FILTERS.map((f) => (
        <Chip
          key={f}
          label={f === 'ALL' ? t('filter.all') : t(`status.${f}`)}
          selected={filter === f}
          onPress={() => setFilter(f)}
        />
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaScreen>
      <AppHeader title={t('list.title')} showBack />

      <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.xs }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: theme.spacing.xs,
            justifyContent: 'flex-end',
          }}
        >
          <Icon name="options-outline" size="iconSm" color="primary" />
          <Caption color="primary">{t('list.filterLabel')}</Caption>
        </View>
      </View>
      {chips}

      {q.isLoading ? (
        <Loading fill label={t('list.loading')} />
      ) : q.isError ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.appointments}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => (
            <AppointmentCard
              appointment={item}
              onPress={() => router.push(Routes.petOwnerAppointment(item.id))}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title={t('list.empty')}
              message={t('list.emptyHint')}
            />
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
