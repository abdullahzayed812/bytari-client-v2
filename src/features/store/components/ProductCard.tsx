import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Badge, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { LOW_STOCK_THRESHOLD, PRODUCT_STATUS_TONE, productTypeIcon } from '../constants';
import type { Product } from '../types';

export interface ProductCardProps {
  product: Product;
  onPress?: () => void;
}

/** Presentation-only product row. Renders only backend DTO fields (§5). */
export function ProductCard({ product, onPress }: ProductCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('store');
  const lowStock = product.stockQuantity <= LOW_STOCK_THRESHOLD;

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
        }}
      >
        <Icon name={productTypeIcon(product.productType)} size="iconMd" color="primary" />
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
            tone={PRODUCT_STATUS_TONE[product.status]}
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
