import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { TextButton } from '@/components/actions';
import { Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { formatProductPrice } from '@/features/veterinaryOffices';
import type { VeterinaryOfficeProduct } from '@/features/veterinaryOffices';
import { useTheme } from '@/theme';

export interface VeterinaryOfficeProductManageCardProps {
  product: VeterinaryOfficeProduct;
  width: number;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleHidden: () => void;
}

/**
 * Grid card for the Dashboard's product management screens (full list + hidden
 * list) — same visual shape as the public catalog's `PublicVeterinaryOfficeProductCard`
 * (image / name / price), plus the owner-only availability line and the
 * حذف / إخفاء-إظهار / تعديل action row from the reference screenshots.
 */
export function VeterinaryOfficeProductManageCard({
  product,
  width,
  onPress,
  onEdit,
  onDelete,
  onToggleHidden,
}: VeterinaryOfficeProductManageCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryOfficeDashboard');
  const { t: tOffice } = useTranslation('veterinaryOffices');
  const inStock = product.stockQuantity > 0;

  return (
    <View
      style={{
        width,
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
        ...theme.shadows.xs,
      }}
    >
      <Pressable accessibilityRole="button" accessibilityLabel={product.name} onPress={onPress}>
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
          {product.isHidden ? (
            <View
              style={{
                position: 'absolute',
                top: theme.spacing.xs,
                insetInlineStart: theme.spacing.xs,
                flexDirection: 'row',
                alignItems: 'center',
                columnGap: 4,
                backgroundColor: theme.colors.dangerSoft,
                borderRadius: theme.radius.pill,
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: 2,
              }}
            >
              <Icon name="eye-off-outline" size="iconXs" color="danger" />
              <Caption style={{ color: theme.colors.danger }}>{t('card.hiddenBadge')}</Caption>
            </View>
          ) : null}
        </View>

        <View style={{ padding: theme.spacing.md, rowGap: 2 }}>
          <Text variant="bodyMedium" numberOfLines={1}>
            {product.name}
          </Text>
          <Text variant="bodyStrong" color="primary">
            {product.price != null
              ? tOffice('product.price', { value: formatProductPrice(product.price) })
              : tOffice('product.noPrice')}
          </Text>
          <Caption style={{ color: inStock ? theme.colors.success : theme.colors.textMuted }}>
            {t(inStock ? 'card.inStock' : 'card.outOfStock')}
          </Caption>
        </View>
      </Pressable>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: theme.spacing.md,
          paddingBottom: theme.spacing.md,
          paddingTop: theme.spacing.xs,
          borderTopWidth: theme.sizes.hairline,
          borderTopColor: theme.colors.divider,
        }}
      >
        <TextButton label={t('card.delete')} icon="trash-outline" tone="danger" onPress={onDelete} />
        <TextButton
          label={t(product.isHidden ? 'card.show' : 'card.hide')}
          icon={product.isHidden ? 'eye-outline' : 'eye-off-outline'}
          tone="muted"
          onPress={onToggleHidden}
        />
        <TextButton label={t('card.edit')} icon="create-outline" tone="primary" onPress={onEdit} />
      </View>
    </View>
  );
}
