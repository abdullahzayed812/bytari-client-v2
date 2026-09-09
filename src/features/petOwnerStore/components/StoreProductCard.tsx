import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/actions';
import { Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import type { PetStoreProductListItem } from '../types';
import { formatAmount } from '../utils';

export interface StoreProductCardProps {
  product: PetStoreProductListItem;
  width: number;
  adding?: boolean;
  onPress: () => void;
  onAddToCart: () => void;
}

/** Consumer product card — image, name, price, "أضف للسلة". Matches the reference grid. */
export function StoreProductCard({
  product,
  width,
  adding,
  onPress,
  onAddToCart,
}: StoreProductCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('petOwnerStore');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={product.name}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width,
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          overflow: 'hidden',
          ...theme.shadows.xs,
        },
        pressed && { opacity: 0.9 },
      ]}
    >
      <View
        style={{
          height: width * 0.82,
          backgroundColor: theme.colors.surfaceAccent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {product.primaryImageUrl ? (
          <Image
            source={{ uri: product.primaryImageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        ) : (
          <Icon name="image-outline" size="iconXl" color="textMuted" />
        )}
      </View>

      <View style={{ padding: theme.spacing.md, rowGap: theme.spacing.xs }}>
        <Text variant="bodyMedium" numberOfLines={2} style={{ minHeight: 38 }}>
          {product.name}
        </Text>
        {product.categoryName ? <Caption numberOfLines={1}>{product.categoryName}</Caption> : null}
        <Text variant="bodyStrong" color="primary">
          {t('common.price', { value: formatAmount(product.price) })}
        </Text>
        <Button
          label={product.inStock ? t('product.addToCart') : t('product.outOfStock')}
          size="sm"
          fullWidth
          loading={adding}
          disabled={!product.inStock || adding}
          leftIcon="bag-add-outline"
          onPress={onAddToCart}
          accessibilityLabel={t('product.addToCart')}
        />
      </View>
    </Pressable>
  );
}
