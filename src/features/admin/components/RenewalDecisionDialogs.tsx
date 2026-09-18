import { useTranslation } from 'react-i18next';

import { useFarmRenewalDecisionMutation } from '../hooks';

import { ReasonPromptDialog } from './ReasonPromptDialog';
import { SubscriptionDatesDialog } from './SubscriptionDatesDialog';

export interface RenewalDecisionDialogProps {
  visible: boolean;
  organizationId: string;
  requestId: string | null;
  onDone: () => void;
  onError: (e: unknown) => void;
  onCancel: () => void;
}

/** Approve dialog for a PENDING renewal request — sets the new subscription period. */
export function RenewalApproveDialog({
  visible,
  organizationId,
  requestId,
  onDone,
  onError,
  onCancel,
}: RenewalDecisionDialogProps) {
  const { t } = useTranslation('admin');
  const decide = useFarmRenewalDecisionMutation(organizationId, requestId ?? '');
  return (
    <SubscriptionDatesDialog
      visible={visible}
      title={t('farms.detail.approveRenewalTitle')}
      confirmLabel={t('farms.detail.approveRenewal')}
      loading={decide.isPending}
      onConfirm={(dates) =>
        decide.mutate({ decision: 'approve', ...dates }, { onSuccess: onDone, onError })
      }
      onCancel={onCancel}
    />
  );
}

/** Reject dialog for a PENDING renewal request — requires a reason. */
export function RenewalRejectDialog({
  visible,
  organizationId,
  requestId,
  onDone,
  onError,
  onCancel,
}: RenewalDecisionDialogProps) {
  const { t } = useTranslation('admin');
  const decide = useFarmRenewalDecisionMutation(organizationId, requestId ?? '');
  return (
    <ReasonPromptDialog
      visible={visible}
      title={t('farms.detail.rejectRenewalTitle')}
      message={t('farms.detail.rejectRenewalBody')}
      label={t('orgs.reasonLabel')}
      placeholder={t('orgs.reasonPlaceholder')}
      confirmLabel={t('farms.detail.rejectRenewal')}
      cancelLabel={t('common.cancel')}
      required
      destructive
      loading={decide.isPending}
      onConfirm={(reason) =>
        decide.mutate({ decision: 'reject', reason }, { onSuccess: onDone, onError })
      }
      onCancel={onCancel}
    />
  );
}
