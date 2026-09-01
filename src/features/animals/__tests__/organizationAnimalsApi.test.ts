import { apiClient } from '@/services/api';

import { organizationAnimalsApi } from '../api';

describe('organizationAnimalsApi — clinic-scoped animal-access wrappers', () => {
  const envelope = jest.spyOn(apiClient, 'requestEnvelope');
  const post = jest.spyOn(apiClient, 'post');
  const del = jest.spyOn(apiClient, 'delete');

  beforeEach(() => jest.clearAllMocks());
  afterAll(() => jest.restoreAllMocks());

  it('list → GET /organizations/:id/animal-access with page/pageSize only (no search param)', async () => {
    envelope.mockResolvedValueOnce({
      data: [
        { id: 'g1', animalId: 'a1', animal: { name: 'لولو', species: 'DOG', status: 'ACTIVE' } },
      ],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    const page = await organizationAnimalsApi.list('o1', 1, 20);
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/organizations/o1/animal-access',
      params: { page: 1, pageSize: 20 },
    });
    expect(page.items).toHaveLength(1);
    expect(page.meta.total).toBe(1);
  });

  it('list → tolerates a missing meta block', async () => {
    envelope.mockResolvedValueOnce({ data: [] });
    const page = await organizationAnimalsApi.list('o1', 2, 10);
    expect(page.meta).toEqual({ page: 2, pageSize: 10, total: 0, totalPages: 1 });
  });

  it('grant → POST /organizations/:id/animal-access with { animalId } only', async () => {
    post.mockResolvedValueOnce({ id: 'g1', animalId: 'a1', status: 'ACTIVE' });
    await organizationAnimalsApi.grant('o1', { animalId: 'a1' });
    expect(post).toHaveBeenCalledWith('/organizations/o1/animal-access', { animalId: 'a1' });
  });

  it('revoke → DELETE /organizations/:id/animal-access/:animalId', async () => {
    del.mockResolvedValueOnce({ revoked: true });
    await organizationAnimalsApi.revoke('o1', 'a1');
    expect(del).toHaveBeenCalledWith('/organizations/o1/animal-access/a1');
  });
});
