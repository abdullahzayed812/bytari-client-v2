import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Card, Divider, Icon } from '@/components/content';
import { EmptyState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Heading, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useCapabilities } from '@/hooks';
import { useTheme } from '@/theme';

import { VetCourseLocationModeBadge, VetCourseTypeBadge } from '../components';
import { useVetCourse } from '../hooks';
import { formatCourseDateRange } from '../utils';

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  label: string;
  value: string;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', columnGap: theme.spacing.sm }}>
      <Icon name={icon} size="iconSm" color="primary" />
      <View style={{ flex: 1 }}>
        <Caption color="textMuted">{label}</Caption>
        <Text variant="body">{value}</Text>
      </View>
    </View>
  );
}

function BulletList({ items }: { items: string[] }) {
  const theme = useTheme();
  if (items.length === 0) return null;
  return (
    <View style={{ rowGap: theme.spacing.xs }}>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', columnGap: theme.spacing.xs }}>
          <Icon name="checkmark-circle" size="iconXs" color="success" />
          <Text variant="body" style={{ flex: 1 }}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Route `/(app)/vet-courses/[courseId]` — "تفاصيل الدورة" (reference screenshot 2). */
export default function VeterinaryCourseDetailsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('vetCourses');
  const caps = useCapabilities();
  const { courseId } = useLocalSearchParams<{ courseId: string }>();

  const q = useVetCourse(courseId);
  const course = q.data;

  const dateTimeValue =
    course?.startTime && course.endTime
      ? `${formatCourseDateRange(course.startDate, course.endDate)}\n${t('details.timeRange', {
          start: course.startTime,
          end: course.endTime,
          timezone: course.timezoneNote ?? '',
        })}`
      : course
        ? formatCourseDateRange(course.startDate, course.endDate)
        : '';

  return (
    <SafeAreaScreen>
      <AppHeader title={course ? t(`details.titleByType.${course.type}`) : t('details.screenTitle')} showBack />

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError || !course ? (
        <EmptyState icon="school-outline" title={t('courses.notFound')} />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ paddingBottom: theme.spacing.huge, rowGap: theme.spacing.lg }}
          >
            <View style={{ height: 200, backgroundColor: theme.colors.surfaceAccent }}>
              {course.coverImageUrl ? (
                <Image
                  source={{ uri: course.coverImageUrl }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="image-outline" size="iconXl" color="textMuted" />
                </View>
              )}
              {course.locationMode === 'ONLINE' ? (
                <View style={{ position: 'absolute', top: theme.spacing.sm, insetInlineEnd: theme.spacing.sm }}>
                  <VetCourseLocationModeBadge locationMode={course.locationMode} />
                </View>
              ) : null}
            </View>

            <View style={{ paddingHorizontal: theme.screenPadding, rowGap: theme.spacing.lg }}>
              <View style={{ rowGap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
                  <Heading level={3} style={{ flex: 1 }}>
                    {course.title}
                  </Heading>
                  <VetCourseTypeBadge type={course.type} />
                </View>
                <Caption>{course.organizingBody}</Caption>
              </View>

              <Card variant="outlined" padding="md">
                <View style={{ rowGap: theme.spacing.md }}>
                  <InfoRow icon="person-outline" label={t('details.instructor')} value={course.instructorName} />
                  {course.instructorSpecialty ? (
                    <InfoRow
                      icon="diamond-outline"
                      label={t('details.specialty')}
                      value={course.instructorSpecialty}
                    />
                  ) : null}
                  <InfoRow icon="calendar-outline" label={t('details.dateTime')} value={dateTimeValue} />
                  <InfoRow
                    icon={course.locationMode === 'ONLINE' ? 'desktop-outline' : 'location-outline'}
                    label={t('details.location')}
                    value={course.locationDetails}
                  />
                  <InfoRow
                    icon="people-outline"
                    label={t('details.seats')}
                    value={
                      course.capacity == null
                        ? t('details.seatsUnlimited')
                        : t('details.seatsValue', {
                            total: course.capacity,
                            remaining: course.remainingSeats ?? 0,
                          })
                    }
                  />
                  <InfoRow
                    icon="pricetag-outline"
                    label={t('details.price')}
                    value={
                      course.price && Number(course.price) > 0
                        ? t('details.priceValue', { amount: course.price })
                        : t('details.priceFree')
                    }
                  />
                  <InfoRow
                    icon="business-outline"
                    label={t('details.organizingBody')}
                    value={course.organizingBody}
                  />
                </View>
              </Card>

              <View style={{ rowGap: theme.spacing.sm }}>
                <Label>{t('details.about')}</Label>
                <Text variant="body" color="textSecondary">
                  {course.description}
                </Text>
              </View>

              {course.topics.length > 0 ? (
                <View style={{ rowGap: theme.spacing.sm }}>
                  <Divider />
                  <Label>{t('details.topics')}</Label>
                  <BulletList items={course.topics} />
                </View>
              ) : null}
            </View>
          </ScrollView>

          {caps.isApprovedVeterinarian ? (
            <View
              style={{
                padding: theme.screenPadding,
                borderTopWidth: theme.sizes.hairline,
                borderTopColor: theme.colors.border,
                backgroundColor: theme.colors.background,
              }}
            >
              <Button
                label={t('details.register')}
                fullWidth
                onPress={() => router.push(Routes.vetCourseRegister(course.id))}
              />
            </View>
          ) : null}
        </>
      )}
    </SafeAreaScreen>
  );
}
