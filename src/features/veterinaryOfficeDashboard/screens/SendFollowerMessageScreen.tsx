import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/actions';
import { Alert, useToast } from '@/components/feedback';
import { FormField } from '@/components/forms';
import { ScrollScreen, Section } from '@/components/layout';
import { ImageUploader } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { VeterinaryOfficeDashboardShell } from '../components';
import { useBroadcastImageProvider, useSendFollowerBroadcast, useVeterinaryOfficeDashboard } from '../hooks';

interface FormValues {
  title: string;
  body: string;
}

/** Route `/vet-office-dashboard/[organizationId]/broadcast` — "إرسال رسالة للمتابعين". */
export default function SendFollowerMessageScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryOfficeDashboard');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const summary = useVeterinaryOfficeDashboard(orgId);
  const send = useSendFollowerBroadcast(orgId);
  const imageProvider = useBroadcastImageProvider(orgId);
  const [imageStorageKey, setImageStorageKey] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        title: z.string().trim().min(1, t('broadcast.errors.title')).max(100),
        body: z.string().trim().min(1, t('broadcast.errors.body')).max(1000),
      }),
    [t],
  );
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', body: '' },
    mode: 'onTouched',
  });

  const onSubmit = (values: FormValues): void => {
    send.mutate(
      { title: values.title.trim(), body: values.body.trim(), imageStorageKey },
      {
        onSuccess: () => {
          toast.show({ message: t('broadcast.sent'), tone: 'success' });
          router.back();
        },
        onError: (error) => toast.show({ message: apiErrorMessage(error), tone: 'danger' }),
      },
    );
  };

  return (
    <VeterinaryOfficeDashboardShell organizationId={orgId} active="home">
      <ScrollScreen edges={[]}>
        <AppHeader title={t('broadcast.title')} showBack />

      <Section spacing="lg">
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: theme.spacing.lg,
            borderRadius: theme.radius.xl,
            backgroundColor: theme.colors.primarySoft,
          }}
        >
          <View style={{ alignItems: 'flex-start' }}>
            <Text variant="heading" color="primary">
              {summary.data?.followersCount ?? 0}
            </Text>
            <Caption>{t('broadcast.followersLabel')}</Caption>
          </View>
          <Text style={{ flex: 1, marginStart: theme.spacing.lg }}>{t('broadcast.intro')}</Text>
        </View>
      </Section>

      <Section spacing="lg">
        <FormField
          control={control}
          name="title"
          label={t('broadcast.form.titleLabel')}
          placeholder={t('broadcast.form.titlePlaceholder')}
          maxLength={100}
        />
      </Section>

      <Section spacing="lg">
        <FormField
          control={control}
          name="body"
          label={t('broadcast.form.bodyLabel')}
          placeholder={t('broadcast.form.bodyPlaceholder')}
          multiline
          numberOfLines={6}
          maxLength={1000}
        />
      </Section>

      <Section spacing="lg">
        <Label>{t('broadcast.form.imageLabel')}</Label>
        <ImageUploader
          value={null}
          provider={imageProvider}
          shape="square"
          size={140}
          onChange={(r) => setImageStorageKey(r?.storageKey ?? null)}
        />
        <Caption>{t('broadcast.form.imageHint')}</Caption>
      </Section>

      {send.isError ? <Alert tone="danger" message={apiErrorMessage(send.error)} /> : null}

      <Section spacing="giant">
        <Button
          label={t('broadcast.form.submit')}
          fullWidth
          loading={send.isPending}
          disabled={send.isPending}
          onPress={handleSubmit(onSubmit)}
        />
      </Section>
      </ScrollScreen>
    </VeterinaryOfficeDashboardShell>
  );
}
