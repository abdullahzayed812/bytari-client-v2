import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Linking, RefreshControl, ScrollView, View } from 'react-native';

import { Button, TextButton } from '@/components/actions';
import { Badge, Card, Chip, Icon } from '@/components/content';
import { EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { Row, SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
// Deep import (not the barrel) — keeps medical ↔ clinicDashboard acyclic.
import { useClinicPermissions } from '@/features/clinicDashboard/hooks';
import { useTheme } from '@/theme';

import { ReminderActions } from '../components/ReminderActions';
import { VaccinationActions } from '../components/VaccinationActions';
import { VACCINATION_STATUS_TONE, displayDateOnly } from '../constants';
import { useClinicReminders, useClinicVaccinations, useNotifyTodayReminders } from '../hooks';
import {
  CLINIC_REMINDER_FILTERS,
  CLINIC_VACCINATION_FILTERS,
  type ClinicListAnimal,
  type ClinicListOwner,
  type ClinicReminderFilter,
  type ClinicVaccinationFilter,
} from '../types';
import { medicalErrorMessage } from '../validation/schemas';

function FilterChips<T extends string>({
  values,
  value,
  label,
  onChange,
}: {
  values: readonly T[];
  value: T;
  label: (v: T) => string;
  onChange: (v: T) => void;
}) {
  const theme = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{
        columnGap: theme.spacing.sm,
        paddingHorizontal: theme.screenPadding,
        paddingVertical: theme.spacing.sm,
      }}
    >
      {values.map((v) => (
        <Chip key={v} label={label(v)} selected={v === value} onPress={() => onChange(v)} />
      ))}
    </ScrollView>
  );
}

/** Animal + owner header line shared by both lists (legacy clinic list rows). */
function AnimalOwnerLine({
  organizationId,
  animal,
  owner,
}: {
  organizationId: string;
  animal: ClinicListAnimal;
  owner: ClinicListOwner | null;
}) {
  const { t } = useTranslation('medical');
  return (
    <Row justify="space-between" align="center" gap="sm" wrap>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {animal.name}
        </Text>
        {owner ? (
          <Caption numberOfLines={1}>
            {t('clinicLists.owner')}: {`${owner.firstName} ${owner.lastName}`.trim()}
          </Caption>
        ) : null}
      </View>
      {owner?.phone ? (
        <TextButton
          label={t('clinicLists.call')}
          icon="call-outline"
          onPress={() => void Linking.openURL(`tel:${owner.phone}`)}
        />
      ) : null}
      <TextButton
        label={t('clinicLists.openAnimal')}
        icon="paw-outline"
        onPress={() => router.push(Routes.organizationAnimalDetail(organizationId, animal.id))}
      />
    </Row>
  );
}

/** Route `/clinic-dashboard/[organizationId]/vaccinations` — legacy "التطعيمات". */
export function ClinicVaccinationsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('medical');
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';
  const perms = useClinicPermissions(orgId);
  const [filter, setFilter] = useState<ClinicVaccinationFilter>('DUE_TODAY');
  const q = useClinicVaccinations(orgId, filter);

  return (
    <SafeAreaScreen>
      <AppHeader title={t('clinicLists.vaccinationsTitle')} showBack />
      <FilterChips
        values={CLINIC_VACCINATION_FILTERS}
        value={filter}
        label={(v) => t(`clinicLists.vaccinationFilter.${v}`)}
        onChange={setFilter}
      />
      {q.isLoading ? (
        <Loading fill />
      ) : q.isError ? (
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.items}
          keyExtractor={(x) => x.vaccination.id}
          contentContainerStyle={{
            padding: theme.screenPadding,
            rowGap: theme.spacing.md,
            flexGrow: 1,
          }}
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
          ListEmptyComponent={
            <EmptyState
              icon="shield-checkmark-outline"
              title={t('clinicLists.emptyVaccinations')}
            />
          }
          renderItem={({ item }) => (
            <Card variant="outlined" padding="md">
              <AnimalOwnerLine organizationId={orgId} animal={item.animal} owner={item.owner} />
              <Row gap="sm" align="center" style={{ marginTop: theme.spacing.sm }} wrap>
                <Icon name="shield-checkmark-outline" size="iconSm" color="primary" />
                <Text variant="bodyMedium" style={{ flex: 1 }}>
                  {item.vaccination.vaccineName}
                </Text>
                <Badge
                  label={t(`vaccinations.status.${item.vaccination.status}`)}
                  tone={VACCINATION_STATUS_TONE[item.vaccination.status]}
                  size="sm"
                />
                {item.isOverdue ? (
                  <Badge label={t('vaccinations.overdue')} tone="danger" size="sm" />
                ) : null}
              </Row>
              <Caption style={{ marginTop: 2 }}>
                {t('vaccinations.fieldAdministeredOn')}:{' '}
                {displayDateOnly(item.vaccination.administeredOn)}
                {item.vaccination.nextDueOn
                  ? ` · ${t('clinicLists.nextDue')}: ${displayDateOnly(item.vaccination.nextDueOn)}`
                  : ''}
              </Caption>
              <View style={{ marginTop: theme.spacing.sm }}>
                <VaccinationActions
                  organizationId={orgId}
                  vaccination={item.vaccination}
                  canManage={perms?.canCreateVaccinations ?? false}
                />
              </View>
            </Card>
          )}
        />
      )}
    </SafeAreaScreen>
  );
}

