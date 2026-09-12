import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/actions';
import { Chip } from '@/components/content';
import { Alert, useToast } from '@/components/feedback';
import { FormField } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { ImageUploader } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption, Label } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { useCreateSyndicateAnnouncement, useSyndicateMediaProvider } from '../hooks';
import { SYNDICATE_ANNOUNCEMENT_TYPES, type SyndicateAnnouncementType } from '../types';

interface FormValues {
  type: SyndicateAnnouncementType;
  title: string;
  body: string;
}

/** Route `/(app)/syndicates/[organizationId]/announcements/new` — "إضافة إعلان" (supervisor/admin only). */
export default function CreateSyndicateAnnouncementScreen() {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const create = useCreateSyndicateAnnouncement(organizationId);
  const imageProvider = useSyndicateMediaProvider('ANNOUNCEMENT_IMAGE');
  const [imageStorageKey, setImageStorageKey] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        type: z.enum(SYNDICATE_ANNOUNCEMENT_TYPES),
        title: z.string().trim().min(3, t('announcements.form.errors.title')),
        body: z.string().trim().min(3, t('announcements.form.errors.body')),
      }),
    [t],
  );
  const { control, handleSubmit, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    // Pre-filled so a test submission needs no typing — every field stays editable.
    defaultValues: {
      type: 'ANNOUNCEMENT',
      title: 'اجتماع الهيئة العامة العادي',
      body: 'ندعو الأعضاء الكرام لحضور الاجتماع العام في الموعد المحدد لمناقشة جدول الأعمال.',
    },
    mode: 'onTouched',
  });

  const onSubmit = (values: FormValues): void => {
    create.mutate(
      { ...values, imageStorageKey },
      {
        onSuccess: () => {
          toast.show({ message: t('announcements.form.created'), tone: 'success' });
          router.back();
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  return (
    <SafeAreaScreen>
      <AppHeader title={t('announcements.addAnnouncement')} showBack />
      <ScrollView contentContainerStyle={{ padding: theme.screenPadding, rowGap: theme.spacing.md }} keyboardShouldPersistTaps="handled">
        <View style={{ rowGap: theme.spacing.xs }}>
          <Label>{t('announcements.form.type')}</Label>
          <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
            {SYNDICATE_ANNOUNCEMENT_TYPES.map((v) => (
              <Chip
                key={v}
                label={t(`type.${v}`)}
                selected={watch('type') === v}
                onPress={() => setValue('type', v, { shouldValidate: true })}
              />
            ))}
          </View>
        </View>

        <FormField control={control} name="title" label={t('announcements.form.title')} placeholder={t('announcements.form.titlePlaceholder')} />
        <FormField
          control={control}
          name="body"
          label={t('announcements.form.body')}
          placeholder={t('announcements.form.bodyPlaceholder')}
          multiline
          numberOfLines={5}
        />

        <View style={{ rowGap: theme.spacing.xs }}>
          <Label>{t('announcements.form.image')}</Label>
          <ImageUploader value={null} provider={imageProvider} shape="square" size={140} onChange={(r) => setImageStorageKey(r?.storageKey ?? null)} />
          <Caption>{t('announcements.form.imageHint')}</Caption>
        </View>

        {create.isError ? <Alert tone="danger" message={apiErrorMessage(create.error)} /> : null}
      </ScrollView>

      <View style={{ padding: theme.screenPadding }}>
        <Button
          label={create.isPending ? t('announcements.form.submitting') : t('announcements.form.submit')}
          fullWidth
          loading={create.isPending}
          disabled={create.isPending}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </SafeAreaScreen>
  );
}
