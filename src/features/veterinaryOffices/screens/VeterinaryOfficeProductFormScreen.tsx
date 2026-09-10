import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrorState, Loading, useToast } from '@/components/feedback';
import { OrgFormLayout } from '@/features/organizations';
import { fieldErrors } from '@/lib/apiError';
import { devDataEnabled } from '@/lib/env';
import { ApiError } from '@/services/api';

import { VeterinaryOfficeProductForm } from '../components';
import { devProductDefaults } from '../data/devDefaults';
import {
  useCreateVeterinaryOfficeProduct,
  useVeterinaryOfficeProduct,
  useUpdateVeterinaryOfficeProduct,
} from '../hooks';
import type { CreateVeterinaryOfficeProductInput, UpdateVeterinaryOfficeProductInput } from '../types';
import { veterinaryOfficeErrorMessage, type VeterinaryOfficeProductFormValues } from '../validation/schemas';

/**
 * Add / edit a product. `organizationId` comes from the route;
 * `createdByUserId` / `status` are set by the backend. `productId` present ⇒
 * edit mode. Stock is NOT edited here — it changes only through the stock-adjust
 * action on the detail screen.
 */
export default function VeterinaryOfficeProductFormScreen() {
  const { t } = useTranslation('veterinaryOffices');
  const toast = useToast();
  const { organizationId, productId } = useLocalSearchParams<{
    organizationId: string;
    productId?: string;
  }>();
  const orgId = organizationId ?? '';
  const isEdit = Boolean(productId);

  const existing = useVeterinaryOfficeProduct(orgId, productId, { enabled: isEdit });
  const create = useCreateVeterinaryOfficeProduct(orgId);
  const update = useUpdateVeterinaryOfficeProduct(orgId);

  const inFlight = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const busy = create.isPending || update.isPending;

  if (isEdit && existing.isLoading) {
    return (
      <OrgFormLayout title={t('manage.form.editTitle')}>
        <Loading fill />
      </OrgFormLayout>
    );
  }
  if (isEdit && (existing.isError || !existing.data)) {
    const notFound =
      existing.error instanceof ApiError &&
      (existing.error.status === 404 || existing.error.status === 403);
    return (
      <OrgFormLayout title={t('manage.form.editTitle')}>
        <ErrorState
          error={existing.error}
          title={notFound ? t('manage.detail.notFoundTitle') : undefined}
          onRetry={notFound ? undefined : () => void existing.refetch()}
        />
      </OrgFormLayout>
    );
  }

  const product = existing.data;
  const defaults: Partial<VeterinaryOfficeProductFormValues> = product
    ? {
        name: product.name,
        productType: product.productType,
        price: product.price ?? '',
        description: product.description ?? '',
      }
    : devDataEnabled
      ? devProductDefaults()
      : {};

  const onSubmit = (values: VeterinaryOfficeProductFormValues) => {
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
      setFormError(veterinaryOfficeErrorMessage(error, t));
    };
    const onSettled = () => {
      inFlight.current = false;
    };

    if (isEdit && product) {
      const body: UpdateVeterinaryOfficeProductInput = {
        name: values.name.trim(),
        productType: values.productType,
        price,
        description,
      };
      update.mutate(
        { productId: product.id, body },
        {
          onSuccess: () => {
            toast.show({ tone: 'success', message: t('manage.form.editSuccess') });
            router.back();
          },
          onError,
          onSettled,
        },
      );
    } else {
      const body: CreateVeterinaryOfficeProductInput = {
        name: values.name.trim(),
        productType: values.productType,
        price,
        description,
        stockQuantity: values.stockQuantity?.trim() ? Number(values.stockQuantity) : undefined,
      };
      create.mutate(body, {
        onSuccess: () => {
          toast.show({ tone: 'success', message: t('manage.form.createSuccess') });
          router.back();
        },
        onError,
        onSettled,
      });
    }
  };

  return (
    <OrgFormLayout title={isEdit ? t('manage.form.editTitle') : t('manage.form.addTitle')}>
      <VeterinaryOfficeProductForm
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
