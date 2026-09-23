import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/actions';
import { Badge, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import type { PublicVetCourse } from '../types';
import { formatCourseDateRange, formatCourseDuration } from '../utils';

import { VetCoursePriceBadge, VetCourseSeatsBadge, VetCourseTypeBadge } from './badges';

function Row({ icon, children }: { icon: Parameters<typeof Icon>[0]['name']; children: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}>
      <Icon name={icon} size="iconXs" color="textMuted" />
      <Caption color="textSecondary" numberOfLines={1} style={{ flex: 1 }}>
        {children}
      </Caption>
    </View>
  );
}

export interface CourseCardProps {
  course: PublicVetCourse;
  onPress: () => void;
}

/** A course/seminar/workshop card, matching the "الدورات والندوات" reference list. */
export function CourseCard({ course, onPress }: CourseCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('vetCourses');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={course.title}
      onPress={onPress}
      style={({ pressed }) => [
        {
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          overflow: 'hidden',
          ...theme.shadows.xs,
        },
        pressed && { opacity: 0.9 },
      ]}
    >
      <View style={{ height: 150, backgroundColor: theme.colors.surfaceAccent }}>
        {course.coverImageUrl ? (
          <Image source={{ uri: course.coverImageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="image-outline" size="iconXl" color="textMuted" />
          </View>
        )}
        <View style={{ position: 'absolute', top: theme.spacing.sm, insetInlineEnd: theme.spacing.sm }}>
          <VetCourseTypeBadge type={course.type} />
        </View>
      </View>

      <View style={{ padding: theme.spacing.md, rowGap: 4 }}>
        <Text variant="bodyStrong" numberOfLines={2}>
          {course.title}
        </Text>
        <Row icon="business-outline">{course.organizingBody}</Row>
        <Row icon="calendar-outline">{formatCourseDateRange(course.startDate, course.endDate)}</Row>
        <Row icon={course.locationMode === 'ONLINE' ? 'globe-outline' : 'location-outline'}>
          {course.locationMode === 'ONLINE' ? t('locationMode.ONLINE') : course.locationDetails}
        </Row>
        <Row icon="time-outline">{formatCourseDuration(course.startDate, course.endDate, t)}</Row>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: theme.spacing.sm,
            columnGap: theme.spacing.sm,
          }}
        >
          <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            <VetCoursePriceBadge price={course.price} />
            {course.isRegistered ? (
              <Badge label={t('registrationState.REGISTERED')} tone="info" size="sm" />
            ) : (
              <VetCourseSeatsBadge capacity={course.capacity} remainingSeats={course.remainingSeats} />
            )}
          </View>
          <Button label={t('courses.viewDetails')} variant="primary" size="sm" onPress={onPress} />
        </View>
      </View>
    </Pressable>
  );
}
