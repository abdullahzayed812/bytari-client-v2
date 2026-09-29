import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { ConfirmationDialog, Skeleton, useToast } from '@/components/feedback';
import { SegmentedControl } from '@/components/forms';
import { ImageThumbnailRow, ImageViewer } from '@/components/media';
import { Label } from '@/components/typography';
import {
  useAdminAnimalPublications,
  useAdminApprovePublication,
  useAdminRejectPublication,
  useAdminUpdatePublication,
  useDeletePublication,
} from '@/features/publications';
import type {
  AnimalPublication,
  PublicationKind,
  PublicationStatus,
} from '@/features/publications';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import {
  AdminDetailModal,
  AdminListScreen,
  AdminPublicationEditSheet,
  AdminRow,
  FilterChips,
  ReasonPromptDialog,
} from '../components';

type DetailKey =
  | 'kind'
  | 'status'
  | 'contactName'
  | 'contactPhone'
  | 'city'
  | 'note'
  | 'extraNotes'
  | 'healthStatus'
  | 'vaccinationStatus'
  | 'isSterilized'
  | 'lostDate'
  | 'lostTime'
  | 'lostGovernorate'
  | 'lostDistrict'
  | 'lostLocationDetail'
  | 'healthNotes'
  | 'rejectionReason'
  | 'submittedAt'
  | 'reviewedAt'
  | 'animalName'
  | 'gallery'
  | 'noImages'
  | 'yes'
  | 'no';

/** Tab order of the combined "التبني والتزاوج والحيوانات المفقودة" section. */
const KINDS: PublicationKind[] = ['ADOPTION', 'MATING', 'LOST'];
const STATUSES: PublicationStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
const STATUS_TONE = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
} as const;

/**
 * `/admin/animal-publications` — the Lost / Adoption / Mating moderation queue.
 * Defaults to PENDING (the requests awaiting action). Approve / reject are
 * backend-authorised (`animal.approve` / `animal.reject`); removing a listing
 * (e.g. a published one) is `DELETE /animal-publications/:id` — ADMIN / ANIMAL
 * supervisor only for someone else's listing, audited.
 *
 * ONE admin section for the three kinds: Adoption / Mating / Lost tabs over the
 * same `animal_publications` queue (each tab = the existing `?kind=` filter of
 * `GET /admin/animal-publications`; the listings stay separate from pet
 * profiles). A `?kind=` deep link (e.g. a PUBLICATION_SUBMITTED notification)
 * pre-selects its tab.
 */
