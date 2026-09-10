import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button, IconButton, TextButton } from '@/components/actions';
import { Card } from '@/components/content';
import { Alert, ConfirmationDialog, EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { Input } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { BottomSheet } from '@/components/overlays';
import { Caption, Label, Text } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { useAdminContentCategories, useAdminContentCategoryMutations } from '../hooks';
import type { AdminCategory } from '../types';

interface Draft {
  id?: string;
  slug: string;
  name: string;
  description: string;
}

const EMPTY_DRAFT: Draft = { slug: '', name: '', description: '' };

/**
 * Route `/(app)/admin/veterinary-content/categories` — the shared category
 * pool used by both Veterinary Magazine (MAGAZINE) and Veterinary Books
 * (BOOK). Categories are a flat table (§ `content-categories`, not
 * type-scoped server-side) — the mobile Magazine/Books screens each show
 * only their own fixed slug set (`mag-*` / `book-*`), so an admin adding a
 * new one should keep that prefix convention.
 */
export default function AdminCategoriesScreen() {
  const theme = useTheme();
  const { t } = useTranslation('content');
  const toast = useToast();

  const q = useAdminContentCategories();
  const { create, update, remove } = useAdminContentCategoryMutations();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [toDelete, setToDelete] = useState<AdminCategory | null>(null);

  const openCreate = (): void => setDraft({ ...EMPTY_DRAFT });
  const openEdit = (c: AdminCategory): void =>
    setDraft({ id: c.id, slug: c.slug, name: c.name, description: c.description ?? '' });

  const saving = create.isPending || update.isPending;
  const draftError = create.error
    ? apiErrorMessage(create.error)
    : update.error
      ? apiErrorMessage(update.error)
      : null;

  const submitDraft = (): void => {
    if (!draft) return;
    const onSuccess = (): void => {
      toast.show({
        message: draft.id ? t('admin.categories.saved') : t('admin.categories.created'),
        tone: 'success',
      });
      setDraft(null);
    };
    if (draft.id) {
      update.mutate(
        { categoryId: draft.id, body: { name: draft.name.trim(), description: draft.description.trim() || null } },
        { onSuccess },
      );
    } else {
      create.mutate(
        {
          slug: draft.slug.trim(),
          name: draft.name.trim(),
          description: draft.description.trim() || null,
        },
        { onSuccess },
      );
    }
  };

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('admin.categories.title')}
        showBack
        right={
          <IconButton icon="add" accessibilityLabel={t('admin.categories.add')} onPress={openCreate} />
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
                <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}>
                  <View style={{ flex: 1, rowGap: 2 }}>
                    <Text variant="bodyStrong">{c.name}</Text>
                    <Caption>{c.slug}</Caption>
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
            {!draft.id ? (
              <Input
                label={t('admin.categories.fieldSlug')}
                value={draft.slug}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={t('admin.categories.fieldSlugPlaceholder')}
                onChangeText={(slug) => setDraft({ ...draft, slug })}
              />
            ) : null}
            <Input
              label={t('admin.categories.fieldDescription')}
              value={draft.description}
              multiline
              numberOfLines={2}
              onChangeText={(description) => setDraft({ ...draft, description })}
            />
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
