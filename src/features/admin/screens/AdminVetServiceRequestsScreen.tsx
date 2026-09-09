import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { ConfirmationDialog, Skeleton, useToast } from '@/components/feedback';
import {
  useAdminApproveVetServiceRequest,
  useAdminRejectVetServiceRequest,
  useAdminVetServiceRequests,
} from '@/features/vetServices';
import type { ModerationStatus, ServiceRequest } from '@/features/vetServices';
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

const STATUSES: ModerationStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
const STATUS_TONE = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' } as const;

type DetailKey =
  | 'title'
  | 'requestNumber'
  | 'owner'
  | 'status'
  | 'serviceType'
  | 'animalType'
  | 'animalCount'
  | 'animalAge'
  | 'governorate'
  | 'district'
  | 'detailedAddress'
  | 'description'
  | 'needsFieldVisit'
  | 'preferredDate'
  | 'budget'
  | 'urgency'
  | 'extraNotes'
  | 'rejectionReason'
  | 'submittedAt';

/**
 * `/admin/vet-service-requests` — the pet-owner service-request moderation
 * queue. Defaults to PENDING. Approve / reject are backend-authorised
 * (`vet_service.approve` / `vet_service.reject`; ADMIN or VET_SERVICE supervisor).
 */
export default function AdminVetServiceRequestsScreen() {
  const { t } = useTranslation('admin');
  const { t: tv } = useTranslation('vetServices');
  const theme = useTheme();
  const toast = useToast();

  const [status, setStatus] = useState<ModerationStatus | undefined>('PENDING');
  const q = useAdminVetServiceRequests({ status });
  const approve = useAdminApproveVetServiceRequest();
  const reject = useAdminRejectVetServiceRequest();

  const [approving, setApproving] = useState<ServiceRequest | null>(null);
  const [rejecting, setRejecting] = useState<ServiceRequest | null>(null);
  const [detail, setDetail] = useState<ServiceRequest | null>(null);

  const dt = (key: DetailKey) => t(`vetServiceRequests.details.${key}`);
  const detailFields = (r: ServiceRequest) => [
    { label: dt('requestNumber'), value: r.requestNumber },
    { label: dt('owner'), value: `${r.petOwner.firstName} ${r.petOwner.lastName}` },
    { label: dt('status'), value: t(`vetServiceRequests.status.${r.status}`) },
    { label: dt('serviceType'), value: tv(`serviceType.${r.serviceType}`) },
    { label: dt('animalType'), value: tv(`animalType.${r.animalType}`) },
    { label: dt('animalCount'), value: r.animalCount != null ? String(r.animalCount) : null },
    { label: dt('animalAge'), value: r.animalAge },
    { label: dt('governorate'), value: r.governorate },
    { label: dt('district'), value: r.district },
    { label: dt('detailedAddress'), value: r.detailedAddress },
    { label: dt('description'), value: r.description },
    { label: dt('needsFieldVisit'), value: r.needsFieldVisit ? tv('common.yes') : tv('common.no') },
    { label: dt('preferredDate'), value: r.preferredDate ? formatDate(r.preferredDate) : null },
    { label: dt('budget'), value: r.budgetAmount },
    { label: dt('urgency'), value: tv(`urgency.${r.urgency}`) },
    { label: dt('extraNotes'), value: r.extraNotes },
    { label: dt('rejectionReason'), value: r.rejectionReason },
    { label: dt('submittedAt'), value: formatDate(r.createdAt) },
  ];

  const onApprove = () => {
    if (!approving) return;
    approve.mutate(
      { id: approving.id },
      {
        onSuccess: () => {
          toast.show({ message: t('vetServiceRequests.toast.approved'), tone: 'success' });
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
          toast.show({ message: t('vetServiceRequests.toast.rejected'), tone: 'success' });
          setRejecting(null);
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  return (
    <>
      <AdminListScreen<ServiceRequest>
        title={t('vetServiceRequests.title')}
        query={q}
        data={q.requests}
        keyExtractor={(r) => r.id}
        skeletonRow={
          <View style={{ rowGap: 8, padding: theme.spacing.md }}>
            <Skeleton width="55%" height={16} />
            <Skeleton width="35%" height={12} />
          </View>
        }
        emptyIcon="clipboard-outline"
        emptyTitle={t('vetServiceRequests.empty')}
        emptyMessage={t('vetServiceRequests.emptyHint')}
        loadingMoreLabel={t('common.loadingMore')}
        filterBar={
          <FilterChips<ModerationStatus>
            value={status}
            onChange={setStatus}
            options={[
              { value: undefined, label: t('vetServiceRequests.status.ALL') },
              ...STATUSES.map((s) => ({ value: s, label: t(`vetServiceRequests.status.${s}`) })),
            ]}
          />
        }
        renderItem={(r) => (
          <AdminRow
            title={r.title}
            subtitle={`${r.petOwner.firstName} ${r.petOwner.lastName} · ${tv(`serviceType.${r.serviceType}`)}`}
            meta={`${r.requestNumber} · ${formatDate(r.createdAt)}`}
            onPress={() => setDetail(r)}
            badge={{ label: t(`vetServiceRequests.status.${r.status}`), tone: STATUS_TONE[r.status] }}
            actions={
              r.status === 'PENDING' ? (
                <>
                  <Button
                    label={t('vetServiceRequests.approve')}
                    variant="primary"
                    onPress={() => setApproving(r)}
                  />
                  <Button
                    label={t('vetServiceRequests.reject')}
                    variant="danger"
                    onPress={() => setRejecting(r)}
                  />
                </>
              ) : undefined
            }
          />
        )}
      />

      <ConfirmationDialog
        visible={approving != null}
        title={t('vetServiceRequests.approveTitle')}
        message={t('vetServiceRequests.approveBody')}
        confirmLabel={t('vetServiceRequests.approveConfirm')}
        cancelLabel={t('common.cancel')}
        loading={approve.isPending}
        onConfirm={onApprove}
        onCancel={() => setApproving(null)}
      />

      <ReasonPromptDialog
        visible={rejecting != null}
        title={t('vetServiceRequests.rejectTitle')}
        message={t('vetServiceRequests.rejectBody')}
        label={t('vetServiceRequests.reasonLabel')}
        placeholder={t('vetServiceRequests.reasonPlaceholder')}
        confirmLabel={t('vetServiceRequests.rejectConfirm')}
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
        title={detail ? detail.title : t('vetServiceRequests.details.title')}
        fields={detail ? detailFields(detail) : []}
      >
        {detail && detail.imageUrls.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
              {detail.imageUrls.map((uri) => (
                <Image
                  key={uri}
                  source={{ uri }}
                  style={{ width: 96, height: 96, borderRadius: theme.radius.md }}
                  resizeMode="cover"
                />
              ))}
            </View>
          </ScrollView>
        ) : null}
        {detail?.status === 'PENDING' ? (
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
            <Button
              label={t('vetServiceRequests.approve')}
              variant="primary"
              onPress={() => {
                const r = detail;
                setDetail(null);
                setApproving(r);
              }}
            />
            <Button
              label={t('vetServiceRequests.reject')}
              variant="danger"
              onPress={() => {
                const r = detail;
                setDetail(null);
                setRejecting(r);
              }}
            />
          </View>
        ) : null}
      </AdminDetailModal>
    </>
  );
}
