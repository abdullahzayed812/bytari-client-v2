/**
 * Veterinary Store & products contract — Mobile Phase 10. Mirrors
 * `server/src/modules/veterinary-store` EXACTLY (`store.constants.ts`,
 * `store.types.ts`, `store.schemas.ts`, OpenAPI `phase10`). No invented fields.
 *
 * A Veterinary Store is an Organization of type `VETERINARY_STORE` (Phase 3).
 * This module adds ONLY product management for that store's own members:
 *
 *   GET/POST         /organizations/:orgId/products
 *   GET/PATCH/DELETE  /organizations/:orgId/products/:productId
 *   POST             /organizations/:orgId/products/:productId/stock
 *
 * Members / supervisors / staff / profile reuse the Phase 4 `features/organizations`
 * APIs and screens.
 *
 * NOT in the backend (documented in MOBILE_ARCHITECTURE.md, never mocked):
 *  - Pet Owner Store (no module at all — `products.organization_type` is pinned
 *    to `VETERINARY_STORE` by a DB CHECK).
 *  - Any public / consumer product browse. Products are private to the store's
 *    members; every route needs `product.read` on that organization.
 *  - Product categories, product images / media (no image field, no R2 seam),
 *    SKU / barcode, discounts, vendor public profiles, "featured" / "popular".
 *  - Cart, checkout, addresses, delivery, payment, orders, order history,
 *    order status, order cancellation.
 */

export const PRODUCT_TYPES = ['MEDICINE', 'EQUIPMENT', 'SUPPLY', 'OTHER'] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const PRODUCT_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

/** `Product` DTO — the backend returns every field here. */
export interface Product {
  id: string;
  organizationId: string;
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
  /** The store member who added the product. UUID — no name-resolution endpoint. */
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- request payloads (client sends ONLY these fields) --------------

export interface CreateProductInput {
  name: string;
  description?: string | null;
  productType: ProductType;
  price?: string | null;
  /** Opening stock only. Later changes go through the stock endpoint. */
  stockQuantity?: number;
}

export interface UpdateProductInput {
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
