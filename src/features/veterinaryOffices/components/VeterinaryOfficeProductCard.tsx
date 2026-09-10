import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Badge, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import {
  VETERINARY_OFFICE_LOW_STOCK_THRESHOLD,
  VETERINARY_OFFICE_PRODUCT_STATUS_TONE,
  veterinaryOfficeProductTypeIcon,
} from '../constants';
import type { VeterinaryOfficeProduct } from '../types';

export interface VeterinaryOfficeProductCardProps {
  product: VeterinaryOfficeProduct;
  onPress?: () => void;
}

/** Presentation-only product row for the management list. Renders only backend DTO fields. */
export function VeterinaryOfficeProductCard({ product, onPress }: VeterinaryOfficeProductCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryOffices');
  const lowStock = product.stockQuantity <= VETERINARY_OFFICE_LOW_STOCK_THRESHOLD;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('manage.card.openLabel', { name: product.name })}
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
        <Icon name={veterinaryOfficeProductTypeIcon(product.productType)} size="iconMd" color="primary" />
      </View>

      <View style={{ flex: 1, rowGap: 4 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {product.name}
        </Text>
        <Caption numberOfLines={1}>
          {t(`productType.${product.productType}`, { defaultValue: product.productType })}
          {' · '}
          {product.price != null ? t('manage.card.price', { value: product.price }) : t('manage.card.noPrice')}
        </Caption>
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
          <Badge
            label={t(`manage.productStatus.${product.status}`)}
            tone={VETERINARY_OFFICE_PRODUCT_STATUS_TONE[product.status]}
            size="sm"
          />
          <Caption style={lowStock ? { color: theme.colors.warning } : undefined}>
            {t('manage.card.stock', { count: product.stockQuantity })}
          </Caption>
        </View>
      </View>

      <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
    </Pressable>
  );
}
