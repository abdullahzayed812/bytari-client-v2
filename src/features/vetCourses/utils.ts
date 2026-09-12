import type { TFunction } from 'i18next';

/** ISO `YYYY-MM-DD` → `YYYY/MM/DD`, matching the reference screenshots. */
export function formatCourseDate(date: string): string {
  return date.replaceAll('-', '/');
}

/** A single date, or `start - end` when the course spans more than one day. */
export function formatCourseDateRange(startDate: string, endDate: string): string {
  return startDate === endDate
    ? formatCourseDate(startDate)
    : `${formatCourseDate(startDate)} - ${formatCourseDate(endDate)}`;
}

/** "يوم واحد" for a single day, otherwise "{{count}} أيام" — inclusive day count. */
export function formatCourseDuration(startDate: string, endDate: string, t: TFunction<'vetCourses'>): string {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  const days = Math.max(1, Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1);
  return days === 1 ? t('courses.oneDay') : t('courses.days', { count: days });
}

/** Days from today until `startDate` (0 if today or already started). "تبدأ بعد N يوم". */
export function daysUntilStart(startDate: string): number {
  const today = new Date().toISOString().slice(0, 10);
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const now = new Date(`${today}T00:00:00Z`).getTime();
  return Math.max(0, Math.round((start - now) / (24 * 60 * 60 * 1000)));
}

export type MyVetCourseStatus = 'UPCOMING' | 'COMPLETED' | 'CANCELLED';

/** Derives the "دوراتي" status badge from the course's dates + cancellation — never stored server-side. */
export function deriveMyCourseStatus(course: {
  startDate: string;
  endDate: string;
  cancelledAt: string | null;
}): MyVetCourseStatus {
  if (course.cancelledAt) return 'CANCELLED';
  const today = new Date().toISOString().slice(0, 10);
  return course.endDate < today ? 'COMPLETED' : 'UPCOMING';
}
