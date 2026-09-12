/**
 * Veterinarian Store contract — mirrors `server/src/modules/veterinarian-store`
 * (`veterinarian-store.types.ts` + OpenAPI `veterinarianStore`) EXACTLY. No invented
 * fields. Money is always a decimal string (`numeric(12,2)`), never a JS number.
 *
 * Consumer browse / cart / checkout / order history need only authentication.
 * The Veterinarians Store (future) will reuse the same cart/checkout/order
 * shapes with its own screens and naming.
 */

export const VET_STORE_ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;
export type VetStoreOrderStatus = (typeof VET_STORE_ORDER_STATUSES)[number];

export const VET_STORE_PAYMENT_METHODS = ['COD', 'MADA', 'CREDIT_CARD'] as const;
export type VetStorePaymentMethod = (typeof VET_STORE_PAYMENT_METHODS)[number];
/** Only COD is accepted by the backend right now; the rest render disabled. */
export const VET_STORE_ENABLED_PAYMENT_METHODS: VetStorePaymentMethod[] = ['COD'];

export type VetStorePaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';
export type VetStoreProductStatus = 'ACTIVE' | 'INACTIVE';

export type VetStoreProductSort = 'name' | 'price' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

// --- category -------------------------------------------------------

export interface VetStoreCategory {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  showOnHome: boolean;
  sortOrder: number;
  status: VetStoreProductStatus;
  /** Present on the admin list only. */
  productCount?: number;
}

// --- product -------------------------------------------------------

export interface VetStoreProductListItem {
  id: string;
  categoryId: string | null;
  categoryName: string | null;
  name: string;
  price: string;
  currency: string;
  inStock: boolean;
  status: VetStoreProductStatus;
  primaryImageUrl: string | null;
  ratingAverage: string | null;
  ratingCount: number;
}

export interface VetStoreProductImage {
  id: string;
  url: string;
  sortOrder: number;
}

export interface VetStoreProductDetail extends VetStoreProductListItem {
  description: string | null;
  stockQuantity: number;
  attributes: Record<string, string> | null;
  images: VetStoreProductImage[];
}

export interface VetStoreAdminProduct extends VetStoreProductDetail {
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- cart ---------------------------------------------------------

export interface VetStoreCartItem {
  id: string;
  productId: string;
  name: string;
  primaryImageUrl: string | null;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
  inStock: boolean;
  availableStock: number;
}

export interface VetStoreCart {
  id: string;
  items: VetStoreCartItem[];
  itemCount: number;
  subtotalAmount: string;
  deliveryFee: string;
  totalAmount: string;
  currency: string;
}

// --- order ------------------------------------------------------

export interface VetStoreOrderItem {
  id: string;
  productId: string | null;
  name: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
}

export interface VetStoreOrder {
  id: string;
  orderNumber: string;
  userId: string;
  status: VetStoreOrderStatus;
  paymentMethod: VetStorePaymentMethod;
  paymentStatus: VetStorePaymentStatus;
  subtotalAmount: string;
  deliveryFee: string;
  totalAmount: string;
  currency: string;
  recipientName: string;
  recipientPhone: string;
  city: string;
  addressLine: string;
  note: string | null;
  items: VetStoreOrderItem[];
  placedAt: string;
  updatedAt: string;
}

// --- request payloads ----------------------------------------

export interface ListVetStoreProductsParams {
  categoryId?: string;
  search?: string;
  sort?: VetStoreProductSort;
  order?: SortOrder;
  status?: VetStoreProductStatus;
  pageSize?: number;
}

export interface CheckoutInput {
  paymentMethod: VetStorePaymentMethod;
  recipientName: string;
  recipientPhone: string;
  city: string;
  addressLine: string;
  note?: string | null;
}

export interface CreateVetStoreProductInput {
  categoryId?: string | null;
  name: string;
  description?: string | null;
  price: string;
  stockQuantity?: number;
  attributes?: Record<string, string> | null;
  status?: VetStoreProductStatus;
}

export type UpdateVetStoreProductInput = Partial<CreateVetStoreProductInput>;

export interface CreateVetStoreCategoryInput {
  slug: string;
  name: string;
  showOnHome?: boolean;
  sortOrder?: number;
  status?: VetStoreProductStatus;
}

export type UpdateVetStoreCategoryInput = Partial<CreateVetStoreCategoryInput>;

// --- pagination (mirrors @/services/api PageMeta) ------------

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
