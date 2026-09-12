import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, type FieldPath } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/actions';
import { Alert, Loading, useToast } from '@/components/feedback';
import { FormField, Select, Switch } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Label } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { IRAQ_GOVERNORATES } from '@/features/vetServices';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { DateField, StepProgress } from '../components';
import { useCreateVetJobOffer, useUpdateVetJobOffer, useVetJobOffer } from '../hooks';
import {
  VET_JOB_EMPLOYMENT_TYPES,
  type CreateVetJobOfferInput,
  type VetJobEmploymentType,
  type VetJobOffer,
} from '../types';

interface FormValues {
  organizationName: string;
  governorate: string;
  district: string;
  salaryAmount: string;
  salaryNegotiable: boolean;
  benefits: string;
  title: string;
  employmentType: VetJobEmploymentType | null;
  experienceYearsRequired: string;
  qualifications: string;
  description: string;
  responsibilities: string;
  requirements: string;
  contactPhone: string;
  contactEmail: string;
  applicationDeadline: string | null;
}

/** Pre-filled so a test submission needs no typing — every field stays editable. */
const EMPTY: FormValues = {
  organizationName: 'مركز الحياة البيطري',
  governorate: 'بغداد',
  district: 'الكرادة',
  salaryAmount: '750000',
  salaryNegotiable: false,
  benefits: 'تأمين صحي\nمكافأة سنوية',
  title: 'طبيب بيطري عام',
  employmentType: 'FULL_TIME',
  experienceYearsRequired: '2',
  qualifications: 'بكالوريوس طب بيطري',
  description: 'مطلوب طبيب بيطري عام للعمل في عيادتنا ضمن فريق متكامل.',
  responsibilities: 'الكشف على الحيوانات\nمتابعة الحالات المرضية',
  requirements: 'خبرة لا تقل عن سنتين\nإجازة مزاولة سارية',
  contactPhone: '07701234567',
  contactEmail: 'jobs@example.com',
  applicationDeadline: null,
};

const STEP_FIELDS: FieldPath<FormValues>[][] = [
  ['organizationName', 'governorate'],
  ['salaryAmount'],
  ['title', 'employmentType', 'description', 'contactPhone'],
];

const STEP_TITLE_KEYS = [
  'form.offerStep1Title',
  'form.offerStep2Title',
  'form.offerStep3Title',
] as const;

