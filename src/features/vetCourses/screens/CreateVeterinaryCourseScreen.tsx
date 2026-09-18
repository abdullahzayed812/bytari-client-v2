import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, type FieldPath } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/actions';
import { Chip } from '@/components/content';
import { Alert, Loading, useToast } from '@/components/feedback';
import { FormField, Select } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { ImageUploader } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption, Label } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { DateTimeField } from '@/features/clinicAppointments';
import { DateField, StepProgress } from '@/features/vetJobs';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { useCreateVetCourse, useUpdateVetCourse, useVetCourse, useVetCourseImageProvider } from '../hooks';
import {
  VET_COURSE_LOCATION_MODES,
  VET_COURSE_TYPES,
  type CreateVetCourseInput,
  type VetCourse,
  type VetCourseLocationMode,
  type VetCourseType,
} from '../types';

interface FormValues {
  type: VetCourseType | null;
  title: string;
  description: string;
  organizingBody: string;
  instructorName: string;
  instructorSpecialty: string;
  startDate: string | null;
  endDate: string | null;
  startTime: string;
  endTime: string;
  timezoneNote: string;
  locationMode: VetCourseLocationMode | null;
  locationDetails: string;
  registrationDeadline: string | null;
  capacity: string;
  price: string;
  topics: string;
}

/** `YYYY-MM-DD`, `n` days from today — used only to seed the default form values below. */
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Pre-filled so a test submission needs no typing — every field stays editable. */
const EMPTY: FormValues = {
  type: 'COURSE',
  title: 'أساسيات التغذية في الحيوانات الأليفة',
  description: 'دورة تدريبية شاملة حول أساسيات التغذية السليمة للحيوانات الأليفة.',
  organizingBody: 'جمعية الأطباء البيطريين العراقية',
  instructorName: 'د. أحمد علي البياتي',
  instructorSpecialty: 'التغذية والتغذية السريرية',
  startDate: daysFromNow(14),
  endDate: daysFromNow(16),
  startTime: '09:00',
  endTime: '17:00',
  timezoneNote: 'بتوقيت بغداد',
  locationMode: 'ONLINE',
  locationDetails: 'أونلاين عبر Zoom',
  registrationDeadline: daysFromNow(10),
  capacity: '50',
  price: '',
  topics: 'المفاهيم الأساسية في تغذية الحيوانات\nالاحتياجات الغذائية حسب العمر',
};

const STEP_FIELDS: FieldPath<FormValues>[][] = [
  ['type', 'title', 'description', 'organizingBody', 'instructorName'],
  ['startDate', 'endDate', 'locationMode', 'locationDetails'],
  [],
];

const STEP_TITLE_KEYS = ['form.step1Title', 'form.step2Title', 'form.step3Title'] as const;

