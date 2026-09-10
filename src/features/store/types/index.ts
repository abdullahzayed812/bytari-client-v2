/**
 * Veterinary Store & products contract — Mobile Phase 10, extended to
 * Veterinary Offices. Mirrors `server/src/modules/veterinary-store` EXACTLY
 * (`store.constants.ts`, `store.types.ts`, `store.schemas.ts`, OpenAPI
 * `phase10`). No invented fields.
 *
 * A product-owning organization is a VETERINARY_STORE or a VETERINARY_OFFICE
 * (Phase 3). This module adds product management for that organization's own
 * members:
 *
 *   GET/POST          /organizations/:orgId/products
 *   GET/PATCH/DELETE  /organizations/:orgId/products/:productId
 *   POST              /organizations/:orgId/products/:productId/stock
 *   POST              /organizations/:orgId/products/:productId/images/upload-url
 *   POST/DELETE       /organizations/:orgId/products/:productId/images[/:imageId]
 *
 * Members / supervisors / staff / profile reuse the Phase 4 `features/organizations`
 * APIs and screens. Public/consumer browse (any authenticated user, not just
 * members) is a separate feature — `features/veterinaryOffices` — against
 * `GET /organizations/discover/:orgId/products*`.
 *
 * NOT in the backend (documented in MOBILE_ARCHITECTURE.md, never mocked):
 *  - Pet Owner Store (no module at all — a wholly separate `pet_owner_store_*`
 *    catalog with its own categories/cart/orders).
 *  - Cart, checkout, addresses, delivery, payment, orders, order history,
 *    order status, order cancellation for THIS catalog.
 */

export const PRODUCT_TYPES = ['MEDICINE', 'EQUIPMENT_SUPPLY', 'SUPPLEMENT', 'CARE'] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const PRODUCT_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export interface ProductImage {
  id: string;
  url: string;
  sortOrder: number;
}

/** Free-text display fields shown on the product-details screen. All optional. */
export interface ProductDetailFields {
  subtype: string | null;
  weight: string | null;
  usageInstructions: string | null;
  dosage: string | null;
  shelfLife: string | null;
  manufacturer: string | null;
  highlights: string[];
}

/** `Product` DTO — the backend returns every field here. */
export interface Product extends ProductDetailFields {
  id: string;
  organizationId: string;
  organizationType: 'VETERINARY_STORE' | 'VETERINARY_OFFICE';
  name: string;
  description: string | null;
  productType: ProductType;
  /**
   * Decimal string (PostgreSQL `numeric(12,2)`), e.g. `"12.50"`, or `null`.
   * NEVER a JS number — displayed verbatim, never parsed for arithmetic.
   */
  price: string | null;
  stockQuantity: number;
  status: ProductStatus;
  primaryImageUrl: string | null;
  images: ProductImage[];
  /** The member who added the product. UUID — no name-resolution endpoint. */
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- request payloads (client sends ONLY these fields) --------------

export interface ProductDetailFieldsInput {
  subtype?: string | null;
  weight?: string | null;
  usageInstructions?: string | null;
  dosage?: string | null;
  shelfLife?: string | null;
  manufacturer?: string | null;
  highlights?: string[];
}

export interface CreateProductInput extends ProductDetailFieldsInput {
  name: string;
  description?: string | null;
  productType: ProductType;
  price?: string | null;
  /** Opening stock only. Later changes go through the stock endpoint. */
  stockQuantity?: number;
}

export interface UpdateProductInput extends ProductDetailFieldsInput {
  name?: string;
  description?: string | null;
  productType?: ProductType;
  price?: string | null;
  status?: ProductStatus;
}

export interface AdjustStockInput {
  /** Signed, non-zero integer. The resulting stock may not be negative. */
  delta: number;
  reason?: string;
}

export type ProductSort = 'name' | 'price' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface ProductListFilter {
  page: number;
  pageSize: number;
  status?: ProductStatus;
  productType?: ProductType;
  search?: string;
  sort?: ProductSort;
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
