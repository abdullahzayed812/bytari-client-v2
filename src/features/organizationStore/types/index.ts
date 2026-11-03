/**
 * Organization Store contract — the Clinic Store and the Veterinary Office
 * Store (cart, checkout, orders, tracking). Mirrors
 * `server/src/modules/organization-store/domain/organization-store.types.ts`.
 *
 *   Customer  /organization-store/carts
 *             /organization-store/organizations/:orgId/cart[/items[/:itemId]]
 *             /organization-store/organizations/:orgId/orders      (checkout)
 *             /organization-store/orders[/:orderId[/cancel]]
 *   Seller    /organizations/:orgId/store-orders[/summary|/:orderId[/status]]
 *
 * Products are the organization's own catalogue (`/office-products`, see
 * `@/features/veterinaryOffices`). Money is always a decimal string.
 */

export const ORG_STORE_ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;
export type OrgStoreOrderStatus = (typeof ORG_STORE_ORDER_STATUSES)[number];

/** Seller transitions — mirrors the server's `ORGANIZATION_STORE_ORDER_TRANSITIONS`. */
export const ORG_STORE_ORDER_TRANSITIONS: Record<OrgStoreOrderStatus, OrgStoreOrderStatus[]> = {
  PENDING: ['CONFIRMED', 'PROCESSING', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'SHIPPED', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

/** The happy-path steps shown on the tracking timeline. */
export const ORG_STORE_TRACKING_STEPS: readonly OrgStoreOrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
];

export type OrgStoreType = 'CLINIC' | 'VETERINARY_OFFICE';
export type OrgStoreCurrency = 'IQD' | 'USD';

export interface OrgStoreCartItem {
  id: string;
  productId: string;
  name: string;
  primaryImageUrl: string | null;
  unitPrice: string | null;
  currency: OrgStoreCurrency;
  quantity: number;
  lineTotal: string | null;
  /** ACTIVE, visible and priced right now. */
  available: boolean;
}

export interface OrgStoreCart {
  id: string | null;
  organizationId: string;
  items: OrgStoreCartItem[];
  itemCount: number;
  subtotalAmount: string;
  deliveryFee: string;
  totalAmount: string;
  currency: OrgStoreCurrency | null;
}

export interface OrgStoreCartSummary {
  organizationId: string;
  organizationName: string;
  organizationType: OrgStoreType;
  itemCount: number;
}

export interface OrgStoreOrderItem {
  id: string;
  productId: string | null;
  name: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
}

export interface OrgStoreOrderEvent {
  id: string;
  fromStatus: OrgStoreOrderStatus | null;
  toStatus: OrgStoreOrderStatus;
  actorSide: 'CUSTOMER' | 'SELLER';
  note: string | null;
  createdAt: string;
}

export interface OrgStoreOrder {
  id: string;
  orderNumber: string;
  organization: { id: string; name: string; type: OrgStoreType; logoUrl: string | null };
  customer: { id: string; firstName: string; lastName: string } | null;
  status: OrgStoreOrderStatus;
  paymentMethod: 'COD';
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  subtotalAmount: string;
  deliveryFee: string;
  totalAmount: string;
  currency: OrgStoreCurrency;
  recipientName: string;
  recipientPhone: string;
  city: string;
  addressLine: string;
  note: string | null;
  items: OrgStoreOrderItem[];
  itemCount: number;
  /** Seller view: nobody on the store side opened it yet. */
  isNew?: boolean;
  /** Customer view: still cancellable (PENDING). */
  canCancel?: boolean;
  /** Detail views: the tracking timeline, oldest first. */
  history?: OrgStoreOrderEvent[];
  placedAt: string;
  updatedAt: string;
}

export interface OrgStoreOrdersSummary {
  newCount: number;
  pendingCount: number;
  activeCount: number;
  deliveredCount: number;
  totalCount: number;
}

export interface OrgStoreCheckoutInput {
  paymentMethod: 'COD';
  recipientName: string;
  recipientPhone: string;
  city: string;
  addressLine: string;
  note?: string | null;
}

export interface Paginated<T> {
  items: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}
