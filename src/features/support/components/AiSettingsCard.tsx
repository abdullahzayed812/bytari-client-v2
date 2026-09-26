import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card } from '@/components/content';
import { ErrorState, SkeletonText, useToast } from '@/components/feedback';
import { Switch } from '@/components/forms';
import { Caption, Label } from '@/components/typography';
import { useTheme } from '@/theme';

import { useAiSettings, useUpdateAiSettings } from '../hooks';
import { supportErrorMessage } from '../validation/schemas';

type AiField = 'consultationAiEnabled' | 'inquiryAiEnabled';

export interface AiSettingsCardProps {
  /** Show only one kind's switch (the consultation or inquiry management queue). */
  only?: AiField;
}

/**
 * Admin-only AI on/off toggles for consultation & inquiry auto-replies
 * (`GET/PATCH /admin/ai-settings`, `ai.settings.manage`). The flag is
 * enforced server-side (`SupportThreadService.maybeAiRespond` reads it before
 * every AI reply) — this is not a UI-only switch. Rendered at the top of the
 * consultation / inquiry management queues; the caller gates visibility.
 */
export function AiSettingsCard({ only }: AiSettingsCardProps = {}) {
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

  const isOn =
    only === undefined ? q.data.consultationAiEnabled || q.data.inquiryAiEnabled : q.data[only];

  const patch = (field: AiField, value: boolean): void => {
    update.mutate(
      { [field]: value },
      {
        onError: (error) => toast.show({ tone: 'danger', message: supportErrorMessage(error, t) }),
      },
    );
  };

  return (
    <Card variant="outlined" padding="md">
      <Label>{t('ai.title')}</Label>
      <Caption>{t('ai.intro')}</Caption>
      <View style={{ marginTop: theme.spacing.sm, rowGap: theme.spacing.sm }}>
        {only !== 'inquiryAiEnabled' ? (
          <Switch
            label={t('ai.consultation')}
            value={q.data.consultationAiEnabled}
            disabled={update.isPending}
            onValueChange={(v) => patch('consultationAiEnabled', v)}
          />
        ) : null}
        {only !== 'consultationAiEnabled' ? (
          <Switch
            label={t('ai.inquiry')}
            value={q.data.inquiryAiEnabled}
            disabled={update.isPending}
            onValueChange={(v) => patch('inquiryAiEnabled', v)}
          />
        ) : null}
        <Caption color={isOn ? 'success' : 'textMuted'}>
          {isOn ? t('ai.stateOn') : t('ai.stateOff')}
        </Caption>
      </View>
    </Card>
  );
}
