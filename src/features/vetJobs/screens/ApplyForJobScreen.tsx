import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useForm, type FieldPath } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/actions';
import { Alert, useToast } from '@/components/feedback';
import { FormField } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { FileUploader, ImageUploader } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption, Label } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { StepProgress } from '../components';
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

const STEP_FIELDS: FieldPath<FormValues>[][] = [['fullName'], [], ['phone']];

/** Route `/(app)/vet-jobs/offers/[offerId]/apply` — "التقديم على الوظيفة". */
export default function ApplyForJobScreen() {
  const theme = useTheme();
  const { t } = useTranslation('vetJobs');
  const toast = useToast();
  const { offerId } = useLocalSearchParams<{ offerId: string }>();
  const apply = useApplyToVetJobOffer(offerId);
  const attachmentProvider = useVetJobAttachmentProvider();
  const [step, setStep] = useState(0);
  const totalSteps = 3;
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

  const { control, handleSubmit, trigger } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

  const goNext = async (): Promise<void> => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => Math.min(s + 1, totalSteps - 1));
  };
  const goBack = (): void => {
    if (step === 0) router.back();
    else setStep((s) => s - 1);
  };

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
      <AppHeader
        title={
          step === 0 ? t('form.personalInfoTitle') : step === 1 ? t('form.professionalInfoTitle') : t('form.cvStepTitle')
        }
        onBack={goBack}
        showBack
      />
      <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.sm }}>
        <StepProgress current={step} total={totalSteps} />
        <Caption style={{ marginTop: theme.spacing.xs }}>
          {t('form.step', { current: step + 1, total: totalSteps })}
        </Caption>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: theme.screenPadding, rowGap: theme.spacing.md }}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 ? (
          <>
            <FormField control={control} name="fullName" label={t('form.fullName')} />
            <FormField
              control={control}
              name="specialty"
              label={t('form.specialty')}
              placeholder={t('form.specialtyPlaceholder')}
            />
          </>
        ) : null}

        {step === 1 ? (
          <>
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
        ) : null}

        {step === 2 ? (
          <>
            <FormField control={control} name="phone" label={t('form.phone')} keyboardType="phone-pad" />
            <FormField
              control={control}
              name="email"
              label={t('form.offerContactEmail')}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={{ rowGap: theme.spacing.xs }}>
              <Label>{t('form.cv')}</Label>
              <FileUploader provider={attachmentProvider} onChange={(r) => setCvStorageKey(r?.storageKey ?? null)} />
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
        ) : null}
      </ScrollView>

      <View style={{ padding: theme.screenPadding, flexDirection: 'row', columnGap: theme.spacing.sm }}>
        {step < totalSteps - 1 ? (
          <Button label={t('form.next')} fullWidth onPress={goNext} />
        ) : (
          <Button
            label={apply.isPending ? t('form.submitting') : t('form.submit')}
            fullWidth
            loading={apply.isPending}
            disabled={apply.isPending}
            onPress={handleSubmit(onSubmit)}
          />
        )}
      </View>
    </SafeAreaScreen>
  );
}
