import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, TextButton } from '@/components/actions';
import { Input } from '@/components/forms';
import { Modal } from '@/components/overlays';
import { useTheme } from '@/theme';

export interface SubscriptionDatesDialogProps {
  visible: boolean;
  title: string;
  confirmLabel: string;
  loading?: boolean;
  onConfirm: (dates: { startDate: string; endDate: string }) => void;
  onCancel: () => void;
}

/**
 * Admin/Supervisor subscription start/end date picker — shared between farm,
 * veterinary office and clinic subscription management (all three call the
 * same generalized `FarmSubscriptionService.setSubscription`, see
 * `useSetFarmSubscriptionMutation`).
 */
export function SubscriptionDatesDialog({
  visible,
  title,
  confirmLabel,
  loading,
  onConfirm,
  onCancel,
}: SubscriptionDatesDialogProps) {
  const { t } = useTranslation('admin');
  const theme = useTheme();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (visible) {
      setStartDate('');
      setEndDate('');
      setTouched(false);
    }
  }, [visible]);

  const isoDate = /^\d{4}-\d{2}-\d{2}$/;
  const startValid = isoDate.test(startDate);
  const endValid = isoDate.test(endDate);
  const rangeValid = startValid && endValid && endDate >= startDate;
  const valid = startValid && endValid && rangeValid;

  const startError =
    touched && startDate.length > 0 && !startValid ? t('farms.detail.dateFormatError') : undefined;
  const endError =
    touched && endDate.length > 0 && !endValid
      ? t('farms.detail.dateFormatError')
      : touched && startValid && endValid && !rangeValid
        ? t('farms.detail.dateRangeError')
        : undefined;

  const toIso = (d: Date): string => d.toISOString().slice(0, 10);
  const fillExpired = () => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setStartDate(toIso(oneYearAgo));
    setEndDate(toIso(yesterday));
    setTouched(true);
  };
  const fillActiveYear = () => {
    const today = new Date();
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    setStartDate(toIso(today));
    setEndDate(toIso(oneYearFromNow));
    setTouched(true);
  };

  return (
    <Modal visible={visible} onClose={onCancel} title={title} dismissable={!loading}>
      <View style={{ rowGap: theme.spacing.md }}>
        <View
          style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: theme.spacing.md, rowGap: 4 }}
        >
          <TextButton
            label={t('farms.detail.quickExpired')}
            onPress={fillExpired}
            disabled={loading}
          />
          <TextButton
            label={t('farms.detail.quickActiveYear')}
            onPress={fillActiveYear}
            disabled={loading}
          />
        </View>
        <Input
          label={t('farms.detail.startDateLabel')}
          placeholder="2026-09-01"
          hint={t('farms.detail.dateFormatHint')}
          error={startError}
          value={startDate}
          onChangeText={(v) => {
            setTouched(true);
            setStartDate(v);
          }}
          autoCorrect={false}
          keyboardType="numbers-and-punctuation"
        />
        <Input
          label={t('farms.detail.endDateLabel')}
          placeholder="2026-12-01"
          hint={t('farms.detail.dateFormatHint')}
          error={endError}
          value={endDate}
          onChangeText={(v) => {
            setTouched(true);
            setEndDate(v);
          }}
          autoCorrect={false}
          keyboardType="numbers-and-punctuation"
        />
        <View style={{ flexDirection: 'row', columnGap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <Button
              label={t('common.cancel')}
              variant="ghost"
              fullWidth
              onPress={onCancel}
              disabled={loading}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={confirmLabel}
              variant="primary"
              fullWidth
              onPress={() => onConfirm({ startDate, endDate })}
              loading={loading}
              disabled={loading || !valid}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
