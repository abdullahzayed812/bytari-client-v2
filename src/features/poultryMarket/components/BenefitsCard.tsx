import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card, Icon } from '@/components/content';
import { Label, Text } from '@/components/typography';
import { useTheme } from '@/theme';

const BENEFIT_KEYS = [
  'poultryMarket',
  'eggMarket',
  'poultryBourse',
  'eggBourse',
  'statistics',
  'profile',
] as const;

/** "مزايا حساب التاجر" benefits checklist + admin-approval notice, shown atop trader registration. */
export function BenefitsCard() {
  const theme = useTheme();
  const { t } = useTranslation('poultryMarket');

  return (
    <Card variant="accent" padding="lg" style={{ rowGap: theme.spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
        <Icon name="cart-outline" size="iconSm" color="primary" />
        <Label color="primary">{t('register.benefitsTitle')}</Label>
      </View>

      <View style={{ rowGap: theme.spacing.sm }}>
        {BENEFIT_KEYS.map((key) => (
          <View key={key} style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
            <Icon name="checkmark-circle" size="iconSm" color="success" />
            <Text variant="bodyMedium">{t(`register.benefit.${key}`)}</Text>
          </View>
        ))}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.sm,
          backgroundColor: theme.colors.warningSoft,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.md,
        }}
      >
        <Icon name="document-text-outline" size="iconSm" color="warning" />
        <Text variant="caption" style={{ flex: 1 }}>
          {t('register.approvalNotice')}
        </Text>
      </View>
    </Card>
  );
}
