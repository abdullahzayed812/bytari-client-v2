import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { ConfirmationDialog, Skeleton, useToast } from '@/components/feedback';
import {
  useAdminApproveVetCourse,
  useAdminCancelVetCourse,
  useAdminRejectVetCourse,
  useAdminVetCourses,
} from '@/features/vetCourses';
import type { VetCourse, VetCourseModerationStatus } from '@/features/vetCourses';
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

const STATUSES: VetCourseModerationStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
const STATUS_TONE = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' } as const;

type DetailKey =
  | 'creator'
  | 'status'
  | 'type'
  | 'organizingBody'
  | 'instructorName'
  | 'startDate'
  | 'endDate'
  | 'locationMode'
  | 'locationDetails'
  | 'capacity'
  | 'price'
  | 'registrationCount'
  | 'description'
  | 'rejectionReason'
  | 'submittedAt';

/**
 * `/admin/vet-courses` — the Veterinarian Courses & Seminars moderation
 * queue. Approve / reject / cancel are backend-authorised (`vet_course.approve`
 * / `vet_course.reject`; ADMIN or VET_COURSES supervisor).
 */
export default function AdminVetCoursesScreen() {
  const { t } = useTranslation('admin');
  const { t: tv } = useTranslation('vetCourses');
  const theme = useTheme();
  const toast = useToast();

  const [status, setStatus] = useState<VetCourseModerationStatus | undefined>('PENDING');
  const q = useAdminVetCourses({ status });
  const approve = useAdminApproveVetCourse();
  const reject = useAdminRejectVetCourse();
  const cancel = useAdminCancelVetCourse();

  const [approving, setApproving] = useState<VetCourse | null>(null);
  const [rejecting, setRejecting] = useState<VetCourse | null>(null);
  const [cancelling, setCancelling] = useState<VetCourse | null>(null);
  const [detail, setDetail] = useState<VetCourse | null>(null);

  const dt = (key: DetailKey) => t(`vetCourses.details.${key}`);
  const detailFields = (c: VetCourse) => [
    { label: dt('creator'), value: `${c.creator.firstName} ${c.creator.lastName}` },
    { label: dt('status'), value: t(`vetCourses.status.${c.status}`) },
    { label: dt('type'), value: tv(`type.${c.type}`) },
    { label: dt('organizingBody'), value: c.organizingBody },
    { label: dt('instructorName'), value: c.instructorName },
    { label: dt('startDate'), value: c.startDate },
    { label: dt('endDate'), value: c.endDate },
    { label: dt('locationMode'), value: tv(`locationMode.${c.locationMode}`) },
    { label: dt('locationDetails'), value: c.locationDetails },
    { label: dt('capacity'), value: c.capacity?.toString() ?? null },
    { label: dt('price'), value: c.price },
    { label: dt('registrationCount'), value: c.registrationCount?.toString() ?? '0' },
    { label: dt('description'), value: c.description },
    { label: dt('rejectionReason'), value: c.rejectionReason },
    { label: dt('submittedAt'), value: formatDate(c.createdAt) },
  ];

  const onApprove = () => {
    if (!approving) return;
    approve.mutate(
      { id: approving.id },
      {
        onSuccess: () => {
          toast.show({ message: t('vetCourses.toast.approved'), tone: 'success' });
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
          toast.show({ message: t('vetCourses.toast.rejected'), tone: 'success' });
          setRejecting(null);
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };
  const onCancel = () => {
    if (!cancelling) return;
    cancel.mutate(
      { id: cancelling.id },
      {
        onSuccess: () => {
          toast.show({ message: t('vetCourses.toast.cancelled'), tone: 'success' });
          setCancelling(null);
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  return (
    <>
      <AdminListScreen<VetCourse>
        title={t('vetCourses.title')}
        query={q}
        data={q.courses}
        keyExtractor={(c) => c.id}
        skeletonRow={
          <View style={{ rowGap: 8, padding: theme.spacing.md }}>
            <Skeleton width="55%" height={16} />
            <Skeleton width="35%" height={12} />
          </View>
        }
        emptyIcon="school-outline"
        emptyTitle={t('vetCourses.empty')}
        emptyMessage={t('vetCourses.emptyHint')}
        loadingMoreLabel={t('common.loadingMore')}
        filterBar={
          <FilterChips<VetCourseModerationStatus>
            value={status}
            onChange={setStatus}
            options={[
              { value: undefined, label: t('vetCourses.status.ALL') },
              ...STATUSES.map((s) => ({ value: s, label: t(`vetCourses.status.${s}`) })),
            ]}
          />
        }
        renderItem={(c) => (
          <AdminRow
            title={c.title}
            subtitle={`${c.organizingBody} · ${tv(`type.${c.type}`)}`}
            meta={`${t('vetCourses.submittedAt')}: ${formatDate(c.createdAt)}`}
            onPress={() => setDetail(c)}
            badge={{ label: t(`vetCourses.status.${c.status}`), tone: STATUS_TONE[c.status] }}
            actions={
              c.status === 'PENDING' ? (
                <>
                  <Button label={t('vetCourses.approve')} variant="primary" onPress={() => setApproving(c)} />
                  <Button label={t('vetCourses.reject')} variant="danger" onPress={() => setRejecting(c)} />
                </>
              ) : c.status === 'APPROVED' && !c.cancelledAt ? (
                <Button label={t('vetCourses.cancel')} variant="danger" onPress={() => setCancelling(c)} />
              ) : undefined
            }
          />
        )}
      />

      <ConfirmationDialog
        visible={approving != null}
        title={t('vetCourses.approveTitle')}
        message={t('vetCourses.approveBody')}
        confirmLabel={t('vetCourses.approveConfirm')}
        cancelLabel={t('common.cancel')}
        loading={approve.isPending}
        onConfirm={onApprove}
        onCancel={() => setApproving(null)}
      />

      <ReasonPromptDialog
        visible={rejecting != null}
        title={t('vetCourses.rejectTitle')}
        message={t('vetCourses.rejectBody')}
        label={t('vetCourses.reasonLabel')}
        placeholder={t('vetCourses.reasonPlaceholder')}
        confirmLabel={t('vetCourses.rejectConfirm')}
        cancelLabel={t('common.cancel')}
        required
        destructive
        loading={reject.isPending}
        onConfirm={onReject}
        onCancel={() => setRejecting(null)}
      />

      <ConfirmationDialog
        visible={cancelling != null}
        title={t('vetCourses.cancelTitle')}
        message={t('vetCourses.cancelBody')}
        confirmLabel={t('vetCourses.cancelConfirm')}
        cancelLabel={t('common.cancel')}
        destructive
        loading={cancel.isPending}
        onConfirm={onCancel}
        onCancel={() => setCancelling(null)}
      />

      <AdminDetailModal
        visible={detail != null}
        onClose={() => setDetail(null)}
        title={detail ? detail.title : t('vetCourses.details.title')}
        fields={detail ? detailFields(detail) : []}
      >
        {detail?.status === 'PENDING' ? (
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
            <Button
              label={t('vetCourses.approve')}
              variant="primary"
              onPress={() => {
                const c = detail;
                setDetail(null);
                setApproving(c);
              }}
            />
            <Button
              label={t('vetCourses.reject')}
              variant="danger"
              onPress={() => {
                const c = detail;
                setDetail(null);
                setRejecting(c);
              }}
            />
          </View>
        ) : detail?.status === 'APPROVED' && !detail.cancelledAt ? (
          <View style={{ marginTop: theme.spacing.sm }}>
            <Button
              label={t('vetCourses.cancel')}
              variant="danger"
              onPress={() => {
                const c = detail;
                setDetail(null);
                setCancelling(c);
              }}
            />
          </View>
        ) : null}
      </AdminDetailModal>
    </>
  );
}
