import { apiClient } from '@/services/api';

import { organizationStoreService } from '../api';

const envelope = jest.spyOn(apiClient, 'requestEnvelope');
const get = jest.spyOn(apiClient, 'get');
const post = jest.spyOn(apiClient, 'post');
const patch = jest.spyOn(apiClient, 'patch');
const del = jest.spyOn(apiClient, 'delete');

beforeEach(() => {
  [envelope, get, post, patch, del].forEach((s) => s.mockReset());
});
afterAll(() => jest.restoreAllMocks());

describe('organizationStoreService — customer side', () => {
  it('cart calls are scoped to one store', async () => {
    get.mockResolvedValue({});
    post.mockResolvedValue({});
    patch.mockResolvedValue({});
    del.mockResolvedValue({});
    await organizationStoreService.getCart('org1');
    expect(get).toHaveBeenCalledWith('/organization-store/organizations/org1/cart');
    await organizationStoreService.addCartItem('org1', 'p1', 3);
    expect(post).toHaveBeenCalledWith('/organization-store/organizations/org1/cart/items', {
      productId: 'p1',
      quantity: 3,
    });
    await organizationStoreService.updateCartItem('org1', 'i1', 2);
    expect(patch).toHaveBeenCalledWith('/organization-store/organizations/org1/cart/items/i1', {
      quantity: 2,
    });
    await organizationStoreService.removeCartItem('org1', 'i1');
    expect(del).toHaveBeenCalledWith('/organization-store/organizations/org1/cart/items/i1');
    await organizationStoreService.clearCart('org1');
    expect(del).toHaveBeenLastCalledWith('/organization-store/organizations/org1/cart');
  });

  it('checkout POSTs the delivery details to the store; cancel posts a note', async () => {
    post.mockResolvedValue({ id: 'o1' });
    const input = {
      paymentMethod: 'COD' as const,
      recipientName: 'أحمد',
      recipientPhone: '07701234567',
      city: 'بغداد',
      addressLine: 'الكرادة',
      note: null,
    };
    await organizationStoreService.placeOrder('org1', input);
    expect(post).toHaveBeenCalledWith('/organization-store/organizations/org1/orders', input);
    await organizationStoreService.cancelMyOrder('o1', '');
    expect(post).toHaveBeenLastCalledWith('/organization-store/orders/o1/cancel', { note: null });
  });

  it('listMyOrders() pages through the customer orders with filters', async () => {
    envelope.mockResolvedValue({
      data: [],
      meta: { page: 2, pageSize: 20, total: 21, totalPages: 2 },
    });
    const res = await organizationStoreService.listMyOrders({
      page: 2,
      pageSize: 20,
      status: 'PENDING',
    });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/organization-store/orders',
      params: {
        page: 2,
        pageSize: 20,
        status: 'PENDING',
        organizationId: undefined,
        organizationType: undefined,
      },
    });
    expect(res.meta.total).toBe(21);
  });
});

describe('organizationStoreService — seller side', () => {
  it('incoming orders live under the organization', async () => {
    envelope.mockResolvedValue({ data: [], meta: undefined });
    await organizationStoreService.listIncomingOrders('org1', {
      page: 1,
      pageSize: 20,
      newOnly: true,
      search: '',
    });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/organizations/org1/store-orders',
      params: { page: 1, pageSize: 20, status: undefined, newOnly: 'true', search: undefined },
    });

    get.mockResolvedValue({});
    await organizationStoreService.incomingOrdersSummary('org1');
    expect(get).toHaveBeenCalledWith('/organizations/org1/store-orders/summary');

    patch.mockResolvedValue({});
    await organizationStoreService.updateIncomingOrderStatus('org1', 'o1', 'CONFIRMED', 'جاهز');
    expect(patch).toHaveBeenCalledWith('/organizations/org1/store-orders/o1/status', {
      status: 'CONFIRMED',
      note: 'جاهز',
    });
  });
});

describe('organizationStoreService — order messaging', () => {
  it('opens the chat through the order-scoped endpoints (customer / seller)', async () => {
    post.mockResolvedValue({ id: 'c1' });
    await organizationStoreService.openMyOrderConversation('o1');
    expect(post).toHaveBeenCalledWith('/organization-store/orders/o1/conversation');
    await organizationStoreService.openIncomingOrderConversation('org1', 'o1');
    expect(post).toHaveBeenLastCalledWith('/organizations/org1/store-orders/o1/conversation');
  });
});
