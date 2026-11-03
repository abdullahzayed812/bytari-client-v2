import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Divider } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { formatAmount } from '@/features/veterinarianStore/utils';
import { useTheme } from '@/theme';

import type { OrgStoreCurrency } from '../types';
import { formatOrgStoreMoney } from '../utils';

interface Props {
  subtotalAmount: string;
  deliveryFee: string;
  totalAmount: string;
  currency: OrgStoreCurrency | null;
}

/** Products total / delivery / total — delivery `0` means "settled on delivery", never free. */
export function OrgStorePriceSummary({
  subtotalAmount,
  deliveryFee,
  totalAmount,
  currency,
}: Props) {
  const theme = useTheme();
  const { t } = useTranslation('organizationStore');
  const feeIncluded = formatAmount(deliveryFee) !== '0';
  const money = (v: string) => formatOrgStoreMoney(t, v, currency);

  return (
    <View style={{ rowGap: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text color="textSecondary">{t('summary.subtotal')}</Text>
        <Text>{money(subtotalAmount)}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text color="textSecondary">{t('summary.delivery')}</Text>
        {feeIncluded ? (
          <Text>{money(deliveryFee)}</Text>
        ) : (
          <Caption color="textMuted">{t('summary.deliveryOnDelivery')}</Caption>
        )}
      </View>
      <Divider />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="bodyStrong">{t('summary.total')}</Text>
        <Text variant="bodyStrong" color="primary">
          {money(totalAmount)}
        </Text>
      </View>
      {feeIncluded ? null : (
        <Caption color="textMuted">{t('summary.totalExcludesDelivery')}</Caption>
      )}
    </View>
  );
}
