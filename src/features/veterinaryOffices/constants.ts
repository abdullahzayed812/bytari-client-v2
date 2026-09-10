import type { BadgeTone, IconName } from '@/components/content';
import type { OrganizationType } from '@/features/organizations/types';

import type { VeterinaryOfficeProductSort, VeterinaryOfficeProductStatus, VeterinaryOfficeProductType } from './types';

/**
 * Only a VETERINARY_OFFICE organization owns Veterinary Office products.
 * Backend source of truth: `VETERINARY_OFFICE_ORG_TYPE` in
 * `server/src/modules/veterinary-office/domain/veterinary-office-product.constants.ts`.
 * Veterinary Store products are a fully separate catalog — see
 * `@/features/veterinaryStore`'s own `organizationOwnsVeterinaryStoreProducts`.
 */
export function organizationOwnsVeterinaryOfficeProducts(
  type: OrganizationType | string | undefined,
): boolean {
  return type === 'VETERINARY_OFFICE';
}

/** Product type → line icon + ordered list for the "add product" picker. */
export const VETERINARY_OFFICE_PRODUCT_TYPE_ICON: Record<string, IconName> = {
  MEDICINE: 'medical-outline',
  EQUIPMENT_SUPPLY: 'hardware-chip-outline',
  SUPPLEMENT: 'nutrition-outline',
  CARE: 'leaf-outline',
};

export function veterinaryOfficeProductTypeIcon(productType: string): IconName {
  return VETERINARY_OFFICE_PRODUCT_TYPE_ICON[productType] ?? 'help-circle-outline';
}

export const VETERINARY_OFFICE_PRODUCT_TYPE_ORDER: readonly VeterinaryOfficeProductType[] = [
  'MEDICINE',
  'EQUIPMENT_SUPPLY',
  'SUPPLEMENT',
  'CARE',
];

/** Product lifecycle → badge tone. `INACTIVE` is the soft-delete state. */
export const VETERINARY_OFFICE_PRODUCT_STATUS_TONE: Record<VeterinaryOfficeProductStatus, BadgeTone> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
};

/** Sort options the backend list endpoint actually supports. */
export const VETERINARY_OFFICE_PRODUCT_SORT_OPTIONS: readonly {
  value: VeterinaryOfficeProductSort;
  order: 'asc' | 'desc';
}[] = [
  { value: 'createdAt', order: 'desc' },
  { value: 'name', order: 'asc' },
  { value: 'price', order: 'asc' },
  { value: 'price', order: 'desc' },
];

/** Low-stock visual cue threshold — presentation only, never sent to the server. */
export const VETERINARY_OFFICE_LOW_STOCK_THRESHOLD = 5;
