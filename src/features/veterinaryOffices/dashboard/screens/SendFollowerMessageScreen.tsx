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
// Deep import (not the barrel) — keeps veterinaryOffices ↔ clinicDashboard acyclic.
import { useClinicDashboard } from '@/features/clinicDashboard/hooks';
import { useOrganization } from '@/features/organizations';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { isHttpUrl, normalizeLink } from '@/utils';

import { VeterinaryOfficeDashboardShell } from '../components';
import {
  useBroadcastImageProvider,
  useSendFollowerBroadcast,
  useVeterinaryOfficeDashboard,
} from '../hooks';

interface FormValues {
  title: string;
  body: string;
  linkUrl: string;
}

/** Route `/vet-office-dashboard/[organizationId]/broadcast` — "إرسال رسالة للمتابعين". */
export default function SendFollowerMessageScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryOfficeDashboard');
  const toast = useToast();
  const { organizationId, audience: audienceParam } = useLocalSearchParams<{
    organizationId: string;
    audience?: string;
  }>();
  const orgId = organizationId ?? '';
  // Reused by the Clinic Dashboard for both "للمتابعين" and "للمراجعين".
  const audience = audienceParam === 'CLINIC_VISITORS' ? 'CLINIC_VISITORS' : 'FOLLOWERS';
  const toVisitors = audience === 'CLINIC_VISITORS';

  const org = useOrganization(orgId);
  const canOperate =
    org.data?.status === 'ACTIVE' && org.data?.details.subscriptionStatus === 'ACTIVE';
  const isOffice = org.data?.type === 'VETERINARY_OFFICE';
  const officeSummary = useVeterinaryOfficeDashboard(orgId, { enabled: isOffice });
  const clinicSummary = useClinicDashboard(orgId, {
    enabled: org.data?.type === 'CLINIC' && !toVisitors,
  });
  const followersCount = isOffice
    ? officeSummary.data?.followersCount
    : clinicSummary.data?.followersCount;
  const send = useSendFollowerBroadcast(orgId);
  const imageProvider = useBroadcastImageProvider(orgId);
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
    send.mutate(
      {
        title: values.title.trim(),
        body: values.body.trim(),
        imageStorageKey,
        linkUrl: normalizeLink(values.linkUrl),
        ...(toVisitors ? { audience } : {}),
      },
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
        <AppHeader
          title={toVisitors ? t('broadcast.visitorsTitle') : t('broadcast.title')}
          showBack
        />

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
                {toVisitors ? '—' : (followersCount ?? 0)}
              </Text>
              <Caption>
                {toVisitors ? t('broadcast.visitorsLabel') : t('broadcast.followersLabel')}
              </Caption>
            </View>
            <Text style={{ flex: 1, marginStart: theme.spacing.lg }}>
              {toVisitors ? t('broadcast.visitorsIntro') : t('broadcast.intro')}
            </Text>
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
          <FormField
            control={control}
            name="linkUrl"
            label={t('broadcast.form.linkLabel')}
            placeholder="https://"
            keyboardType="url"
            autoCapitalize="none"
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
        {canOperate ? null : <Alert tone="warning" message={t('status.actionsDisabledNotice')} />}

        <Section spacing="giant">
          <Button
            label={t('broadcast.form.submit')}
            fullWidth
            loading={send.isPending}
            disabled={send.isPending || !canOperate}
            onPress={handleSubmit(onSubmit)}
          />
        </Section>
      </ScrollScreen>
    </VeterinaryOfficeDashboardShell>
  );
}
