import { ScrollView } from 'react-native';

import { Chip } from '@/components/content';
import { useTheme } from '@/theme';

export interface FilterOption<T extends string> {
  value: T | undefined;
  label: string;
}

export interface FilterChipsProps<T extends string> {
  options: FilterOption<T>[];
  value: T | undefined;
  onChange: (value: T | undefined) => void;
}

/** Horizontal, scrollable single-select filter chip row. RTL-safe. */
export function FilterChips<T extends string>({ options, value, onChange }: FilterChipsProps<T>) {
  const theme = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        alignItems: 'flex-start',
        columnGap: theme.spacing.sm,
        paddingHorizontal: theme.screenPadding,
        paddingVertical: theme.spacing.sm,
      }}
    >
      {options.map((opt) => (
        <Chip
          key={opt.label}
          label={opt.label}
          selected={value === opt.value}
          onPress={() => onChange(opt.value)}
        />
      ))}
    </ScrollView>
  );
}
