import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import { Button, TextButton } from '@/components/actions';
import { Card, Icon } from '@/components/content';
import { ConfirmationDialog, EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { SegmentedControl } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { MyVetCourseStatusBadge, VetCourseStatusBadge, VetCourseTypeBadge } from '../components';
import { useCancelVetCourse, useDeleteVetCourse, useMyVetCourseRegistrations, useMyVetCourses } from '../hooks';
import type { VetCourse, VetCourseRegistration } from '../types';
import { daysUntilStart, deriveMyCourseStatus, formatCourseDateRange } from '../utils';

type Tab = 'registrations' | 'created';

/** Route `/(app)/vet-courses/my` — "دوراتي" (reference screenshot 4). */
export default function MyVeterinaryCoursesScreen() {
  const theme = useTheme();
  const { t } = useTranslation('vetCourses');
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('registrations');

  const registrations = useMyVetCourseRegistrations({ enabled: tab === 'registrations' });
  const created = useMyVetCourses(undefined, { enabled: tab === 'created' });
  const cancelCourse = useCancelVetCourse();
  const deleteCourse = useDeleteVetCourse();
  const [deleting, setDeleting] = useState<VetCourse | null>(null);

  const onDelete = (): void => {
    if (!deleting) return;
    deleteCourse.mutate(deleting.id, {
      onSuccess: () => setDeleting(null),
      onError: (e) => {
        toast.show({ message: apiErrorMessage(e), tone: 'danger' });
        setDeleting(null);
      },
    });
  };

  const onCancel = (course: VetCourse): void => {
    cancelCourse.mutate(course.id, {
      onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
    });
  };

  return (
    <SafeAreaScreen>
      <AppHeader title={t('myCourses.title')} showBack />
      <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.sm }}>
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'registrations', label: t('myCourses.tabRegistrations') },
            { value: 'created', label: t('myCourses.tabCreated') },
          ]}
        />
      </View>

      {tab === 'registrations' ? (
        registrations.isLoading ? (
          <Loading fill />
        ) : registrations.isError ? (
          <View style={{ padding: theme.screenPadding }}>
            <ErrorState error={registrations.error} onRetry={() => void registrations.refetch()} />
          </View>
        ) : (
          <FlatList
            data={registrations.registrations}
            keyExtractor={(r) => r.id}
            renderItem={({ item }) => <RegistrationRow registration={item} />}
            ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
            ListEmptyComponent={
              <EmptyState icon="school-outline" title={t('myCourses.empty')} message={t('myCourses.emptyHint')} />
            }
            contentContainerStyle={{ padding: theme.screenPadding, paddingBottom: theme.spacing.huge }}
          />
        )
      ) : created.isLoading ? (
        <Loading fill />
      ) : created.isError ? (
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={created.error} onRetry={() => void created.refetch()} />
        </View>
      ) : (
        <FlatList
          data={created.courses}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <Card variant="outlined" padding="md">
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', columnGap: theme.spacing.md }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: theme.radius.md,
                    backgroundColor: theme.colors.primarySoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="school-outline" size="iconMd" color="primary" />
                </View>
                <View style={{ flex: 1, rowGap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
                    <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                      {item.title}
                    </Text>
                    <VetCourseTypeBadge type={item.type} />
                  </View>
                  <Caption numberOfLines={1}>{item.organizingBody}</Caption>
                  <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
                    <VetCourseStatusBadge status={item.status} />
                    <Caption>{formatDate(item.createdAt)}</Caption>
                  </View>
                  {item.status === 'REJECTED' && item.rejectionReason ? (
                    <Caption color="danger">{item.rejectionReason}</Caption>
                  ) : null}
                </View>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  columnGap: theme.spacing.md,
                  marginTop: theme.spacing.sm,
                  flexWrap: 'wrap',
                }}
              >
                <TextButton label={t('myCourses.view')} onPress={() => router.push(Routes.vetCourse(item.id))} />
                <TextButton label={t('myCourses.edit')} onPress={() => router.push(Routes.vetCourseEdit(item.id))} />
                {item.status === 'APPROVED' && !item.cancelledAt ? (
                  <TextButton label={t('myCourses.cancelAd')} tone="danger" onPress={() => onCancel(item)} />
                ) : null}
                <TextButton label={t('myCourses.delete')} tone="danger" onPress={() => setDeleting(item)} />
              </View>
            </Card>
          )}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
          ListEmptyComponent={<EmptyState icon="school-outline" title={t('myCourses.emptyCreated')} />}
          ListFooterComponent={
            <View
              style={{
                marginTop: theme.spacing.lg,
                padding: theme.spacing.md,
                borderRadius: theme.radius.lg,
                backgroundColor: theme.colors.primarySoft,
                flexDirection: 'row',
                alignItems: 'center',
                columnGap: theme.spacing.sm,
              }}
            >
              <Icon name="information-circle-outline" color="primary" />
              <View style={{ flex: 1 }}>
                <Text variant="label" color="primary">
                  {t('myCourses.noteTitle')}
                </Text>
                <Caption>{t('myCourses.noteBody')}</Caption>
              </View>
            </View>
          }
          contentContainerStyle={{ padding: theme.screenPadding, paddingBottom: theme.spacing.huge }}
        />
      )}

      <ConfirmationDialog
        visible={deleting != null}
        title={t('myCourses.deleteConfirmTitle')}
        message={t('myCourses.deleteConfirmBody')}
        confirmLabel={t('myCourses.delete')}
        destructive
        loading={deleteCourse.isPending}
        onConfirm={onDelete}
        onCancel={() => setDeleting(null)}
      />
    </SafeAreaScreen>
  );
}

function RegistrationRow({ registration }: { registration: VetCourseRegistration }) {
  const theme = useTheme();
  const { t } = useTranslation('vetCourses');
  const toast = useToast();
  const course = registration.course;
  if (!course) return null;
  const status = deriveMyCourseStatus(course);

  return (
    <Card variant="outlined" padding="md">
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', columnGap: theme.spacing.md }}>
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
            <MyVetCourseStatusBadge status={status} />
          </View>
          <Caption numberOfLines={1}>{course.organizingBody}</Caption>
          <Caption>{formatCourseDateRange(course.startDate, course.endDate)}</Caption>
          <Caption>{course.locationMode === 'ONLINE' ? t('locationMode.ONLINE') : t('locationMode.IN_PERSON')}</Caption>
        </View>
      </View>

      {status === 'UPCOMING' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4, marginTop: theme.spacing.sm }}>
          <Icon name="calendar-outline" size="iconXs" color="primary" />
          <Caption color="primary">{t('myCourses.startsIn', { count: daysUntilStart(course.startDate) })}</Caption>
        </View>
      ) : null}
      {status === 'CANCELLED' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4, marginTop: theme.spacing.sm }}>
          <Icon name="close-circle-outline" size="iconXs" color="danger" />
          <Caption color="danger">{t('myCourses.cancelledNotice')}</Caption>
        </View>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          columnGap: theme.spacing.md,
          marginTop: theme.spacing.sm,
          flexWrap: 'wrap',
        }}
      >
        <Button
          label={t('courses.viewDetails')}
          size="sm"
          onPress={() => router.push(Routes.vetCourse(course.id))}
        />
        {status === 'COMPLETED' ? (
          <Button
            label={t('myCourses.downloadCertificate')}
            variant="outline"
            size="sm"
            leftIcon="document-text-outline"
            onPress={() => toast.show({ message: t('myCourses.certificateUnavailable'), tone: 'info' })}
          />
        ) : null}
      </View>
    </Card>
  );
}