function linesToList(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

/**
 * Routes `/(app)/vet-jobs/offers/new` and `/(app)/vet-jobs/offers/[offerId]/edit`
 * — "إضافة إعلان وظيفة" (reference screenshots 6-8). One shared form; editing
 * loads the owner's existing offer first (`getMyOffer`).
 */
export default function AddVetJobOfferScreen() {
  const theme = useTheme();
  const { t } = useTranslation('vetJobs');
  const toast = useToast();
  const { offerId } = useLocalSearchParams<{ offerId?: string }>();
  const isEdit = Boolean(offerId);
  const existing = useVetJobOffer(offerId, { manage: true });
  const create = useCreateVetJobOffer();
  const update = useUpdateVetJobOffer();
  const [step, setStep] = useState(0);
  const totalSteps = 3;

  const schema = useMemo(
    () =>
      z.object({
        organizationName: z.string().trim().min(1, t('form.errors.organizationName')),
        governorate: z.string().trim().min(1, t('form.errors.governorate')),
        district: z.string().trim(),
        salaryAmount: z.string().trim(),
        salaryNegotiable: z.boolean(),
        benefits: z.string().trim(),
        title: z.string().trim().min(3, t('form.errors.title')),
        employmentType: z.enum(VET_JOB_EMPLOYMENT_TYPES, { message: t('form.errors.required') }),
        experienceYearsRequired: z.string().trim(),
        qualifications: z.string().trim(),
        description: z.string().trim().min(10, t('form.errors.description')),
        responsibilities: z.string().trim(),
        requirements: z.string().trim(),
        contactPhone: z.string().trim().min(5, t('form.errors.phone')),
        contactEmail: z.string().trim().email(t('form.errors.email')).or(z.literal('')),
        applicationDeadline: z.string().nullable(),
      }),
    [t],
  );

  const { control, handleSubmit, trigger, watch, setValue, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

  useEffect(() => {
    const o = existing.data as VetJobOffer | undefined;
    if (!isEdit || !o) return;
    reset({
      organizationName: o.organizationName,
      governorate: o.governorate,
      district: o.district ?? '',
      salaryAmount: o.salaryAmount ?? '',
      salaryNegotiable: o.salaryNegotiable,
      benefits: o.benefits.join('\n'),
      title: o.title,
      employmentType: o.employmentType,
      experienceYearsRequired: o.experienceYearsRequired?.toString() ?? '',
      qualifications: o.qualifications ?? '',
      description: o.description,
      responsibilities: o.responsibilities.join('\n'),
      requirements: o.requirements.join('\n'),
      contactPhone: o.contactPhone,
      contactEmail: o.contactEmail ?? '',
      applicationDeadline: o.applicationDeadline,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing.data, isEdit]);

  const goNext = async (): Promise<void> => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => Math.min(s + 1, totalSteps - 1));
  };
  const goBack = (): void => {
    if (step === 0) router.back();
    else setStep((s) => s - 1);
  };

  const onSubmit = (values: FormValues): void => {
    const input: CreateVetJobOfferInput = {
      organizationName: values.organizationName,
      title: values.title,
      employmentType: values.employmentType as VetJobEmploymentType,
      governorate: values.governorate,
      district: values.district || undefined,
      salaryAmount: values.salaryAmount || undefined,
      salaryNegotiable: values.salaryNegotiable,
      experienceYearsRequired: values.experienceYearsRequired
        ? Number(values.experienceYearsRequired)
        : undefined,
      qualifications: values.qualifications || undefined,
      description: values.description,
      responsibilities: linesToList(values.responsibilities),
      requirements: linesToList(values.requirements),
      benefits: linesToList(values.benefits),
      contactPhone: values.contactPhone,
      contactEmail: values.contactEmail || undefined,
      applicationDeadline: values.applicationDeadline ?? undefined,
    };
    if (isEdit && offerId) {
      update.mutate(
        { id: offerId, input },
        {
          onSuccess: () => {
            toast.show({ message: t('form.offerSaved'), tone: 'success' });
            router.back();
          },
          onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
        },
      );
    } else {
      create.mutate(input, {
        onSuccess: () => {
          toast.show({ message: t('form.offerCreated'), tone: 'success' });
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
        <AppHeader title={t('offer.editOffer')} showBack />
        <Loading fill />
      </SafeAreaScreen>
    );
  }

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t(STEP_TITLE_KEYS[step] ?? STEP_TITLE_KEYS[0])}
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
        {step === 0 && isEdit && (existing.data as VetJobOffer | undefined)?.status === 'REJECTED' ? (
          <Alert
            tone="danger"
            message={(existing.data as VetJobOffer | undefined)?.rejectionReason ?? ''}
          />
        ) : null}

        {step === 0 ? (
          <>
            <FormField
              control={control}
              name="organizationName"
              label={t('form.offerOrganizationName')}
              placeholder={t('form.offerOrganizationNamePlaceholder')}
            />
            <Controller
              control={control}
              name="governorate"
              render={({ field: { value, onChange }, fieldState }) => (
                <Select<string>
                  label={t('form.offerGovernorate')}
                  placeholder={t('form.offerGovernoratePlaceholder')}
                  value={value || null}
                  options={IRAQ_GOVERNORATES.map((g) => ({ value: g, label: g }))}
                  onChange={onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            <FormField control={control} name="district" label={t('form.offerDistrict')} />
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Label>{t('form.offerSalary')}</Label>
            <Controller
              control={control}
              name="salaryNegotiable"
              render={({ field: { value, onChange } }) => (
                <Switch label={t('form.offerSalaryNegotiable')} value={value} onValueChange={onChange} />
              )}
            />
            {!watch('salaryNegotiable') ? (
              <FormField
                control={control}
                name="salaryAmount"
                label={t('form.offerSalaryAmount')}
                keyboardType="decimal-pad"
              />
            ) : null}
            <FormField
              control={control}
              name="benefits"
              label={t('form.offerBenefits')}
              placeholder={t('form.offerBenefitsPlaceholder')}
              multiline
              numberOfLines={4}
            />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <FormField
              control={control}
              name="title"
              label={t('form.offerTitle')}
              placeholder={t('form.offerTitlePlaceholder')}
            />
            <Controller
              control={control}
              name="employmentType"
              render={({ field: { value, onChange }, fieldState }) => (
                <Select<VetJobEmploymentType>
                  label={t('form.offerEmploymentType')}
                  value={value}
                  options={VET_JOB_EMPLOYMENT_TYPES.map((v) => ({
                    value: v,
                    label: t(`employmentType.${v}`),
                  }))}
                  onChange={(v) => setValue('employmentType', v, { shouldValidate: true })}
                  error={fieldState.error?.message}
                />
              )}
            />
            <FormField
              control={control}
              name="experienceYearsRequired"
              label={t('form.offerExperienceYears')}
              keyboardType="number-pad"
            />
            <FormField control={control} name="qualifications" label={t('form.offerQualifications')} />
            <FormField
              control={control}
              name="description"
              label={t('form.offerDescription')}
              placeholder={t('form.offerDescriptionPlaceholder')}
              multiline
              numberOfLines={4}
            />
            <FormField
              control={control}
              name="responsibilities"
              label={t('form.offerResponsibilities')}
              placeholder={t('form.offerResponsibilitiesPlaceholder')}
              multiline
              numberOfLines={3}
            />
            <FormField
              control={control}
              name="requirements"
              label={t('form.offerRequirements')}
              placeholder={t('form.offerRequirementsPlaceholder')}
              multiline
              numberOfLines={3}
            />
            <FormField
              control={control}
              name="contactPhone"
              label={t('form.offerContactPhone')}
              keyboardType="phone-pad"
            />
            <FormField
              control={control}
              name="contactEmail"
              label={t('form.offerContactEmail')}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Controller
              control={control}
              name="applicationDeadline"
              render={({ field: { value, onChange } }) => (
                <DateField
                  label={t('form.offerApplicationDeadline')}
                  value={value}
                  onChange={onChange}
                  placeholder={t('form.offerApplicationDeadline')}
                  minimumDate={new Date()}
                  accessibilityLabel={t('form.offerApplicationDeadline')}
                />
              )}
            />

            {submitError ? <Alert tone="danger" message={apiErrorMessage(submitError)} /> : null}
            <Alert tone="info" message={t('form.offerReviewNote')} />
          </>
        ) : null}
      </ScrollView>

      <View style={{ padding: theme.screenPadding, flexDirection: 'row', columnGap: theme.spacing.sm }}>
        {step < totalSteps - 1 ? (
          <Button label={t('form.next')} fullWidth onPress={goNext} />
        ) : (
          <Button
            label={submitting ? t('form.submitting') : isEdit ? t('form.save') : t('form.submit')}
            fullWidth
            loading={submitting}
            disabled={submitting}
            onPress={handleSubmit(onSubmit)}
          />
        )}
      </View>
    </SafeAreaScreen>
  );
}
