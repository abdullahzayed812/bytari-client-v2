import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, View } from 'react-native';

import { Button } from '@/components/actions';
import { Icon } from '@/components/content';
import { BottomSheet } from '@/components/overlays';
import { Caption, Label, Text } from '@/components/typography';
import { useTheme } from '@/theme';

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
 * A bordered, tappable date/time field that opens the platform picker
 * (`@react-native-community/datetimepicker`). Android uses the native dialog;
 * iOS renders the spinner inside a `BottomSheet` with a confirm button. Matches
 * the reference: value leading, calendar / clock icon trailing.
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
    setDraft(value);
    setOpen(true);
  };

  const handleAndroidChange = (event: DateTimePickerEvent, next?: Date) => {
    setOpen(false);
    if (event.type === 'set' && next) onChange(next);
  };

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

      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={value}
          mode={mode}
          minimumDate={minimumDate}
          onChange={handleAndroidChange}
        />
      ) : null}

      {Platform.OS !== 'android' ? (
        <BottomSheet visible={open} onClose={() => setOpen(false)} title={label}>
          <DateTimePicker
            value={draft}
            mode={mode}
            display="spinner"
            minimumDate={minimumDate}
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
