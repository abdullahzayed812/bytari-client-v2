import { apiClient } from '@/services/api';

import { veterinarianStoreService } from '../api';
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

describe('veterinarianStoreService — 1:1 with /veterinarian-store/*', () => {
  it('listProducts() GETs the catalogue with search + category filter + pagination', async () => {
    envelope.mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    await veterinarianStoreService.listProducts({
      page: 1,
      pageSize: 20,
      categoryId: 'c1',
      search: 'طعام',
      sort: 'price',
      order: 'asc',
    });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/veterinarian-store/products',
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
    await veterinarianStoreService.listCategories(true);
    expect(get).toHaveBeenCalledWith('/veterinarian-store/categories', { homeOnly: 'true' });
    await veterinarianStoreService.listCategories();
    expect(get).toHaveBeenLastCalledWith('/veterinarian-store/categories', undefined);
  });

  it('cart mutations hit the item-scoped routes', async () => {
    post.mockResolvedValue({});
    patch.mockResolvedValue({});
    del.mockResolvedValue({});
    await veterinarianStoreService.addCartItem('p1', 2);
    expect(post).toHaveBeenCalledWith('/veterinarian-store/cart/items', {
      productId: 'p1',
      quantity: 2,
    });
    await veterinarianStoreService.updateCartItem('i1', 3);
    expect(patch).toHaveBeenCalledWith('/veterinarian-store/cart/items/i1', { quantity: 3 });
    await veterinarianStoreService.removeCartItem('i1');
    expect(del).toHaveBeenCalledWith('/veterinarian-store/cart/items/i1');
  });

  it('placeOrder() POSTs the checkout payload', async () => {
    post.mockResolvedValue({});
    await veterinarianStoreService.placeOrder({
      paymentMethod: 'COD',
      recipientName: 'أحمد',
      recipientPhone: '0551234567',
      city: 'الرياض',
      addressLine: 'حي الياسمين',
      note: null,
    });
    expect(post).toHaveBeenCalledWith(
      '/veterinarian-store/orders',
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
