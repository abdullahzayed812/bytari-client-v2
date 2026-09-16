import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Badge, Card, Divider } from '@/components/content';
import {
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  SkeletonText,
  useToast,
} from '@/components/feedback';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { ImagePreview, ImageUploader } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption, Heading, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { orgCapabilities, useOrganization } from '@/features/organizations';
import { useCapabilities } from '@/hooks';
import { fieldErrors } from '@/lib/apiError';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { AdjustVeterinaryOfficeStockForm } from '../components';
import { VETERINARY_OFFICE_PRODUCT_STATUS_TONE } from '../../constants';
import {
  useAdjustVeterinaryOfficeStock,
  useDeleteVeterinaryOfficeProduct,
  useVeterinaryOfficeProduct,
  useVeterinaryOfficeProductImagePresignProvider,
  useRemoveVeterinaryOfficeProductImage,
  useUpdateVeterinaryOfficeProduct,
} from '../hooks';
import { veterinaryOfficeErrorMessage, type AdjustVeterinaryOfficeStockFormValues } from '../../validation/schemas';

const MAX_PRODUCT_IMAGES = 6;

/**
 * Route `/organizations/[organizationId]/office-products/[productId]` (management).
 * Sections map 1:1 to backend DTO fields — there is no image / category /
 * vendor-profile data beyond what the DTO carries, so no such sections exist
 * here.
 */
export default function VeterinaryOfficeProductDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryOffices');
  const toast = useToast();
  const { isAdmin } = useCapabilities();
  const { organizationId, productId } = useLocalSearchParams<{
    organizationId: string;
    productId: string;
  }>();
  const orgId = organizationId ?? '';

  const detail = useOrganization(orgId);
  const caps = orgCapabilities(detail.data?.myRole, isAdmin);
  const q = useVeterinaryOfficeProduct(orgId, productId);
  const update = useUpdateVeterinaryOfficeProduct(orgId);
  const del = useDeleteVeterinaryOfficeProduct(orgId);
  const stock = useAdjustVeterinaryOfficeStock(orgId);
  const removeImage = useRemoveVeterinaryOfficeProductImage(orgId);
  const imagePresign = useVeterinaryOfficeProductImagePresignProvider(orgId, productId);

  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [stockFields, setStockFields] = useState<Record<string, string>>({});
  const stockInFlight = useRef(false);
  const [uploadKey, setUploadKey] = useState(0);

  const notFound =
    q.error instanceof ApiError && (q.error.status === 404 || q.error.status === 403);
  if (notFound) {
    return (
      <ScrollScreen>
        <AppHeader title={t('manage.detail.title')} showBack />
        <EmptyState
          icon="help-circle-outline"
          title={t('manage.detail.notFoundTitle')}
          message={t('manage.detail.notFoundBody')}
          actionLabel={t('manage.detail.backToList')}
          onAction={() => router.replace(Routes.organizationOfficeProducts(orgId))}
        />
      </ScrollScreen>
    );
  }
  if (q.isError) {
    return (
      <ScrollScreen>
        <AppHeader title={t('manage.detail.title')} showBack />
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      </ScrollScreen>
    );
  }

  const product = q.data;
  const canManage = caps.canManageStoreProducts;
  const busy = update.isPending || del.isPending || stock.isPending;

  const reactivate = () => {
    if (!product) return;
    update.mutate(
      { productId: product.id, body: { status: 'ACTIVE' } },
      {
        onSuccess: () => toast.show({ tone: 'success', message: t('manage.detail.reactivated') }),
        onError: (error) =>
          toast.show({ tone: 'danger', message: veterinaryOfficeErrorMessage(error, t) }),
      },
    );
  };

  const toggleHidden = () => {
    if (!product) return;
    update.mutate(
      { productId: product.id, body: { isHidden: !product.isHidden } },
      {
        onSuccess: () =>
          toast.show({
            tone: 'success',
            message: t(product.isHidden ? 'manage.detail.shown' : 'manage.detail.hidden'),
          }),
        onError: (error) =>
          toast.show({ tone: 'danger', message: veterinaryOfficeErrorMessage(error, t) }),
      },
    );
  };

  const submitStock = (values: AdjustVeterinaryOfficeStockFormValues) => {
    if (!product || stockInFlight.current || stock.isPending) return;
    stockInFlight.current = true;
    setStockError(null);
    setStockFields({});
    stock.mutate(
      {
        productId: product.id,
        body: {
          delta: Number(values.delta),
          reason: values.reason?.trim() ? values.reason.trim() : undefined,
        },
      },
      {
        onSuccess: () => {
          toast.show({ tone: 'success', message: t('manage.stock.success') });
          setShowStock(false);
        },
        onError: (error) => {
          setStockFields(fieldErrors(error));
          setStockError(veterinaryOfficeErrorMessage(error, t));
        },
        onSettled: () => {
          stockInFlight.current = false;
        },
      },
    );
  };

  return (
    <ScrollScreen>
      <AppHeader title={t('manage.detail.title')} showBack />

      {q.isLoading || !product ? (
        <Section spacing="xl">
          <SkeletonText lines={6} />
        </Section>
      ) : (
        <>
          <Section spacing="lg">
            <Row justify="space-between" align="center">
              <Heading level={2} numberOfLines={2} style={{ flex: 1 }}>
                {product.name}
              </Heading>
              <Row gap="xs">
                {product.isHidden ? (
                  <Badge label={t('manage.detail.hiddenBadge')} tone="warning" size="md" />
                ) : null}
                <Badge
                  label={t(`manage.productStatus.${product.status}`)}
                  tone={VETERINARY_OFFICE_PRODUCT_STATUS_TONE[product.status]}
                  size="md"
                />
              </Row>
            </Row>
          </Section>

          <Section spacing="xl">
            <Label>{t('manage.detail.sectionInfo')}</Label>
            <Card variant="outlined">
              <Field label={t('manage.form.fieldName')} value={product.name} />
              <Divider spacing="sm" />
              <Field
                label={t('manage.form.fieldType')}
                value={t(`productType.${product.productType}`, {
                  defaultValue: product.productType,
                })}
              />
              <Divider spacing="sm" />
              <Field
                label={t('manage.form.fieldPrice')}
                value={product.price != null ? product.price : t('manage.detail.noPrice')}
              />
              <Divider spacing="sm" />
              <Field label={t('manage.detail.fieldStock')} value={String(product.stockQuantity)} />
              <Divider spacing="sm" />
              <Field
                label={t('manage.form.fieldStatus')}
                value={t(`manage.productStatus.${product.status}`)}
              />
            </Card>
          </Section>

          {product.description ? (
            <Section spacing="xl">
              <Label>{t('manage.form.fieldDescription')}</Label>
              <Card variant="outlined" padding="md">
                <Text variant="body">{product.description}</Text>
              </Card>
            </Section>
          ) : null}

          <Section spacing="xl">
            <Label>{t('manage.detail.images')}</Label>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
              {product.images.map((img) => (
                <ImagePreview
                  key={img.id}
                  uri={img.url}
                  size={96}
                  onRemove={
                    canManage
                      ? () =>
                          removeImage.mutate(
                            { productId: product.id, imageId: img.id },
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
                />
              ))}
              {canManage && product.images.length < MAX_PRODUCT_IMAGES ? (
                <ImageUploader
                  key={uploadKey}
                  value={null}
                  provider={imagePresign}
                  icon="add"
                  onChange={(result) => {
                    if (result) {
                      setUploadKey((k) => k + 1);
                      toast.show({ tone: 'success', message: t('manage.detail.addImage') });
                    }
                  }}
                />
              ) : null}
            </View>
            {canManage && product.images.length >= MAX_PRODUCT_IMAGES ? (
              <Caption style={{ marginTop: theme.spacing.xs }}>
                {t('manage.detail.imageLimitReached')}
              </Caption>
            ) : null}
          </Section>

          <Section spacing="xl">
            <Card variant="outlined" padding="md">
              <Field label={t('manage.common.recordedAt')} value={formatDate(product.createdAt)} />
              <Divider spacing="sm" />
              <Field label={t('manage.detail.fieldUpdatedAt')} value={formatDate(product.updatedAt)} />
            </Card>
          </Section>

          {canManage ? (
            <>
              <Button
                label={t('manage.detail.editCta')}
                variant="outline"
                leftIcon="create-outline"
                disabled={busy}
                onPress={() => router.push(Routes.organizationOfficeProductEdit(orgId, product.id))}
              />

              <View style={{ marginTop: theme.spacing.md }}>
                <Button
                  label={showStock ? t('manage.stock.hideCta') : t('manage.stock.showCta')}
                  variant="outline"
                  leftIcon="swap-vertical-outline"
                  disabled={busy}
                  onPress={() => setShowStock((s) => !s)}
                />
              </View>

              {showStock ? (
                <Section spacing="lg">
                  <Card variant="outlined" padding="md">
                    <AdjustVeterinaryOfficeStockForm
                      currentStock={product.stockQuantity}
                      submitting={stock.isPending}
                      formError={stockError}
                      serverFields={stockFields}
                      onSubmit={submitStock}
                    />
                  </Card>
                </Section>
              ) : null}

              <View style={{ marginTop: theme.spacing.md }}>
                <Button
                  label={t(product.isHidden ? 'manage.detail.unhideCta' : 'manage.detail.hideCta')}
                  variant="outline"
                  leftIcon={product.isHidden ? 'eye-outline' : 'eye-off-outline'}
                  disabled={busy}
                  onPress={toggleHidden}
                />
              </View>

              <View style={{ marginTop: theme.spacing.md }}>
                {product.status === 'ACTIVE' ? (
                  <Button
                    label={t('manage.detail.deactivateCta')}
                    variant="ghost"
                    disabled={busy}
                    onPress={() => setConfirmDeactivate(true)}
                  />
                ) : (
                  <Button
                    label={t('manage.detail.reactivateCta')}
                    variant="ghost"
                    disabled={busy}
                    onPress={reactivate}
                  />
                )}
              </View>
            </>
          ) : null}

          <ConfirmationDialog
            visible={confirmDeactivate}
            title={t('manage.detail.deactivateConfirmTitle')}
            message={t('manage.detail.deactivateConfirmBody')}
            confirmLabel={t('manage.detail.deactivateCta')}
            cancelLabel={t('manage.common.cancel')}
            destructive
            loading={del.isPending}
            onConfirm={() => {
              setConfirmDeactivate(false);
              del.mutate(
                { productId: product.id },
                {
                  onSuccess: () => {
                    toast.show({ tone: 'success', message: t('manage.detail.deactivated') });
                  },
                  onError: (error) =>
                    toast.show({ tone: 'danger', message: veterinaryOfficeErrorMessage(error, t) }),
                },
              );
            }}
            onCancel={() => setConfirmDeactivate(false)}
          />
        </>
      )}
    </ScrollScreen>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Row justify="space-between" align="center">
      <Caption>{label}</Caption>
      <Text variant="bodyMedium" numberOfLines={1} style={{ maxWidth: '60%' }}>
        {value}
      </Text>
    </Row>
  );
}
