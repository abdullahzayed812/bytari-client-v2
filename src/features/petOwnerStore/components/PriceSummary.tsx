import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Divider } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { formatAmount } from '../utils';

interface PriceSummaryProps {
  subtotalAmount: string;
  deliveryFee: string;
  totalAmount: string;
}

/** إجمالي المنتجات / التوصيل / المجموع الكلي — the checkout & cart totals block. */
export function PriceSummary({ subtotalAmount, deliveryFee, totalAmount }: PriceSummaryProps) {
  const theme = useTheme();
  const { t } = useTranslation('petOwnerStore');
  const freeDelivery = formatAmount(deliveryFee) === '0';

  const row = (label: string, value: string, strong?: boolean) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text
        variant={strong ? 'bodyStrong' : 'body'}
        color={strong ? 'textPrimary' : 'textSecondary'}
      >
        {label}
      </Text>
      <Text variant={strong ? 'bodyStrong' : 'body'} color={strong ? 'primary' : 'textPrimary'}>
        {value}
      </Text>
    </View>
  );

  return (
    <View style={{ rowGap: theme.spacing.sm }}>
      {row(t('summary.subtotal'), t('common.price', { value: formatAmount(subtotalAmount) }))}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="body" color="textSecondary">
          {t('summary.delivery')}
        </Text>
        {freeDelivery ? (
          <Caption style={{ color: theme.colors.success }}>{t('summary.freeDelivery')}</Caption>
        ) : (
          <Text variant="body">{t('common.price', { value: formatAmount(deliveryFee) })}</Text>
        )}
      </View>
      <Divider />
      {row(t('summary.total'), t('common.price', { value: formatAmount(totalAmount) }), true)}
    </View>
  );
}
