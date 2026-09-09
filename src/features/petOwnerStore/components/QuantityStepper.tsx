import { Pressable, View } from 'react-native';

import { Icon } from '@/components/content';
import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  busy?: boolean;
  onChange: (next: number) => void;
}

/** `−  n  +` control used on the product detail and cart line items. */
export function QuantityStepper({
  value,
  min = 1,
  max = 99,
  busy,
  onChange,
}: QuantityStepperProps) {
  const theme = useTheme();

  const step = (delta: number): void => {
    const next = Math.min(max, Math.max(min, value + delta));
    if (next !== value) onChange(next);
  };

  const btn = (name: 'remove' | 'add', delta: number, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name === 'add' ? 'increment' : 'decrement'}
      disabled={disabled || busy}
      onPress={() => step(delta)}
      hitSlop={6}
      style={{
        width: 30,
        height: 30,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surfaceAccent,
        opacity: disabled || busy ? 0.4 : 1,
      }}
    >
      <Icon name={name} size="iconSm" color="primary" />
    </Pressable>
  );

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}>
      {btn('remove', -1, value <= min)}
      <Text variant="bodyStrong" style={{ minWidth: 20, textAlign: 'center' }}>
        {value}
      </Text>
      {btn('add', 1, value >= max)}
    </View>
  );
}
