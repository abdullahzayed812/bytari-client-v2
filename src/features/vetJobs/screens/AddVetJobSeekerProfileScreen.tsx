import { zodResolver } from '@hookform/resolvers/zod';
import { router, usePathname } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/actions';
import { Chip } from '@/components/content';
import { Alert, Loading, useToast } from '@/components/feedback';
import { FormField, Select } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { FileUploader, ImageUploader } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { IRAQ_GOVERNORATES } from '@/features/vetServices';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import {
  useCreateVetJobSeekerProfile,
  useMyVetJobSeekerProfile,
  useUpdateVetJobSeekerProfile,
  useVetJobAttachmentProvider,
} from '../hooks';
import {
  VET_JOB_EMPLOYMENT_TYPES,
  type CreateVetJobSeekerProfileInput,
  type VetJobEmploymentType,
} from '../types';

interface FormValues {
  specialty: string;
  qualifications: string;
  skills: string;
  headline: string;
  experienceYears: string;
  preferredEmploymentTypes: VetJobEmploymentType[];
  governorate: string;
  district: string;
  phone: string;
  email: string;
}

/** Pre-filled so a test submission needs no typing — every field stays editable. */
const EMPTY: FormValues = {
  specialty: 'طب وجراحة الحيوانات الصغيرة',
  qualifications: 'بكالوريوس طب بيطري',
  skills: 'الجراحة\nالتشخيص بالأشعة',
  headline: 'طبيب بيطري بخبرة في طب وجراحة الحيوانات الصغيرة.',
  experienceYears: '3',
  preferredEmploymentTypes: ['FULL_TIME'],
  governorate: 'بغداد',
  district: 'الكرادة',
  phone: '07709876543',
  email: 'vet@example.com',
};

