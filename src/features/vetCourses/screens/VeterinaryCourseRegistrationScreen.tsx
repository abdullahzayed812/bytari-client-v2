import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/actions';
import { Card, Icon } from '@/components/content';
import { Alert, EmptyState, Loading, useToast } from '@/components/feedback';
import { FormField, Select } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { IRAQ_GOVERNORATES } from '@/features/vetServices';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { VetCourseTypeBadge } from '../components';
import { useRegisterForVetCourse, useVetCourse } from '../hooks';
import type { CreateVetCourseRegistrationInput } from '../types';
import { formatCourseDateRange } from '../utils';

interface FormValues {
  fullName: string;
  phone: string;
  email: string;
  governorate: string;
  specialty: string;
  notes: string;
}

/** Pre-filled so a test submission needs no typing — every field stays editable. */
const EMPTY: FormValues = {
  fullName: 'د. سارة محمد',
  phone: '07701112244',
  email: 'participant@example.com',
  governorate: 'بغداد',
  specialty: 'طب عام',
  notes: '',
};

/** Route `/(app)/vet-courses/[courseId]/register` — "التسجيل في الدورة" (reference screenshot 3). */
export default function VeterinaryCourseRegistrationScreen() {
  const theme = useTheme();
  const { t } = useTranslation('vetCourses');
  const toast = useToast();
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const q = useVetCourse(courseId);
  const course = q.data;
  const register = useRegisterForVetCourse(courseId);

  const schema = useMemo(
    () =>
      z.object({
        fullName: z.string().trim().min(2, t('registration.errors.fullName')),
        phone: z.string().trim().min(5, t('registration.errors.phone')),
        email: z.string().trim().email(t('registration.errors.email')).or(z.literal('')),
        governorate: z.string().trim().min(1, t('registration.errors.governorate')),
        specialty: z.string().trim(),
        notes: z.string().trim(),
      }),
    [t],
  );

  const { control, handleSubmit, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

  const onSubmit = (values: FormValues): void => {
    const input: CreateVetCourseRegistrationInput = {
      fullName: values.fullName,
      phone: values.phone,
      email: values.email || undefined,
      governorate: values.governorate,
      specialty: values.specialty || undefined,
      notes: values.notes || undefined,
    };
    register.mutate(input, {
      onSuccess: () => {
        toast.show({ message: t('registration.success'), tone: 'success' });
        router.replace(Routes.vetCourseMy);
      },
      onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
    });
  };

  if (q.isLoading) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('registration.title')} showBack />
        <Loading fill />
      </SafeAreaScreen>
    );
  }
  if (q.isError || !course) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('registration.title')} showBack />
        <EmptyState icon="school-outline" title={t('courses.notFound')} />
      </SafeAreaScreen>
    );
  }

  return (
    <SafeAreaScreen>
      <AppHeader title={t('registration.title')} showBack />
      <ScrollView
        contentContainerStyle={{ padding: theme.screenPadding, rowGap: theme.spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        <Card variant="outlined" padding="md">
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surfaceAccent,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {course.coverImageUrl ? (
                <Image source={{ uri: course.coverImageUrl }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Icon name="image-outline" size="iconMd" color="textMuted" />
              )}
            </View>
            <View style={{ flex: 1, rowGap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
                <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                  {course.title}
                </Text>
                <VetCourseTypeBadge type={course.type} />
              </View>
              <Caption numberOfLines={1}>{course.organizingBody}</Caption>
              <Caption>{formatCourseDateRange(course.startDate, course.endDate)}</Caption>
            </View>
          </View>
        </Card>

        <View style={{ rowGap: theme.spacing.md }}>
          <Text variant="bodyStrong">{t('registration.participantData')}</Text>
          <FormField
            control={control}
            name="fullName"
            label={t('registration.fullName')}
            placeholder={t('registration.fullNamePlaceholder')}
          />
          <FormField
            control={control}
            name="phone"
            label={t('registration.phone')}
            placeholder={t('registration.phonePlaceholder')}
            keyboardType="phone-pad"
          />
          <FormField
            control={control}
            name="email"
            label={t('registration.email')}
            placeholder={t('registration.emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Controller
            control={control}
            name="governorate"
            render={({ field: { value }, fieldState }) => (
              <Select<string>
                label={t('registration.governorate')}
                placeholder={t('registration.governoratePlaceholder')}
                value={value || null}
                options={IRAQ_GOVERNORATES.map((g) => ({ value: g, label: g }))}
                onChange={(v) => setValue('governorate', v ?? '', { shouldValidate: true })}
                error={fieldState.error?.message}
              />
            )}
          />
          <FormField
            control={control}
            name="specialty"
            label={t('registration.specialty')}
            placeholder={t('registration.specialtyPlaceholder')}
          />
          <FormField
            control={control}
            name="notes"
            label={t('registration.notes')}
            placeholder={t('registration.notesPlaceholder')}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', columnGap: theme.spacing.sm }}>
          <Icon name="shield-checkmark-outline" size="iconSm" color="textMuted" />
          <Caption color="textSecondary" style={{ flex: 1 }}>
            {t('registration.termsNotice')}
          </Caption>
        </View>

        {register.isError ? <Alert tone="danger" message={apiErrorMessage(register.error)} /> : null}
      </ScrollView>

      <View style={{ padding: theme.screenPadding }}>
        <Button
          label={register.isPending ? t('registration.confirming') : t('registration.confirm')}
          fullWidth
          loading={register.isPending}
          disabled={register.isPending}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </SafeAreaScreen>
  );
}
