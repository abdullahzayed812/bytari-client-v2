import type { BadgeTone, IconName } from '@/components/content';
import type { OrganizationType } from '@/features/organizations/types';

import type { VeterinaryStoreProductSort, VeterinaryStoreProductStatus, VeterinaryStoreProductType } from './types';

/**
 * Only a VETERINARY_STORE organization owns Veterinary Store products.
 * Backend source of truth: `VETERINARY_STORE_ORG_TYPE` in
 * `server/src/modules/veterinary-store/domain/veterinary-store-product.constants.ts`.
 * Veterinary Office products are a fully separate catalog — see
 * `@/features/veterinaryOffices`'s own `organizationOwnsVeterinaryOfficeProducts`.
 */
export function organizationOwnsVeterinaryStoreProducts(
  type: OrganizationType | string | undefined,
): boolean {
  return type === 'VETERINARY_STORE';
}

/** VeterinaryStoreProduct type → line icon + ordered list for the "add product" picker. */
export const VETERINARY_STORE_PRODUCT_TYPE_ICON: Record<string, IconName> = {
  MEDICINE: 'medical-outline',
  EQUIPMENT_SUPPLY: 'hardware-chip-outline',
  SUPPLEMENT: 'nutrition-outline',
  CARE: 'leaf-outline',
};

export function veterinaryStoreProductTypeIcon(productType: string): IconName {
  return VETERINARY_STORE_PRODUCT_TYPE_ICON[productType] ?? 'help-circle-outline';
}

export const VETERINARY_STORE_PRODUCT_TYPE_ORDER: readonly VeterinaryStoreProductType[] = [
  'MEDICINE',
  'EQUIPMENT_SUPPLY',
  'SUPPLEMENT',
  'CARE',
];

/** VeterinaryStoreProduct lifecycle → badge tone. `INACTIVE` is the soft-delete state. */
export const VETERINARY_STORE_PRODUCT_STATUS_TONE: Record<VeterinaryStoreProductStatus, BadgeTone> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
};

/** Sort options the backend list endpoint actually supports (§9). */
export const VETERINARY_STORE_PRODUCT_SORT_OPTIONS: readonly { value: VeterinaryStoreProductSort; order: 'asc' | 'desc' }[] = [
  { value: 'createdAt', order: 'desc' },
  { value: 'name', order: 'asc' },
  { value: 'price', order: 'asc' },
  { value: 'price', order: 'desc' },
];

/** Low-stock visual cue threshold — presentation only, never sent to the server. */
export const VETERINARY_STORE_LOW_STOCK_THRESHOLD = 5;
