import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { QuantityStepper } from '@/features/veterinarianStore/components/QuantityStepper';
import { useTheme } from '@/theme';

import type { OrgStoreCartItem } from '../types';
import { formatOrgStoreMoney } from '../utils';

interface Props {
  item: OrgStoreCartItem;
  busy?: boolean;
  onChangeQuantity: (next: number) => void;
  onRemove: () => void;
}

/** One cart row: thumbnail, name, live unit price, quantity stepper, remove. */
export function OrgStoreCartLine({ item, busy, onChangeQuantity, onRemove }: Props) {
  const theme = useTheme();
  const { t } = useTranslation('organizationStore');

  return (
    <View
      style={{
        flexDirection: 'row',
        columnGap: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: item.available ? theme.colors.border : theme.colors.warning,
        opacity: item.available ? 1 : 0.85,
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
          <Icon name="cube-outline" size="iconMd" color="textMuted" />
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
        {item.unitPrice ? (
          <Text variant="bodyStrong" color="primary">
            {formatOrgStoreMoney(t, item.unitPrice, item.currency)}
          </Text>
        ) : null}
        {item.available ? null : <Caption color="warning">{t('cart.unavailable')}</Caption>}
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <QuantityStepper
            value={item.quantity}
            busy={busy || !item.available}
            onChange={onChangeQuantity}
          />
          {item.lineTotal ? (
            <Caption>{formatOrgStoreMoney(t, item.lineTotal, item.currency)}</Caption>
          ) : null}
        </View>
      </View>
    </View>
  );
}
