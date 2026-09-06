import type { BadgeTone, IconName } from '@/components/content';

import type {
  PoultryBirdType,
  PoultryCaseStatus,
  PoultryFlockStatus,
} from './types';

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

/** Individual-case status → icon + tone (الحالات الفردية screen). */
export const CASE_STATUS_ICON: Record<PoultryCaseStatus, IconName> = {
  UNDER_TREATMENT: 'pulse-outline',
  RECOVERED: 'heart-outline',
  DECEASED: 'skull-outline',
};
export const CASE_STATUS_TONE: Record<PoultryCaseStatus, BadgeTone> = {
  UNDER_TREATMENT: 'warning',
  RECOVERED: 'success',
  DECEASED: 'neutral',
};

/**
 * Production type ("نوع الإنتاج") shown on the "Add Poultry Farm" form. Only the
 * two types in the reference design are offered; the backend `FARM_CATEGORIES`
 * enum is wider (MIXED / BREEDER / HATCHERY / OTHER) and stays valid.
 */
export const POULTRY_PRODUCTION_TYPES = ['BROILER', 'LAYER'] as const;
export type PoultryProductionType = (typeof POULTRY_PRODUCTION_TYPES)[number];

/** Re-exported for backward compatibility — this is genuinely shared geography data, not poultry-specific; its canonical home is `@/constants/governorates`. */
export { IRAQ_GOVERNORATES } from '@/constants/governorates';
