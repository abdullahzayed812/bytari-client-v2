import { createElement } from 'react';

import { useTheme } from '@/theme';
import { normalizeIsoDate } from '@/utils';

import type { WebDateTimeInputProps } from './WebDateTimeInput';

export type { WebDateTimeInputProps } from './WebDateTimeInput';

/**
 * Web date / time field. `@react-native-community/datetimepicker` has no web
 * implementation (it renders `null` and warns), so the browser's own
 * `<input type="date|time">` picker is used — it works on desktop and mobile
 * browsers (incl. iOS Safari) with no extra dependency.
 */
export function WebDateTimeInput({
  mode,
  value,
  min,
  onChange,
  accessibilityLabel,
  invalid,
}: WebDateTimeInputProps) {
  const theme = useTheme();
  // `<input type="date">` only understands the zero-padded form — an unpadded
  // `2026-4-7` would render as empty, so hand it the canonical value.
  const padded = (v: string | undefined) => (v ? (normalizeIsoDate(v) ?? v) : v);
  return createElement('input', {
    type: mode,
    value: mode === 'date' ? padded(value) : value,
    min: mode === 'date' ? padded(min) : undefined,
    'aria-label': accessibilityLabel,
    'aria-invalid': invalid || undefined,
    onChange: (e: { target: { value: string } }) => {
      if (e.target.value) onChange(e.target.value);
    },
    style: {
      boxSizing: 'border-box',
      width: '100%',
      minHeight: theme.sizes.controlHeightMd,
      paddingLeft: theme.spacing.lg,
      paddingRight: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      border: `1.5px solid ${invalid ? theme.colors.danger : theme.colors.primary}`,
      backgroundColor: theme.colors.surface,
      color: theme.colors.primary,
      fontSize: 16, // ≥16px keeps iOS Safari from zooming on focus
      fontFamily: 'inherit',
      colorScheme: theme.scheme,
    },
  });
}
