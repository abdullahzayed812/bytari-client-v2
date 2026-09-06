import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { ConfirmationDialog, Skeleton, useToast } from '@/components/feedback';
import type { TraderApplicationSummary, TraderStatus } from '@/features/poultryMarket';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { AdminListScreen, AdminRow, FilterChips, ReasonPromptDialog } from '../components';
import { useAdminTraderApplications, useTraderDecisionMutation } from '../hooks';

type Scope = 'all' | 'pending' | 'approved' | 'rejected' | 'suspended';

function scopeToStatus(scope: Scope): TraderStatus | undefined {
  if (scope === 'all') return undefined;
  return scope.toUpperCase() as TraderStatus;
}

function statusTone(s: TraderStatus): 'success' | 'warning' | 'danger' | 'info' {
  if (s === 'APPROVED') return 'success';
  if (s === 'PENDING') return 'info';
  if (s === 'SUSPENDED') return 'warning';
  return 'danger';
}

/** `/admin/traders` — trader registration applications (approve/reject/suspend/reactivate). */
export default function AdminTraderApplicationsScreen() {
  const { t } = useTranslation('admin');
  const theme = useTheme();
  const toast = useToast();
  const [scope, setScope] = useState<Scope>('all');

  const q = useAdminTraderApplications({ status: scopeToStatus(scope) });
  const decide = useTraderDecisionMutation();

  const [approving, setApproving] = useState<TraderApplicationSummary | null>(null);
  const [rejecting, setRejecting] = useState<TraderApplicationSummary | null>(null);
  const [suspending, setSuspending] = useState<TraderApplicationSummary | null>(null);
  const [reactivating, setReactivating] = useState<TraderApplicationSummary | null>(null);

  const onApprove = () => {
    if (!approving) return;
    decide.mutate(
      { userId: approving.userId, decision: 'approve' },
      {
        onSuccess: () => {
          toast.show({ message: t('traders.toast.approved'), tone: 'success' });
          setApproving(null);
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  const onReject = (reason: string) => {
    if (!rejecting) return;
    decide.mutate(
      { userId: rejecting.userId, decision: 'reject', reason },
      {
        onSuccess: () => {
          toast.show({ message: t('traders.toast.rejected'), tone: 'success' });
          setRejecting(null);
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  const onSuspend = (reason: string) => {
    if (!suspending) return;
    decide.mutate(
      { userId: suspending.userId, decision: 'suspend', reason: reason || undefined },
      {
        onSuccess: () => {
          toast.show({ message: t('traders.toast.suspended'), tone: 'success' });
          setSuspending(null);
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  const onReactivate = () => {
    if (!reactivating) return;
    decide.mutate(
      { userId: reactivating.userId, decision: 'reactivate' },
      {
        onSuccess: () => {
          toast.show({ message: t('traders.toast.reactivated'), tone: 'success' });
          setReactivating(null);
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  return (
    <>
      <AdminListScreen<TraderApplicationSummary>
        title={t('traders.title')}
        query={q}
        data={q.applications}
        keyExtractor={(a) => a.userId}
        skeletonRow={
          <View style={{ rowGap: 8, padding: theme.spacing.md }}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={12} />
          </View>
        }
        emptyIcon="person-outline"
        emptyTitle={t('traders.empty')}
        emptyMessage={t('traders.emptyHint')}
        loadingMoreLabel={t('common.loadingMore')}
        filterBar={
          <FilterChips<Scope>
            value={scope}
            onChange={(v) => setScope(v ?? 'all')}
            options={[
              { value: 'all', label: t('traders.tab.all') },
              { value: 'pending', label: t('traders.tab.pending') },
              { value: 'approved', label: t('traders.tab.approved') },
              { value: 'rejected', label: t('traders.tab.rejected') },
              { value: 'suspended', label: t('traders.tab.suspended') },
            ]}
          />
        }
        renderItem={(a) => (
          <AdminRow
            title={`${a.user.firstName} ${a.user.lastName}`.trim() || a.user.email}
            subtitle={`${a.displayName} — ${t(`traders.type.${a.traderType}`)}`}
            meta={[a.governorate, a.district].filter(Boolean).join(' - ')}
            badge={{ label: t(`traders.status.${a.status}`), tone: statusTone(a.status) }}
            actions={
              <>
                {a.status === 'PENDING' ? (
                  <>
                    <Button
                      label={t('traders.detail.approve')}
                      variant="primary"
                      onPress={() => setApproving(a)}
                    />
                    <Button
                      label={t('traders.detail.reject')}
                      variant="danger"
                      onPress={() => setRejecting(a)}
                    />
                  </>
                ) : null}
                {a.status === 'APPROVED' ? (
                  <Button
                    label={t('traders.detail.suspend')}
                    variant="danger"
                    onPress={() => setSuspending(a)}
                  />
                ) : null}
                {a.status === 'SUSPENDED' ? (
                  <Button
                    label={t('traders.detail.reactivate')}
                    variant="primary"
                    onPress={() => setReactivating(a)}
                  />
                ) : null}
              </>
            }
          />
        )}
      />

      <ConfirmationDialog
        visible={approving != null}
        title={t('traders.detail.approve')}
        confirmLabel={t('traders.detail.approve')}
        cancelLabel={t('common.cancel')}
        loading={decide.isPending}
        onConfirm={onApprove}
        onCancel={() => setApproving(null)}
      />

      <ReasonPromptDialog
        visible={rejecting != null}
        title={t('traders.detail.rejectTitle')}
        message={t('traders.detail.rejectBody')}
        label={t('traders.detail.decisionReasonLabel')}
        confirmLabel={t('traders.detail.reject')}
        cancelLabel={t('common.cancel')}
        required
        destructive
        loading={decide.isPending}
        onConfirm={onReject}
        onCancel={() => setRejecting(null)}
      />

      <ReasonPromptDialog
        visible={suspending != null}
        title={t('traders.detail.suspendTitle')}
        message={t('traders.detail.suspendBody')}
        label={t('common.reasonOptional')}
        confirmLabel={t('traders.detail.suspend')}
        cancelLabel={t('common.cancel')}
        destructive
        loading={decide.isPending}
        onConfirm={onSuspend}
        onCancel={() => setSuspending(null)}
      />

      <ConfirmationDialog
        visible={reactivating != null}
        title={t('traders.detail.reactivate')}
        confirmLabel={t('traders.detail.reactivate')}
        cancelLabel={t('common.cancel')}
        loading={decide.isPending}
        onConfirm={onReactivate}
        onCancel={() => setReactivating(null)}
      />
    </>
  );
}
