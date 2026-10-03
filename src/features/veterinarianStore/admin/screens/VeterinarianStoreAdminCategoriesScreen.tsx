import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button, IconButton, TextButton } from '@/components/actions';
import { Card, Chip } from '@/components/content';
import {
  Alert,
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  Loading,
  useToast,
} from '@/components/feedback';
import { Input, Switch } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { ImageThumbnailRow, ImageUploader } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { BottomSheet } from '@/components/overlays';
import { Caption, Label, Text } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import type { VetStoreCategory } from '../../types';
import {
  useVetStoreAdminCategories,
  useVetStoreAdminCategoryMutations,
  useVetStoreCategoryImagePresignProvider,
} from '../hooks';

interface Draft {
  id?: string;
  slug: string;
  name: string;
  /** `null` = a top-level section. */
  parentId: string | null;
  showOnHome: boolean;
  sortOrder: string;
}

const EMPTY_DRAFT: Draft = {
  slug: '',
  name: '',
  parentId: null,
  showOnHome: false,
  sortOrder: '0',
};

/** Route `/(app)/admin/veterinarian-store/categories` — store category management. */
export default function VeterinarianStoreAdminCategoriesScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinarianStore');
  const toast = useToast();

  const q = useVetStoreAdminCategories();
  const { create, update, remove } = useVetStoreAdminCategoryMutations();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [toDelete, setToDelete] = useState<VetStoreCategory | null>(null);
  // Remounts the uploader after a successful replace so it drops its local
  // preview and re-reads the freshly invalidated `imageUrl`.
  const [imageUploadKey, setImageUploadKey] = useState(0);

  const imagePresign = useVetStoreCategoryImagePresignProvider(draft?.id);
  const draftCategory = (q.data ?? []).find((c) => c.id === draft?.id);

  const openCreate = (): void => setDraft({ ...EMPTY_DRAFT });
  const openEdit = (c: VetStoreCategory): void =>
    setDraft({
      id: c.id,
      slug: c.slug,
      name: c.name,
      parentId: c.parentId ?? null,
      showOnHome: c.showOnHome,
      sortOrder: String(c.sortOrder),
    });

  // Sections first, each followed by its sub-categories (indented below).
  const all = q.data ?? [];
  const known = new Set(all.map((c) => c.id));
  const sections = all.filter((c) => !c.parentId || !known.has(c.parentId));
  const childrenOf = (id: string) => all.filter((c) => c.parentId === id);
  const ordered = sections.flatMap((s) => [s, ...childrenOf(s.id)]);
  // a section that already has sub-categories cannot itself move under another
  const draftHasChildren = draft?.id ? childrenOf(draft.id).length > 0 : false;

  const saving = create.isPending || update.isPending;
  const draftError = create.error
    ? apiErrorMessage(create.error)
    : update.error
      ? apiErrorMessage(update.error)
      : null;

  const submitDraft = (): void => {
    if (!draft) return;
    const body = {
      slug: draft.slug.trim(),
      name: draft.name.trim(),
      parentId: draft.parentId,
      showOnHome: draft.showOnHome,
      sortOrder: draft.sortOrder === '' ? 0 : Number(draft.sortOrder),
    };
    const onSuccess = (): void => {
      toast.show({
        message: draft.id ? t('admin.categories.saved') : t('admin.categories.created'),
        tone: 'success',
      });
      setDraft(null);
    };
    if (draft.id) update.mutate({ categoryId: draft.id, body }, { onSuccess });
    else create.mutate(body, { onSuccess });
  };

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('admin.categories.title')}
        showBack
        right={
          <IconButton
            icon="add"
            accessibilityLabel={t('admin.categories.add')}
            onPress={openCreate}
          />
        }
      />

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: theme.screenPadding,
            rowGap: theme.spacing.sm,
            flexGrow: 1,
            paddingBottom: theme.spacing.huge,
          }}
        >
          {(q.data ?? []).length === 0 ? (
            <EmptyState
              icon="albums-outline"
              title={t('admin.categories.empty')}
              actionLabel={t('admin.categories.add')}
              onAction={openCreate}
            />
          ) : (
            ordered.map((c) => (
              <Card
                key={c.id}
                variant="outlined"
                padding="md"
                onPress={() => openEdit(c)}
                style={
                  c.parentId && known.has(c.parentId)
                    ? { marginStart: theme.spacing.xl }
                    : undefined
                }
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    columnGap: theme.spacing.md,
                  }}
                >
                  <ImageThumbnailRow
                    images={c.imageUrl ? [c.imageUrl] : []}
                    size={44}
                    fallbackIcon="albums-outline"
                    placeholderWhenEmpty
                  />
                  <View style={{ flex: 1, rowGap: 2 }}>
                    <Text variant="bodyStrong">
                      {c.parentId && known.has(c.parentId) ? '↳ ' : ''}
                      {c.name}
                    </Text>
                    {!c.parentId && childrenOf(c.id).length > 0 ? (
                      <Caption color="primary">
                        {t('admin.categories.sectionBadge')} ·{' '}
                        {t('admin.categories.subCount', { count: childrenOf(c.id).length })}
                      </Caption>
                    ) : null}
                    <Caption>
                      {c.slug} ·{' '}
                      {t('admin.categories.productCount', { count: c.productCount ?? 0 })}
                      {c.showOnHome ? ' · ' + t('admin.categories.fieldShowOnHome') : ''}
                    </Caption>
                  </View>
                  <TextButton
                    label={t('common.delete')}
                    tone="danger"
                    onPress={() => setToDelete(c)}
                    icon="trash-outline"
                  />
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}

      <BottomSheet
        visible={draft !== null}
        onClose={() => setDraft(null)}
        title={draft?.id ? t('admin.categories.title') : t('admin.categories.add')}
      >
        {draft ? (
          <View style={{ rowGap: theme.spacing.md, paddingBottom: theme.spacing.lg }}>
            {draftError ? <Alert tone="danger" message={draftError} /> : null}
            <Input
              label={t('admin.categories.fieldName')}
              value={draft.name}
              onChangeText={(name) => setDraft({ ...draft, name })}
            />
            <Input
              label={t('admin.categories.fieldSlug')}
              value={draft.slug}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={(slug) => setDraft({ ...draft, slug })}
            />
            <View style={{ rowGap: theme.spacing.xs }}>
              <Label>{t('admin.categories.fieldParent')}</Label>
              {draftHasChildren ? (
                <Caption>{t('admin.categories.parentLockedHint')}</Caption>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                  <Chip
                    label={t('admin.categories.parentNone')}
                    selected={draft.parentId === null}
                    onPress={() => setDraft({ ...draft, parentId: null })}
                  />
                  {sections
                    .filter((s) => s.id !== draft.id)
                    .map((s) => (
                      <Chip
                        key={s.id}
                        label={s.name}
                        selected={draft.parentId === s.id}
                        onPress={() => setDraft({ ...draft, parentId: s.id })}
                      />
                    ))}
                </View>
              )}
            </View>
            <Input
              label={t('admin.categories.fieldSortOrder')}
              value={draft.sortOrder}
              keyboardType="number-pad"
              onChangeText={(sortOrder) => setDraft({ ...draft, sortOrder })}
            />
            <Switch
              label={t('admin.categories.fieldShowOnHome')}
              value={draft.showOnHome}
              onValueChange={(showOnHome) => setDraft({ ...draft, showOnHome })}
            />
            {draft.id ? (
              <View style={{ rowGap: theme.spacing.xs }}>
                <Label>{t('admin.categories.fieldImage')}</Label>
                <ImageUploader
                  key={imageUploadKey}
                  value={draftCategory?.imageUrl ?? null}
                  provider={imagePresign}
                  shape="square"
                  size={96}
                  onChange={(result) => {
                    if (result) setImageUploadKey((k) => k + 1);
                  }}
                />
              </View>
            ) : (
              <Caption>{t('admin.categories.imageAfterCreateHint')}</Caption>
            )}
            <Button
              label={draft.id ? t('admin.form.submitSave') : t('admin.form.submitCreate')}
              fullWidth
              loading={saving}
              disabled={saving}
              onPress={submitDraft}
            />
          </View>
        ) : (
          <Label>{''}</Label>
        )}
      </BottomSheet>

      <ConfirmationDialog
        visible={toDelete !== null}
        title={t('admin.categories.title')}
        message={t('admin.categories.deleteConfirm')}
        confirmLabel={t('common.delete')}
        destructive
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          const target = toDelete;
          setToDelete(null);
          if (target) {
            remove.mutate(target.id, {
              onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
            });
          }
        }}
      />
    </SafeAreaScreen>
  );
}
