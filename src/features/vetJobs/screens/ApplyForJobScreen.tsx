import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/actions';
import { Alert, useToast } from '@/components/feedback';
import { FormField } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { FileUploader, ImageUploader } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { useApplyToVetJobOffer, useVetJobAttachmentProvider } from '../hooks';
import type { CreateVetJobApplicationInput } from '../types';

interface FormValues {
  fullName: string;
  specialty: string;
  qualifications: string;
  experienceYears: string;
  phone: string;
  email: string;
  coverNote: string;
}

/** Pre-filled so a test submission needs no typing — every field stays editable. */
const EMPTY: FormValues = {
  fullName: 'د. أحمد علي',
  specialty: 'طب وجراحة الحيوانات الصغيرة',
  qualifications: 'بكالوريوس طب بيطري',
  experienceYears: '3',
  phone: '07701112233',
  email: 'applicant@example.com',
  coverNote: 'أرغب بالانضمام لفريقكم وأمتلك خبرة مناسبة لهذه الوظيفة.',
};

/** Route `/(app)/vet-jobs/offers/[offerId]/apply` — "التقديم على الوظيفة". */
export default function ApplyForJobScreen() {
  const theme = useTheme();
  const { t } = useTranslation('vetJobs');
  const toast = useToast();
  const { offerId } = useLocalSearchParams<{ offerId: string }>();
  const apply = useApplyToVetJobOffer(offerId);
  const attachmentProvider = useVetJobAttachmentProvider();
  const [cvStorageKey, setCvStorageKey] = useState<string | null>(null);
  const [photoStorageKey, setPhotoStorageKey] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        fullName: z.string().trim().min(2, t('form.errors.fullName')),
        specialty: z.string().trim(),
        qualifications: z.string().trim(),
        experienceYears: z.string().trim(),
        phone: z.string().trim().min(5, t('form.errors.phone')),
        email: z.string().trim().email(t('form.errors.email')).or(z.literal('')),
        coverNote: z.string().trim(),
      }),
    [t],
  );

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

  const onSubmit = (values: FormValues): void => {
    const input: CreateVetJobApplicationInput = {
      fullName: values.fullName,
      phone: values.phone,
      email: values.email || undefined,
      specialty: values.specialty || undefined,
      experienceYears: values.experienceYears ? Number(values.experienceYears) : undefined,
      qualifications: values.qualifications || undefined,
      coverNote: values.coverNote || undefined,
      cvStorageKey,
      photoStorageKey,
    };
    apply.mutate(input, {
      onSuccess: () => {
        toast.show({ message: t('form.applySubmitted'), tone: 'success' });
        router.replace(Routes.vetJobMy);
      },
      onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
    });
  };

  return (
    <SafeAreaScreen>
      <AppHeader title={t('offer.apply')} showBack />

      <ScrollView
        contentContainerStyle={{ padding: theme.screenPadding, rowGap: theme.spacing.md }}
        keyboardShouldPersistTaps="handled"
      >
        <>
          <Text variant="subtitle" weight="bold">
            {t('form.personalInfoTitle')}
          </Text>
          <FormField control={control} name="fullName" label={t('form.fullName')} />
          <FormField
            control={control}
            name="specialty"
            label={t('form.specialty')}
            placeholder={t('form.specialtyPlaceholder')}
          />
        </>

        <>
          <Text variant="subtitle" weight="bold" style={{ marginTop: theme.spacing.sm }}>
            {t('form.professionalInfoTitle')}
          </Text>
          <FormField
            control={control}
            name="qualifications"
            label={t('form.qualifications')}
            placeholder={t('form.qualificationsPlaceholder')}
          />
          <FormField
            control={control}
            name="experienceYears"
            label={t('form.experienceYears')}
            keyboardType="number-pad"
          />
          <FormField
            control={control}
            name="coverNote"
            label={t('form.coverNote')}
            placeholder={t('form.coverNotePlaceholder')}
            multiline
            numberOfLines={4}
          />
        </>

        <>
          <Text variant="subtitle" weight="bold" style={{ marginTop: theme.spacing.sm }}>
            {t('form.cvStepTitle')}
          </Text>
          <FormField
            control={control}
            name="phone"
            label={t('form.phone')}
            keyboardType="phone-pad"
          />
          <FormField
            control={control}
            name="email"
            label={t('form.offerContactEmail')}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={{ rowGap: theme.spacing.xs }}>
            <Label>{t('form.cv')}</Label>
            <FileUploader
              provider={attachmentProvider}
              onChange={(r) => setCvStorageKey(r?.storageKey ?? null)}
            />
            <Caption>{t('form.cvHint')}</Caption>
          </View>

          <View style={{ rowGap: theme.spacing.xs }}>
            <Label>{t('form.photo')}</Label>
            <ImageUploader
              value={null}
              provider={attachmentProvider}
              shape="square"
              size={120}
              onChange={(r) => setPhotoStorageKey(r?.storageKey ?? null)}
            />
            <Caption>{t('form.photoHint')}</Caption>
          </View>

          {apply.isError ? <Alert tone="danger" message={apiErrorMessage(apply.error)} /> : null}
          <Alert tone="info" message={t('form.applyReviewNote')} />
        </>
      </ScrollView>

      <View
        style={{ padding: theme.screenPadding, flexDirection: 'row', columnGap: theme.spacing.sm }}
      >
        <Button
          label={apply.isPending ? t('form.submitting') : t('form.submit')}
          fullWidth
          loading={apply.isPending}
          disabled={apply.isPending}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </SafeAreaScreen>
  );
}