export default function AdminAnimalPublicationsScreen() {
  const { t } = useTranslation('admin');
  const { t: tpub } = useTranslation('publications');
  const theme = useTheme();
  const toast = useToast();

  const { kind: kindParam } = useLocalSearchParams<{ kind?: string }>();
  const [kind, setKind] = useState<PublicationKind>(
    KINDS.includes(kindParam as PublicationKind) ? (kindParam as PublicationKind) : 'ADOPTION',
  );
  const [status, setStatus] = useState<PublicationStatus | undefined>('PENDING');
  const q = useAdminAnimalPublications({ kind, status });
  const approve = useAdminApprovePublication();
  const reject = useAdminRejectPublication();
  const remove = useDeletePublication();
  const update = useAdminUpdatePublication();
  const [editing, setEditing] = useState<AnimalPublication | null>(null);
  // APPROVED → REJECTED (hide a live listing) needs a reason; REJECTED → APPROVED does not.
  const [unpublishing, setUnpublishing] = useState<AnimalPublication | null>(null);
  const [removing, setRemoving] = useState<AnimalPublication | null>(null);

  const [approving, setApproving] = useState<AnimalPublication | null>(null);
  const [rejecting, setRejecting] = useState<AnimalPublication | null>(null);
  const [detail, setDetail] = useState<AnimalPublication | null>(null);
  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);

  /** Photos the owner attached to the listing's animal — `[]` when none. */
  const photos = (p: AnimalPublication): string[] => p.animal?.galleryUrls ?? [];

  const dt = (key: DetailKey) => t(`animalPublications.details.${key}`);
  const detailFields = (p: AnimalPublication) => [
    { label: dt('kind'), value: t(`animalPublications.kind.${p.kind}`) },
    { label: dt('status'), value: t(`animalPublications.status.${p.status}`) },
    { label: dt('animalName'), value: p.animal?.name },
    { label: dt('contactName'), value: p.contactName },
    { label: dt('contactPhone'), value: p.contactPhone },
    { label: dt('city'), value: p.city },
    { label: dt('note'), value: p.note },
    { label: dt('extraNotes'), value: p.extraNotes },
    {
      label: dt('healthStatus'),
      value: p.healthStatus
        ? tpub(`healthStatus.${p.healthStatus}`, { defaultValue: p.healthStatus })
        : null,
    },
    {
      label: dt('vaccinationStatus'),
      value: p.vaccinationStatus
        ? tpub(`vaccinationStatus.${p.vaccinationStatus}`, { defaultValue: p.vaccinationStatus })
        : null,
    },
    {
      label: dt('isSterilized'),
      value: p.isSterilized == null ? null : p.isSterilized ? dt('yes') : dt('no'),
    },
    { label: dt('lostDate'), value: p.lostDate ? formatDate(p.lostDate) : null },
    { label: dt('lostTime'), value: p.lostTime },
    { label: dt('lostGovernorate'), value: p.lostGovernorate },
    { label: dt('lostDistrict'), value: p.lostDistrict },
    { label: dt('lostLocationDetail'), value: p.lostLocationDetail },
    { label: dt('healthNotes'), value: p.healthNotes },
    { label: dt('rejectionReason'), value: p.rejectionReason },
    { label: dt('submittedAt'), value: formatDate(p.createdAt) },
    { label: dt('reviewedAt'), value: p.reviewedAt ? formatDate(p.reviewedAt) : null },
  ];

  const onApprove = () => {
    if (!approving) return;
    approve.mutate(
      { publicationId: approving.id },
      {
        onSuccess: () => {
          toast.show({ message: t('animalPublications.toast.approved'), tone: 'success' });
          setApproving(null);
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  const onReject = (reason: string) => {
    if (!rejecting) return;
    reject.mutate(
      { publicationId: rejecting.id, reason },
      {
        onSuccess: () => {
          toast.show({ message: t('animalPublications.toast.rejected'), tone: 'success' });
          setRejecting(null);
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  const onEditSubmit = (body: Parameters<typeof update.mutate>[0]['body']) => {
    if (!editing) return;
    update.mutate(
      { publicationId: editing.id, body },
      {
        onSuccess: () => {
          toast.show({ message: t('animalPublications.toast.updated'), tone: 'success' });
          setEditing(null);
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  const onUnpublish = (reason: string) => {
    if (!unpublishing) return;
    update.mutate(
      { publicationId: unpublishing.id, body: { status: 'REJECTED', rejectionReason: reason } },
      {
        onSuccess: () => {
          toast.show({ message: t('animalPublications.toast.unpublished'), tone: 'success' });
          setUnpublishing(null);
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  const onRepublish = (p: AnimalPublication) => {
    update.mutate(
      { publicationId: p.id, body: { status: 'APPROVED' } },
      {
        onSuccess: () => {
          toast.show({ message: t('animalPublications.toast.approved'), tone: 'success' });
          setDetail(null);
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  return (
    <>
      <AdminListScreen<AnimalPublication>
        title={t('animalPublications.title')}
        query={q}
        data={q.publications}
        keyExtractor={(p) => p.id}
        skeletonRow={
          <View style={{ rowGap: 8, padding: theme.spacing.md }}>
            <Skeleton width="55%" height={16} />
            <Skeleton width="35%" height={12} />
          </View>
        }
        emptyIcon="file-tray-outline"
        emptyTitle={t('animalPublications.empty')}
        emptyMessage={t('animalPublications.emptyHint')}
        loadingMoreLabel={t('common.loadingMore')}
        filterBar={
          <View style={{ rowGap: theme.spacing.sm }}>
            <View style={{ paddingHorizontal: theme.screenPadding }}>
              <SegmentedControl<PublicationKind>
                value={kind}
                onChange={setKind}
                options={[
                  { value: 'ADOPTION', label: t('animalPublications.tabs.ADOPTION') },
                  { value: 'MATING', label: t('animalPublications.tabs.MATING') },
                  { value: 'LOST', label: t('animalPublications.tabs.LOST') },
                ]}
              />
            </View>
            <FilterChips<PublicationStatus>
              value={status}
              onChange={setStatus}
              options={[
                { value: undefined, label: t('animalPublications.status.ALL') },
                ...STATUSES.map((s) => ({
                  value: s,
                  label: t(`animalPublications.status.${s}`),
                })),
              ]}
            />
          </View>
        }
        renderItem={(p) => (
          <AdminRow
            title={t(`animalPublications.kind.${p.kind}`)}
            subtitle={p.animal?.name || p.contactName || p.note || undefined}
            meta={`${t('animalPublications.submittedAt')}: ${formatDate(p.createdAt)}`}
            image={{
              uri: photos(p)[0] ?? null,
              fallbackIcon: 'paw-outline',
              accessibilityLabel: dt('gallery'),
              onPress:
                photos(p).length > 0 ? () => setViewer({ images: photos(p), index: 0 }) : undefined,
            }}
            onPress={() => setDetail(p)}
            badge={{
              label: t(`animalPublications.status.${p.status}`),
              tone: STATUS_TONE[p.status],
            }}
            actions={
              p.status === 'PENDING' ? (
                <>
                  <Button
                    label={t('animalPublications.approve')}
                    variant="primary"
                    onPress={() => setApproving(p)}
                  />
                  <Button
                    label={t('animalPublications.reject')}
                    variant="danger"
                    onPress={() => setRejecting(p)}
                  />
                </>
              ) : (
                <Button
                  label={t('animalPublications.remove')}
                  variant="danger"
                  onPress={() => setRemoving(p)}
                />
              )
            }
          />
        )}
      />

      <ConfirmationDialog
        visible={approving != null}
        title={t('animalPublications.approveTitle')}
        message={t('animalPublications.approveBody')}
        confirmLabel={t('animalPublications.approveConfirm')}
        cancelLabel={t('common.cancel')}
        loading={approve.isPending}
        onConfirm={onApprove}
        onCancel={() => setApproving(null)}
      />

      <ConfirmationDialog
        visible={removing != null}
        title={t('animalPublications.removeTitle')}
        message={t('animalPublications.removeBody')}
        confirmLabel={t('animalPublications.remove')}
        cancelLabel={t('common.cancel')}
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          if (!removing) return;
          remove.mutate(
            { publicationId: removing.id, kind: removing.kind, animalId: removing.animalId },
            {
              onSuccess: () => {
                toast.show({ message: t('animalPublications.toast.removed'), tone: 'success' });
                setRemoving(null);
              },
              onError: (e) => {
                toast.show({ message: apiErrorMessage(e), tone: 'danger' });
                setRemoving(null);
              },
            },
          );
        }}
        onCancel={() => setRemoving(null)}
      />

      <ReasonPromptDialog
        visible={rejecting != null}
        title={t('animalPublications.rejectTitle')}
        message={t('animalPublications.rejectBody')}
        label={t('animalPublications.reasonLabel')}
        placeholder={t('animalPublications.reasonPlaceholder')}
        confirmLabel={t('animalPublications.rejectConfirm')}
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
        title={
          detail
            ? t(`animalPublications.kind.${detail.kind}`)
            : t('animalPublications.details.title')
        }
        fields={detail ? detailFields(detail) : []}
      >
        <View style={{ rowGap: theme.spacing.xs, marginTop: theme.spacing.sm }}>
          <Label>{dt('gallery')}</Label>
          <ImageThumbnailRow
            images={detail ? photos(detail) : []}
            emptyLabel={dt('noImages')}
            fallbackIcon="paw-outline"
            onPress={(index) => (detail ? setViewer({ images: photos(detail), index }) : undefined)}
          />
        </View>

        {detail ? (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: theme.spacing.sm,
              marginTop: theme.spacing.sm,
            }}
          >
            <Button
              label={t('animalPublications.edit.cta')}
              variant="outline"
              onPress={() => {
                const p = detail;
                setDetail(null);
                setEditing(p);
              }}
            />
            {detail.status === 'APPROVED' ? (
              <Button
                label={t('animalPublications.unpublish')}
                variant="danger"
                onPress={() => {
                  const p = detail;
                  setDetail(null);
                  setUnpublishing(p);
                }}
              />
            ) : null}
            {detail.status === 'REJECTED' ? (
              <Button
                label={t('animalPublications.republish')}
                variant="primary"
                loading={update.isPending}
                onPress={() => onRepublish(detail)}
              />
            ) : null}
          </View>
        ) : null}

        {detail?.status === 'PENDING' ? (
          <View
            style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}
          >
            <Button
              label={t('animalPublications.approve')}
              variant="primary"
              onPress={() => {
                const p = detail;
                setDetail(null);
                setApproving(p);
              }}
            />
            <Button
              label={t('animalPublications.reject')}
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

      <AdminPublicationEditSheet
        publication={editing}
        submitting={update.isPending}
        onClose={() => setEditing(null)}
        onSubmit={onEditSubmit}
      />

      <ReasonPromptDialog
        visible={unpublishing != null}
        title={t('animalPublications.unpublishTitle')}
        message={t('animalPublications.unpublishBody')}
        label={t('animalPublications.reasonLabel')}
        placeholder={t('animalPublications.reasonPlaceholder')}
        confirmLabel={t('animalPublications.unpublish')}
        cancelLabel={t('common.cancel')}
        required
        destructive
        loading={update.isPending}
        onConfirm={onUnpublish}
        onCancel={() => setUnpublishing(null)}
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
