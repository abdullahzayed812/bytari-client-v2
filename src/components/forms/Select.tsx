import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, View } from 'react-native';

import { Icon } from '@/components/content/Icon';
import { BottomSheet } from '@/components/overlays/BottomSheet';
import { Caption, Label, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { SearchInput } from './SearchInput';

/** Lists longer than this get a search field in the sheet (e.g. countries). */
const SEARCHABLE_THRESHOLD = 8;

function normalize(text: string): string {
  return text.trim().toLocaleLowerCase();
}

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
  /** Force the in-sheet search on/off; defaults to on for long lists. */
  searchable?: boolean;
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
  searchable,
}: SelectProps<T>) {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);
  const showSearch = searchable ?? options.length > SEARCHABLE_THRESHOLD;
  const visibleOptions = useMemo(() => {
    const q = normalize(query);
    if (!showSearch || !q) return options;
    return options.filter((o) => normalize(o.label).includes(q) || normalize(o.value).includes(q));
  }, [options, query, showSearch]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

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

      <BottomSheet visible={open} onClose={close} title={label}>
        {showSearch ? (
          <SearchInput
            value={query}
            onChangeText={setQuery}
            onClear={() => setQuery('')}
            placeholder={t('actions.search')}
            accessibilityLabel={t('actions.search')}
          />
        ) : null}
        {/* flexShrink lets the list take the sheet's remaining (capped) height and scroll. */}
        <FlatList
          data={visibleOptions}
          keyExtractor={(option) => option.value}
          style={{ flexShrink: 1 }}
          contentContainerStyle={{ rowGap: theme.spacing.xs }}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={40}
          ListEmptyComponent={<Caption>{t('states.empty')}</Caption>}
          renderItem={({ item: option }) => {
            const active = option.value === value;
            return (
              <Pressable
                accessibilityRole="menuitem"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  onChange(option.value);
                  close();
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
          }}
        />
      </BottomSheet>
    </View>
  );
}
