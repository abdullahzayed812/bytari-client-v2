import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Badge, Card, Divider } from '@/components/content';
import { ConfirmationDialog, ErrorState, Loading, useToast } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { ImagePreview, ImageUploader } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { formatAmount } from '../../utils';
import {
  useVetStoreAdminProduct,
  useVetStoreAdminProductMutations,
  useVetStoreProductImagePresignProvider,
} from '../hooks';

/** Route `/(app)/admin/veterinarian-store/products/[productId]` — preview + manage. */
export default function VeterinarianStoreAdminProductDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinarianStore');
  const toast = useToast();
  const { productId } = useLocalSearchParams<{ productId: string }>();

  const q = useVetStoreAdminProduct(productId);
  const { deactivate, removeImage } = useVetStoreAdminProductMutations();
  const presign = useVetStoreProductImagePresignProvider(productId);
  const [uploadKey, setUploadKey] = useState(0);
  const [confirmOff, setConfirmOff] = useState(false);

  const product = q.data;

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('admin.detail.title')}
        showBack
        right={
          product ? (
            <Button
              label={t('admin.detail.edit')}
              size="sm"
              variant="ghost"
              onPress={() => router.push(Routes.adminVetStoreProductEdit(product.id))}
            />
          ) : undefined
        }
      />

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError || !product ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: theme.screenPadding,
            rowGap: theme.spacing.lg,
            paddingBottom: theme.spacing.huge,
          }}
        >
          <Card variant="outlined" padding="md">
            <View style={{ rowGap: theme.spacing.xs }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text variant="title" style={{ flex: 1 }}>
                  {product.name}
                </Text>
                <Badge
                  label={t(
                    product.status === 'ACTIVE'
                      ? 'admin.form.statusActive'
                      : 'admin.form.statusInactive',
                  )}
                  tone={product.status === 'ACTIVE' ? 'success' : 'neutral'}
                  size="sm"
                />
              </View>
              <Text variant="bodyStrong" color="primary">
                {t('common.price', { value: formatAmount(product.price) })}
              </Text>
              <Caption>
                {(product.categoryName ?? '—') +
                  ' · ' +
                  t('admin.detail.stock', { count: product.stockQuantity })}
              </Caption>
              {product.description ? (
                <Text variant="body" color="textSecondary">
                  {product.description}
                </Text>
              ) : null}
            </View>
          </Card>

          <View style={{ rowGap: theme.spacing.sm }}>
            <Label>{t('admin.detail.images')}</Label>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
              {product.images.map((img) => (
                <ImagePreview
                  key={img.id}
                  uri={img.url}
                  size={96}
                  onRemove={() =>
                    removeImage.mutate(
                      { productId: product.id, imageId: img.id },
                      {
                        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
                      },
                    )
                  }
                />
              ))}
              <ImageUploader
                key={uploadKey}
                value={null}
                provider={presign}
                icon="add"
                onChange={(result) => {
                  if (result) {
                    setUploadKey((k) => k + 1);
                    toast.show({ message: t('admin.detail.addImage'), tone: 'success' });
                  }
                }}
              />
            </View>
          </View>

          <Divider />

          {product.status === 'ACTIVE' ? (
            <Button
              label={t('admin.detail.deactivate')}
              variant="danger"
              fullWidth
              loading={deactivate.isPending}
              onPress={() => setConfirmOff(true)}
            />
          ) : null}
        </ScrollView>
      )}

      <ConfirmationDialog
        visible={confirmOff}
        title={t('admin.detail.deactivate')}
        message={t('admin.detail.deactivateConfirm')}
        confirmLabel={t('admin.detail.deactivate')}
        destructive
        onCancel={() => setConfirmOff(false)}
        onConfirm={() => {
          setConfirmOff(false);
          if (product) {
            deactivate.mutate(product.id, {
              onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
            });
          }
        }}
      />
    </SafeAreaScreen>
  );
}
