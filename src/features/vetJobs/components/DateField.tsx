import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, View } from 'react-native';

import { Button } from '@/components/actions';
import { Icon } from '@/components/content';
import { BottomSheet } from '@/components/overlays';
import { Caption, Label, Text } from '@/components/typography';
import { useTheme } from '@/theme';

export interface DateFieldProps {
  label?: string;
  /** `YYYY-MM-DD`, or `null` for "not set". */
  value: string | null;
  onChange: (next: string | null) => void;
  placeholder: string;
  minimumDate?: Date;
  error?: string;
  accessibilityLabel: string;
}

/** A tappable date-only field for an optional `YYYY-MM-DD` value (e.g. application deadline). */
export function DateField({
  label,
  value,
  onChange,
  placeholder,
  minimumDate,
  error,
  accessibilityLabel,
}: DateFieldProps) {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const current = value ? new Date(`${value}T00:00:00`) : new Date();
  const [draft, setDraft] = useState(current);

  const openPicker = () => {
    setDraft(current);
    setOpen(true);
  };

  const commit = (next: Date): void => onChange(next.toISOString().slice(0, 10));

  const handleAndroidChange = (event: DateTimePickerEvent, next?: Date) => {
    setOpen(false);
    if (event.type === 'set' && next) commit(next);
  };

  return (
    <View style={{ rowGap: theme.spacing.xs }}>
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
          borderColor: error ? theme.colors.danger : theme.colors.border,
          backgroundColor: theme.colors.surface,
        }}
      >
        <Text variant="body" color={value ? 'textPrimary' : 'textMuted'}>
          {value ?? placeholder}
        </Text>
        <Icon name="calendar-outline" size="iconSm" color="primary" />
      </Pressable>
      {error ? <Caption color="danger">{error}</Caption> : null}

      {open && Platform.OS === 'android' ? (
        <DateTimePicker value={current} mode="date" minimumDate={minimumDate} onChange={handleAndroidChange} />
      ) : null}

      {Platform.OS !== 'android' ? (
        <BottomSheet visible={open} onClose={() => setOpen(false)} title={label}>
          <DateTimePicker
            value={draft}
            mode="date"
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
              commit(draft);
              setOpen(false);
            }}
            leftIcon="checkmark"
          />
        </BottomSheet>
      ) : null}
    </View>
  );
}
