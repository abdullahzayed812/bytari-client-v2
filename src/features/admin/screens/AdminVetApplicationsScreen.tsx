import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { Button, TextButton } from '@/components/actions';
import { ConfirmationDialog, useToast } from '@/components/feedback';
import { ImageThumbnailRow, ImageViewer } from '@/components/media';
import { Caption, Label } from '@/components/typography';
import { RecordCardSkeleton } from '@/features/medical/components';
import { countryDisplayName } from '@/features/registration';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { AdminDetailModal, AdminListScreen, AdminRow, ReasonPromptDialog } from '../components';
import { useAdminVetApplications, useVetDecisionMutation } from '../hooks';
import type { PendingVetApplication, VetApplicationDocument } from '../types';

const isImage = (d: VetApplicationDocument): boolean => d.mimeType.startsWith('image/');

/**
 * `/admin/vet-applications` — veterinarian / student approval queue.
 *
 * The applicant's identity + licence documents are shown inline so the
 * reviewer decides WITH the evidence in front of them. Those documents are
 * restricted: the backend only attaches their signed `downloadUrl` to this
 * `veterinarian.read`-gated projection, so nothing here widens access — it
 * renders what the authorised caller already received. Image documents open in
 * the shared full-screen `ImageViewer`; PDFs hand off to the OS viewer.
 *
 * Tapping a row opens the applicant's COMPLETE record (`AdminDetailModal`):
 * every stored profile field the backend returns on this projection, the
 * application itself, the documents, and the approve / reject actions — so the
 * decision can be made from the full picture.
 */
export default function AdminVetApplicationsScreen() {
  const { t, i18n } = useTranslation('admin');
  const theme = useTheme();
  const toast = useToast();
  const q = useAdminVetApplications();
  const decide = useVetDecisionMutation();

  const [approving, setApproving] = useState<PendingVetApplication | null>(null);
  const [rejecting, setRejecting] = useState<PendingVetApplication | null>(null);
  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);
  const [detail, setDetail] = useState<PendingVetApplication | null>(null);

  const fullName = (a: PendingVetApplication) =>
    `${a.user.firstName} ${a.user.lastName}`.trim() || a.user.email;

  const detailFields = (a: PendingVetApplication) => {
    const u = a.user;
    return [
      { label: t('vets.detail.nameLabel'), value: fullName(a) },
      { label: t('users.detail.emailLabel'), value: u.email },
      { label: t('users.detail.phoneLabel'), value: u.phone },
      {
        label: t('users.detail.genderLabel'),
        value: u.gender ? t(`users.detail.gender.${u.gender}`) : null,
      },
      {
        label: t('users.detail.countryLabel'),
        value: countryDisplayName(u.country, i18n.language),
      },
      { label: t('users.detail.governorateLabel'), value: u.governorate },
      { label: t('users.detail.specializationLabel'), value: u.specialization },
      { label: t('users.detail.vetSubTypeLabel'), value: t(`vets.subType.${a.subType}`) },
      {
        label: t('vets.detail.applicationStatusLabel'),
        value: t(`vets.detail.status.${a.status}`),
      },
      { label: t('users.detail.vetAppliedAtLabel'), value: formatDate(a.createdAt) },
      { label: t('vets.detail.noteLabel'), value: a.note },
      {
        label: t('users.detail.statusLabel'),
        value: u.status ? t(`users.status.${u.status}`) : null,
      },
      {
        label: t('users.detail.registrationLabel'),
        value: u.registrationType ? t(`users.detail.registrationType.${u.registrationType}`) : null,
      },
      { label: t('users.detail.joinedLabel'), value: u.createdAt ? formatDate(u.createdAt) : null },
    ];
  };

  const onApprove = () => {
    if (!approving) return;
    const userId = approving.userId;
    decide.mutate(
      { userId, decision: 'approve' },
      {
        onSuccess: () => {
          toast.show({ message: t('vets.toast.approved'), tone: 'success' });
          setApproving(null);
          setDetail(null);
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
          setDetail(null);
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  const openPdf = async (doc: VetApplicationDocument) => {
    try {
      await Linking.openURL(doc.downloadUrl);
    } catch {
      toast.show({ message: t('vets.documents.openFailed'), tone: 'danger' });
    }
  };

  const renderDocuments = (a: PendingVetApplication) => {
    const docs = a.documents ?? [];
    const images = docs.filter(isImage);
    const files = docs.filter((d) => !isImage(d));

    // `width: '100%'` — `AdminRow`'s `actions` slot is a wrapping flex ROW.
    return (
      <View style={{ width: '100%', rowGap: theme.spacing.xs }}>
        <Label>{t('vets.documents.title')}</Label>
        {docs.length === 0 ? (
          <Caption color="textMuted">{t('vets.documents.none')}</Caption>
        ) : (
          <>
            <ImageThumbnailRow
              images={images.map((d) => d.downloadUrl)}
              fallbackIcon="document-outline"
              accessibilityLabelFor={(index) =>
                t(`vets.documents.kind.${images[index]?.kind ?? 'LICENSE_OR_ID'}`)
              }
              onPress={(index) => setViewer({ images: images.map((d) => d.downloadUrl), index })}
            />
            {files.map((d) => (
              <TextButton
                key={d.downloadUrl}
                label={`${t(`vets.documents.kind.${d.kind}`)} · ${d.filename}`}
                icon="document-text-outline"
                onPress={() => void openPdf(d)}
              />
            ))}
          </>
        )}
      </View>
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
            title={fullName(a)}
            onPress={() => setDetail(a)}
            accessibilityLabel={`${t('vets.detail.open')}: ${fullName(a)}`}
            image={{
              uri: a.user.avatarUrl ?? null,
              fallbackIcon: 'person-outline',
              onPress: a.user.avatarUrl
                ? () => setViewer({ images: [a.user.avatarUrl as string], index: 0 })
                : undefined,
              accessibilityLabel: fullName(a),
            }}
            subtitle={[
              a.user.email,
              a.user.phone,
              a.user.specialization
                ? `${t('vets.specialization')}: ${a.user.specialization}`
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
            meta={a.note ? a.note : `${t('vets.submittedAt')}: ${formatDate(a.createdAt)}`}
            badge={a.subType ? { label: t(`vets.subType.${a.subType}`), tone: 'info' } : undefined}
            actions={
              <>
                {renderDocuments(a)}
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

      <AdminDetailModal
        visible={detail != null && approving == null && rejecting == null && viewer == null}
        onClose={() => setDetail(null)}
        title={t('vets.detail.title')}
        fields={detail ? detailFields(detail) : []}
      >
        {detail ? (
          <View style={{ rowGap: theme.spacing.md }}>
            {renderDocuments(detail)}
            <Button
              label={t('vets.approve')}
              variant="primary"
              onPress={() => setApproving(detail)}
            />
            <Button
              label={t('vets.reject')}
              variant="danger"
              onPress={() => setRejecting(detail)}
            />
          </View>
        ) : null}
      </AdminDetailModal>

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

      <ImageViewer
        visible={viewer !== null}
        images={viewer?.images ?? []}
        initialIndex={viewer?.index ?? 0}
        onClose={() => setViewer(null)}
      />
    </>
  );
}
