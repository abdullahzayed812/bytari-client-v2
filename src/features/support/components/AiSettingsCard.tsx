import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Card } from '@/components/content';
import { ErrorState, SkeletonText, useToast } from '@/components/feedback';
import { Input, Switch } from '@/components/forms';
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
        <Caption>{t('ai.singleResponse')}</Caption>
        {only !== 'inquiryAiEnabled' ? (
          <InstructionEditor
            field="consultationAiInstruction"
            value={q.data.consultationAiInstruction ?? null}
          />
        ) : null}
        {only !== 'consultationAiEnabled' ? (
          <InstructionEditor
            field="inquiryAiInstruction"
            value={q.data.inquiryAiInstruction ?? null}
          />
        ) : null}
      </View>
    </Card>
  );
}

/** The Admin's fixed AI instruction for one kind (`PATCH /admin/ai-settings`). */
function InstructionEditor({
  field,
  value,
}: {
  field: 'consultationAiInstruction' | 'inquiryAiInstruction';
  value: string | null;
}) {
  const { t } = useTranslation('support');
  const toast = useToast();
  const update = useUpdateAiSettings();
  const [draft, setDraft] = useState(value ?? '');
  useEffect(() => setDraft(value ?? ''), [value]);
  const dirty = draft.trim() !== (value ?? '').trim();

  return (
    <View style={{ rowGap: 6 }}>
      <Input
        label={t('ai.instructionLabel')}
        placeholder={t('ai.instructionPlaceholder')}
        hint={t('ai.instructionHint')}
        value={draft}
        onChangeText={setDraft}
        multiline
        numberOfLines={4}
        maxLength={4000}
      />
      <Button
        label={t('ai.instructionSave')}
        size="sm"
        variant="outline"
        disabled={!dirty || update.isPending}
        loading={update.isPending}
        onPress={() =>
          update.mutate(
            { [field]: draft.trim() === '' ? null : draft.trim() },
            {
              onSuccess: () => toast.show({ tone: 'success', message: t('ai.instructionSaved') }),
              onError: (error) =>
                toast.show({ tone: 'danger', message: supportErrorMessage(error, t) }),
            },
          )
        }
      />
    </View>
  );
}
