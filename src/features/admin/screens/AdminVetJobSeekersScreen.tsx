import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { Button, TextButton } from '@/components/actions';
import { ConfirmationDialog, Skeleton, useToast } from '@/components/feedback';
import { ImageThumbnailRow, ImageViewer } from '@/components/media';
import { Label } from '@/components/typography';
import {
  useAdminApproveVetJobSeeker,
  useAdminRejectVetJobSeeker,
  useAdminVetJobSeekers,
} from '@/features/vetJobs';
import type { VetJobModerationStatus, VetJobSeekerProfile } from '@/features/vetJobs';
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
  | 'user'
  | 'status'
  | 'specialty'
  | 'headline'
  | 'experienceYears'
  | 'governorate'
  | 'district'
  | 'qualifications'
  | 'phone'
  | 'email'
  | 'rejectionReason'
  | 'submittedAt'
  | 'reviewedAt';

/**
 * `/admin/vet-job-seekers` — the Veterinarian Jobs seeker-profile moderation
 * queue ("باحثون عن عمل"). Defaults to PENDING. Approve / reject are
 * backend-authorised (`vet_job.approve` / `vet_job.reject`; ADMIN or VET_JOBS
 * supervisor).
 */
export default function AdminVetJobSeekersScreen() {
  const { t } = useTranslation('admin');
  const theme = useTheme();
  const toast = useToast();

  const [status, setStatus] = useState<VetJobModerationStatus | undefined>('PENDING');
  const q = useAdminVetJobSeekers({ status });
  const approve = useAdminApproveVetJobSeeker();
  const reject = useAdminRejectVetJobSeeker();

  const [approving, setApproving] = useState<VetJobSeekerProfile | null>(null);
  const [rejecting, setRejecting] = useState<VetJobSeekerProfile | null>(null);
  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);
  const [detail, setDetail] = useState<VetJobSeekerProfile | null>(null);

  const dt = (key: DetailKey) => t(`vetJobSeekers.details.${key}`);
  const detailFields = (p: VetJobSeekerProfile) => [
    { label: dt('user'), value: `${p.user.firstName} ${p.user.lastName}` },
    { label: dt('status'), value: t(`vetJobSeekers.status.${p.status}`) },
    { label: dt('specialty'), value: p.specialty },
    { label: dt('headline'), value: p.headline },
    { label: dt('experienceYears'), value: p.experienceYears.toString() },
    { label: dt('governorate'), value: p.governorate },
    { label: dt('district'), value: p.district },
    { label: dt('qualifications'), value: p.qualifications },
    { label: dt('phone'), value: p.phone },
    { label: dt('email'), value: p.email },
    { label: dt('rejectionReason'), value: p.rejectionReason },
    { label: dt('submittedAt'), value: formatDate(p.createdAt) },
  ];

  const onApprove = () => {
    if (!approving) return;
    approve.mutate(
      { id: approving.id },
      {
        onSuccess: () => {
          toast.show({ message: t('vetJobSeekers.toast.approved'), tone: 'success' });
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
          toast.show({ message: t('vetJobSeekers.toast.rejected'), tone: 'success' });
          setRejecting(null);
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  return (
    <>
      <AdminListScreen<VetJobSeekerProfile>
        title={t('vetJobSeekers.title')}
        query={q}
        data={q.seekers}
        keyExtractor={(p) => p.id}
        skeletonRow={
          <View style={{ rowGap: 8, padding: theme.spacing.md }}>
            <Skeleton width="55%" height={16} />
            <Skeleton width="35%" height={12} />
          </View>
        }
        emptyIcon="person-outline"
        emptyTitle={t('vetJobSeekers.empty')}
        emptyMessage={t('vetJobSeekers.emptyHint')}
        loadingMoreLabel={t('common.loadingMore')}
        filterBar={
          <FilterChips<VetJobModerationStatus>
            value={status}
            onChange={setStatus}
            options={[
              { value: undefined, label: t('vetJobSeekers.status.ALL') },
              ...STATUSES.map((s) => ({ value: s, label: t(`vetJobSeekers.status.${s}`) })),
            ]}
          />
        }
        renderItem={(p) => (
          <AdminRow
            title={`${p.user.firstName} ${p.user.lastName}`}
            subtitle={`${p.specialty} · ${p.governorate}`}
            meta={`${t('vetJobSeekers.submittedAt')}: ${formatDate(p.createdAt)}`}
            image={{
              uri: p.photoUrl ?? null,
              fallbackIcon: 'person-outline',
              onPress: p.photoUrl
                ? () => setViewer({ images: [p.photoUrl as string], index: 0 })
                : undefined,
            }}
            onPress={() => setDetail(p)}
            badge={{ label: t(`vetJobSeekers.status.${p.status}`), tone: STATUS_TONE[p.status] }}
            actions={
              p.status === 'PENDING' ? (
                <>
                  <Button
                    label={t('vetJobSeekers.approve')}
                    variant="primary"
                    onPress={() => setApproving(p)}
                  />
                  <Button
                    label={t('vetJobSeekers.reject')}
                    variant="danger"
                    onPress={() => setRejecting(p)}
                  />
                </>
              ) : undefined
            }
          />
        )}
      />

      <ConfirmationDialog
        visible={approving != null}
        title={t('vetJobSeekers.approveTitle')}
        message={t('vetJobSeekers.approveBody')}
        confirmLabel={t('vetJobSeekers.approveConfirm')}
        cancelLabel={t('common.cancel')}
        loading={approve.isPending}
        onConfirm={onApprove}
        onCancel={() => setApproving(null)}
      />

      <ReasonPromptDialog
        visible={rejecting != null}
        title={t('vetJobSeekers.rejectTitle')}
        message={t('vetJobSeekers.rejectBody')}
        label={t('vetJobSeekers.reasonLabel')}
        placeholder={t('vetJobSeekers.reasonPlaceholder')}
        confirmLabel={t('vetJobSeekers.rejectConfirm')}
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
        title={detail ? `${detail.user.firstName} ${detail.user.lastName}` : t('vetJobSeekers.details.title')}
        fields={detail ? detailFields(detail) : []}
      >
        <View style={{ rowGap: theme.spacing.xs, marginTop: theme.spacing.sm }}>
          <Label>{t('vetJobSeekers.details.photo')}</Label>
          <ImageThumbnailRow
            images={detail?.photoUrl ? [detail.photoUrl] : []}
            size={96}
            fallbackIcon="person-outline"
            emptyLabel={t('vetJobSeekers.details.noPhoto')}
            onPress={() =>
              detail?.photoUrl ? setViewer({ images: [detail.photoUrl], index: 0 }) : undefined
            }
          />
          {detail?.cvUrl ? (
            <TextButton
              label={t('vetJobSeekers.details.openCv')}
              icon="document-text-outline"
              onPress={() => void Linking.openURL(detail.cvUrl as string)}
            />
          ) : null}
        </View>

        {detail?.status === 'PENDING' ? (
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
            <Button
              label={t('vetJobSeekers.approve')}
              variant="primary"
              onPress={() => {
                const p = detail;
                setDetail(null);
                setApproving(p);
              }}
            />
            <Button
              label={t('vetJobSeekers.reject')}
              variant="danger"
              onPress={() => {
                const p = detail;
                setDetail(null);
                setRejecting(p);
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
