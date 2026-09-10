import { apiClient } from '@/services/api';

import { productsApi } from '../api';
import type { Product } from '../types';

const envelope = jest.spyOn(apiClient, 'requestEnvelope');
const get = jest.spyOn(apiClient, 'get');
const post = jest.spyOn(apiClient, 'post');
const patch = jest.spyOn(apiClient, 'patch');
const del = jest.spyOn(apiClient, 'delete');

beforeEach(() => {
  [envelope, get, post, patch, del].forEach((s) => s.mockReset());
});
afterAll(() => jest.restoreAllMocks());

const product: Product = {
  id: 'p1',
  organizationId: 'o1',
  organizationType: 'VETERINARY_STORE',
  name: 'مضاد حيوي',
  description: null,
  productType: 'MEDICINE',
  price: '120.00',
  stockQuantity: 40,
  status: 'ACTIVE',
  primaryImageUrl: null,
  images: [],
  subtype: null,
  weight: null,
  usageInstructions: null,
  dosage: null,
  shelfLife: null,
  manufacturer: null,
  highlights: [],
  createdByUserId: 'u1',
  createdAt: '2026-02-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
};

describe('productsApi — 1:1 with the backend routes', () => {
  it('list() GETs the store-scoped path and maps `productType` → the `type` query param', async () => {
    envelope.mockResolvedValue({
      data: [product],
      meta: { page: 2, pageSize: 20, total: 25, totalPages: 2 },
    });
    const res = await productsApi.list('o1', {
      page: 2,
      pageSize: 20,
      status: 'ACTIVE',
      productType: 'MEDICINE',
      search: 'مضاد',
      sort: 'price',
      order: 'asc',
    });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/organizations/o1/products',
      params: {
        page: 2,
        pageSize: 20,
        status: 'ACTIVE',
        type: 'MEDICINE',
        search: 'مضاد',
        sort: 'price',
        order: 'asc',
      },
    });
    expect(res.items).toHaveLength(1);
    expect(res.meta.total).toBe(25);
  });

  it('list() tolerates a missing `meta` envelope', async () => {
    envelope.mockResolvedValue({ data: [product] } as never);
    const res = await productsApi.list('o1', { page: 1, pageSize: 20 });
    expect(res.meta).toEqual({ page: 1, pageSize: 20, total: 1, totalPages: 1 });
  });

  it('get() / create() / update() / remove() / adjustStock() hit the right URLs & bodies', async () => {
    get.mockResolvedValue(product);
    post.mockResolvedValue(product);
    patch.mockResolvedValue(product);
    del.mockResolvedValue(product);

    await productsApi.get('o1', 'p1');
    expect(get).toHaveBeenCalledWith('/organizations/o1/products/p1');

    await productsApi.create('o1', { name: 'x', productType: 'EQUIPMENT_SUPPLY', price: '10.00' });
    expect(post).toHaveBeenCalledWith('/organizations/o1/products', {
      name: 'x',
      productType: 'EQUIPMENT_SUPPLY',
      price: '10.00',
    });

    await productsApi.update('o1', 'p1', { status: 'INACTIVE' });
    expect(patch).toHaveBeenCalledWith('/organizations/o1/products/p1', { status: 'INACTIVE' });

    await productsApi.remove('o1', 'p1');
    expect(del).toHaveBeenCalledWith('/organizations/o1/products/p1');

    await productsApi.adjustStock('o1', 'p1', { delta: -12, reason: 'جرد' });
    expect(post).toHaveBeenCalledWith('/organizations/o1/products/p1/stock', {
      delta: -12,
      reason: 'جرد',
    });
  });
});
