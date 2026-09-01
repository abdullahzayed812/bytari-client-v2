import { apiClient } from '@/services/api';

import { petsApi } from '../api';

describe('petsApi — endpoint wrappers', () => {
  const envelope = jest.spyOn(apiClient, 'requestEnvelope');
  const get = jest.spyOn(apiClient, 'get');
  const post = jest.spyOn(apiClient, 'post');
  const patch = jest.spyOn(apiClient, 'patch');
  const del = jest.spyOn(apiClient, 'delete');

  beforeEach(() => jest.clearAllMocks());
  afterAll(() => jest.restoreAllMocks());

  it('list → GET /animals with pagination + filter params, returns { items, meta }', async () => {
    envelope.mockResolvedValueOnce({
      data: [{ id: 'p1' }],
      meta: { page: 2, pageSize: 20, total: 25, totalPages: 2 },
    });
    const page = await petsApi.list({ page: 2, pageSize: 20, status: 'ACTIVE', search: 'lulu' });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/animals',
      params: { page: 2, pageSize: 20, status: 'ACTIVE', species: undefined, search: 'lulu' },
    });
    expect(page.items).toHaveLength(1);
    expect(page.meta).toEqual({ page: 2, pageSize: 20, total: 25, totalPages: 2 });
  });

  it('list → tolerates a missing meta block', async () => {
    envelope.mockResolvedValueOnce({ data: [] });
    const page = await petsApi.list({ page: 1, pageSize: 20 });
    expect(page.meta).toEqual({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  });

  it('get → GET /animals/:id', async () => {
    get.mockResolvedValueOnce({ id: 'p1' });
    await petsApi.get('p1');
    expect(get).toHaveBeenCalledWith('/animals/p1');
  });

  it('create → POST /animals (no ownerId in the body)', async () => {
    post.mockResolvedValueOnce({ id: 'p1' });
    await petsApi.create({ name: 'Lulu', species: 'CAT' });
    expect(post).toHaveBeenCalledWith('/animals', { name: 'Lulu', species: 'CAT' });
  });

  it('update → PATCH /animals/:id', async () => {
    patch.mockResolvedValueOnce({ id: 'p1' });
    await petsApi.update('p1', { name: 'Lu' });
    expect(patch).toHaveBeenCalledWith('/animals/p1', { name: 'Lu' });
  });

  it('deactivate → DELETE /animals/:id', async () => {
    del.mockResolvedValueOnce({ id: 'p1', status: 'DEACTIVATED' });
    await petsApi.deactivate('p1');
    expect(del).toHaveBeenCalledWith('/animals/p1');
  });
});
