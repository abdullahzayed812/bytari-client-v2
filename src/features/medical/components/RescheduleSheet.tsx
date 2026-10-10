import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Input } from '@/components/forms';
import { BottomSheet } from '@/components/overlays';
import { useTheme } from '@/theme';
import { normalizeIsoDate } from '@/utils';

/**
 * Pick a new `YYYY-MM-DD` date (legacy "إعادة جدولة" for vaccinations and
 * reminders). Same text-date format as every v2 medical form.
 */
export function RescheduleSheet({
  visible,
  title,
  initialDate,
  submitting,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  title: string;
  initialDate: string | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (date: string) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('medical');
  const [value, setValue] = useState(initialDate ?? '');
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (visible) {
      setValue(initialDate ?? '');
      setError(undefined);
    }
  }, [visible, initialDate]);

  const submit = () => {
    const v = value.trim();
    const day = normalizeIsoDate(v);
    if (!day) {
      setError(t('reminders.errors.dateFormat'));
      return;
    }
    onSubmit(day);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <View style={{ rowGap: theme.spacing.md }}>
        <Input
          value={value}
          onChangeText={setValue}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
          autoCorrect={false}
          error={error}
          accessibilityLabel={title}
        />
        <Button
          label={t('common.save')}
          loading={submitting}
          disabled={submitting}
          onPress={submit}
        />
      </View>
    </BottomSheet>
  );
}
