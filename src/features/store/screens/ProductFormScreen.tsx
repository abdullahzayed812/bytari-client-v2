import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrorState, Loading, useToast } from '@/components/feedback';
import { OrgFormLayout } from '@/features/organizations';
import { fieldErrors } from '@/lib/apiError';
import { ApiError } from '@/services/api';

import { ProductForm } from '../components';
import { useCreateProduct, useProduct, useUpdateProduct } from '../hooks';
import type { CreateProductInput, UpdateProductInput } from '../types';
import { storeErrorMessage, type ProductFormValues } from '../validation/schemas';

/**
 * Add / edit a product. `organizationId` comes from the route;
 * `createdByUserId` / `status` are set by the backend. `productId` present ⇒
 * edit mode. Stock is NOT edited here — it changes only through the stock-adjust
 * action on the detail screen.
 */
export default function ProductFormScreen() {
  const { t } = useTranslation('store');
  const toast = useToast();
  const { organizationId, productId } = useLocalSearchParams<{
    organizationId: string;
    productId?: string;
  }>();
  const orgId = organizationId ?? '';
  const isEdit = Boolean(productId);

  const existing = useProduct(orgId, productId, { enabled: isEdit });
  const create = useCreateProduct(orgId);
  const update = useUpdateProduct(orgId);

  const inFlight = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const busy = create.isPending || update.isPending;

  if (isEdit && existing.isLoading) {
    return (
      <OrgFormLayout title={t('form.editTitle')}>
        <Loading fill />
      </OrgFormLayout>
    );
  }
  if (isEdit && (existing.isError || !existing.data)) {
    const notFound =
      existing.error instanceof ApiError &&
      (existing.error.status === 404 || existing.error.status === 403);
    return (
      <OrgFormLayout title={t('form.editTitle')}>
        <ErrorState
          error={existing.error}
          title={notFound ? t('detail.notFoundTitle') : undefined}
          onRetry={notFound ? undefined : () => void existing.refetch()}
        />
      </OrgFormLayout>
    );
  }

  const product = existing.data;
  const defaults: Partial<ProductFormValues> = product
    ? {
        name: product.name,
        productType: product.productType,
        price: product.price ?? '',
        description: product.description ?? '',
      }
    : {};

  const onSubmit = (values: ProductFormValues) => {
    if (inFlight.current || busy) return;
    inFlight.current = true;
    setFormError(null);
    setServerFields({});

    const price = values.price?.trim() ? values.price.trim() : isEdit ? null : undefined;
    const description = values.description?.trim()
      ? values.description.trim()
      : isEdit
        ? null
        : undefined;

    const onError = (error: unknown) => {
      setServerFields(fieldErrors(error));
      setFormError(storeErrorMessage(error, t));
    };
    const onSettled = () => {
      inFlight.current = false;
    };

    if (isEdit && product) {
      const body: UpdateProductInput = {
        name: values.name.trim(),
        productType: values.productType,
        price,
        description,
      };
      update.mutate(
        { productId: product.id, body },
        {
          onSuccess: () => {
            toast.show({ tone: 'success', message: t('form.editSuccess') });
            router.back();
          },
          onError,
          onSettled,
        },
      );
    } else {
      const body: CreateProductInput = {
        name: values.name.trim(),
        productType: values.productType,
        price,
        description,
        stockQuantity: values.stockQuantity?.trim() ? Number(values.stockQuantity) : undefined,
      };
      create.mutate(body, {
        onSuccess: () => {
          toast.show({ tone: 'success', message: t('form.createSuccess') });
          router.back();
        },
        onError,
        onSettled,
      });
    }
  };

  return (
    <OrgFormLayout title={isEdit ? t('form.editTitle') : t('form.addTitle')}>
      <ProductForm
        mode={isEdit ? 'edit' : 'create'}
        defaultValues={defaults}
        submitting={busy}
        formError={formError}
        serverFields={serverFields}
        onSubmit={onSubmit}
      />
    </OrgFormLayout>
  );
}
