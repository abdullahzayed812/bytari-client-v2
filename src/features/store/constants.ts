import type { BadgeTone, IconName } from '@/components/content';
import type { OrganizationType } from '@/features/organizations/types';

import type { ProductSort, ProductStatus, ProductType } from './types';

/**
 * Organization type that carries veterinary-store behaviour. Backend source of
 * truth: `VETERINARY_STORE_ORG_TYPE` in
 * `server/src/modules/veterinary-store/domain/store.constants.ts`. Centralised so
 * no component does `if (org.type === 'VETERINARY_STORE')` inline.
 */
export const VETERINARY_STORE_ORG_TYPE: OrganizationType = 'VETERINARY_STORE';

export function organizationIsVeterinaryStore(
  type: OrganizationType | string | undefined,
): boolean {
  return type === VETERINARY_STORE_ORG_TYPE;
}

/** Product type → line icon + ordered list for the "add product" picker. */
export const PRODUCT_TYPE_ICON: Record<string, IconName> = {
  MEDICINE: 'medical-outline',
  EQUIPMENT: 'hardware-chip-outline',
  SUPPLY: 'cube-outline',
  OTHER: 'help-circle-outline',
};

export function productTypeIcon(productType: string): IconName {
  return PRODUCT_TYPE_ICON[productType] ?? 'help-circle-outline';
}

export const PRODUCT_TYPE_ORDER: readonly ProductType[] = [
  'MEDICINE',
  'EQUIPMENT',
  'SUPPLY',
  'OTHER',
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
