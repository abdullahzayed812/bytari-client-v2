import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ErrorState, Loading, useToast } from '@/components/feedback';
import { ImageUploader } from '@/components/media';
import { Caption, Label } from '@/components/typography';
import { OrgFormLayout } from '@/features/organizations';
import { fieldErrors } from '@/lib/apiError';
import { devDataEnabled } from '@/lib/env';
import { ApiError } from '@/services/api';

import { devProductDefaults } from '../../data/devDefaults';
import type {
  CreateVeterinaryOfficeProductInput,
  UpdateVeterinaryOfficeProductInput,
} from '../../types';
import {
  veterinaryOfficeErrorMessage,
  type VeterinaryOfficeProductFormValues,
} from '../../validation/schemas';
import { VeterinaryOfficeProductForm } from '../components';
import {
  useCreateVeterinaryOfficeProduct,
  useNewVeterinaryOfficeProductImagePresignProvider,
  useRemoveVeterinaryOfficeProductImage,
  useReplaceVeterinaryOfficeProductImagePresignProvider,
  useVeterinaryOfficeProduct,
  useVeterinaryOfficeProductImagePresignProvider,
  useUpdateVeterinaryOfficeProduct,
  type PendingProductImage,
} from '../hooks';

/**
 * Add / edit a product. `organizationId` comes from the route;
 * `createdByUserId` / `status` are set by the backend. `productId` present ⇒
 * edit mode. Stock is NOT edited here — it changes only through the stock-adjust
 * action on the detail screen.
 *
 * Image: on create the cover is uploaded right away (before the product
 * exists) and attached by the create call itself; on edit the cover can be
 * replaced in place — upload first, then an atomic server-side swap, so a
 * failed upload never loses the current image. Save is blocked while an
 * upload is in flight.
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
  const [pendingImage, setPendingImage] = useState<PendingProductImage | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const busy = create.isPending || update.isPending;

  const cover = existing.data?.images.find((i) => i.isPrimary) ?? existing.data?.images[0];
  const newImageProvider = useNewVeterinaryOfficeProductImagePresignProvider(
    orgId,
    setPendingImage,
  );
  const replaceProvider = useReplaceVeterinaryOfficeProductImagePresignProvider(
    orgId,
    productId,
    cover?.id,
  );
  const addProvider = useVeterinaryOfficeProductImagePresignProvider(orgId, productId);
  const removeImage = useRemoveVeterinaryOfficeProductImage(orgId);

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
        brand: product.brand ?? '',
        countryOfOrigin: product.countryOfOrigin ?? '',
        manufacturer: product.manufacturer ?? '',
      }
    : devDataEnabled
      ? devProductDefaults()
      : {};

  const onSubmit = (values: VeterinaryOfficeProductFormValues) => {
    if (inFlight.current || busy) return;
    if (imageUploading) {
      setFormError(t('manage.form.imageUploading'));
      return;
    }
    inFlight.current = true;
    setFormError(null);
    setServerFields({});

    const price = values.price?.trim() ? values.price.trim() : isEdit ? null : undefined;
    const description = values.description?.trim()
      ? values.description.trim()
      : isEdit
        ? null
        : undefined;

    // optional free text: blank → omitted on create, cleared (null) on edit
    const opt = (v: string | undefined) => (v?.trim() ? v.trim() : isEdit ? null : undefined);
    const catalogFields = {
      brand: opt(values.brand),
      countryOfOrigin: opt(values.countryOfOrigin),
      manufacturer: opt(values.manufacturer),
    };

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
        ...catalogFields,
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
        ...catalogFields,
        stockQuantity: values.stockQuantity?.trim() ? Number(values.stockQuantity) : undefined,
        ...(pendingImage ? { image: pendingImage } : {}),
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
      <View style={{ rowGap: 4 }}>
        <Label>{t('manage.form.fieldImage')}</Label>
        {isEdit && product ? (
          <ImageUploader
            // Remount on a different cover so the preview follows the server.
            key={cover?.id ?? 'none'}
            value={cover?.url ?? null}
            provider={cover ? replaceProvider : addProvider}
            replaceable
            disabled={busy}
            onBusyChange={setImageUploading}
            onRemove={
              cover
                ? () =>
                    removeImage.mutate(
                      { productId: product.id, imageId: cover.id },
                      {
                        onError: (error) =>
                          toast.show({
                            tone: 'danger',
                            message: veterinaryOfficeErrorMessage(error, t),
                          }),
                      },
                    )
                : undefined
            }
            onChange={(result) => {
              if (result) toast.show({ tone: 'success', message: t('manage.form.imageReplaced') });
            }}
          />
        ) : (
          <ImageUploader
            value={null}
            provider={newImageProvider}
            replaceable
            disabled={busy}
            onBusyChange={setImageUploading}
            // `onUploaded` already recorded the key; only removal clears it.
            onChange={(result) => {
              if (!result) setPendingImage(null);
            }}
          />
        )}
        <Caption>{isEdit ? t('manage.form.imageReplaceHint') : t('manage.form.imageHint')}</Caption>
      </View>
      <VeterinaryOfficeProductForm
        mode={isEdit ? 'edit' : 'create'}
        defaultValues={defaults}
        submitting={busy || imageUploading}
        formError={formError}
        serverFields={serverFields}
        onSubmit={onSubmit}
      />
    </OrgFormLayout>
  );
}