/** Route `/clinic-dashboard/[organizationId]/reminders` — legacy "التذكيرات". */
export function ClinicRemindersScreen() {
  const theme = useTheme();
  const { t } = useTranslation('medical');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';
  const perms = useClinicPermissions(orgId);
  const canManage = perms?.canCreateMedicalRecords ?? false;
  const [filter, setFilter] = useState<ClinicReminderFilter>('TODAY');
  const q = useClinicReminders(orgId, filter);
  const sendToday = useNotifyTodayReminders(orgId);

  return (
    <SafeAreaScreen>
      <AppHeader title={t('clinicLists.remindersTitle')} showBack />
      <FilterChips
        values={CLINIC_REMINDER_FILTERS}
        value={filter}
        label={(v) => t(`clinicLists.reminderFilter.${v}`)}
        onChange={setFilter}
      />
      {canManage ? (
        <View style={{ paddingHorizontal: theme.screenPadding }}>
          <Button
            label={t('clinicLists.sendToday')}
            size="sm"
            variant="outline"
            leftIcon="paper-plane-outline"
            loading={sendToday.isPending}
            disabled={sendToday.isPending}
            onPress={() =>
              sendToday.mutate(undefined, {
                onSuccess: (r) =>
                  toast.show({
                    tone: 'success',
                    message: t('clinicLists.sentToday', { count: r.sent }),
                  }),
                onError: (e) => toast.show({ tone: 'danger', message: medicalErrorMessage(e, t) }),
              })
            }
          />
        </View>
      ) : null}
      {q.isLoading ? (
        <Loading fill />
      ) : q.isError ? (
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.items}
          keyExtractor={(x) => x.reminder.id}
          contentContainerStyle={{
            padding: theme.screenPadding,
            rowGap: theme.spacing.md,
            flexGrow: 1,
          }}
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
          ListEmptyComponent={
            <EmptyState icon="notifications-outline" title={t('clinicLists.emptyReminders')} />
          }
          renderItem={({ item }) => (
            <Card variant="outlined" padding="md">
              <AnimalOwnerLine organizationId={orgId} animal={item.animal} owner={item.owner} />
              <Row gap="sm" align="center" style={{ marginTop: theme.spacing.sm }} wrap>
                <Icon name="notifications-outline" size="iconSm" color="warning" />
                <Text variant="bodyMedium" style={{ flex: 1 }}>
                  {item.reminder.title}
                </Text>
                <Badge
                  label={
                    item.reminder.isCompleted
                      ? t('reminders.statusDone')
                      : t('reminders.statusPending')
                  }
                  tone={item.reminder.isCompleted ? 'success' : 'warning'}
                  size="sm"
                />
                {item.isOverdue ? (
                  <Badge label={t('reminders.overdue')} tone="danger" size="sm" />
                ) : null}
              </Row>
              <Caption style={{ marginTop: 2 }}>
                {t('clinicLists.date')}: {displayDateOnly(item.reminder.reminderDate)} ·{' '}
                {t(`reminders.type.${item.reminder.reminderType}`)}
              </Caption>
              {item.reminder.description ? (
                <Text numberOfLines={2}>{item.reminder.description}</Text>
              ) : null}
              <View style={{ marginTop: theme.spacing.sm }}>
                <ReminderActions
                  reminder={item.reminder}
                  organizationId={orgId}
                  canManage={canManage}
                />
              </View>
            </Card>
          )}
        />
      )}
    </SafeAreaScreen>
  );
}
