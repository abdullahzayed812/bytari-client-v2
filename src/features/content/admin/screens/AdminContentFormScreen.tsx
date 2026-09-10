import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { ErrorState, Loading, useToast } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Routes } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { AdminContentForm, type AdminContentFormValues } from '../components';
import { useAdminContentCategories, useAdminContentItem, useCreateAdminContent, useUpdateAdminContent } from '../hooks';

/**
 * Routes `/(app)/admin/veterinary-content/[type]/create` and
 * `.../[type]/[contentId]/edit` — one shared add/edit form for MAGAZINE & BOOK.
 */
export default function AdminContentFormScreen() {
  const theme = useTheme();
  const { t } = useTranslation('content');
  const toast = useToast();
  const { type, contentId } = useLocalSearchParams<{
    type: 'MAGAZINE' | 'BOOK';
    contentId?: string;
  }>();
  const mode = contentId ? 'edit' : 'create';

  const categories = useAdminContentCategories();
  const existing = useAdminContentItem(contentId);
  const create = useCreateAdminContent();
  const update = useUpdateAdminContent();

  const submitting = create.isPending || update.isPending;
  const formError = create.error
    ? apiErrorMessage(create.error)
    : update.error
      ? apiErrorMessage(update.error)
      : null;

  const onSubmit = (values: AdminContentFormValues): void => {
    const body = {
      title: values.title,
      description: values.description.trim() || null,
      body: values.body.trim() || null,
      authorName: values.authorName.trim() || null,
      language: type === 'BOOK' ? values.language.trim() || null : undefined,
      pageCount: type === 'BOOK' && values.pageCount ? Number(values.pageCount) : undefined,
      publishYear: type === 'BOOK' && values.publishYear ? Number(values.publishYear) : undefined,
      categoryIds: values.categoryIds,
    };
    if (mode === 'create') {
      create.mutate(
        { type: type ?? 'MAGAZINE', ...body },
        {
          onSuccess: (item) => {
            toast.show({ message: t('admin.form.created'), tone: 'success' });
            router.replace(Routes.adminVeterinaryContentDetail(item.type as 'MAGAZINE' | 'BOOK', item.id));
          },
        },
      );
    } else if (contentId) {
      update.mutate(
        { contentId, body },
        {
          onSuccess: () => {
            toast.show({ message: t('admin.form.saved'), tone: 'success' });
            router.back();
          },
        },
      );
    }
  };

  if (mode === 'edit' && existing.isLoading) {
    return (
      <SafeAreaScreen>
        <Loading fill />
      </SafeAreaScreen>
    );
  }
  if (mode === 'edit' && existing.isError) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('admin.form.editTitle')} showBack />
        <ErrorState error={existing.error} onRetry={() => void existing.refetch()} />
      </SafeAreaScreen>
    );
  }

  return (
    <SafeAreaScreen>
      <AppHeader
        title={mode === 'create' ? t('admin.form.createTitle') : t('admin.form.editTitle')}
        showBack
      />
      <ScrollView
        contentContainerStyle={{ padding: theme.screenPadding, paddingBottom: theme.spacing.huge }}
        keyboardShouldPersistTaps="handled"
      >
        <AdminContentForm
          type={type ?? 'MAGAZINE'}
          mode={mode}
          categories={categories.data ?? []}
          submitting={submitting}
          formError={formError}
          defaultValues={
            existing.data
              ? {
                  title: existing.data.title,
                  description: existing.data.description ?? '',
                  body: existing.data.body ?? '',
                  authorName: existing.data.authorName ?? '',
                  language: existing.data.language ?? '',
                  pageCount: existing.data.pageCount != null ? String(existing.data.pageCount) : '',
                  publishYear:
                    existing.data.publishYear != null ? String(existing.data.publishYear) : '',
                  categoryIds: existing.data.categories.map((c) => c.id),
                }
              : undefined
          }
          onSubmit={onSubmit}
        />
      </ScrollView>
    </SafeAreaScreen>
  );
}
