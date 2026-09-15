import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/content/Icon';
import { BottomSheet } from '@/components/overlays/BottomSheet';
import { Caption, Label, Text } from '@/components/typography';
import { useTheme } from '@/theme';

export interface SelectOption<T extends string> {
  label: string;
  value: T;
  description?: string;
}

export interface SelectProps<T extends string> {
  label?: string;
  placeholder?: string;
  value: T | null;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

/**
 * Select control. Tapping opens a `BottomSheet` list (native-feeling on mobile,
 * avoids a JS picker). Generic over the value union.
 */
export function Select<T extends string>({
  label,
  placeholder,
  value,
  options,
  onChange,
  error,
  disabled,
  required,
}: SelectProps<T>) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  return (
    <View style={{ rowGap: theme.spacing.xs }}>
      {label ? (
        <Label>
          {label}
          {required ? <Text color="danger"> *</Text> : null}
        </Label>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder ?? 'Select'}
        accessibilityState={{ disabled, expanded: open }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: theme.sizes.controlHeightMd,
          paddingHorizontal: theme.spacing.lg,
          borderRadius: theme.radius.lg,
          borderWidth: 1.5,
          borderColor: error ? theme.colors.danger : theme.colors.border,
          backgroundColor: theme.colors.surface,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Text variant="body" color={selected ? 'textPrimary' : 'textMuted'}>
          {selected?.label ?? placeholder ?? '—'}
        </Text>
        <Icon name="chevron-down" size="iconSm" color="textMuted" />
      </Pressable>
      {error ? <Caption color="danger">{error}</Caption> : null}

      <BottomSheet visible={open} onClose={() => setOpen(false)} title={label}>
        <View style={{ rowGap: theme.spacing.xs }}>
          {options.map((option) => {
            const active = option.value === value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: theme.spacing.md,
                  paddingHorizontal: theme.spacing.md,
                  borderRadius: theme.radius.md,
                  backgroundColor: active ? theme.colors.surfaceAccent : 'transparent',
                }}
              >
                <View style={{ flex: 1, rowGap: 2 }}>
                  <Text variant="bodyMedium">{option.label}</Text>
                  {option.description ? <Caption>{option.description}</Caption> : null}
                </View>
                {active ? <Icon name="checkmark" size="iconSm" color="primary" /> : null}
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </View>
  );
}
