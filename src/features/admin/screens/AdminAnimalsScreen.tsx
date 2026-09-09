import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, View } from 'react-native';

import { Button } from '@/components/actions';
import { ConfirmationDialog, Skeleton, useToast } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { Text } from '@/components/typography';
import { useDebouncedValue } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { AdminDetailModal, AdminListScreen, AdminRow, FilterChips } from '../components';
import { useAdminAnimals, useAdminDeleteAnimal } from '../hooks';
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
  const [detail, setDetail] = useState<AdminAnimal | null>(null);

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
        <View style={{ rowGap: 4 }}>
          <Text variant="overline" color="textMuted">
            {t('adminAnimals.details.gallery')}
          </Text>
          {detail && detail.galleryUrls.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
              {detail.galleryUrls.map((uri) => (
                <Image
                  key={uri}
                  source={{ uri }}
                  style={{ width: 88, height: 88, borderRadius: theme.radius.md }}
                />
              ))}
            </View>
          ) : (
            <Text variant="body" color="textSecondary">
              {t('adminAnimals.details.noImages')}
            </Text>
          )}
        </View>
      </AdminDetailModal>
    </>
  );
}
