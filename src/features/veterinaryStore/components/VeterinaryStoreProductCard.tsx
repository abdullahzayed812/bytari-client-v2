import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Badge, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { VETERINARY_STORE_LOW_STOCK_THRESHOLD, VETERINARY_STORE_PRODUCT_STATUS_TONE, veterinaryStoreProductTypeIcon } from '../constants';
import type { VeterinaryStoreProduct } from '../types';

export interface VeterinaryStoreProductCardProps {
  product: VeterinaryStoreProduct;
  onPress?: () => void;
}

/** Presentation-only product row. Renders only backend DTO fields (§5). */
export function VeterinaryStoreProductCard({ product, onPress }: VeterinaryStoreProductCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryStore');
  const lowStock = product.stockQuantity <= VETERINARY_STORE_LOW_STOCK_THRESHOLD;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('card.openLabel', { name: product.name })}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.lg,
          padding: theme.spacing.lg,
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.shadows.xs,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surfaceAccent,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {product.primaryImageUrl ? (
          <Image
            source={{ uri: product.primaryImageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        ) : (
          <Icon name={veterinaryStoreProductTypeIcon(product.productType)} size="iconMd" color="primary" />
        )}
      </View>

      <View style={{ flex: 1, rowGap: 4 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {product.name}
        </Text>
        <Caption numberOfLines={1}>
          {t(`productType.${product.productType}`, { defaultValue: product.productType })}
          {' · '}
          {product.price != null ? t('card.price', { value: product.price }) : t('card.noPrice')}
        </Caption>
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
          <Badge
            label={t(`productStatus.${product.status}`)}
            tone={VETERINARY_STORE_PRODUCT_STATUS_TONE[product.status]}
            size="sm"
          />
          <Caption style={lowStock ? { color: theme.colors.warning } : undefined}>
            {t('card.stock', { count: product.stockQuantity })}
          </Caption>
        </View>
      </View>

      <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
    </Pressable>
  );
}
