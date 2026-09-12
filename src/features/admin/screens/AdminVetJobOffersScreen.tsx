import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { ConfirmationDialog, Skeleton, useToast } from '@/components/feedback';
import {
  useAdminApproveVetJobOffer,
  useAdminRejectVetJobOffer,
  useAdminVetJobOffers,
} from '@/features/vetJobs';
import type { VetJobModerationStatus, VetJobOffer } from '@/features/vetJobs';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import {
  AdminDetailModal,
  AdminListScreen,
  AdminRow,
  FilterChips,
  ReasonPromptDialog,
} from '../components';

const STATUSES: VetJobModerationStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
const STATUS_TONE = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' } as const;

type DetailKey =
  | 'postedBy'
  | 'status'
  | 'organizationName'
  | 'employmentType'
  | 'governorate'
  | 'district'
  | 'salary'
  | 'experienceYearsRequired'
  | 'qualifications'
  | 'description'
  | 'contactPhone'
  | 'contactEmail'
  | 'applicationDeadline'
  | 'rejectionReason'
  | 'submittedAt'
  | 'reviewedAt';

/**
 * `/admin/vet-job-offers` — the Veterinarian Jobs offer moderation queue.
 * Defaults to PENDING. Approve / reject are backend-authorised
 * (`vet_job.approve` / `vet_job.reject`; ADMIN or VET_JOBS supervisor).
 */
export default function AdminVetJobOffersScreen() {
  const { t } = useTranslation('admin');
  const { t: tv } = useTranslation('vetJobs');
  const theme = useTheme();
  const toast = useToast();

  const [status, setStatus] = useState<VetJobModerationStatus | undefined>('PENDING');
  const q = useAdminVetJobOffers({ status });
  const approve = useAdminApproveVetJobOffer();
  const reject = useAdminRejectVetJobOffer();

  const [approving, setApproving] = useState<VetJobOffer | null>(null);
  const [rejecting, setRejecting] = useState<VetJobOffer | null>(null);
  const [detail, setDetail] = useState<VetJobOffer | null>(null);

  const dt = (key: DetailKey) => t(`vetJobOffers.details.${key}`);
  const detailFields = (o: VetJobOffer) => [
    { label: dt('postedBy'), value: `${o.postedBy.firstName} ${o.postedBy.lastName}` },
    { label: dt('status'), value: t(`vetJobOffers.status.${o.status}`) },
    { label: dt('organizationName'), value: o.organizationName },
    { label: dt('employmentType'), value: tv(`employmentType.${o.employmentType}`) },
    { label: dt('governorate'), value: o.governorate },
    { label: dt('district'), value: o.district },
    {
      label: dt('salary'),
      value: o.salaryAmount ?? (o.salaryNegotiable ? tv('offers.negotiable') : null),
    },
    { label: dt('experienceYearsRequired'), value: o.experienceYearsRequired?.toString() ?? null },
    { label: dt('qualifications'), value: o.qualifications },
    { label: dt('description'), value: o.description },
    { label: dt('contactPhone'), value: o.contactPhone },
    { label: dt('contactEmail'), value: o.contactEmail },
    { label: dt('applicationDeadline'), value: o.applicationDeadline },
    { label: dt('rejectionReason'), value: o.rejectionReason },
    { label: dt('submittedAt'), value: formatDate(o.createdAt) },
    { label: dt('reviewedAt'), value: null },
  ];

  const onApprove = () => {
    if (!approving) return;
    approve.mutate(
      { id: approving.id },
      {
        onSuccess: () => {
          toast.show({ message: t('vetJobOffers.toast.approved'), tone: 'success' });
          setApproving(null);
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };
  const onReject = (reason: string) => {
    if (!rejecting) return;
    reject.mutate(
      { id: rejecting.id, reason },
      {
        onSuccess: () => {
          toast.show({ message: t('vetJobOffers.toast.rejected'), tone: 'success' });
          setRejecting(null);
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  return (
    <>
      <AdminListScreen<VetJobOffer>
        title={t('vetJobOffers.title')}
        query={q}
        data={q.offers}
        keyExtractor={(o) => o.id}
        skeletonRow={
          <View style={{ rowGap: 8, padding: theme.spacing.md }}>
            <Skeleton width="55%" height={16} />
            <Skeleton width="35%" height={12} />
          </View>
        }
        emptyIcon="briefcase-outline"
        emptyTitle={t('vetJobOffers.empty')}
        emptyMessage={t('vetJobOffers.emptyHint')}
        loadingMoreLabel={t('common.loadingMore')}
        filterBar={
          <FilterChips<VetJobModerationStatus>
            value={status}
            onChange={setStatus}
            options={[
              { value: undefined, label: t('vetJobOffers.status.ALL') },
              ...STATUSES.map((s) => ({ value: s, label: t(`vetJobOffers.status.${s}`) })),
            ]}
          />
        }
        renderItem={(o) => (
          <AdminRow
            title={o.title}
            subtitle={`${o.organizationName} · ${tv(`employmentType.${o.employmentType}`)}`}
            meta={`${t('vetJobOffers.submittedAt')}: ${formatDate(o.createdAt)}`}
            onPress={() => setDetail(o)}
            badge={{ label: t(`vetJobOffers.status.${o.status}`), tone: STATUS_TONE[o.status] }}
            actions={
              o.status === 'PENDING' ? (
                <>
                  <Button
                    label={t('vetJobOffers.approve')}
                    variant="primary"
                    onPress={() => setApproving(o)}
                  />
                  <Button
                    label={t('vetJobOffers.reject')}
                    variant="danger"
                    onPress={() => setRejecting(o)}
                  />
                </>
              ) : undefined
            }
          />
        )}
      />

      <ConfirmationDialog
        visible={approving != null}
        title={t('vetJobOffers.approveTitle')}
        message={t('vetJobOffers.approveBody')}
        confirmLabel={t('vetJobOffers.approveConfirm')}
        cancelLabel={t('common.cancel')}
        loading={approve.isPending}
        onConfirm={onApprove}
        onCancel={() => setApproving(null)}
      />

      <ReasonPromptDialog
        visible={rejecting != null}
        title={t('vetJobOffers.rejectTitle')}
        message={t('vetJobOffers.rejectBody')}
        label={t('vetJobOffers.reasonLabel')}
        placeholder={t('vetJobOffers.reasonPlaceholder')}
        confirmLabel={t('vetJobOffers.rejectConfirm')}
        cancelLabel={t('common.cancel')}
        required
        destructive
        loading={reject.isPending}
        onConfirm={onReject}
        onCancel={() => setRejecting(null)}
      />

      <AdminDetailModal
        visible={detail != null}
        onClose={() => setDetail(null)}
        title={detail ? detail.title : t('vetJobOffers.details.title')}
        fields={detail ? detailFields(detail) : []}
      >
        {detail?.status === 'PENDING' ? (
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
            <Button
              label={t('vetJobOffers.approve')}
              variant="primary"
              onPress={() => {
                const o = detail;
                setDetail(null);
                setApproving(o);
              }}
            />
            <Button
              label={t('vetJobOffers.reject')}
              variant="danger"
              onPress={() => {
                const o = detail;
                setDetail(null);
                setRejecting(o);
              }}
            />
          </View>
        ) : null}
      </AdminDetailModal>
    </>
  );
}
