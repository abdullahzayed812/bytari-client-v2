import { Pressable, View } from 'react-native';

import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

export interface SegmentedControlOption<T extends string> {
  label: string;
  value: T;
}

export interface SegmentedControlProps<T extends string> {
  options: [SegmentedControlOption<T>, SegmentedControlOption<T>];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

/**
 * Two-option inline pill switcher (e.g. "Veterinarian" / "Student"). `Row`
 * already uses logical flex direction, so the segment order flows correctly
 * start→end in RTL without any manual reversing.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: SegmentedControlProps<T>) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.surfaceMuted,
        borderRadius: theme.radius.pill,
        padding: 4,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active, disabled }}
            accessibilityLabel={option.label}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            style={{
              flex: 1,
              minHeight: theme.sizes.controlHeightSm,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: theme.radius.pill,
              backgroundColor: active ? theme.colors.primary : 'transparent',
            }}
          >
            <Text
              variant="label"
              style={{ color: active ? theme.colors.onPrimary : theme.colors.textSecondary }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