function linesToList(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

function timeToDate(hhmm: string): Date {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function dateToTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Routes `/(app)/vet-courses/new` and `/(app)/vet-courses/[courseId]/edit` —
 * one shared multi-step form for a COURSE / SEMINAR / WORKSHOP, with `type`
 * as a form field rather than three separate creation screens. Editing loads
 * the creator's existing course first (`getMyCourse`).
 */
export default function CreateVeterinaryCourseScreen() {
  const theme = useTheme();
  const { t } = useTranslation('vetCourses');
  const toast = useToast();
  const { courseId } = useLocalSearchParams<{ courseId?: string }>();
  const isEdit = Boolean(courseId);
  const existing = useVetCourse(courseId, { manage: true });
  const create = useCreateVetCourse();
  const update = useUpdateVetCourse();
  const imageProvider = useVetCourseImageProvider();
  const [step, setStep] = useState(0);
  const totalSteps = 3;
  const [coverImageStorageKey, setCoverImageStorageKey] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z
        .object({
          type: z.enum(VET_COURSE_TYPES, { message: t('form.errors.required') }),
          title: z.string().trim().min(3, t('form.errors.title')),
          description: z.string().trim().min(10, t('form.errors.description')),
          organizingBody: z.string().trim().min(1, t('form.errors.organizingBody')),
          instructorName: z.string().trim().min(1, t('form.errors.instructorName')),
          instructorSpecialty: z.string().trim(),
          startDate: z.string({ message: t('form.errors.required') }).nullable(),
          endDate: z.string({ message: t('form.errors.required') }).nullable(),
          startTime: z.string().trim(),
          endTime: z.string().trim(),
          timezoneNote: z.string().trim(),
          locationMode: z.enum(VET_COURSE_LOCATION_MODES, { message: t('form.errors.required') }),
          locationDetails: z.string().trim().min(1, t('form.errors.locationDetails')),
          registrationDeadline: z.string().nullable(),
          capacity: z.string().trim(),
          price: z.string().trim(),
          topics: z.string().trim(),
        })
        .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
          message: t('form.errors.dates'),
          path: ['endDate'],
        }),
    [t],
  );

  const { control, handleSubmit, trigger, setValue, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

  useEffect(() => {
    const c = existing.data as VetCourse | undefined;
    if (!isEdit || !c) return;
    reset({
      type: c.type,
      title: c.title,
      description: c.description,
      organizingBody: c.organizingBody,
      instructorName: c.instructorName,
      instructorSpecialty: c.instructorSpecialty ?? '',
      startDate: c.startDate,
      endDate: c.endDate,
      startTime: c.startTime ?? '',
      endTime: c.endTime ?? '',
      timezoneNote: c.timezoneNote ?? '',
      locationMode: c.locationMode,
      locationDetails: c.locationDetails,
      registrationDeadline: c.registrationDeadline,
      capacity: c.capacity?.toString() ?? '',
      price: c.price ?? '',
      topics: c.topics.join('\n'),
    });
    setCoverImageStorageKey(null);
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
    const input: CreateVetCourseInput = {
      type: values.type as VetCourseType,
      title: values.title,
      description: values.description,
      organizingBody: values.organizingBody,
      instructorName: values.instructorName,
      instructorSpecialty: values.instructorSpecialty || undefined,
      startDate: values.startDate as string,
      endDate: values.endDate as string,
      startTime: values.startTime || undefined,
      endTime: values.endTime || undefined,
      timezoneNote: values.timezoneNote || undefined,
      locationMode: values.locationMode as VetCourseLocationMode,
      locationDetails: values.locationDetails,
      registrationDeadline: values.registrationDeadline ?? undefined,
      capacity: values.capacity ? Number(values.capacity) : undefined,
      price: values.price || undefined,
      topics: linesToList(values.topics),
      // `undefined` (field omitted) means "leave unchanged" on update — only a
      // freshly re-uploaded image should ever replace the existing one.
      ...(coverImageStorageKey ? { coverImageStorageKey } : {}),
    };
    if (isEdit && courseId) {
      update.mutate(
        { id: courseId, input },
        {
          onSuccess: () => {
            toast.show({ message: t('form.saved'), tone: 'success' });
            router.back();
          },
          onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
        },
      );
    } else {
      create.mutate(input, {
        onSuccess: () => {
          toast.show({ message: t('form.created'), tone: 'success' });
          router.replace(Routes.vetCourseMy);
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
        <AppHeader title={t('details.editCourse')} showBack />
        <Loading fill />
      </SafeAreaScreen>
    );
  }

  return (
    <SafeAreaScreen>
      <AppHeader title={t(STEP_TITLE_KEYS[step] ?? STEP_TITLE_KEYS[0])} onBack={goBack} showBack />
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
        {step === 0 && isEdit && (existing.data as VetCourse | undefined)?.status === 'REJECTED' ? (
          <Alert tone="danger" message={(existing.data as VetCourse | undefined)?.rejectionReason ?? ''} />
        ) : null}

        {step === 0 ? (
          <>
            <View style={{ rowGap: theme.spacing.xs }}>
              <Label>{t('form.type')}</Label>
              <Controller
                control={control}
                name="type"
                render={({ field: { value }, fieldState }) => (
                  <>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                      {VET_COURSE_TYPES.map((v) => (
                        <Chip
                          key={v}
                          label={t(`type.${v}`)}
                          selected={value === v}
                          onPress={() => setValue('type', v, { shouldValidate: true })}
                        />
                      ))}
                    </View>
                    {fieldState.error ? <Caption color="danger">{fieldState.error.message}</Caption> : null}
                  </>
                )}
              />
            </View>
            <FormField
              control={control}
              name="title"
              label={t('form.title')}
              placeholder={t('form.titlePlaceholder')}
            />
            <FormField
              control={control}
              name="description"
              label={t('form.description')}
              placeholder={t('form.descriptionPlaceholder')}
              multiline
              numberOfLines={4}
            />
            <FormField
              control={control}
              name="organizingBody"
              label={t('form.organizingBody')}
              placeholder={t('form.organizingBodyPlaceholder')}
            />
            <FormField
              control={control}
              name="instructorName"
              label={t('form.instructorName')}
              placeholder={t('form.instructorNamePlaceholder')}
            />
            <FormField
              control={control}
              name="instructorSpecialty"
              label={t('form.instructorSpecialty')}
              placeholder={t('form.instructorSpecialtyPlaceholder')}
            />
          </>
        ) : null}

        {step === 1 ? (
          <>
            <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
              <Controller
                control={control}
                name="startDate"
                render={({ field: { value, onChange }, fieldState }) => (
                  <DateField
                    label={t('form.startDate')}
                    value={value}
                    onChange={onChange}
                    placeholder={t('form.startDate')}
                    minimumDate={new Date()}
                    error={fieldState.error?.message}
                    accessibilityLabel={t('form.startDate')}
                  />
                )}
              />
              <Controller
                control={control}
                name="endDate"
                render={({ field: { value, onChange }, fieldState }) => (
                  <DateField
                    label={t('form.endDate')}
                    value={value}
                    onChange={onChange}
                    placeholder={t('form.endDate')}
                    minimumDate={new Date()}
                    error={fieldState.error?.message}
                    accessibilityLabel={t('form.endDate')}
                  />
                )}
              />
            </View>
            <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
              <Controller
                control={control}
                name="startTime"
                render={({ field: { value, onChange } }) => (
                  <DateTimeField
                    label={t('form.startTime')}
                    mode="time"
                    value={timeToDate(value || '09:00')}
                    onChange={(d) => onChange(dateToTime(d))}
                    display={value || t('form.startTime')}
                    accessibilityLabel={t('form.startTime')}
                  />
                )}
              />
              <Controller
                control={control}
                name="endTime"
                render={({ field: { value, onChange } }) => (
                  <DateTimeField
                    label={t('form.endTime')}
                    mode="time"
                    value={timeToDate(value || '17:00')}
                    onChange={(d) => onChange(dateToTime(d))}
                    display={value || t('form.endTime')}
                    accessibilityLabel={t('form.endTime')}
                  />
                )}
              />
            </View>
            <FormField
              control={control}
              name="timezoneNote"
              label={t('form.timezoneNote')}
              placeholder={t('form.timezoneNotePlaceholder')}
            />
            <Controller
              control={control}
              name="locationMode"
              render={({ field: { value }, fieldState }) => (
                <Select<VetCourseLocationMode>
                  label={t('form.locationMode')}
                  value={value}
                  options={VET_COURSE_LOCATION_MODES.map((v) => ({ value: v, label: t(`locationMode.${v}`) }))}
                  onChange={(v) => setValue('locationMode', v, { shouldValidate: true })}
                  error={fieldState.error?.message}
                />
              )}
            />
            <FormField
              control={control}
              name="locationDetails"
              label={t('form.locationDetails')}
              placeholder={t('form.locationDetailsPlaceholder')}
            />
            <Controller
              control={control}
              name="registrationDeadline"
              render={({ field: { value, onChange } }) => (
                <DateField
                  label={t('form.registrationDeadline')}
                  value={value}
                  onChange={onChange}
                  placeholder={t('form.registrationDeadline')}
                  minimumDate={new Date()}
                  accessibilityLabel={t('form.registrationDeadline')}
                />
              )}
            />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <FormField
              control={control}
              name="capacity"
              label={t('form.capacity')}
              placeholder={t('form.capacityPlaceholder')}
              keyboardType="number-pad"
            />
            <FormField
              control={control}
              name="price"
              label={t('form.price')}
              placeholder={t('form.pricePlaceholder')}
              keyboardType="decimal-pad"
            />
            <FormField
              control={control}
              name="topics"
              label={t('form.topics')}
              placeholder={t('form.topicsPlaceholder')}
              multiline
              numberOfLines={4}
            />
            <View style={{ rowGap: theme.spacing.xs }}>
              <Label>{t('form.coverImage')}</Label>
              <ImageUploader
                value={isEdit ? ((existing.data as VetCourse | undefined)?.coverImageUrl ?? null) : null}
                provider={imageProvider}
                shape="square"
                size={160}
                onChange={(r) => setCoverImageStorageKey(r?.storageKey ?? null)}
              />
              <Caption>{t('form.coverImageHint')}</Caption>
            </View>

            {submitError ? <Alert tone="danger" message={apiErrorMessage(submitError)} /> : null}
            <Alert tone="info" message={t('form.reviewNote')} />
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
