import { Pressable, Switch as RNSwitch, View } from 'react-native';

import { Icon } from '@/components/content/Icon';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

interface OptionRowProps {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}

/** Checkbox — square, checkmark when selected. */
export function Checkbox({ label, description, checked, disabled, onChange }: OptionRowProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={{
        flexDirection: 'row',
        columnGap: theme.spacing.md,
        alignItems: 'flex-start',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: theme.radius.sm,
          borderWidth: 2,
          borderColor: checked ? theme.colors.primary : theme.colors.borderStrong,
          backgroundColor: checked ? theme.colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
        }}
      >
        {checked ? <Icon name="checkmark" size={16} color="onPrimary" /> : null}
      </View>
      <View style={{ flex: 1, rowGap: 2 }}>
        <Text variant="bodyMedium">{label}</Text>
        {description ? <Caption>{description}</Caption> : null}
      </View>
    </Pressable>
  );
}

/** Radio — circular, filled dot when selected. */
export function Radio({ label, description, checked, disabled, onChange }: OptionRowProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => onChange(true)}
      style={{
        flexDirection: 'row',
        columnGap: theme.spacing.md,
        alignItems: 'flex-start',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: theme.radius.pill,
          borderWidth: 2,
          borderColor: checked ? theme.colors.primary : theme.colors.borderStrong,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
        }}
      >
        {checked ? (
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.colors.primary,
            }}
          />
        ) : null}
      </View>
      <View style={{ rowGap: 2 }}>
        <Text variant="bodyMedium">{label}</Text>
        {description ? <Caption>{description}</Caption> : null}
      </View>
    </Pressable>
  );
}

interface SwitchProps {
  value: boolean;
  onValueChange: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
}

/** Platform switch, themed to the brand green, with an optional inline label. */
export function Switch({ value, onValueChange, label, disabled }: SwitchProps) {
  const theme = useTheme();
  const control = (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
      thumbColor={theme.colors.surface}
      ios_backgroundColor={theme.colors.border}
    />
  );
  if (!label) return control;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        columnGap: theme.spacing.md,
      }}
    >
      <Text variant="bodyMedium" style={{ flex: 1 }}>
        {label}
      </Text>
      {control}
    </View>
  );
}
