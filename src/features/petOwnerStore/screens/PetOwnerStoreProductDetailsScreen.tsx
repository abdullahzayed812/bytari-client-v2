import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Divider, Icon } from '@/components/content';
import { EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { Caption, Heading, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { QuantityStepper, StoreHeader } from '../components';
import { usePetOwnerStoreCartMutations, usePetOwnerStoreProduct } from '../hooks';
import { formatAmount } from '../utils';

/** Route `/pet-owner-store/products/[productId]` — product detail + add to cart. */
export default function PetOwnerStoreProductDetailsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('petOwnerStore');
  const toast = useToast();
  const { productId } = useLocalSearchParams<{ productId: string }>();

  const q = usePetOwnerStoreProduct(productId);
  const { addItem } = usePetOwnerStoreCartMutations();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const product = q.data;
  const gallery = product?.images ?? [];
  const heroUrl = gallery[activeImage]?.url ?? product?.primaryImageUrl ?? null;

  const onAdd = (): void => {
    if (!product) return;
    addItem.mutate(
      { productId: product.id, quantity },
      {
        onSuccess: () => {
          toast.show({ message: t('cart.added'), tone: 'success' });
          router.push(Routes.petOwnerStoreCart);
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  return (
    <SafeAreaScreen>
      <StoreHeader title={t('product.title')} showBack />

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : !product ? (
        <EmptyState icon="pricetag-outline" title={t('product.notFound')} />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ paddingBottom: theme.spacing.huge }}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={{
                height: 280,
                backgroundColor: theme.colors.surfaceAccent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {heroUrl ? (
                <Image
                  source={{ uri: heroUrl }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="contain"
                />
              ) : (
                <Icon name="image-outline" size="iconXl" color="textMuted" />
              )}
            </View>

            {gallery.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  columnGap: theme.spacing.sm,
                  padding: theme.spacing.md,
                }}
              >
                {gallery.map((img, i) => (
                  <Pressable
                    key={img.id}
                    onPress={() => setActiveImage(i)}
                    accessibilityRole="button"
                    accessibilityLabel={`image ${i + 1}`}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: theme.radius.md,
                      overflow: 'hidden',
                      borderWidth: 2,
                      borderColor: i === activeImage ? theme.colors.primary : 'transparent',
                    }}
                  >
                    <Image source={{ uri: img.url }} style={{ flex: 1 }} contentFit="cover" />
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            <View style={{ padding: theme.screenPadding, rowGap: theme.spacing.md }}>
              <Heading level={2}>{product.name}</Heading>
              {product.categoryName ? <Caption>{product.categoryName}</Caption> : null}

              {product.ratingCount > 0 && product.ratingAverage ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    columnGap: theme.spacing.xs,
                  }}
                >
                  <Icon name="star" size="iconSm" color="warning" />
                  <Text variant="label">{product.ratingAverage}</Text>
                  <Caption>{t('product.ratingCount', { count: product.ratingCount })}</Caption>
                </View>
              ) : null}

              <Heading level={3} color="primary">
                {t('common.price', { value: formatAmount(product.price) })}
              </Heading>

              {product.description ? (
                <Text variant="body" color="textSecondary">
                  {product.description}
                </Text>
              ) : null}

              {product.attributes && Object.keys(product.attributes).length > 0 ? (
                <View style={{ rowGap: theme.spacing.sm }}>
                  <Divider />
                  <Label>{t('product.specs')}</Label>
                  {Object.entries(product.attributes).map(([k, v]) => (
                    <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Caption>{k}</Caption>
                      <Text variant="label">{v}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <Caption style={product.inStock ? undefined : { color: theme.colors.warning }}>
                {product.inStock
                  ? t('product.inStock', { count: product.stockQuantity })
                  : t('product.outOfStock')}
              </Caption>
            </View>
          </ScrollView>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              columnGap: theme.spacing.md,
              padding: theme.spacing.md,
              borderTopWidth: theme.sizes.hairline,
              borderTopColor: theme.colors.border,
              backgroundColor: theme.colors.background,
            }}
          >
            <QuantityStepper
              value={quantity}
              max={Math.max(1, product.stockQuantity)}
              onChange={setQuantity}
            />
            <View style={{ flex: 1 }}>
              <Button
                label={t('product.addToCart')}
                fullWidth
                leftIcon="bag-add-outline"
                loading={addItem.isPending}
                disabled={!product.inStock || addItem.isPending}
                onPress={onAdd}
              />
            </View>
          </View>
        </>
      )}
    </SafeAreaScreen>
  );
}
