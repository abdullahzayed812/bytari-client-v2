import type { BadgeTone, IconName } from '@/components/content';
import type { OrganizationType } from '@/features/organizations/types';

import type { ProductSort, ProductStatus, ProductType } from './types';

/**
 * Organization types that can own products. Backend source of truth:
 * `PRODUCT_ORG_TYPES` in
 * `server/src/modules/veterinary-store/domain/store.constants.ts` — a
 * VETERINARY_STORE or a VETERINARY_OFFICE. Centralised so no component does
 * `if (org.type === 'VETERINARY_STORE')` inline.
 */
export const PRODUCT_ORG_TYPES: readonly OrganizationType[] = [
  'VETERINARY_STORE',
  'VETERINARY_OFFICE',
];

export function organizationOwnsProducts(type: OrganizationType | string | undefined): boolean {
  return type != null && (PRODUCT_ORG_TYPES as readonly string[]).includes(type);
}

/** Product type → line icon + ordered list for the "add product" picker. */
export const PRODUCT_TYPE_ICON: Record<string, IconName> = {
  MEDICINE: 'medical-outline',
  EQUIPMENT_SUPPLY: 'hardware-chip-outline',
  SUPPLEMENT: 'nutrition-outline',
  CARE: 'leaf-outline',
};

export function productTypeIcon(productType: string): IconName {
  return PRODUCT_TYPE_ICON[productType] ?? 'help-circle-outline';
}

export const PRODUCT_TYPE_ORDER: readonly ProductType[] = [
  'MEDICINE',
  'EQUIPMENT_SUPPLY',
  'SUPPLEMENT',
  'CARE',
];

/** Product lifecycle → badge tone. `INACTIVE` is the soft-delete state. */
export const PRODUCT_STATUS_TONE: Record<ProductStatus, BadgeTone> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
};

/** Sort options the backend list endpoint actually supports (§9). */
export const PRODUCT_SORT_OPTIONS: readonly { value: ProductSort; order: 'asc' | 'desc' }[] = [
  { value: 'createdAt', order: 'desc' },
  { value: 'name', order: 'asc' },
  { value: 'price', order: 'asc' },
  { value: 'price', order: 'desc' },
];

/** Low-stock visual cue threshold — presentation only, never sent to the server. */
export const LOW_STOCK_THRESHOLD = 5;
