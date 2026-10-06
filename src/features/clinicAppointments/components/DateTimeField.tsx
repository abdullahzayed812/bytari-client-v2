import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, View } from 'react-native';

import { Button } from '@/components/actions';
import { Icon } from '@/components/content';
import { WebDateTimeInput } from '@/components/forms';
import { BottomSheet } from '@/components/overlays';
import { Caption, Label, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { toLocalIsoDate, toLocalTime, withLocalDate, withLocalTime } from '@/utils';

export interface DateTimeFieldProps {
  label?: string;
  mode: 'date' | 'time';
  /** Current value. */
  value: Date;
  onChange: (next: Date) => void;
  /** Formatted display string (locale-aware, provided by the caller). */
  display: string;
  minimumDate?: Date;
  error?: string;
  accessibilityLabel: string;
}

/**
 * A bordered, tappable date/time field. Per platform:
 *  - Android: the native dialog via the imperative `DateTimePickerAndroid.open`
 *    (the inline-rendered dialog re-opens / crashes when it is unmounted from
 *    its own `onChange`);
 *  - iOS: the spinner inside a `BottomSheet` with a confirm button;
 *  - web: the browser's `<input type="date|time">` — the community picker has
 *    no web implementation (it renders nothing).
 * Matches the reference: value leading, calendar / clock icon trailing.
 */
export function DateTimeField({
  label,
  mode,
  value,
  onChange,
  display,
  minimumDate,
  error,
  accessibilityLabel,
}: DateTimeFieldProps) {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const openPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode,
        is24Hour: true,
        minimumDate: mode === 'date' ? minimumDate : undefined,
        onChange: (event, next) => {
          if (event.type === 'set' && next) onChange(next);
        },
      });
      return;
    }
    setDraft(value);
    setOpen(true);
  };

  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, rowGap: theme.spacing.xs }}>
        {label ? <Label>{label}</Label> : null}
        <WebDateTimeInput
          mode={mode}
          value={mode === 'date' ? toLocalIsoDate(value) : toLocalTime(value)}
          min={minimumDate ? toLocalIsoDate(minimumDate) : undefined}
          invalid={Boolean(error)}
          accessibilityLabel={accessibilityLabel}
          onChange={(v) => {
            const next = mode === 'date' ? withLocalDate(value, v) : withLocalTime(value, v);
            if (next) onChange(next);
          }}
        />
        {error ? <Caption color="danger">{error}</Caption> : null}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, rowGap: theme.spacing.xs }}>
      {label ? <Label>{label}</Label> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={openPicker}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: theme.sizes.controlHeightMd,
          paddingHorizontal: theme.spacing.lg,
          borderRadius: theme.radius.lg,
          borderWidth: 1.5,
          borderColor: error ? theme.colors.danger : theme.colors.primary,
          backgroundColor: theme.colors.surface,
        }}
      >
        <Text variant="body" color="primary">
          {display}
        </Text>
        <Icon
          name={mode === 'date' ? 'calendar-outline' : 'time-outline'}
          size="iconSm"
          color="primary"
        />
      </Pressable>
      {error ? <Caption color="danger">{error}</Caption> : null}

      {Platform.OS === 'ios' ? (
        <BottomSheet visible={open} onClose={() => setOpen(false)} title={label}>
          <DateTimePicker
            value={draft}
            mode={mode}
            display="spinner"
            minimumDate={mode === 'date' ? minimumDate : undefined}
            onChange={(_e, next) => {
              if (next) setDraft(next);
            }}
          />
          <Button
            label={t('actions.confirm')}
            fullWidth
            onPress={() => {
              onChange(draft);
              setOpen(false);
            }}
            leftIcon="checkmark"
          />
        </BottomSheet>
      ) : null}
    </View>
  );
}
