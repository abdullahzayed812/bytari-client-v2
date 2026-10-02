import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/actions';
import { Alert, useToast } from '@/components/feedback';
import { FormField } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { ImageUploader } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption, Label } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { isHttpUrl, newRequestId, normalizeLink } from '@/utils';

import {
  useMembersBroadcastImageProvider,
  useMessageSyndicateMembers,
  useSyndicate,
} from '../hooks';

interface FormValues {
  title: string;
  body: string;
  linkUrl: string;
}

/**
 * Route `/(app)/syndicates/[organizationId]/members/broadcast` — "رسالة إلى
 * الأعضاء". Sent as a notification to THIS syndicate's registered members only
 * (`syndicate.member.message`). One `clientRequestId` per screen visit makes a
 * double tap / retry idempotent server-side.
 */
export default function SyndicateMembersBroadcastScreen() {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const syndicate = useSyndicate(organizationId);
  const send = useMessageSyndicateMembers(organizationId ?? '');
  const requestId = useRef(newRequestId());
  const imageProvider = useMembersBroadcastImageProvider(organizationId ?? '');
  const [imageStorageKey, setImageStorageKey] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        title: z.string().trim().min(1, t('broadcast.errors.title')).max(100),
        body: z.string().trim().min(1, t('broadcast.errors.body')).max(1000),
        linkUrl: z
          .string()
          .trim()
          .max(1000)
          .refine((v) => v.length === 0 || isHttpUrl(v), t('broadcast.errors.link')),
      }),
    [t],
  );
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', body: '', linkUrl: '' },
    mode: 'onTouched',
  });

  const onSubmit = (values: FormValues): void => {
    if (send.isPending) return;
    send.mutate(
      {
        title: values.title,
        body: values.body,
        clientRequestId: requestId.current,
        imageStorageKey,
        linkUrl: normalizeLink(values.linkUrl),
      },
      {
        onSuccess: (r) => {
          toast.show({
            message: t('broadcast.sent', { count: r.recipientCount }),
            tone: 'success',
          });
          router.back();
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  return (
    <SafeAreaScreen>
      <AppHeader title={t('broadcast.title')} showBack />
      <ScrollView
        contentContainerStyle={{ padding: theme.screenPadding, rowGap: theme.spacing.md }}
        keyboardShouldPersistTaps="handled"
      >
        <Caption>{t('broadcast.hint', { count: syndicate.data?.membersCount ?? 0 })}</Caption>
        <FormField
          control={control}
          name="title"
          label={t('broadcast.titleLabel')}
          placeholder={t('broadcast.titlePlaceholder')}
        />
        <FormField
          control={control}
          name="body"
          label={t('broadcast.bodyLabel')}
          placeholder={t('broadcast.bodyPlaceholder')}
          multiline
          numberOfLines={6}
        />
        <FormField
          control={control}
          name="linkUrl"
          label={t('broadcast.linkLabel')}
          placeholder="https://"
          keyboardType="url"
          autoCapitalize="none"
        />
        <Label>{t('broadcast.imageLabel')}</Label>
        <ImageUploader
          value={null}
          provider={imageProvider}
          shape="square"
          size={140}
          onChange={(r) => setImageStorageKey(r?.storageKey ?? null)}
        />
        {send.isError ? <Alert tone="danger" message={apiErrorMessage(send.error)} /> : null}
      </ScrollView>
      <View style={{ padding: theme.screenPadding }}>
        <Button
          label={send.isPending ? t('broadcast.submitting') : t('broadcast.submit')}
          leftIcon="send-outline"
          fullWidth
          loading={send.isPending}
          disabled={send.isPending}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </SafeAreaScreen>
  );
}
