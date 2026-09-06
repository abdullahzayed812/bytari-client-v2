import type { BadgeTone, IconName } from '@/components/content';
import type {
  FarmAppointmentCategory,
  FarmExpenseCategory,
  PoultryHealthEventKind,
  PoultryHealthEventStatus,
} from '@/features/farm/types';
import type { OrganizationType } from '@/features/organizations/types';


/**
 * Organization type that carries farm behaviour. Backend source of truth:
 * `FARM_ORG_TYPE` in `server/src/modules/farms/domain/farm.constants.ts`.
 * Centralised so no component does `if (org.type === 'FARM')` inline. Shared
 * across poultry/sheep/cattle — a farm is a farm regardless of species.
 */
export const FARM_ORG_TYPE: OrganizationType = 'FARM';

export function organizationIsFarm(type: OrganizationType | string | undefined): boolean {
  return type === FARM_ORG_TYPE;
}

/** Farm expense category → line icon (المصاريف screen). Species-agnostic. */
export const EXPENSE_CATEGORY_ICON: Record<FarmExpenseCategory, IconName> = {
  FEED: 'leaf-outline',
  MEDICINE: 'medkit-outline',
  WATER_TRANSPORT: 'water-outline',
  LABOR: 'people-outline',
  UTILITIES: 'flash-outline',
  EQUIPMENT: 'construct-outline',
  OTHER: 'ellipsis-horizontal',
};

/** Health-event kind → line icon (العلاجات واللقاحات screen). Species-agnostic shape. */
export const HEALTH_EVENT_KIND_ICON: Record<PoultryHealthEventKind, IconName> = {
  TREATMENT: 'medkit-outline',
  VACCINATION: 'shield-checkmark-outline',
};

/** Health-event status → icon + tone. */
export const HEALTH_EVENT_STATUS_ICON: Record<PoultryHealthEventStatus, IconName> = {
  SCHEDULED: 'time-outline',
  ONGOING: 'pulse-outline',
  DONE: 'checkmark-circle-outline',
  RECOVERED: 'checkmark-circle-outline',
};
export const HEALTH_EVENT_STATUS_TONE: Record<PoultryHealthEventStatus, BadgeTone> = {
  SCHEDULED: 'info',
  ONGOING: 'warning',
  DONE: 'success',
  RECOVERED: 'success',
};

/** Appointment category → badge tone (المواعيد screen). Species-agnostic. */
export const APPOINTMENT_CATEGORY_TONE: Record<FarmAppointmentCategory, BadgeTone> = {
  VACCINATION: 'success',
  TREATMENT: 'warning',
  INDIVIDUAL_CASE: 'info',
  VET_VISIT: 'primary',
  OTHER: 'neutral',
};
