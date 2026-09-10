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
import { AppHeader } from '@/components/navigation';
import { Caption, Heading, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { orgCapabilities, useOrganization } from '@/features/organizations';
import { useCapabilities } from '@/hooks';
import { fieldErrors } from '@/lib/apiError';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { AdjustVeterinaryStoreStockForm } from '../components';
import { VETERINARY_STORE_PRODUCT_STATUS_TONE } from '../constants';
import { useAdjustVeterinaryStoreStock, useDeleteVeterinaryStoreProduct, useVeterinaryStoreProduct, useUpdateVeterinaryStoreProduct } from '../hooks';
import { veterinaryStoreErrorMessage, type AdjustVeterinaryStoreStockFormValues } from '../validation/schemas';

/**
 * Route `/organizations/[organizationId]/store-products/[productId]`. Sections map 1:1
 * to backend DTO fields (§6) — there is no image / category / vendor-profile
 * data in the backend, so no such sections exist here.
 */
export default function VeterinaryStoreProductDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryStore');
  const toast = useToast();
  const { isAdmin } = useCapabilities();
  const { organizationId, productId } = useLocalSearchParams<{
    organizationId: string;
    productId: string;
  }>();
  const orgId = organizationId ?? '';

  const detail = useOrganization(orgId);
  const caps = orgCapabilities(detail.data?.myRole, isAdmin);
  const q = useVeterinaryStoreProduct(orgId, productId);
  const update = useUpdateVeterinaryStoreProduct(orgId);
  const del = useDeleteVeterinaryStoreProduct(orgId);
  const stock = useAdjustVeterinaryStoreStock(orgId);

  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [stockFields, setStockFields] = useState<Record<string, string>>({});
  const stockInFlight = useRef(false);

  const notFound =
    q.error instanceof ApiError && (q.error.status === 404 || q.error.status === 403);
  if (notFound) {
    return (
      <ScrollScreen>
        <AppHeader title={t('detail.title')} showBack />
        <EmptyState
          icon="help-circle-outline"
          title={t('detail.notFoundTitle')}
          message={t('detail.notFoundBody')}
          actionLabel={t('detail.backToList')}
          onAction={() => router.replace(Routes.organizationStoreProducts(orgId))}
        />
      </ScrollScreen>
    );
  }
  if (q.isError) {
    return (
      <ScrollScreen>
        <AppHeader title={t('detail.title')} showBack />
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
        onSuccess: () => toast.show({ tone: 'success', message: t('detail.reactivated') }),
        onError: (error) => toast.show({ tone: 'danger', message: veterinaryStoreErrorMessage(error, t) }),
      },
    );
  };

  const submitStock = (values: AdjustVeterinaryStoreStockFormValues) => {
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
          toast.show({ tone: 'success', message: t('stock.success') });
          setShowStock(false);
        },
        onError: (error) => {
          setStockFields(fieldErrors(error));
          setStockError(veterinaryStoreErrorMessage(error, t));
        },
        onSettled: () => {
          stockInFlight.current = false;
        },
      },
    );
  };

  return (
    <ScrollScreen>
      <AppHeader title={t('detail.title')} showBack />

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
              <Badge
                label={t(`productStatus.${product.status}`)}
                tone={VETERINARY_STORE_PRODUCT_STATUS_TONE[product.status]}
                size="md"
              />
            </Row>
          </Section>

          <Section spacing="xl">
            <Label>{t('detail.sectionInfo')}</Label>
            <Card variant="outlined">
              <Field label={t('form.fieldName')} value={product.name} />
              <Divider spacing="sm" />
              <Field
                label={t('form.fieldType')}
                value={t(`productType.${product.productType}`, {
                  defaultValue: product.productType,
                })}
              />
              <Divider spacing="sm" />
              <Field
                label={t('form.fieldPrice')}
                value={product.price != null ? product.price : t('detail.noPrice')}
              />
              <Divider spacing="sm" />
              <Field label={t('detail.fieldStock')} value={String(product.stockQuantity)} />
              <Divider spacing="sm" />
              <Field label={t('form.fieldStatus')} value={t(`productStatus.${product.status}`)} />
            </Card>
          </Section>

          {product.description ? (
            <Section spacing="xl">
              <Label>{t('form.fieldDescription')}</Label>
              <Card variant="outlined" padding="md">
                <Text variant="body">{product.description}</Text>
              </Card>
            </Section>
          ) : null}

          <Section spacing="xl">
            <Card variant="outlined" padding="md">
              <Field label={t('common.recordedAt')} value={formatDate(product.createdAt)} />
              <Divider spacing="sm" />
              <Field label={t('detail.fieldUpdatedAt')} value={formatDate(product.updatedAt)} />
            </Card>
          </Section>

          {canManage ? (
            <>
              <Button
                label={t('detail.editCta')}
                variant="outline"
                leftIcon="create-outline"
                disabled={busy}
                onPress={() => router.push(Routes.organizationStoreProductEdit(orgId, product.id))}
              />

              <View style={{ marginTop: theme.spacing.md }}>
                <Button
                  label={showStock ? t('stock.hideCta') : t('stock.showCta')}
                  variant="outline"
                  leftIcon="swap-vertical-outline"
                  disabled={busy}
                  onPress={() => setShowStock((s) => !s)}
                />
              </View>

              {showStock ? (
                <Section spacing="lg">
                  <Card variant="outlined" padding="md">
                    <AdjustVeterinaryStoreStockForm
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
                {product.status === 'ACTIVE' ? (
                  <Button
                    label={t('detail.deactivateCta')}
                    variant="ghost"
                    disabled={busy}
                    onPress={() => setConfirmDeactivate(true)}
                  />
                ) : (
                  <Button
                    label={t('detail.reactivateCta')}
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
            title={t('detail.deactivateConfirmTitle')}
            message={t('detail.deactivateConfirmBody')}
            confirmLabel={t('detail.deactivateCta')}
            cancelLabel={t('common.cancel')}
            destructive
            loading={del.isPending}
            onConfirm={() => {
              setConfirmDeactivate(false);
              del.mutate(
                { productId: product.id },
                {
                  onSuccess: () => {
                    toast.show({ tone: 'success', message: t('detail.deactivated') });
                  },
                  onError: (error) =>
                    toast.show({ tone: 'danger', message: veterinaryStoreErrorMessage(error, t) }),
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
