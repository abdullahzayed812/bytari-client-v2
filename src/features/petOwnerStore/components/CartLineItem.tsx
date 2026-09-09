import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import type { PetStoreCartItem } from '../types';
import { formatAmount } from '../utils';

import { QuantityStepper } from './QuantityStepper';

interface CartLineItemProps {
  item: PetStoreCartItem;
  busy?: boolean;
  onChangeQuantity: (next: number) => void;
  onRemove: () => void;
}

/** One cart row: thumbnail, name, unit price, quantity stepper, remove. */
export function CartLineItem({ item, busy, onChangeQuantity, onRemove }: CartLineItemProps) {
  const theme = useTheme();
  const { t } = useTranslation('petOwnerStore');

  return (
    <View
      style={{
        flexDirection: 'row',
        columnGap: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadows.xs,
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: theme.radius.md,
          overflow: 'hidden',
          backgroundColor: theme.colors.surfaceAccent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {item.primaryImageUrl ? (
          <Image
            source={{ uri: item.primaryImageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        ) : (
          <Icon name="image-outline" size="iconMd" color="textMuted" />
        )}
      </View>

      <View style={{ flex: 1, rowGap: theme.spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <Text variant="bodyMedium" numberOfLines={2} style={{ flex: 1 }}>
            {item.name}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('cart.remove')}
            onPress={onRemove}
            disabled={busy}
            hitSlop={8}
          >
            <Icon name="trash-outline" size="iconSm" color="danger" />
          </Pressable>
        </View>

        <Text variant="bodyStrong" color="primary">
          {t('common.price', { value: formatAmount(item.unitPrice) })}
        </Text>
        {!item.inStock ? (
          <Caption style={{ color: theme.colors.warning }}>{t('cart.lowStock')}</Caption>
        ) : null}

        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <QuantityStepper
            value={item.quantity}
            max={Math.max(item.quantity, item.availableStock || 99)}
            busy={busy}
            onChange={onChangeQuantity}
          />
          <Caption>{t('common.price', { value: formatAmount(item.lineTotal) })}</Caption>
        </View>
      </View>
    </View>
  );
}
