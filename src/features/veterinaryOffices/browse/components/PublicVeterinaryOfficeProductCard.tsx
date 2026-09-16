import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { formatProductPrice } from '../../utils';
import type { VeterinaryOfficeProduct } from '../../types';

export interface PublicVeterinaryOfficeProductCardProps {
  product: VeterinaryOfficeProduct;
  width: number;
  onPress: () => void;
}

/** Grid card for a veterinary office/store's public product catalog. */
export function PublicVeterinaryOfficeProductCard({ product, width, onPress }: PublicVeterinaryOfficeProductCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryOffices');

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
        <Text variant="bodyMedium" numberOfLines={1}>
          {product.name}
        </Text>
        {product.description ? (
          <Caption numberOfLines={1}>{product.description}</Caption>
        ) : null}
        <Text variant="bodyStrong" color="primary">
          {product.price != null
            ? t('product.price', { value: formatProductPrice(product.price) })
            : t('product.noPrice')}
        </Text>
      </View>
    </Pressable>
  );
}
