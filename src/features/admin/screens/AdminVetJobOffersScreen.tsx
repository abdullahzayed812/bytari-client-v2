import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { Button } from '@/components/actions';
import { Avatar, Card } from '@/components/content';
import { ConfirmationDialog, Loading, Skeleton, useToast } from '@/components/feedback';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import {
  useAdminApproveVetJobOffer,
  useAdminRejectVetJobOffer,
  useAdminVetJobOfferApplications,
  useAdminVetJobOffers,
} from '@/features/vetJobs';
import type { VetJobApplication, VetJobModerationStatus, VetJobOffer } from '@/features/vetJobs';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import {
  AdminDetailModal,
  AdminListScreen,
  AdminRow,
  FilterChips,
  MessageUserDialog,
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
  const [applicantsOf, setApplicantsOf] = useState<VetJobOffer | null>(null);

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
    {
      label: dt('applicationDeadline'),
      value: o.applicationDeadline ? formatDate(o.applicationDeadline) : null,
    },
    { label: dt('rejectionReason'), value: o.rejectionReason },
    { label: dt('submittedAt'), value: formatDate(o.createdAt) },
    { label: dt('reviewedAt'), value: o.reviewedAt ? formatDate(o.reviewedAt) : null },
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
            counter={o.applicationCount ?? 0}
            counterLabel={t('vetJobOffers.applicants.count', { count: o.applicationCount ?? 0 })}
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
        {detail && detail.status !== 'PENDING' ? (
          <Button
            label={`${t('vetJobOffers.applicants.open')} (${detail.applicationCount ?? 0})`}
            variant="outline"
            leftIcon="people-outline"
            onPress={() => {
              const o = detail;
              setDetail(null);
              setApplicantsOf(o);
            }}
          />
        ) : null}
        {detail?.status === 'PENDING' ? (
          <View
            style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}
          >
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

      <ApplicantsModal offer={applicantsOf} onClose={() => setApplicantsOf(null)} />
    </>
  );
}

/**
 * One offer's applicants (`GET /admin/vet-job-applications?jobOfferId=`,
 * `vet_job.read`, read-only). "Message applicant" reuses the existing Admin →
 * user messaging (a SUPPORT thread owned by the applicant).
 */
function ApplicantsModal({ offer, onClose }: { offer: VetJobOffer | null; onClose: () => void }) {
  const { t } = useTranslation('admin');
  const { t: tv } = useTranslation('vetJobs');
  const q = useAdminVetJobOfferApplications(offer?.id);
  const [messaging, setMessaging] = useState<VetJobApplication | null>(null);

  return (
    <>
      <AdminDetailModal
        visible={offer != null}
        onClose={onClose}
        title={offer ? `${t('vetJobOffers.applicants.title')} · ${offer.title}` : ''}
        fields={[]}
      >
        <Text variant="bodyStrong">{t('vetJobOffers.applicants.count', { count: q.total })}</Text>
        {q.isLoading ? (
          <Loading />
        ) : q.applications.length === 0 ? (
          <Caption color="textMuted">{t('vetJobOffers.applicants.empty')}</Caption>
        ) : (
          q.applications.map((a) => (
            <Card key={a.id} variant="outlined" padding="sm">
              <View style={{ flexDirection: 'row', columnGap: 10, alignItems: 'flex-start' }}>
                <Avatar uri={a.photoUrl} name={a.fullName} size="avatarSm" />
                <View style={{ rowGap: 2, flex: 1 }}>
                  <Text variant="bodyStrong">{a.fullName}</Text>
                  <Caption color="textSecondary">
                    {[a.phone, a.email, a.specialty].filter(Boolean).join(' · ')}
                  </Caption>
                  {a.experienceYears != null ? (
                    <Caption color="textSecondary">
                      {t('vetJobOffers.applicants.experience', { count: a.experienceYears })}
                    </Caption>
                  ) : null}
                  {a.qualifications ? (
                    <Caption color="textMuted">{a.qualifications}</Caption>
                  ) : null}
                  {a.coverNote ? <Caption color="textMuted">{a.coverNote}</Caption> : null}
                  <Caption color="textMuted">
                    {`${t('vetJobOffers.applicants.appliedAt')}: ${formatDate(a.createdAt)} · ${tv(
                      `applicationStatus.${a.status}`,
                    )}`}
                  </Caption>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    {a.cvUrl ? (
                      <Button
                        label={t('vetJobOffers.applicants.cv')}
                        size="sm"
                        variant="ghost"
                        leftIcon="document-text-outline"
                        onPress={() => void Linking.openURL(a.cvUrl as string)}
                      />
                    ) : null}
                    <Button
                      label={t('vetJobOffers.applicants.contact')}
                      size="sm"
                      variant="outline"
                      leftIcon="chatbubble-ellipses-outline"
                      onPress={() => setMessaging(a)}
                    />
                    <Button
                      label={t('vetJobOffers.applicants.viewUser')}
                      size="sm"
                      variant="ghost"
                      leftIcon="person-outline"
                      onPress={() => {
                        onClose();
                        router.push(Routes.adminUser(a.applicant.id));
                      }}
                    />
                  </View>
                </View>
              </View>
            </Card>
          ))
        )}
        {q.hasNextPage ? (
          <Button
            label={t('vetJobOffers.applicants.loadMore')}
            variant="ghost"
            loading={q.isFetchingNextPage}
            onPress={() => void q.fetchNextPage()}
          />
        ) : null}
      </AdminDetailModal>

      {messaging ? (
        <MessageUserDialog
          userId={messaging.applicant.id}
          onDone={() => {
            setMessaging(null);
            onClose();
          }}
          onCancel={() => setMessaging(null)}
        />
      ) : null}
    </>
  );
}
