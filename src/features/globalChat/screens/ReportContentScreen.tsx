import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert, useToast } from '@/components/feedback';
import { Input, Radio } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Label } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { useSubmitReport } from '../hooks';
import { REPORT_REASONS, type ReportReason, type ReportTargetType } from '../types';

/** Route `/(app)/global-chat/report` — "الإبلاغ عن الرسالة" / "الإبلاغ عن الغرفة". */
export default function ReportContentScreen() {
  const theme = useTheme();
  const { t } = useTranslation('globalChat');
  const toast = useToast();
  const { targetType, targetId } = useLocalSearchParams<{
    targetType: ReportTargetType;
    targetId: string;
  }>();

  const submit = useSubmitReport();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');

  const onSubmit = (): void => {
    if (!reason || !targetType || !targetId) return;
    submit.mutate(
      { targetType, targetId, reason, details: details.trim() || undefined },
      {
        onSuccess: () => {
          toast.show({ tone: 'success', message: t('report.success') });
          router.back();
        },
        onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
      },
    );
  };

  return (
    <SafeAreaScreen>
      <AppHeader
        title={targetType === 'ROOM' ? t('report.titleRoom') : t('report.titleMessage')}
        showBack
      />
      <ScrollView
        contentContainerStyle={{ padding: theme.screenPadding, rowGap: theme.spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        {submit.isError ? <Alert tone="danger" message={apiErrorMessage(submit.error)} /> : null}

        <View style={{ rowGap: theme.spacing.md }}>
          <Label>{t('report.reasonLabel')}</Label>
          {REPORT_REASONS.map((r) => (
            <Radio
              key={r}
              label={t(`report.reason.${r}`)}
              checked={reason === r}
              onChange={() => setReason(r)}
            />
          ))}
        </View>

        <View style={{ rowGap: theme.spacing.xs }}>
          <Label>{t('report.detailsLabel')}</Label>
          <Input
            value={details}
            onChangeText={setDetails}
            placeholder={t('report.detailsPlaceholder')}
            multiline
            numberOfLines={4}
            maxLength={2000}
          />
        </View>

        <Button
          label={submit.isPending ? t('report.submitting') : t('report.submit')}
          fullWidth
          loading={submit.isPending}
          disabled={submit.isPending || !reason}
          onPress={onSubmit}
        />
      </ScrollView>
    </SafeAreaScreen>
  );
}
