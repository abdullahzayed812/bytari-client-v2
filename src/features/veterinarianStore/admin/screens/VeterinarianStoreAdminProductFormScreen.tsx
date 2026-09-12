import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { ErrorState, Loading, useToast } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import {
  VeterinarianStoreProductForm,
  type VeterinarianStoreProductFormValues,
} from '../components/VeterinarianStoreProductForm';
import {
  useVetStoreAdminCategories,
  useVetStoreAdminProduct,
  useVetStoreAdminProductMutations,
} from '../hooks';

/**
 * Routes `/(app)/admin/veterinarian-store/products/create` and
 * `.../[productId]/edit` — one shared add/edit form.
 */
export default function VeterinarianStoreAdminProductFormScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinarianStore');
  const toast = useToast();
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const mode = productId ? 'edit' : 'create';

  const categories = useVetStoreAdminCategories();
  const existing = useVetStoreAdminProduct(productId);
  const { create, update } = useVetStoreAdminProductMutations();

  const submitting = create.isPending || update.isPending;
  const formError = create.error
    ? apiErrorMessage(create.error)
    : update.error
      ? apiErrorMessage(update.error)
      : null;

  const onSubmit = (values: VeterinarianStoreProductFormValues): void => {
    const body = {
      name: values.name,
      categoryId: values.categoryId,
      price: values.price,
      stockQuantity: values.stockQuantity === '' ? 0 : Number(values.stockQuantity),
      description: values.description || null,
      status: values.status,
    };
    if (mode === 'create') {
      create.mutate(body, {
        onSuccess: (p) => {
          toast.show({ message: t('admin.form.created'), tone: 'success' });
          router.replace({
            pathname: '/(app)/admin/veterinarian-store/products/[productId]',
            params: { productId: p.id },
          });
        },
      });
    } else if (productId) {
      update.mutate(
        { productId, body },
        {
          onSuccess: () => {
            toast.show({ message: t('admin.form.saved'), tone: 'success' });
            router.back();
          },
        },
      );
    }
  };

  if (mode === 'edit' && existing.isLoading)
    return (
      <SafeAreaScreen>
        <Loading fill />
      </SafeAreaScreen>
    );
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
        <VeterinarianStoreProductForm
          mode={mode}
          categories={categories.data ?? []}
          submitting={submitting}
          formError={formError}
          defaultValues={
            existing.data
              ? {
                  name: existing.data.name,
                  categoryId: existing.data.categoryId,
                  price: existing.data.price,
                  stockQuantity: String(existing.data.stockQuantity),
                  description: existing.data.description ?? '',
                  status: existing.data.status,
                }
              : undefined
          }
          onSubmit={onSubmit}
        />
      </ScrollView>
    </SafeAreaScreen>
  );
}
