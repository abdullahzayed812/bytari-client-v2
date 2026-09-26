import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, View } from 'react-native';

import { Button, IconButton } from '@/components/actions';
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
import { useFarmProfile, useFarmSubscriptionRenewals } from '@/features/farmShared';
import { DailyRecordWeekStrip } from '@/features/farmShared/components/DailyRecordWeekStrip';
import { FarmAddStaffSheet } from '@/features/farmShared/components/FarmAddStaffSheet';
import { orgCapabilities, useOrganization, useOrganizationMembers } from '@/features/organizations';
import { useCapabilities } from '@/hooks';
import { businessToday } from '@/lib/businessDate';
import { useTheme } from '@/theme';

import {
  BatchSummaryCard,
  DailyRecordCard,
  FarmHeaderCard,
  FarmSectionCard,
  FarmStaffRow,
  FarmStatusCard,
  PoultryCard,
  WeeklySummaryCard,
} from '../components';
import {
  useBatchSummary,
  useDailyRecords,
  usePoultryFlocks,
  useUpdatePoultryFlock,
  useWeeklySummary,
} from '../hooks';

/** Poultry Farm Details (Landing → "عرض التفاصيل"). */
export default function PoultryFarmDetailsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  const toast = useToast();
  const { isAdmin } = useCapabilities();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const detail = useOrganization(orgId);
  const caps = orgCapabilities(detail.data?.myRole, isAdmin);
  const canManage = caps.canManageFarmPoultry;
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  // Approval (Organization.status) and subscription validity are separate
  // axes. Membership/renewal visibility only need the farm to be APPROVED;
  // actual day-to-day operations (flocks, daily records, management sections)
  // additionally require an ACTIVE subscription — enforced server-side too
  // (`requireActiveFarmSubscription`), this only mirrors it in the UI.
  const isApproved = detail.data?.status === 'ACTIVE';
  const canOperateFarm = isApproved && detail.data?.details?.subscriptionStatus === 'ACTIVE';

  const profile = useFarmProfile(orgId, { enabled: Boolean(orgId) });
  const activeFlocks = usePoultryFlocks(orgId, {
    status: 'ACTIVE',
    pageSize: 1,
    enabled: canOperateFarm,
  });
  const flock = activeFlocks.flocks[0];
  const closedFlocks = usePoultryFlocks(orgId, {
    status: 'CLOSED',
    pageSize: 20,
    enabled: canOperateFarm,
  });
  const summary = useBatchSummary(orgId, flock?.id, { enabled: Boolean(flock) });
  const daily = useDailyRecords(orgId, flock?.id, { pageSize: 7, enabled: Boolean(flock) });
  const weekly = useWeeklySummary(orgId, flock?.id, undefined, { enabled: Boolean(flock) });
  const members = useOrganizationMembers(orgId, {
    status: 'ACTIVE',
    enabled: caps.canViewMembers && isApproved,
  });
  const renewals = useFarmSubscriptionRenewals(orgId, { enabled: isApproved });
  const sellFlock = useUpdatePoultryFlock(orgId);
  const [confirmSell, setConfirmSell] = useState(false);

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
      <AppHeader
        title={t('details.title')}
        showBack
        right={
          caps.canEditOrganization ? (
            <IconButton
              icon="settings-outline"
              variant="soft"
              accessibilityLabel={t('settings.a11y')}
              onPress={() => router.push(Routes.farmSettings(orgId))}
            />
          ) : undefined
        }
      />
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
        <FarmHeaderCard
          name={name}
          location={location}
          profile={profile.data ?? null}
          icon="egg-outline"
        />

        <FarmStatusCard
          approvalStatus={detail.data?.status ?? 'PENDING'}
          decisionReason={detail.data?.decisionReason}
          subscriptionStatus={detail.data?.details?.subscriptionStatus}
          subscriptionEndDate={detail.data?.details?.subscriptionEndDate}
          hasPendingRenewal={renewals.hasPendingRenewal}
          onRequestRenewal={
            caps.isOwner ? () => router.push(Routes.farmSubscriptionRenewal(orgId)) : undefined
          }
        />

        {canOperateFarm ? (
          <>
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
                    <DailyRecordWeekStrip
                      records={daily.data?.items ?? []}
                      todayRecorded={(daily.data?.items ?? []).some(
                        (r) => r.recordDate === businessToday(),
                      )}
                      onAddPress={
                        canManage
                          ? () => router.push(Routes.poultryFarmSection(orgId, 'daily'))
                          : undefined
                      }
                      renderRecord={(r, day) => <DailyRecordCard record={r} dayIndex={day} />}
                    />
                  )}
                </View>

                {/* Weekly summary */}
                {weekly.data ? <WeeklySummaryCard summary={weekly.data} /> : null}
              </>
            )}

            {/* Previous batches — only shown when at least one exists. */}
            {closedFlocks.flocks.length > 0 ? (
              <View style={{ rowGap: theme.spacing.sm }}>
                <Text variant="subtitle" weight="bold">
                  {t('batch.previousTitle')}
                </Text>
                <View style={{ rowGap: theme.spacing.sm }}>
                  {closedFlocks.flocks.map((f) => (
                    <PoultryCard
                      key={f.id}
                      flock={f}
                      onPress={() => router.push(Routes.organizationPoultryFlock(orgId, f.id))}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        ) : null}

        {/* Management sections — daily operations, subscription-gated server-side too. */}
        {canOperateFarm ? (
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
        ) : null}

        {/* Doctors & workers — membership, not subscription-gated. */}
        {isApproved && caps.canViewMembers ? (
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
                  onPress={() => setAddStaffOpen(true)}
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
      <FarmAddStaffSheet
        visible={addStaffOpen}
        onClose={() => setAddStaffOpen(false)}
        organizationId={orgId}
        organizationName={detail.data?.name ?? ''}
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
