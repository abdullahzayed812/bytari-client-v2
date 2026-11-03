import { notificationHref } from '@/features/notifications/constants';
import { orgCapabilities, permissionGroupsFor } from '@/features/organizations/constants';

describe('store order notifications deep-link by audience', () => {
  const base = { entityType: 'ORGANIZATION_STORE_ORDER', entityId: 'o1' };
  it('the store side opens its incoming order', () => {
    expect(
      notificationHref({
        ...base,
        type: 'STORE_ORDER_PLACED',
        data: { orderId: 'o1', organizationId: 'org1', store: 'ORGANIZATION', audience: 'SELLER' },
      }),
    ).toBe('/(app)/organization-store/org1/incoming-orders/o1');
    expect(
      notificationHref({
        ...base,
        type: 'STORE_ORDER_UPDATED',
        data: { orderId: 'o1', organizationId: 'org1', store: 'ORGANIZATION', audience: 'SELLER' },
      }),
    ).toBe('/(app)/organization-store/org1/incoming-orders/o1');
  });
  it('the customer opens their order tracking', () => {
    for (const type of ['STORE_ORDER_SUBMITTED', 'STORE_ORDER_STATUS_CHANGED'] as const) {
      expect(
        notificationHref({
          ...base,
          type,
          data: {
            orderId: 'o1',
            organizationId: 'org1',
            store: 'ORGANIZATION',
            audience: 'CUSTOMER',
          },
        }),
      ).toBe('/(app)/organization-store/orders/o1');
    }
  });
  it('platform store notifications keep their old destinations', () => {
    expect(
      notificationHref({
        type: 'STORE_ORDER_STATUS_CHANGED',
        entityType: 'STORE_ORDER',
        entityId: 'o2',
        data: { orderId: 'o2', store: 'PET_OWNER_STORE' },
      }),
    ).toBe('/(app)/pet-owner-store/orders/o2');
  });
});

describe('store order capabilities + supervisor permission groups', () => {
  it('order access follows the granted keys; owner / admin always', () => {
    expect(orgCapabilities('OWNER', false).canManageStoreOrders).toBe(true);
    expect(orgCapabilities('STAFF', true).canViewStoreOrders).toBe(true);
    expect(orgCapabilities('STAFF', false, ['product.read']).canViewStoreOrders).toBe(false);
    const sup = orgCapabilities('SUPERVISOR', false, ['store.order.read']);
    expect(sup.canViewStoreOrders).toBe(true);
    expect(sup.canManageStoreOrders).toBe(false);
  });
  it('clinics and offices can grant store keys; a veterinary store has no orders group', () => {
    const keys = (type: Parameters<typeof permissionGroupsFor>[0]) =>
      permissionGroupsFor(type).flatMap((g) => [...g.permissions]);
    expect(keys('CLINIC')).toEqual(
      expect.arrayContaining(['product.create', 'store.order.read', 'store.order.manage']),
    );
    expect(keys('VETERINARY_OFFICE')).toEqual(expect.arrayContaining(['store.order.manage']));
    expect(keys('VETERINARY_STORE')).not.toContain('store.order.read');
  });
});
