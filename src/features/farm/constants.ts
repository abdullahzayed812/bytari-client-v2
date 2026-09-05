import type { BadgeTone, IconName } from '@/components/content';
import type { OrganizationType } from '@/features/organizations/types';

import type { PoultryBirdType, PoultryFlockStatus } from './types';

/**
 * Organization type that carries farm behaviour. Backend source of truth:
 * `FARM_ORG_TYPE` in `server/src/modules/farms/domain/farm.constants.ts`.
 * Centralised so no component does `if (org.type === 'FARM')` inline.
 */
export const FARM_ORG_TYPE: OrganizationType = 'FARM';

export function organizationIsFarm(type: OrganizationType | string | undefined): boolean {
  return type === FARM_ORG_TYPE;
}

/** Bird type → line icon + ordered list for the "create flock" picker. */
export const BIRD_TYPE_ICON: Record<string, IconName> = {
  CHICKEN: 'egg-outline',
  DUCK: 'water-outline',
  TURKEY: 'egg-outline',
  QUAIL: 'egg-outline',
  GOOSE: 'water-outline',
  OTHER: 'help-circle-outline',
};

export function birdTypeIcon(birdType: string): IconName {
  return BIRD_TYPE_ICON[birdType] ?? 'help-circle-outline';
}

export const BIRD_TYPE_ORDER: readonly PoultryBirdType[] = [
  'CHICKEN',
  'DUCK',
  'TURKEY',
  'QUAIL',
  'GOOSE',
  'OTHER',
];

/** Poultry flock lifecycle → badge tone. */
export const FLOCK_STATUS_TONE: Record<PoultryFlockStatus, BadgeTone> = {
  ACTIVE: 'success',
  CLOSED: 'neutral',
};

/**
 * Production type ("نوع الإنتاج") shown on the "Add Poultry Farm" form. Only the
 * two types in the reference design are offered; the backend `FARM_CATEGORIES`
 * enum is wider (MIXED / BREEDER / HATCHERY / OTHER) and stays valid.
 */
export const FARM_PRODUCTION_TYPES = ['BROILER', 'LAYER'] as const;
export type FarmProductionType = (typeof FARM_PRODUCTION_TYPES)[number];

/** Iraqi governorates for the "المحافظة" picker. Value === Arabic label. */
export const IRAQ_GOVERNORATES: readonly string[] = [
  'بغداد',
  'البصرة',
  'نينوى',
  'أربيل',
  'النجف',
  'كربلاء',
  'بابل',
  'ذي قار',
  'الأنبار',
  'ديالى',
  'كركوك',
  'صلاح الدين',
  'واسط',
  'ميسان',
  'المثنى',
  'القادسية',
  'دهوك',
  'السليمانية',
];
