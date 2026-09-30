import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { ConfirmationDialog, Skeleton, useToast } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { ImageThumbnailRow, ImageViewer } from '@/components/media';
import { Text } from '@/components/typography';
import { useDebouncedValue } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import {
  AdminAnimalEditSheet,
  AdminDetailModal,
  AdminListScreen,
  AdminRow,
  FilterChips,
} from '../components';
import { useAdminAnimals, useAdminDeleteAnimal, useAdminUpdateAnimal } from '../hooks';
import type { AdminAnimal, AdminAnimalStatus } from '../types';

const STATUSES: AdminAnimalStatus[] = ['ACTIVE', 'DEACTIVATED'];

/**
 * `/admin/animals` — every user's pets. Admin can search / filter and
 * soft-delete (deactivate) a pet. Deletion is backend-authorised
 * (`animal.delete`, ADMIN override) — hiding the button is not the control.
 */
export default function AdminAnimalsScreen() {
  const { t } = useTranslation('admin');
  const { t: tp } = useTranslation('pets');
  const theme = useTheme();
  const toast = useToast();

  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const [status, setStatus] = useState<AdminAnimalStatus | undefined>(undefined);
  const q = useAdminAnimals({ status, search });
  const del = useAdminDeleteAnimal();

  const [pendingDelete, setPendingDelete] = useState<AdminAnimal | null>(null);
  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);
  const [detail, setDetail] = useState<AdminAnimal | null>(null);
  const [editing, setEditing] = useState<AdminAnimal | null>(null);
  const update = useAdminUpdateAnimal();

  const onDelete = () => {
    if (!pendingDelete) return;
    del.mutate(
      { animalId: pendingDelete.id },
      {
        onSuccess: () => {
          toast.show({ message: t('adminAnimals.toast.deleted'), tone: 'success' });
          setPendingDelete(null);
        },
        onError: (e) => {
          toast.show({ message: apiErrorMessage(e), tone: 'danger' });
          setPendingDelete(null);
        },
      },
    );
  };

  return (
    <>
      <AdminListScreen<AdminAnimal>
        title={t('adminAnimals.title')}
        query={q}
        data={q.animals}
        keyExtractor={(a) => a.id}
        skeletonRow={
          <View style={{ rowGap: 8, padding: theme.spacing.md }}>
            <Skeleton width="50%" height={16} />
            <Skeleton width="40%" height={12} />
          </View>
        }
        emptyIcon="paw-outline"
        emptyTitle={search ? t('adminAnimals.emptySearch') : t('adminAnimals.empty')}
        loadingMoreLabel={t('common.loadingMore')}
        filterBar={
          <View style={{ rowGap: theme.spacing.sm, paddingHorizontal: theme.screenPadding }}>
            <SearchInput
              value={rawSearch}
              onChangeText={setRawSearch}
              onClear={() => setRawSearch('')}
              placeholder={t('adminAnimals.searchPlaceholder')}
            />
            <FilterChips<AdminAnimalStatus>
              value={status}
              onChange={setStatus}
              options={[
                { value: undefined, label: t('adminAnimals.status.ALL') },
                ...STATUSES.map((s) => ({ value: s, label: t(`adminAnimals.status.${s}`) })),
              ]}
            />
          </View>
        }
        renderItem={(a) => (
          <AdminRow
            title={a.name}
            subtitle={[a.species, a.breed].filter(Boolean).join(' · ')}
            meta={`${t('adminAnimals.owner')}: ${a.ownerName ?? t('adminAnimals.noOwner')}`}
            image={{
              uri: a.galleryUrls[0] ?? null,
              fallbackIcon: 'paw-outline',
              onPress:
                a.galleryUrls.length > 0
                  ? () => setViewer({ images: a.galleryUrls, index: 0 })
                  : undefined,
            }}
            onPress={() => setDetail(a)}
            badge={{
              label: t(`adminAnimals.status.${a.status}`),
              tone: a.status === 'ACTIVE' ? 'success' : 'danger',
            }}
            actions={
              a.status === 'ACTIVE' ? (
                <Button
                  label={t('adminAnimals.deleteAction')}
                  variant="danger"
                  onPress={() => setPendingDelete(a)}
                />
              ) : undefined
            }
          />
        )}
      />

      <ConfirmationDialog
        visible={pendingDelete != null}
        title={t('adminAnimals.deleteConfirmTitle')}
        message={t('adminAnimals.deleteConfirmBody')}
        confirmLabel={t('adminAnimals.deleteConfirm')}
        cancelLabel={t('common.cancel')}
        destructive
        loading={del.isPending}
        onConfirm={onDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <AdminDetailModal
        visible={detail != null}
        onClose={() => setDetail(null)}
        title={detail?.name ?? t('adminAnimals.details.title')}
        fields={
          detail
            ? [
                {
                  label: t('adminAnimals.details.species'),
                  value: tp(`species.${detail.species}`, {
                    defaultValue: detail.species,
                  }),
                },
                { label: t('adminAnimals.details.breed'), value: detail.breed },
                { label: t('adminAnimals.details.color'), value: detail.color ?? null },
                {
                  label: t('adminAnimals.details.dateOfBirth'),
                  value: detail.dateOfBirth ? formatDate(detail.dateOfBirth) : null,
                },
                {
                  label: t('adminAnimals.details.ageEstimate'),
                  value: detail.ageEstimate
                    ? tp(`ageEstimate.${detail.ageEstimate}`, { defaultValue: detail.ageEstimate })
                    : null,
                },
                {
                  label: t('adminAnimals.details.distinguishingFeatures'),
                  value: detail.distinguishingFeatures ?? null,
                },
                { label: t('adminAnimals.details.notes'), value: detail.notes ?? null },
                {
                  label: t('adminAnimals.details.sex'),
                  value: tp(`sex.${detail.sex}`, { defaultValue: detail.sex }),
                },
                {
                  label: t('adminAnimals.details.status'),
                  value: t(`adminAnimals.status.${detail.status}`),
                },
                {
                  label: t('adminAnimals.details.owner'),
                  value: detail.ownerName ?? t('adminAnimals.noOwner'),
                },
                { label: t('adminAnimals.details.createdAt'), value: formatDate(detail.createdAt) },
                { label: t('adminAnimals.details.updatedAt'), value: formatDate(detail.updatedAt) },
              ]
            : []
        }
      >
        {detail && detail.status === 'ACTIVE' ? (
          <Button
            label={t('adminAnimals.editAction')}
            variant="outline"
            leftIcon="create-outline"
            onPress={() => {
              const a = detail;
              setDetail(null);
              setEditing(a);
            }}
          />
        ) : null}
        <View style={{ rowGap: 4 }}>
          <Text variant="overline" color="textMuted">
            {t('adminAnimals.details.gallery')}
          </Text>
          <ImageThumbnailRow
            images={detail?.galleryUrls ?? []}
            size={88}
            fallbackIcon="paw-outline"
            emptyLabel={t('adminAnimals.details.noImages')}
            onPress={(index) =>
              detail ? setViewer({ images: detail.galleryUrls, index }) : undefined
            }
          />
        </View>
      </AdminDetailModal>

      <AdminAnimalEditSheet
        animal={editing}
        loading={update.isPending}
        onClose={() => setEditing(null)}
        onSave={(patch) => {
          if (!editing) return;
          update.mutate(
            { animalId: editing.id, patch },
            {
              onSuccess: () => {
                toast.show({ message: t('adminAnimals.toast.updated'), tone: 'success' });
                setEditing(null);
              },
              onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
            },
          );
        }}
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
