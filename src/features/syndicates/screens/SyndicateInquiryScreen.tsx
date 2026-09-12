import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/actions';
import { Icon } from '@/components/content';
import { Alert, useToast } from '@/components/feedback';
import { FormField } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { ImageUploader } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption, Label } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { useCreateSyndicateSubmission, useSyndicateMediaProvider } from '../hooks';
import type { SyndicateRequestType } from '../types';

const MAX_ATTACHMENTS = 5;

interface FormValues {
  message: string;
}

/**
 * Route `/(app)/syndicates/[organizationId]/inquiry` — "إرسال استفسار"
 * (reference screenshot). Also reused for a REQUEST submission
 * (`?kind=REQUEST&requestType=...`) — same form shape, no screenshot shows a
 * separate request form.
 */
export default function SyndicateInquiryScreen() {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');
  const toast = useToast();
  const { organizationId, kind, requestType } = useLocalSearchParams<{
    organizationId: string;
    kind?: 'REQUEST' | 'INQUIRY';
    requestType?: SyndicateRequestType;
  }>();
  const isRequest = kind === 'REQUEST';
  const submit = useCreateSyndicateSubmission(organizationId);
  const imageProvider = useSyndicateMediaProvider('SUBMISSION_ATTACHMENT');
  const [attachmentKeys, setAttachmentKeys] = useState<string[]>([]);

  const schema = useMemo(
    () =>
      z.object({
        message: z.string().trim().min(1, t('inquiry.errors.message')).max(1000),
      }),
    [t],
  );
  const { control, handleSubmit, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    // Pre-filled so a test submission needs no typing — the field stays editable.
    defaultValues: { message: 'أرغب بالاستفسار عن متطلبات تجديد الهوية النقابية.' },
    mode: 'onTouched',
  });

  const onSubmit = (values: FormValues): void => {
    submit.mutate(
      {
        kind: isRequest ? 'REQUEST' : 'INQUIRY',
        requestType: isRequest ? requestType : undefined,
        message: values.message,
        attachmentStorageKeys: attachmentKeys,
      },
      {
        onSuccess: () => {
          toast.show({ message: isRequest ? t('request.success') : t('inquiry.success'), tone: 'success' });
          // Land on "طلباتي واستفساراتي" so the submission (and, later, the
          // syndicate's reply) is immediately easy to find.
          router.replace(Routes.syndicateMy);
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  const messageLength = watch('message')?.length ?? 0;
  const slots = Math.min(attachmentKeys.length + 1, MAX_ATTACHMENTS);

  return (
    <SafeAreaScreen>
      <AppHeader title={isRequest ? t('request.title') : t('inquiry.title')} showBack />
      <ScrollView
        contentContainerStyle={{ padding: theme.screenPadding, rowGap: theme.spacing.md }}
        keyboardShouldPersistTaps="handled"
      >
        {!isRequest ? <Alert tone="info" message={t('inquiry.infoNote')} /> : null}

        <FormField
          control={control}
          name="message"
          label={isRequest ? t('request.messageLabel') : t('inquiry.messageLabel')}
          placeholder={isRequest ? t('request.messagePlaceholder') : t('inquiry.messagePlaceholder')}
          multiline
          numberOfLines={5}
        />
        {!isRequest ? (
          <Caption color="textMuted">{t('inquiry.messageCounter', { count: messageLength })}</Caption>
        ) : null}

        {!isRequest ? (
          <View style={{ rowGap: theme.spacing.xs }}>
            <Label>{t('inquiry.attachmentsLabel')}</Label>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
              {Array.from({ length: slots }).map((_, i) => (
                <ImageUploader
                  key={i}
                  value={null}
                  provider={imageProvider}
                  shape="square"
                  size={80}
                  onChange={(r) =>
                    setAttachmentKeys((prev) => {
                      const next = [...prev];
                      if (r?.storageKey) next[i] = r.storageKey;
                      else next.splice(i, 1);
                      return next.filter(Boolean).slice(0, MAX_ATTACHMENTS);
                    })
                  }
                />
              ))}
            </View>
            <Caption color="textMuted">{t('inquiry.attachmentsHint')}</Caption>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', columnGap: theme.spacing.sm }}>
          <Icon name="shield-checkmark-outline" size="iconSm" color="textMuted" />
          <Caption color="textSecondary" style={{ flex: 1 }}>
            {t('inquiry.privacyNote')}
          </Caption>
        </View>

        {submit.isError ? <Alert tone="danger" message={apiErrorMessage(submit.error)} /> : null}
      </ScrollView>

      <View style={{ padding: theme.screenPadding }}>
        <Button
          label={submit.isPending ? t('inquiry.submitting') : isRequest ? t('request.submit') : t('inquiry.submit')}
          fullWidth
          loading={submit.isPending}
          disabled={submit.isPending}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </SafeAreaScreen>
  );
}
