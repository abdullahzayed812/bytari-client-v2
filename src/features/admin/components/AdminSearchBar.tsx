import { useState } from 'react';
import { View } from 'react-native';

import { SearchInput } from '@/components/forms';
import { useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

/**
 * Search state for one admin list: `raw` drives the input, `search` is the
 * debounced + trimmed term sent to the server (`undefined` when blank, so the
 * query key — and the cached unfiltered list — stays the same as before).
 */
export function useAdminSearch(delayMs = 300) {
  const [raw, setRaw] = useState('');
  const debounced = useDebouncedValue(raw, delayMs).trim();
  return { raw, setRaw, search: debounced || undefined, clear: () => setRaw('') };
}

export interface AdminSearchBarProps {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}

/** The admin-list search field, padded like the filter rows it sits above. */
export function AdminSearchBar({ value, onChangeText, placeholder }: AdminSearchBarProps) {
  const theme = useTheme();
  return (
    <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.sm }}>
      <SearchInput
        value={value}
        onChangeText={onChangeText}
        onClear={() => onChangeText('')}
        placeholder={placeholder}
        accessibilityLabel={placeholder}
        // The server accepts up to 120–160 chars per section; never send a 400.
        maxLength={120}
      />
    </View>
  );
}
