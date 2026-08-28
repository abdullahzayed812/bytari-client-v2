import { Pressable } from 'react-native';

import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';

export interface ChipProps {
  label: string;
  selected?: boolean;
  icon?: IconName;
  onPress?: () => void;
  disabled?: boolean;
}

/** Selectable filter chip. */
export function Chip({ label, selected, icon, onPress, disabled }: ChipProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.xs,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.sm,
          borderRadius: theme.radius.pill,
          borderWidth: 1.5,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          backgroundColor: selected ? theme.colors.primarySoft : theme.colors.surface,
        },
        pressed && { opacity: 0.7 },
        disabled && { opacity: 0.4 },
      ]}
    >
      {icon ? (
        <Icon name={icon} size="iconXs" color={selected ? 'primary' : 'textSecondary'} />
      ) : null}
      <Text variant="label" color={selected ? 'primary' : 'textSecondary'}>
        {label}
      </Text>
    </Pressable>
  );
}
