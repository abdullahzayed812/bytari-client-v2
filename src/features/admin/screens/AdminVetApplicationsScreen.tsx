import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/actions';
import { ConfirmationDialog, useToast } from '@/components/feedback';
import { RecordCardSkeleton } from '@/features/medical/components';
import { apiErrorMessage } from '@/lib/apiError';

import { AdminListScreen, AdminRow, ReasonPromptDialog } from '../components';
import { useAdminVetApplications, useVetDecisionMutation } from '../hooks';
import type { PendingVetApplication } from '../types';

export default function AdminVetApplicationsScreen() {
  const { t } = useTranslation('admin');
  const toast = useToast();
  const q = useAdminVetApplications();
  const decide = useVetDecisionMutation();

  const [approving, setApproving] = useState<PendingVetApplication | null>(null);
  const [rejecting, setRejecting] = useState<PendingVetApplication | null>(null);

  const onApprove = () => {
    if (!approving) return;
    const userId = approving.userId;
    decide.mutate(
      { userId, decision: 'approve' },
      {
        onSuccess: () => {
          toast.show({ message: t('vets.toast.approved'), tone: 'success' });
          setApproving(null);
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  const onReject = (reason: string) => {
    if (!rejecting) return;
    const userId = rejecting.userId;
    decide.mutate(
      { userId, decision: 'reject', reason },
      {
        onSuccess: () => {
          toast.show({ message: t('vets.toast.rejected'), tone: 'success' });
          setRejecting(null);
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  return (
    <>
      <AdminListScreen<PendingVetApplication>
        title={t('vets.title')}
        query={q}
        data={q.applications}
        keyExtractor={(a) => a.id}
        skeletonRow={<RecordCardSkeleton />}
        emptyIcon="ribbon-outline"
        emptyTitle={t('vets.empty')}
        emptyMessage={t('vets.emptyHint')}
        loadingMoreLabel={t('common.loadingMore')}
        renderItem={(a) => (
          <AdminRow
            title={`${a.user.firstName} ${a.user.lastName}`.trim() || a.user.email}
            subtitle={a.user.email}
            meta={
              a.note
                ? a.note
                : `${t('vets.submittedAt')}: ${new Date(a.createdAt).toLocaleDateString()}`
            }
            actions={
              <>
                <Button
                  label={t('vets.approve')}
                  variant="primary"
                  onPress={() => setApproving(a)}
                />
                <Button label={t('vets.reject')} variant="danger" onPress={() => setRejecting(a)} />
              </>
            }
          />
        )}
      />

      <ConfirmationDialog
        visible={approving != null}
        title={t('vets.approveTitle')}
        message={t('vets.approveBody')}
        confirmLabel={t('vets.approve')}
        cancelLabel={t('common.cancel')}
        loading={decide.isPending}
        onConfirm={onApprove}
        onCancel={() => setApproving(null)}
      />

      <ReasonPromptDialog
        visible={rejecting != null}
        title={t('vets.rejectTitle')}
        message={t('vets.rejectBody')}
        label={t('vets.reasonLabel')}
        placeholder={t('vets.reasonPlaceholder')}
        confirmLabel={t('vets.reject')}
        cancelLabel={t('common.cancel')}
        required
        destructive
        loading={decide.isPending}
        onConfirm={onReject}
        onCancel={() => setRejecting(null)}
      />
    </>
  );
}