function linesToList(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

/**
 * Routes `/(app)/vet-jobs/seekers/new` and `/(app)/vet-jobs/seekers/mine/edit`
 * — "إضافة طلب عمل" (reference screenshots 9-11). One shared form; editing
 * loads the veterinarian's existing profile first.
 */
export default function AddVetJobSeekerProfileScreen() {
  const theme = useTheme();
  const { t } = useTranslation('vetJobs');
  const toast = useToast();
  const isEdit = usePathname().endsWith('/edit');
  const existing = useMyVetJobSeekerProfile({ enabled: isEdit });
  const create = useCreateVetJobSeekerProfile();
  const update = useUpdateVetJobSeekerProfile();
  const attachmentProvider = useVetJobAttachmentProvider();
  const [cvStorageKey, setCvStorageKey] = useState<string | null>(null);
  const [photoStorageKey, setPhotoStorageKey] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        specialty: z.string().trim().min(1, t('form.errors.specialty')),
        qualifications: z.string().trim(),
        skills: z.string().trim(),
        headline: z.string().trim(),
        experienceYears: z.string().trim(),
        preferredEmploymentTypes: z.array(z.enum(VET_JOB_EMPLOYMENT_TYPES)),
        governorate: z.string().trim().min(1, t('form.errors.governorate')),
        district: z.string().trim(),
        phone: z.string().trim().min(5, t('form.errors.phone')),
        email: z.string().trim().email(t('form.errors.email')).or(z.literal('')),
      }),
    [t],
  );

  const { control, handleSubmit, watch, setValue, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

  useEffect(() => {
    const p = existing.data;
    if (!isEdit || !p) return;
    reset({
      specialty: p.specialty,
      qualifications: p.qualifications ?? '',
      skills: p.skills.join('\n'),
      headline: p.headline ?? '',
      experienceYears: String(p.experienceYears),
      preferredEmploymentTypes: p.preferredEmploymentTypes,
      governorate: p.governorate,
      district: p.district ?? '',
      phone: p.phone,
      email: p.email ?? '',
    });
    setCvStorageKey(null);
    setPhotoStorageKey(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing.data, isEdit]);

  const togglePreference = (v: VetJobEmploymentType): void => {
    const current = watch('preferredEmploymentTypes');
    setValue(
      'preferredEmploymentTypes',
      current.includes(v) ? current.filter((x) => x !== v) : [...current, v],
    );
  };

  const onSubmit = (values: FormValues): void => {
    const input: CreateVetJobSeekerProfileInput = {
      specialty: values.specialty,
      headline: values.headline || undefined,
      experienceYears: values.experienceYears ? Number(values.experienceYears) : undefined,
      governorate: values.governorate,
      district: values.district || undefined,
      qualifications: values.qualifications || undefined,
      skills: linesToList(values.skills),
      preferredEmploymentTypes: values.preferredEmploymentTypes,
      phone: values.phone,
      email: values.email || undefined,
      // `undefined` (field omitted) means "leave unchanged" on update — only a
      // freshly re-uploaded file should ever replace the existing one.
      ...(cvStorageKey ? { cvStorageKey } : {}),
      ...(photoStorageKey ? { photoStorageKey } : {}),
    };
    if (isEdit) {
      update.mutate(input, {
        onSuccess: () => {
          toast.show({ message: t('form.seekerSaved'), tone: 'success' });
          router.back();
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      });
    } else {
      create.mutate(input, {
        onSuccess: () => {
          toast.show({ message: t('form.seekerCreated'), tone: 'success' });
          router.replace(Routes.vetJobMy);
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      });
    }
  };

  const submitting = create.isPending || update.isPending;
  const submitError = create.error ?? update.error;

  if (isEdit && existing.isLoading) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('seeker.editProfile')} showBack />
        <Loading fill />
      </SafeAreaScreen>
    );
  }

  return (
    <SafeAreaScreen>
      <AppHeader title={isEdit ? t('seeker.editProfile') : t('seekers.addProfile')} showBack />

      <ScrollView
        contentContainerStyle={{ padding: theme.screenPadding, rowGap: theme.spacing.md }}
        keyboardShouldPersistTaps="handled"
      >
        {isEdit && existing.data?.status === 'REJECTED' && existing.data.rejectionReason ? (
          <Alert tone="danger" message={existing.data.rejectionReason} />
        ) : null}

        <>
          <Text variant="subtitle" weight="bold">
            {t('form.personalInfoTitle')}
          </Text>
          <FormField
            control={control}
            name="specialty"
            label={t('form.specialty')}
            placeholder={t('form.specialtyPlaceholder')}
          />
          <FormField
            control={control}
            name="qualifications"
            label={t('form.qualifications')}
            placeholder={t('form.qualificationsPlaceholder')}
          />
          <FormField
            control={control}
            name="skills"
            label={t('form.skills')}
            placeholder={t('form.skillsPlaceholder')}
            multiline
            numberOfLines={3}
          />
        </>

        <>
          <Text variant="subtitle" weight="bold" style={{ marginTop: theme.spacing.sm }}>
            {t('form.professionalInfoTitle')}
          </Text>
          <FormField
            control={control}
            name="headline"
            label={t('form.headline')}
            placeholder={t('form.headlinePlaceholder')}
            multiline
            numberOfLines={4}
          />
          <FormField
            control={control}
            name="experienceYears"
            label={t('form.experienceYears')}
            keyboardType="number-pad"
          />
          <View style={{ rowGap: theme.spacing.xs }}>
            <Label>{t('form.employmentTypePreference')}</Label>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
              {VET_JOB_EMPLOYMENT_TYPES.map((v) => (
                <Chip
                  key={v}
                  label={t(`employmentType.${v}`)}
                  selected={watch('preferredEmploymentTypes').includes(v)}
                  onPress={() => togglePreference(v)}
                />
              ))}
            </View>
          </View>
          <Controller
            control={control}
            name="governorate"
            render={({ field: { value, onChange }, fieldState }) => (
              <Select<string>
                label={t('form.governorate')}
                value={value || null}
                options={IRAQ_GOVERNORATES.map((g) => ({ value: g, label: g }))}
                onChange={onChange}
                error={fieldState.error?.message}
              />
            )}
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

          {submitError ? <Alert tone="danger" message={apiErrorMessage(submitError)} /> : null}
          <Alert tone="info" message={t('form.seekerReviewNote')} />
        </>
      </ScrollView>

      <View
        style={{ padding: theme.screenPadding, flexDirection: 'row', columnGap: theme.spacing.sm }}
      >
        <Button
          label={submitting ? t('form.submitting') : isEdit ? t('form.save') : t('form.submit')}
          fullWidth
          loading={submitting}
          disabled={submitting}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </SafeAreaScreen>
  );
}
