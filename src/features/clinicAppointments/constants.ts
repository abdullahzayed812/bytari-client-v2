import type { BadgeTone, IconName } from '@/components/content';

import type { AppointmentHistoryKind, AppointmentStatus, VisitType } from './types';

/** Status → Badge tone (mirrors the reference: amber "في الانتظار", green confirmed…). */
export const APPOINTMENT_STATUS_TONE: Record<AppointmentStatus, BadgeTone> = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  RESCHEDULE_PROPOSED: 'info',
  COMPLETED: 'primary',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
};

export const VISIT_TYPE_ICON: Record<VisitType, IconName> = {
  CHECKUP: 'search-outline',
  VACCINATION: 'medical-outline',
  FOLLOW_UP: 'repeat-outline',
  SURGERY: 'cut-outline',
  OTHER: 'ellipsis-horizontal-outline',
};

export const HISTORY_KIND_ICON: Record<AppointmentHistoryKind, IconName> = {
  REQUESTED: 'add-circle-outline',
  CONFIRMED: 'checkmark-circle-outline',
  REJECTED: 'close-circle-outline',
  RESCHEDULE_PROPOSED: 'time-outline',
  RESCHEDULE_ACCEPTED: 'checkmark-done-outline',
  RESCHEDULE_DECLINED: 'close-outline',
  CANCELLED: 'ban-outline',
  COMPLETED: 'flag-outline',
};

/**
 * `Intl` locale — the app formats appointment dates as `٢٠٢٦/٩/٨` and times as
 * `٢:٠٥ م` (Arabic-Indic digits), matching the screenshots.
 */
function intlLocale(locale: string): string {
  return locale === 'ar' ? 'ar-EG' : 'en-GB';
}

export function formatAppointmentDate(iso: string, locale = 'ar'): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(d);
}

export function formatAppointmentTime(iso: string, locale = 'ar'): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

export function formatAppointmentDateTime(iso: string, locale = 'ar'): string {
  return `${formatAppointmentDate(iso, locale)}، ${formatAppointmentTime(iso, locale)}`;
}
