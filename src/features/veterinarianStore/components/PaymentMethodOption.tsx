import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import type { VetStorePaymentMethod } from '../types';

interface PaymentMethodOptionProps {
  method: VetStorePaymentMethod;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

const ICON: Record<VetStorePaymentMethod, 'cash-outline' | 'card-outline'> = {
  COD: 'cash-outline',
  MADA: 'card-outline',
  CREDIT_CARD: 'card-outline',
};

/** A radio row at checkout. Non-COD methods render disabled with a "coming soon" note. */
export function PaymentMethodOption({
  method,
  selected,
  disabled,
  onSelect,
}: PaymentMethodOptionProps) {
  const theme = useTheme();
  const { t } = useTranslation('veterinarianStore');

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={t(`payment.method.${method}`)}
      disabled={disabled}
      onPress={onSelect}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: theme.spacing.md,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.xl,
        borderWidth: 1.5,
        borderColor: selected ? theme.colors.primary : theme.colors.border,
        backgroundColor: selected ? theme.colors.primarySoft : theme.colors.surface,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Icon
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size="iconMd"
        color={selected ? 'primary' : 'textMuted'}
      />
      <Icon name={ICON[method]} size="iconMd" color="textSecondary" />
      <View style={{ flex: 1 }}>
        <Text variant="bodyMedium">{t(`payment.method.${method}`)}</Text>
        <Caption>{disabled ? t('payment.comingSoon') : t(`payment.hint.${method}`)}</Caption>
      </View>
    </Pressable>
  );
}
