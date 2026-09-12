import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/content';

import type { VetCourseModerationStatus, VetCourseType } from '../types';

const MODERATION_TONE = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' } as const;
const TYPE_TONE = { COURSE: 'info', SEMINAR: 'primary', WORKSHOP: 'danger' } as const;

export function VetCourseStatusBadge({
  status,
  size = 'sm',
}: {
  status: VetCourseModerationStatus;
  size?: 'sm' | 'md';
}) {
  const { t } = useTranslation('vetCourses');
  return <Badge label={t(`status.${status}`)} tone={MODERATION_TONE[status]} size={size} />;
}

/** "دورة" / "ندوة" / "ورشة عمل" — the badge overlaid on the card's cover image. */
export function VetCourseTypeBadge({ type, size = 'sm' }: { type: VetCourseType; size?: 'sm' | 'md' }) {
  const { t } = useTranslation('vetCourses');
  return <Badge label={t(`type.${type}`)} tone={TYPE_TONE[type]} size={size} />;
}

/** "أونلاين" / "حضوري" — overlaid on the details-screen hero image. */
export function VetCourseLocationModeBadge({
  locationMode,
  size = 'sm',
}: {
  locationMode: 'ONLINE' | 'IN_PERSON';
  size?: 'sm' | 'md';
}) {
  const { t } = useTranslation('vetCourses');
  return <Badge label={t(`locationMode.${locationMode}`)} tone="neutral" size={size} />;
}

/** "مدفوعة ..." / "مجانية" — bottom-left price badge on the browse card. */
export function VetCoursePriceBadge({ price, size = 'sm' }: { price: string | null; size?: 'sm' | 'md' }) {
  const { t } = useTranslation('vetCourses');
  if (!price || Number(price) <= 0) return <Badge label={t('courses.free')} tone="success" size={size} />;
  return <Badge label={t('courses.paid', { amount: price })} tone="info" size={size} />;
}

const MY_COURSE_STATUS_TONE = { UPCOMING: 'info', COMPLETED: 'primary', CANCELLED: 'danger' } as const;

export function MyVetCourseStatusBadge({
  status,
  size = 'sm',
}: {
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  size?: 'sm' | 'md';
}) {
  const { t } = useTranslation('vetCourses');
  return <Badge label={t(`myCourses.status.${status}`)} tone={MY_COURSE_STATUS_TONE[status]} size={size} />;
}
