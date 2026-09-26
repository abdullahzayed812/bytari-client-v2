import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { Button, TextButton } from '@/components/actions';
import { ConfirmationDialog, useToast } from '@/components/feedback';
import { ImageThumbnailRow, ImageViewer } from '@/components/media';
import { Caption, Label } from '@/components/typography';
import { RecordCardSkeleton } from '@/features/medical/components';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { AdminListScreen, AdminRow, ReasonPromptDialog } from '../components';
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
 */
export default function AdminVetApplicationsScreen() {
  const { t } = useTranslation('admin');
  const theme = useTheme();
  const toast = useToast();
  const q = useAdminVetApplications();
  const decide = useVetDecisionMutation();

  const [approving, setApproving] = useState<PendingVetApplication | null>(null);
  const [rejecting, setRejecting] = useState<PendingVetApplication | null>(null);
  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);

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
              onPress={(index) =>
                setViewer({ images: images.map((d) => d.downloadUrl), index })
              }
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
            title={`${a.user.firstName} ${a.user.lastName}`.trim() || a.user.email}
            subtitle={[
              a.user.email,
              a.user.phone,
              a.user.specialization ? `${t('vets.specialization')}: ${a.user.specialization}` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
            meta={
              a.note
                ? a.note
                : `${t('vets.submittedAt')}: ${new Date(a.createdAt).toLocaleDateString()}`
            }
            badge={
              a.subType
                ? { label: t(`vets.subType.${a.subType}`), tone: 'info' }
                : undefined
            }
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
