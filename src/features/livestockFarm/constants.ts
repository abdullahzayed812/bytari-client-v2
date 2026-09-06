import type { BadgeTone, IconName } from '@/components/content';

import type { LivestockBatchStatus, LivestockCaseStatus } from './types';

/** Sheep production type ("نوع الإنتاج") shown on the "Add Sheep Farm" form. */
export const SHEEP_PRODUCTION_TYPE_ORDER = [
  'MEAT',
  'DAIRY',
  'WOOL',
  'BREEDING',
  'MIXED',
  'OTHER',
] as const;

/** Cattle production type shown on the "Add Cattle Farm" form. */
export const CATTLE_PRODUCTION_TYPE_ORDER = ['DAIRY', 'BEEF', 'BREEDING', 'MIXED', 'OTHER'] as const;

export const FEED_TYPE_ORDER = ['CONCENTRATED', 'GREEN_FODDER', 'MIXED', 'OTHER'] as const;

/** Batch lifecycle → badge tone. Same for sheep and cattle. */
export const BATCH_STATUS_TONE: Record<LivestockBatchStatus, BadgeTone> = {
  ACTIVE: 'success',
  CLOSED: 'neutral',
};

/** Individual-case status → icon + tone (الحالات الفردية screen). Same for sheep/cattle. */
export const CASE_STATUS_ICON: Record<LivestockCaseStatus, IconName> = {
  UNDER_TREATMENT: 'pulse-outline',
  RECOVERED: 'heart-outline',
  DECEASED: 'skull-outline',
};
export const CASE_STATUS_TONE: Record<LivestockCaseStatus, BadgeTone> = {
  UNDER_TREATMENT: 'warning',
  RECOVERED: 'success',
  DECEASED: 'neutral',
};

export const SHEEP_ICON: IconName = 'paw-outline';
export const CATTLE_ICON: IconName = 'paw-outline';
