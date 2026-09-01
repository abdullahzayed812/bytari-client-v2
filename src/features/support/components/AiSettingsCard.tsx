import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card } from '@/components/content';
import { ErrorState, SkeletonText, useToast } from '@/components/feedback';
import { Switch } from '@/components/forms';
import { Caption } from '@/components/typography';
import { useTheme } from '@/theme';

import { useAiSettings, useUpdateAiSettings } from '../hooks';
import { supportErrorMessage } from '../validation/schemas';

/**
 * Admin-only AI on/off toggles for consultation & inquiry auto-replies
 * (`GET/PATCH /admin/ai-settings`, `ai.settings.manage`). Rendered inside the
 * Management Centre; the caller gates visibility.
 */
export function AiSettingsCard() {
  const theme = useTheme();
  const { t } = useTranslation('support');
  const toast = useToast();
  const q = useAiSettings();
  const update = useUpdateAiSettings();

  if (q.isLoading) {
    return (
      <Card variant="outlined" padding="md">
        <SkeletonText lines={2} />
      </Card>
    );
  }
  if (q.isError || !q.data) {
    return <ErrorState error={q.error} onRetry={() => void q.refetch()} />;
  }

  const patch = (field: 'consultationAiEnabled' | 'inquiryAiEnabled', value: boolean): void => {
    update.mutate(
      { [field]: value },
      {
        onError: (error) => toast.show({ tone: 'danger', message: supportErrorMessage(error, t) }),
      },
    );
  };

  return (
    <Card variant="outlined" padding="md">
      <Caption>{t('ai.intro')}</Caption>
      <View style={{ marginTop: theme.spacing.sm, rowGap: theme.spacing.sm }}>
        <Switch
          label={t('ai.consultation')}
          value={q.data.consultationAiEnabled}
          disabled={update.isPending}
          onValueChange={(v) => patch('consultationAiEnabled', v)}
        />
        <Switch
          label={t('ai.inquiry')}
          value={q.data.inquiryAiEnabled}
          disabled={update.isPending}
          onValueChange={(v) => patch('inquiryAiEnabled', v)}
        />
      </View>
    </Card>
  );
}
