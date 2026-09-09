import type { BadgeTone, IconName } from '@/components/content';

import type {
  EngagementStatus,
  ModerationStatus,
  VetServiceAnimalType,
  VetServiceType,
  VetServiceUrgency,
} from './types';

/** Iraqi governorates — free-text on the backend; this list backs the pickers. */
export const IRAQ_GOVERNORATES = [
  'بغداد',
  'نينوى',
  'البصرة',
  'أربيل',
  'النجف',
  'كربلاء',
  'كركوك',
  'صلاح الدين',
  'الأنبار',
  'ديالى',
  'واسط',
  'ذي قار',
  'ميسان',
  'المثنى',
  'القادسية',
  'بابل',
  'دهوك',
  'السليمانية',
  'حلبجة',
] as const;

export const MODERATION_STATUS_TONE: Record<ModerationStatus, BadgeTone> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

export const ENGAGEMENT_STATUS_TONE: Record<EngagementStatus, BadgeTone> = {
  PENDING: 'warning',
  ACCEPTED: 'primary',
  COMPLETED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
};

export const URGENCY_TONE: Record<VetServiceUrgency, BadgeTone> = {
  NORMAL: 'neutral',
  URGENT: 'danger',
};

export const ANIMAL_TYPE_ICON: Record<VetServiceAnimalType, IconName> = {
  DOG: 'paw-outline',
  CAT: 'paw-outline',
  BIRD: 'egg-outline',
  POULTRY: 'egg-outline',
  SHEEP: 'leaf-outline',
  GOAT: 'leaf-outline',
  CATTLE: 'leaf-outline',
  HORSE: 'leaf-outline',
  CAMEL: 'leaf-outline',
  FISH: 'fish-outline',
  OTHER: 'ellipse-outline',
};

export const SERVICE_TYPE_ICON: Record<VetServiceType, IconName> = {
  VACCINATION: 'medical-outline',
  EXAMINATION: 'search-outline',
  TREATMENT: 'bandage-outline',
  SURGERY: 'cut-outline',
  ARTIFICIAL_INSEMINATION: 'flask-outline',
  FOLLOW_UP: 'repeat-outline',
  HOME_VISIT: 'home-outline',
  DIAGNOSIS: 'pulse-outline',
  CONSULTATION: 'chatbubbles-outline',
  OTHER: 'ellipsis-horizontal-outline',
};

/** ISO datetime / date → localised `ar-EG` string (Arabic-Indic digits). */
export function formatVetServiceDate(iso: string | null, locale = 'ar'): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(d);
}

/** `"150000"` → `"١٥٠٬٠٠٠ د.ع"` (or `—`). */
export function formatPrice(amount: string | null, locale = 'ar'): string {
  if (amount == null || amount === '') return '—';
  const n = Number(amount);
  if (Number.isNaN(n)) return `${amount} د.ع`;
  return `${new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-GB').format(n)} د.ع`;
}
