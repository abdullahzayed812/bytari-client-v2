import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Icon } from '@/components/content';
import {
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  Loading,
  useToast,
} from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { orgCapabilities, useOrganization, useOrganizationMembers } from '@/features/organizations';
import { useCapabilities } from '@/hooks';
import { useTheme } from '@/theme';

import {
  BatchSummaryCard,
  DailyRecordCard,
  DailyRecordEmptyCard,
  FarmHeaderCard,
  FarmSectionCard,
  FarmStaffRow,
  WeeklySummaryCard,
} from '../components';
import {
  useBatchSummary,
  useDailyRecords,
  useFarmProfile,
  usePoultryFlocks,
  useUpdatePoultryFlock,
  useWeeklySummary,
} from '../hooks';

function nextDayDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Poultry Farm Details (Landing → "عرض التفاصيل"). */
export default function FarmDetailsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  const toast = useToast();
  const { isAdmin } = useCapabilities();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const detail = useOrganization(orgId);
  const caps = orgCapabilities(detail.data?.myRole, isAdmin);
  const canManage = caps.canManageFarmPoultry;

  const profile = useFarmProfile(orgId, { enabled: Boolean(orgId) });
  const activeFlocks = usePoultryFlocks(orgId, { status: 'ACTIVE', pageSize: 1 });
  const flock = activeFlocks.flocks[0];
  const summary = useBatchSummary(orgId, flock?.id, { enabled: Boolean(flock) });
  const daily = useDailyRecords(orgId, flock?.id, { enabled: Boolean(flock) });
  const weekly = useWeeklySummary(orgId, flock?.id, undefined, { enabled: Boolean(flock) });
  const members = useOrganizationMembers(orgId, { status: 'ACTIVE', enabled: caps.canViewMembers });
  const sellFlock = useUpdatePoultryFlock(orgId);
  const [confirmSell, setConfirmSell] = useState(false);

  const lastRecord = daily.data?.items[0] ?? null;
  const lastIndex = daily.data?.meta.total ?? 0;

  const sectionCards = useMemo(
    () =>
      [
        { key: 'treatments' as const, icon: 'medkit-outline' as const },
        { key: 'cases' as const, icon: 'pulse-outline' as const },
        { key: 'appointments' as const, icon: 'calendar-outline' as const },
        { key: 'expenses' as const, icon: 'wallet-outline' as const },
      ].map((s) => ({ ...s, label: t(`sections.${s.key}`) })),
    [t],
  );

  const refreshing =
    (detail.isRefetching || profile.isRefetching || activeFlocks.isRefetching) && !detail.isLoading;
  const onRefresh = (): void => {
    void detail.refetch();
    void profile.refetch();
    void activeFlocks.refetch();
    void summary.refetch();
    void daily.refetch();
    void weekly.refetch();
    void members.refetch();
  };

  const onSell = (): void => {
    if (!flock) return;
    sellFlock.mutate(
      { flockId: flock.id, body: { status: 'CLOSED' } },
      {
        onSuccess: () => {
          toast.show({ tone: 'success', message: t('batch.sellSuccess') });
          setConfirmSell(false);
          void activeFlocks.refetch();
        },
        onError: () => toast.show({ tone: 'danger', message: t('common.error') }),
      },
    );
  };

  const name = detail.data?.name ?? t('details.title');
  const location = detail.data?.description ?? null;

  if (detail.isLoading) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('details.title')} showBack />
        <Loading label={t('common.loading')} />
      </SafeAreaScreen>
    );
  }

  if (detail.isError) {
    const status = (detail.error as { status?: number } | null)?.status;
    return (
      <SafeAreaScreen>
        <AppHeader title={t('details.title')} showBack />
        <View style={{ padding: theme.screenPadding }}>
          {status === 403 || status === 404 ? (
            <EmptyState
              icon="lock-closed-outline"
              title={t('details.notAllowedTitle')}
              message={t('details.notAllowedBody')}
            />
          ) : (
            <ErrorState error={detail.error} onRetry={() => void detail.refetch()} />
          )}
        </View>
      </SafeAreaScreen>
    );
  }

  return (
    <SafeAreaScreen>
      <AppHeader title={t('details.title')} showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: theme.screenPadding,
          paddingBottom: theme.spacing.huge,
          rowGap: theme.spacing.lg,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <FarmHeaderCard name={name} location={location} profile={profile.data ?? null} />

        {/* Current batch */}
        {activeFlocks.isLoading ? (
          <Loading label={t('common.loading')} />
        ) : !flock ? (
          <EmptyBatch canManage={canManage} orgId={orgId} />
        ) : summary.isLoading || !summary.data ? (
          <Loading label={t('common.loading')} />
        ) : (
          <>
            <BatchSummaryCard
              summary={summary.data}
              canManage={canManage}
              selling={sellFlock.isPending}
              onAddDaily={() => router.push(Routes.poultryFarmSection(orgId, 'daily'))}
              onWeeklyReport={() => router.push(Routes.poultryFarmSection(orgId, 'weekly'))}
              onSell={() => setConfirmSell(true)}
            />

            {/* Daily data */}
            <View style={{ rowGap: theme.spacing.sm }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  columnGap: theme.spacing.sm,
                }}
              >
                <Icon name="clipboard-outline" size="iconSm" color="primary" />
                <Text variant="subtitle" weight="bold">
                  {t('daily.title')}
                </Text>
              </View>
              {daily.isLoading ? (
                <Loading label={t('common.loading')} />
              ) : (
                <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
                  {lastRecord ? (
                    <DailyRecordCard record={lastRecord} dayIndex={lastIndex} />
                  ) : (
                    <DailyRecordEmptyCard
                      dayIndex={1}
                      onPress={
                        canManage
                          ? () => router.push(Routes.poultryFarmSection(orgId, 'daily'))
                          : undefined
                      }
                    />
                  )}
                  <DailyRecordEmptyCard
                    dayIndex={lastIndex + 1}
                    date={lastRecord ? nextDayDate(lastRecord.recordDate) : undefined}
                    onPress={
                      canManage
                        ? () => router.push(Routes.poultryFarmSection(orgId, 'daily'))
                        : undefined
                    }
                  />
                </View>
              )}
            </View>

            {/* Weekly summary */}
            {weekly.data ? <WeeklySummaryCard summary={weekly.data} /> : null}
          </>
        )}

        {/* Management sections */}
        <View style={{ rowGap: theme.spacing.sm }}>
          <Text variant="subtitle" weight="bold">
            {t('sections.title')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            {sectionCards.map((s) => (
              <FarmSectionCard
                key={s.key}
                icon={s.icon}
                label={s.label}
                onPress={() => router.push(Routes.poultryFarmSection(orgId, s.key))}
              />
            ))}
          </View>
        </View>

        {/* Doctors & workers */}
        {caps.canViewMembers ? (
          <View style={{ rowGap: theme.spacing.xs }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text variant="subtitle" weight="bold">
                {t('details.staffTitle')}
              </Text>
              {caps.canManageMembers ? (
                <Button
                  label={t('details.staffAdd')}
                  variant="ghost"
                  size="sm"
                  leftIcon="add"
                  onPress={() => router.push(Routes.organizationMembersAdd(orgId))}
                />
              ) : null}
            </View>
            {members.isLoading ? (
              <Loading label={t('common.loading')} />
            ) : members.members.length === 0 ? (
              <Caption>{t('details.staffEmpty')}</Caption>
            ) : (
              members.members.map((m) => (
                <FarmStaffRow key={m.id} member={m} onChat={() => router.push(Routes.chat)} />
              ))
            )}
          </View>
        ) : null}
      </ScrollView>

      <ConfirmationDialog
        visible={confirmSell}
        title={t('batch.sellConfirmTitle')}
        message={t('batch.sellConfirmBody')}
        confirmLabel={t('batch.sellConfirmCta')}
        destructive
        onConfirm={onSell}
        onCancel={() => setConfirmSell(false)}
      />
    </SafeAreaScreen>
  );
}

function EmptyBatch({ canManage, orgId }: { canManage: boolean; orgId: string }) {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  return (
    <View
      style={{
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.lg,
        rowGap: theme.spacing.md,
        ...theme.shadows.card,
      }}
    >
      <EmptyState
        icon="egg-outline"
        title={t('batch.emptyTitle')}
        message={t('batch.emptyBody')}
        actionLabel={canManage ? t('batch.addBatch') : undefined}
        onAction={
          canManage ? () => router.push(Routes.organizationPoultryCreate(orgId)) : undefined
        }
      />
      <View
        style={{
          flexDirection: 'row',
          columnGap: theme.spacing.sm,
          padding: theme.spacing.md,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surfaceAccent,
        }}
      >
        <Icon name="information-circle-outline" size="iconSm" color="primary" />
        <View style={{ flex: 1, rowGap: 2 }}>
          <Text variant="label" weight="bold">
            {t('batch.infoTitle')}
          </Text>
          <Caption>{t('batch.infoBody')}</Caption>
        </View>
      </View>
    </View>
  );
}
