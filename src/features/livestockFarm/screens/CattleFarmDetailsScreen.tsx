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
import { FarmHeaderCard } from '@/features/farm';
import {
  useFarmProfile,
  useFarmSubscriptionRenewals,
  FarmSectionCard,
  FarmStaffRow,
  FarmStatusCard,
} from '@/features/farmShared';
import { DailyRecordWeekStrip } from '@/features/farmShared/components/DailyRecordWeekStrip';
import { FarmAddStaffSheet } from '@/features/farmShared/components/FarmAddStaffSheet';
import { orgCapabilities, useOrganization, useOrganizationMembers } from '@/features/organizations';
import { useCapabilities } from '@/hooks';
import { businessToday } from '@/lib/businessDate';
import { useTheme } from '@/theme';

import {
  LivestockBatchRow,
  LivestockBatchSummaryCard,
  LivestockDailyRecordCard,
  LivestockWeeklySummaryCard,
} from '../components';
import {
  useCattleBatches,
  useCattleBatchSummary,
  useCattleDailyRecords,
  useCattleWeeklySummary,
  useUpdateCattleBatch,
} from '../hooks';

/** Cattle Farm Details. Mirrors `SheepFarmDetailsScreen` exactly. */
export default function CattleFarmDetailsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('sheepCattleFarm');
  const toast = useToast();
  const { isAdmin } = useCapabilities();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const detail = useOrganization(orgId);
  const caps = orgCapabilities(detail.data?.myRole, isAdmin);
  const canManage = caps.canManageFarmPoultry;
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const isApproved = detail.data?.status === 'ACTIVE';
  const canOperateFarm = isApproved && detail.data?.details?.subscriptionStatus === 'ACTIVE';

  const profile = useFarmProfile(orgId, { enabled: Boolean(orgId) });
  const activeBatches = useCattleBatches(orgId, {
    status: 'ACTIVE',
    pageSize: 1,
    enabled: canOperateFarm,
  });
  const batch = activeBatches.batches[0];
  const closedBatches = useCattleBatches(orgId, {
    status: 'CLOSED',
    pageSize: 20,
    enabled: canOperateFarm,
  });
  const summary = useCattleBatchSummary(orgId, batch?.id, { enabled: Boolean(batch) });
  const daily = useCattleDailyRecords(orgId, batch?.id, { pageSize: 7, enabled: Boolean(batch) });
  const weekly = useCattleWeeklySummary(orgId, batch?.id, undefined, { enabled: Boolean(batch) });
  const members = useOrganizationMembers(orgId, {
    status: 'ACTIVE',
    enabled: caps.canViewMembers && isApproved,
  });
  const renewals = useFarmSubscriptionRenewals(orgId, { enabled: isApproved });
  const sellBatch = useUpdateCattleBatch(orgId);
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
    (detail.isRefetching || profile.isRefetching || activeBatches.isRefetching) &&
    !detail.isLoading;
  const onRefresh = (): void => {
    void detail.refetch();
    void profile.refetch();
    void activeBatches.refetch();
    void summary.refetch();
    void daily.refetch();
    void weekly.refetch();
    void members.refetch();
  };

  const onSell = (): void => {
    if (!batch) return;
    sellBatch.mutate(
      { batchId: batch.id, body: { status: 'CLOSED' } },
      {
        onSuccess: () => {
          toast.show({ tone: 'success', message: t('batch.sellSuccess') });
          setConfirmSell(false);
          void activeBatches.refetch();
        },
        onError: () => toast.show({ tone: 'danger', message: t('common.error') }),
      },
    );
  };

  const name = detail.data?.name ?? t('details.cattleTitle');
  const location = detail.data?.description ?? null;

  if (detail.isLoading) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('details.cattleTitle')} showBack />
        <Loading label={t('common.loading')} />
      </SafeAreaScreen>
    );
  }
  if (detail.isError) {
    const status = (detail.error as { status?: number } | null)?.status;
    return (
      <SafeAreaScreen>
        <AppHeader title={t('details.cattleTitle')} showBack />
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
        title={t('details.cattleTitle')}
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
          icon="paw-outline"
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
            {activeBatches.isLoading ? (
              <Loading label={t('common.loading')} />
            ) : !batch ? (
              <EmptyBatch canManage={canManage} orgId={orgId} />
            ) : summary.isLoading || !summary.data ? (
              <Loading label={t('common.loading')} />
            ) : (
              <>
                <LivestockBatchSummaryCard
                  summary={summary.data}
                  canManage={canManage}
                  selling={sellBatch.isPending}
                  onAddDaily={() => router.push(Routes.cattleFarmSection(orgId, 'daily'))}
                  onWeeklyReport={() => router.push(Routes.cattleFarmSection(orgId, 'weekly'))}
                  onSell={() => setConfirmSell(true)}
                />

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
                          ? () => router.push(Routes.cattleFarmSection(orgId, 'daily'))
                          : undefined
                      }
                      renderRecord={(r, day) => (
                        <LivestockDailyRecordCard record={r} dayIndex={day} />
                      )}
                    />
                  )}
                </View>

                {weekly.data ? <LivestockWeeklySummaryCard summary={weekly.data} /> : null}
              </>
            )}

            {closedBatches.batches.length > 0 ? (
              <View style={{ rowGap: theme.spacing.sm }}>
                <Text variant="subtitle" weight="bold">
                  {t('batch.previousTitle')}
                </Text>
                <View style={{ rowGap: theme.spacing.sm }}>
                  {closedBatches.batches.map((b) => (
                    <LivestockBatchRow
                      key={b.id}
                      batch={b}
                      headCountLabel={`${b.headCount} ${t('batch.headUnit')}`}
                      statusLabel={t('batch.statusClosed')}
                      onPress={() => router.push(Routes.cattleBatchDetail(orgId, b.id))}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        ) : null}

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
                  onPress={() => router.push(Routes.cattleFarmSection(orgId, s.key))}
                />
              ))}
            </View>
          </View>
        ) : null}

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
  const { t } = useTranslation('sheepCattleFarm');
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
        icon="paw-outline"
        title={t('batch.emptyTitle')}
        message={t('batch.emptyBody')}
        actionLabel={canManage ? t('batch.addBatch') : undefined}
        onAction={canManage ? () => router.push(Routes.cattleBatchCreate(orgId)) : undefined}
      />
    </View>
  );
}
