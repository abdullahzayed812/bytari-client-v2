import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button, IconButton, TextButton } from '@/components/actions';
import { Card, Icon } from '@/components/content';
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
import { ImageUploader } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { BottomSheet } from '@/components/overlays';
import { Caption, Label, Text } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import type { PetStoreCategory } from '../../types';
import {
  usePetStoreAdminCategories,
  usePetStoreAdminCategoryMutations,
  usePetStoreCategoryImagePresignProvider,
} from '../hooks';

interface Draft {
  id?: string;
  slug: string;
  name: string;
  showOnHome: boolean;
  sortOrder: string;
}

const EMPTY_DRAFT: Draft = { slug: '', name: '', showOnHome: false, sortOrder: '0' };

/** Route `/(app)/admin/pet-owner-store/categories` — store category management. */
export default function PetOwnerStoreAdminCategoriesScreen() {
  const theme = useTheme();
  const { t } = useTranslation('petOwnerStore');
  const toast = useToast();

  const q = usePetStoreAdminCategories();
  const { create, update, remove } = usePetStoreAdminCategoryMutations();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [toDelete, setToDelete] = useState<PetStoreCategory | null>(null);
  const [imageUploadKey, setImageUploadKey] = useState(0);
  const imagePresign = usePetStoreCategoryImagePresignProvider(draft?.id);
  const draftCategory = draft?.id ? (q.data ?? []).find((c) => c.id === draft.id) : undefined;

  const openCreate = (): void => setDraft({ ...EMPTY_DRAFT });
  const openEdit = (c: PetStoreCategory): void =>
    setDraft({
      id: c.id,
      slug: c.slug,
      name: c.name,
      showOnHome: c.showOnHome,
      sortOrder: String(c.sortOrder),
    });

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
            (q.data ?? []).map((c) => (
              <Card key={c.id} variant="outlined" padding="md" onPress={() => openEdit(c)}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    columnGap: theme.spacing.md,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: theme.radius.md,
                      backgroundColor: theme.colors.surfaceAccent,
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {c.imageUrl ? (
                      <Image
                        source={{ uri: c.imageUrl }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                      />
                    ) : (
                      <Icon name="albums-outline" size="iconSm" color="primary" />
                    )}
                  </View>
                  <View style={{ flex: 1, rowGap: 2 }}>
                    <Text variant="bodyStrong">{c.name}</Text>
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
