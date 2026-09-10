/**
 * Veterinary Office products contract. Mirrors
 * `server/src/modules/veterinary-office` EXACTLY
 * (`veterinary-office-product.constants.ts`, `.types.ts`, `.schemas.ts`,
 * OpenAPI `phase10`). No invented fields.
 *
 * This is a fully separate domain from Veterinary Store products
 * (`@/features/veterinaryStore`, own `veterinary_store_products` table and
 * `/store-products` routes) — no shared tables, DTOs, or business logic.
 *
 *   Public browse (any authenticated user, ACTIVE org + ACTIVE products only):
 *     GET  /organizations/discover/:orgId/office-products
 *     GET  /organizations/discover/:orgId/office-products/:productId
 *
 *   Management (the office's own members):
 *     GET/POST          /organizations/:orgId/office-products
 *     GET/PATCH/DELETE  /organizations/:orgId/office-products/:productId
 *     POST              /organizations/:orgId/office-products/:productId/stock
 *     POST              /organizations/:orgId/office-products/:productId/images/upload-url
 *     POST/DELETE       /organizations/:orgId/office-products/:productId/images[/:imageId]
 */

export const VETERINARY_OFFICE_PRODUCT_TYPES = [
  'MEDICINE',
  'EQUIPMENT_SUPPLY',
  'SUPPLEMENT',
  'CARE',
] as const;
export type VeterinaryOfficeProductType = (typeof VETERINARY_OFFICE_PRODUCT_TYPES)[number];

export const VETERINARY_OFFICE_PRODUCT_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type VeterinaryOfficeProductStatus = (typeof VETERINARY_OFFICE_PRODUCT_STATUSES)[number];

export interface VeterinaryOfficeProductImage {
  id: string;
  url: string;
  sortOrder: number;
}

/** Free-text display fields shown on the product-details screen. All optional. */
export interface VeterinaryOfficeProductDetailFields {
  subtype: string | null;
  weight: string | null;
  usageInstructions: string | null;
  dosage: string | null;
  shelfLife: string | null;
  manufacturer: string | null;
  highlights: string[];
}

/** `VeterinaryOfficeProduct` DTO — the backend returns every field here. */
export interface VeterinaryOfficeProduct extends VeterinaryOfficeProductDetailFields {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  productType: VeterinaryOfficeProductType;
  /**
   * Decimal string (PostgreSQL `numeric(12,2)`), e.g. `"12.50"`, or `null`.
   * NEVER a JS number — displayed verbatim, never parsed for arithmetic.
   */
  price: string | null;
  stockQuantity: number;
  status: VeterinaryOfficeProductStatus;
  primaryImageUrl: string | null;
  images: VeterinaryOfficeProductImage[];
  /** The member who added the product. UUID — no name-resolution endpoint. */
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- request payloads (client sends ONLY these fields) --------------

export interface VeterinaryOfficeProductDetailFieldsInput {
  subtype?: string | null;
  weight?: string | null;
  usageInstructions?: string | null;
  dosage?: string | null;
  shelfLife?: string | null;
  manufacturer?: string | null;
  highlights?: string[];
}

export interface CreateVeterinaryOfficeProductInput
  extends VeterinaryOfficeProductDetailFieldsInput {
  name: string;
  description?: string | null;
  productType: VeterinaryOfficeProductType;
  price?: string | null;
  /** Opening stock only. Later changes go through the stock endpoint. */
  stockQuantity?: number;
}

export interface UpdateVeterinaryOfficeProductInput
  extends VeterinaryOfficeProductDetailFieldsInput {
  name?: string;
  description?: string | null;
  productType?: VeterinaryOfficeProductType;
  price?: string | null;
  status?: VeterinaryOfficeProductStatus;
}

export interface AdjustVeterinaryOfficeStockInput {
  /** Signed, non-zero integer. The resulting stock may not be negative. */
  delta: number;
  reason?: string;
}

export type VeterinaryOfficeProductSort = 'name' | 'price' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface VeterinaryOfficeProductListFilter {
  page: number;
  pageSize: number;
  status?: VeterinaryOfficeProductStatus;
  productType?: VeterinaryOfficeProductType;
  search?: string;
  sort?: VeterinaryOfficeProductSort;
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
