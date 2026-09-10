/**
 * Veterinary Store products contract — Mobile Phase 10. Mirrors
 * `server/src/modules/veterinary-store` EXACTLY
 * (`veterinary-store-product.constants.ts`, `.types.ts`, `.schemas.ts`,
 * OpenAPI `phase10`). No invented fields.
 *
 * Only a VETERINARY_STORE organization owns this catalog. This module adds
 * product management for that organization's own members:
 *
 *   GET/POST          /organizations/:orgId/store-products
 *   GET/PATCH/DELETE  /organizations/:orgId/store-products/:productId
 *   POST              /organizations/:orgId/store-products/:productId/stock
 *   POST              /organizations/:orgId/store-products/:productId/images/upload-url
 *   POST/DELETE       /organizations/:orgId/store-products/:productId/images[/:imageId]
 *
 * Members / supervisors / staff / profile reuse the Phase 4 `features/organizations`
 * APIs and screens. Veterinary Office products are a fully separate catalog,
 * own table, own routes — `features/veterinaryOffices` — never this one.
 *
 * NOT in the backend (documented in MOBILE_ARCHITECTURE.md, never mocked):
 *  - Pet Owner Store (no module at all — a wholly separate `pet_owner_store_*`
 *    catalog with its own categories/cart/orders).
 *  - Cart, checkout, addresses, delivery, payment, orders, order history,
 *    order status, order cancellation for THIS catalog.
 */

export const VETERINARY_STORE_PRODUCT_TYPES = [
  'MEDICINE',
  'EQUIPMENT_SUPPLY',
  'SUPPLEMENT',
  'CARE',
] as const;
export type VeterinaryStoreProductType = (typeof VETERINARY_STORE_PRODUCT_TYPES)[number];

export const VETERINARY_STORE_PRODUCT_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type VeterinaryStoreProductStatus = (typeof VETERINARY_STORE_PRODUCT_STATUSES)[number];

export interface VeterinaryStoreProductImage {
  id: string;
  url: string;
  sortOrder: number;
}

/** Free-text display fields shown on the product-details screen. All optional. */
export interface VeterinaryStoreProductDetailFields {
  subtype: string | null;
  weight: string | null;
  usageInstructions: string | null;
  dosage: string | null;
  shelfLife: string | null;
  manufacturer: string | null;
  highlights: string[];
}

/** `VeterinaryStoreProduct` DTO — the backend returns every field here. */
export interface VeterinaryStoreProduct extends VeterinaryStoreProductDetailFields {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  productType: VeterinaryStoreProductType;
  /**
   * Decimal string (PostgreSQL `numeric(12,2)`), e.g. `"12.50"`, or `null`.
   * NEVER a JS number — displayed verbatim, never parsed for arithmetic.
   */
  price: string | null;
  stockQuantity: number;
  status: VeterinaryStoreProductStatus;
  primaryImageUrl: string | null;
  images: VeterinaryStoreProductImage[];
  /** The member who added the product. UUID — no name-resolution endpoint. */
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- request payloads (client sends ONLY these fields) --------------

export interface VeterinaryStoreProductDetailFieldsInput {
  subtype?: string | null;
  weight?: string | null;
  usageInstructions?: string | null;
  dosage?: string | null;
  shelfLife?: string | null;
  manufacturer?: string | null;
  highlights?: string[];
}

export interface CreateVeterinaryStoreProductInput extends VeterinaryStoreProductDetailFieldsInput {
  name: string;
  description?: string | null;
  productType: VeterinaryStoreProductType;
  price?: string | null;
  /** Opening stock only. Later changes go through the stock endpoint. */
  stockQuantity?: number;
}

export interface UpdateVeterinaryStoreProductInput extends VeterinaryStoreProductDetailFieldsInput {
  name?: string;
  description?: string | null;
  productType?: VeterinaryStoreProductType;
  price?: string | null;
  status?: VeterinaryStoreProductStatus;
}

export interface AdjustVeterinaryStoreStockInput {
  /** Signed, non-zero integer. The resulting stock may not be negative. */
  delta: number;
  reason?: string;
}

export type VeterinaryStoreProductSort = 'name' | 'price' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface VeterinaryStoreProductListFilter {
  page: number;
  pageSize: number;
  status?: VeterinaryStoreProductStatus;
  productType?: VeterinaryStoreProductType;
  search?: string;
  sort?: VeterinaryStoreProductSort;
  order?: SortOrder;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}
