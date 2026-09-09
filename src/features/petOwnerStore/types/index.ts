/**
 * Pet Owners Store contract — mirrors `server/src/modules/pet-owner-store`
 * (`pet-owner-store.types.ts` + OpenAPI `petOwnerStore`) EXACTLY. No invented
 * fields. Money is always a decimal string (`numeric(12,2)`), never a JS number.
 *
 * Consumer browse / cart / checkout / order history need only authentication.
 * The Veterinarians Store (future) will reuse the same cart/checkout/order
 * shapes with its own screens and naming.
 */

export const PET_STORE_ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;
export type PetStoreOrderStatus = (typeof PET_STORE_ORDER_STATUSES)[number];

export const PET_STORE_PAYMENT_METHODS = ['COD', 'MADA', 'CREDIT_CARD'] as const;
export type PetStorePaymentMethod = (typeof PET_STORE_PAYMENT_METHODS)[number];
/** Only COD is accepted by the backend right now; the rest render disabled. */
export const PET_STORE_ENABLED_PAYMENT_METHODS: PetStorePaymentMethod[] = ['COD'];

export type PetStorePaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';
export type PetStoreProductStatus = 'ACTIVE' | 'INACTIVE';

export type PetStoreProductSort = 'name' | 'price' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

// --- category -------------------------------------------------------

export interface PetStoreCategory {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  showOnHome: boolean;
  sortOrder: number;
  status: PetStoreProductStatus;
  /** Present on the admin list only. */
  productCount?: number;
}

// --- product -------------------------------------------------------

export interface PetStoreProductListItem {
  id: string;
  categoryId: string | null;
  categoryName: string | null;
  name: string;
  price: string;
  currency: string;
  inStock: boolean;
  status: PetStoreProductStatus;
  primaryImageUrl: string | null;
  ratingAverage: string | null;
  ratingCount: number;
}

export interface PetStoreProductImage {
  id: string;
  url: string;
  sortOrder: number;
}

export interface PetStoreProductDetail extends PetStoreProductListItem {
  description: string | null;
  stockQuantity: number;
  attributes: Record<string, string> | null;
  images: PetStoreProductImage[];
}

export interface PetStoreAdminProduct extends PetStoreProductDetail {
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- cart ---------------------------------------------------------

export interface PetStoreCartItem {
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

export interface PetStoreCart {
  id: string;
  items: PetStoreCartItem[];
  itemCount: number;
  subtotalAmount: string;
  deliveryFee: string;
  totalAmount: string;
  currency: string;
}

// --- order ------------------------------------------------------

export interface PetStoreOrderItem {
  id: string;
  productId: string | null;
  name: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
}

export interface PetStoreOrder {
  id: string;
  orderNumber: string;
  userId: string;
  status: PetStoreOrderStatus;
  paymentMethod: PetStorePaymentMethod;
  paymentStatus: PetStorePaymentStatus;
  subtotalAmount: string;
  deliveryFee: string;
  totalAmount: string;
  currency: string;
  recipientName: string;
  recipientPhone: string;
  city: string;
  addressLine: string;
  note: string | null;
  items: PetStoreOrderItem[];
  placedAt: string;
  updatedAt: string;
}

// --- request payloads ----------------------------------------

export interface ListPetStoreProductsParams {
  categoryId?: string;
  search?: string;
  sort?: PetStoreProductSort;
  order?: SortOrder;
  status?: PetStoreProductStatus;
  pageSize?: number;
}

export interface CheckoutInput {
  paymentMethod: PetStorePaymentMethod;
  recipientName: string;
  recipientPhone: string;
  city: string;
  addressLine: string;
  note?: string | null;
}

export interface CreatePetStoreProductInput {
  categoryId?: string | null;
  name: string;
  description?: string | null;
  price: string;
  stockQuantity?: number;
  attributes?: Record<string, string> | null;
  status?: PetStoreProductStatus;
}

export type UpdatePetStoreProductInput = Partial<CreatePetStoreProductInput>;

export interface CreatePetStoreCategoryInput {
  slug: string;
  name: string;
  showOnHome?: boolean;
  sortOrder?: number;
  status?: PetStoreProductStatus;
}

export type UpdatePetStoreCategoryInput = Partial<CreatePetStoreCategoryInput>;

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
