import { apiClient } from '@/services/api';

import { petOwnerStoreService } from '../api';
import { formatAmount } from '../utils';

const envelope = jest.spyOn(apiClient, 'requestEnvelope');
const get = jest.spyOn(apiClient, 'get');
const post = jest.spyOn(apiClient, 'post');
const patch = jest.spyOn(apiClient, 'patch');
const del = jest.spyOn(apiClient, 'delete');

beforeEach(() => {
  [envelope, get, post, patch, del].forEach((s) => s.mockReset());
});
afterAll(() => jest.restoreAllMocks());

describe('petOwnerStoreService — 1:1 with /pet-owner-store/*', () => {
  it('listProducts() GETs the catalogue with search + category filter + pagination', async () => {
    envelope.mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    await petOwnerStoreService.listProducts({
      page: 1,
      pageSize: 20,
      categoryId: 'c1',
      search: 'طعام',
      sort: 'price',
      order: 'asc',
    });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/pet-owner-store/products',
      params: {
        page: 1,
        pageSize: 20,
        categoryId: 'c1',
        search: 'طعام',
        sort: 'price',
        order: 'asc',
      },
    });
  });

  it('listCategories() passes homeOnly only when requested', async () => {
    get.mockResolvedValue([]);
    await petOwnerStoreService.listCategories(true);
    expect(get).toHaveBeenCalledWith('/pet-owner-store/categories', { homeOnly: 'true' });
    await petOwnerStoreService.listCategories();
    expect(get).toHaveBeenLastCalledWith('/pet-owner-store/categories', undefined);
  });

  it('cart mutations hit the item-scoped routes', async () => {
    post.mockResolvedValue({});
    patch.mockResolvedValue({});
    del.mockResolvedValue({});
    await petOwnerStoreService.addCartItem('p1', 2);
    expect(post).toHaveBeenCalledWith('/pet-owner-store/cart/items', {
      productId: 'p1',
      quantity: 2,
    });
    await petOwnerStoreService.updateCartItem('i1', 3);
    expect(patch).toHaveBeenCalledWith('/pet-owner-store/cart/items/i1', { quantity: 3 });
    await petOwnerStoreService.removeCartItem('i1');
    expect(del).toHaveBeenCalledWith('/pet-owner-store/cart/items/i1');
  });

  it('placeOrder() POSTs the checkout payload', async () => {
    post.mockResolvedValue({});
    await petOwnerStoreService.placeOrder({
      paymentMethod: 'COD',
      recipientName: 'أحمد',
      recipientPhone: '0551234567',
      city: 'الرياض',
      addressLine: 'حي الياسمين',
      note: null,
    });
    expect(post).toHaveBeenCalledWith(
      '/pet-owner-store/orders',
      expect.objectContaining({ paymentMethod: 'COD', city: 'الرياض' }),
    );
  });
});

describe('formatAmount', () => {
  it('drops a trailing .00 but keeps real fractions', () => {
    expect(formatAmount('85.00')).toBe('85');
    expect(formatAmount('12.50')).toBe('12.50');
    expect(formatAmount('0.00')).toBe('0');
  });
});
