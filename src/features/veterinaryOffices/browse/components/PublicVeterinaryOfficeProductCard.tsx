import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import type { VeterinaryOfficeProduct } from '../../types';
import { formatProductPrice, productCurrency } from '../../utils';

export interface PublicVeterinaryOfficeProductCardProps {
  product: VeterinaryOfficeProduct;
  width: number;
  onPress: () => void;
  /** Shows the "تسوق" button (one unit → this store's cart). Omitted = no button. */
  onAddToCart?: () => void;
  adding?: boolean;
}

/** Grid card for a veterinary office/store's public product catalog. */
export function PublicVeterinaryOfficeProductCard({
  product,
  width,
  onPress,
  onAddToCart,
  adding,
}: PublicVeterinaryOfficeProductCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryOffices');
  const { t: tStore } = useTranslation('organizationStore');
  // Products without a price cannot be ordered (same rule as the product page).
  const orderable = product.price != null;
  // The all-products grid is 3 across on phones (~100px cards): the "تسوق"
  // pill then gets tighter padding, a smaller icon and font so the label fits.
  const compact = width < 140;

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
          // Square-ish on phones; capped so wide desktop cards stay proportionate.
          height: Math.min(width * 0.82, 260),
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

      <View
        style={{ padding: compact ? theme.spacing.sm : theme.spacing.md, rowGap: theme.spacing.xs }}
      >
        <Text variant="bodyMedium" numberOfLines={2}>
          {product.name}
        </Text>
        {product.description ? <Caption numberOfLines={1}>{product.description}</Caption> : null}
        <Text variant="bodyStrong" color="primary">
          {product.price != null
            ? t('product.price', {
                value: formatProductPrice(product.price),
                currency: t(`currency.${productCurrency(product)}`),
              })
            : t('product.noPrice')}
        </Text>
        {onAddToCart ? (
          // Compact pill, same as the Pet Owner Store grid card. The label has
          // a flex width: sized by its own measured width, some Android
          // devices measure Arabic text too narrow and cut it to "…".
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${tStore('addToCart.cta')} — ${product.name}`}
            accessibilityState={{ disabled: !orderable, busy: Boolean(adding) }}
            disabled={!orderable || adding}
            onPress={onAddToCart}
            hitSlop={4}
            style={({ pressed }) => ({
              minHeight: compact ? 30 : 34,
              marginTop: theme.spacing.xs,
              borderRadius: theme.radius.pill,
              backgroundColor: pressed ? theme.colors.primaryPressed : theme.colors.primary,
              flexDirection: 'row',
              alignItems: 'center',
              columnGap: compact ? 2 : theme.spacing.xs,
              paddingHorizontal: compact ? theme.spacing.xs : theme.spacing.md,
              opacity: orderable ? 1 : 0.45,
            })}
          >
            {adding ? (
              <ActivityIndicator size="small" color={theme.colors.onPrimary} style={{ flex: 1 }} />
            ) : (
              <>
                <Icon name="bag-add-outline" size={compact ? 13 : 16} color="onPrimary" />
                <Text
                  variant="label"
                  numberOfLines={1}
                  // Safety net on very narrow cards: shrink a little rather than "…".
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    color: theme.colors.onPrimary,
                    ...(compact ? { fontSize: 12, lineHeight: 16 } : null),
                  }}
                >
                  {tStore('addToCart.shop')}
                </Text>
              </>
            )}
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}
