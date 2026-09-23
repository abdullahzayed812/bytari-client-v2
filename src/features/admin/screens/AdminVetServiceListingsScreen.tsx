import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { ConfirmationDialog, Skeleton, useToast } from '@/components/feedback';
import { ImageThumbnailRow, ImageViewer } from '@/components/media';
import {
  useAdminApproveVetServiceListing,
  useAdminRejectVetServiceListing,
  useAdminVetServiceListings,
} from '@/features/vetServices';
import type { ModerationStatus, ServiceListing } from '@/features/vetServices';
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
  | 'vet'
  | 'status'
  | 'serviceType'
  | 'animalType'
  | 'specialty'
  | 'governorate'
  | 'district'
  | 'description'
  | 'price'
  | 'priceType'
  | 'locationMode'
  | 'availability'
  | 'contactPhone'
  | 'contactWhatsapp'
  | 'executionDuration'
  | 'details'
  | 'rejectionReason'
  | 'submittedAt'
  | 'reviewedAt';

/**
 * `/admin/vet-service-listings` — the Veterinary Services listing moderation
 * queue. Defaults to PENDING. Approve / reject are backend-authorised
 * (`vet_service.approve` / `vet_service.reject`; ADMIN or VET_SERVICE supervisor).
 */
export default function AdminVetServiceListingsScreen() {
  const { t } = useTranslation('admin');
  const { t: tv } = useTranslation('vetServices');
  const theme = useTheme();
  const toast = useToast();

  const [status, setStatus] = useState<ModerationStatus | undefined>('PENDING');
  const q = useAdminVetServiceListings({ status });
  const approve = useAdminApproveVetServiceListing();
  const reject = useAdminRejectVetServiceListing();

  const [approving, setApproving] = useState<ServiceListing | null>(null);
  const [rejecting, setRejecting] = useState<ServiceListing | null>(null);
  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);
  const [detail, setDetail] = useState<ServiceListing | null>(null);

  const dt = (key: DetailKey) => t(`vetServiceListings.details.${key}`);
  const detailFields = (l: ServiceListing) => [
    { label: dt('vet'), value: `${l.veterinarian.firstName} ${l.veterinarian.lastName}` },
    { label: dt('status'), value: t(`vetServiceListings.status.${l.status}`) },
    { label: dt('serviceType'), value: tv(`serviceType.${l.serviceType}`) },
    { label: dt('animalType'), value: tv(`animalType.${l.animalType}`) },
    { label: dt('specialty'), value: l.specialty },
    { label: dt('governorate'), value: l.governorate },
    { label: dt('district'), value: l.district },
    { label: dt('description'), value: l.description },
    { label: dt('price'), value: l.priceAmount },
    { label: dt('priceType'), value: tv(`priceType.${l.priceType}`) },
    { label: dt('locationMode'), value: tv(`locationMode.${l.locationMode}`) },
    { label: dt('availability'), value: l.availability },
    { label: dt('contactPhone'), value: l.contactPhone },
    { label: dt('contactWhatsapp'), value: l.contactWhatsapp },
    { label: dt('executionDuration'), value: l.executionDuration },
    { label: dt('details'), value: l.details.join('\n') || null },
    { label: dt('rejectionReason'), value: l.rejectionReason },
    { label: dt('submittedAt'), value: formatDate(l.createdAt) },
    { label: dt('reviewedAt'), value: l.reviewedAt ? formatDate(l.reviewedAt) : null },
  ];

  const onApprove = () => {
    if (!approving) return;
    approve.mutate(
      { id: approving.id },
      {
        onSuccess: () => {
          toast.show({ message: t('vetServiceListings.toast.approved'), tone: 'success' });
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
          toast.show({ message: t('vetServiceListings.toast.rejected'), tone: 'success' });
          setRejecting(null);
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  return (
    <>
      <AdminListScreen<ServiceListing>
        title={t('vetServiceListings.title')}
        query={q}
        data={q.listings}
        keyExtractor={(l) => l.id}
        skeletonRow={
          <View style={{ rowGap: 8, padding: theme.spacing.md }}>
            <Skeleton width="55%" height={16} />
            <Skeleton width="35%" height={12} />
          </View>
        }
        emptyIcon="medkit-outline"
        emptyTitle={t('vetServiceListings.empty')}
        emptyMessage={t('vetServiceListings.emptyHint')}
        loadingMoreLabel={t('common.loadingMore')}
        filterBar={
          <FilterChips<ModerationStatus>
            value={status}
            onChange={setStatus}
            options={[
              { value: undefined, label: t('vetServiceListings.status.ALL') },
              ...STATUSES.map((s) => ({ value: s, label: t(`vetServiceListings.status.${s}`) })),
            ]}
          />
        }
        renderItem={(l) => (
          <AdminRow
            title={l.title}
            subtitle={`${l.veterinarian.firstName} ${l.veterinarian.lastName} · ${tv(`serviceType.${l.serviceType}`)}`}
            meta={`${t('vetServiceListings.submittedAt')}: ${formatDate(l.createdAt)}`}
            image={{
              uri: l.imageUrls[0] ?? null,
              fallbackIcon: 'medkit-outline',
              onPress:
                l.imageUrls.length > 0
                  ? () => setViewer({ images: l.imageUrls, index: 0 })
                  : undefined,
            }}
            onPress={() => setDetail(l)}
            badge={{ label: t(`vetServiceListings.status.${l.status}`), tone: STATUS_TONE[l.status] }}
            actions={
              l.status === 'PENDING' ? (
                <>
                  <Button
                    label={t('vetServiceListings.approve')}
                    variant="primary"
                    onPress={() => setApproving(l)}
                  />
                  <Button
                    label={t('vetServiceListings.reject')}
                    variant="danger"
                    onPress={() => setRejecting(l)}
                  />
                </>
              ) : undefined
            }
          />
        )}
      />

      <ConfirmationDialog
        visible={approving != null}
        title={t('vetServiceListings.approveTitle')}
        message={t('vetServiceListings.approveBody')}
        confirmLabel={t('vetServiceListings.approveConfirm')}
        cancelLabel={t('common.cancel')}
        loading={approve.isPending}
        onConfirm={onApprove}
        onCancel={() => setApproving(null)}
      />

      <ReasonPromptDialog
        visible={rejecting != null}
        title={t('vetServiceListings.rejectTitle')}
        message={t('vetServiceListings.rejectBody')}
        label={t('vetServiceListings.reasonLabel')}
        placeholder={t('vetServiceListings.reasonPlaceholder')}
        confirmLabel={t('vetServiceListings.rejectConfirm')}
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
        title={detail ? detail.title : t('vetServiceListings.details.title')}
        fields={detail ? detailFields(detail) : []}
      >
        <View style={{ marginTop: theme.spacing.sm }}>
          <ImageThumbnailRow
            images={detail?.imageUrls ?? []}
            size={96}
            onPress={(index) =>
              detail ? setViewer({ images: detail.imageUrls, index }) : undefined
            }
          />
        </View>
        {detail?.status === 'PENDING' ? (
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
            <Button
              label={t('vetServiceListings.approve')}
              variant="primary"
              onPress={() => {
                const l = detail;
                setDetail(null);
                setApproving(l);
              }}
            />
            <Button
              label={t('vetServiceListings.reject')}
              variant="danger"
              onPress={() => {
                const l = detail;
                setDetail(null);
                setRejecting(l);
              }}
            />
          </View>
        ) : null}
      </AdminDetailModal>

      <ImageViewer
        visible={viewer !== null}
        images={viewer?.images ?? []}
        initialIndex={viewer?.index ?? 0}
        onClose={() => setViewer(null)}
      />
    </>
  );
}
