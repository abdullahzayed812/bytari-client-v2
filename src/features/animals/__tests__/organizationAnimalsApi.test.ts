import { apiClient } from '@/services/api';

import { organizationAnimalsApi } from '../api';

describe('organizationAnimalsApi — clinic pets (record-derived, no link)', () => {
  const envelope = jest.spyOn(apiClient, 'requestEnvelope');
  const get = jest.spyOn(apiClient, 'get');

  beforeEach(() => jest.clearAllMocks());
  afterAll(() => jest.restoreAllMocks());

  it('list → GET /organizations/:id/clinic-pets with page/pageSize (+ optional search)', async () => {
    envelope.mockResolvedValueOnce({
      data: [
        {
          animalId: 'a1',
          publicCode: 'K7M4QXR',
          animal: { name: 'لولو', species: 'DOG', status: 'ACTIVE' },
          firstActivityAt: '2026-01-01T00:00:00.000Z',
          lastActivityAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    const page = await organizationAnimalsApi.list('o1', 1, 20);
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/organizations/o1/clinic-pets',
      params: { page: 1, pageSize: 20 },
    });
    expect(page.items).toHaveLength(1);
    expect(page.meta.total).toBe(1);

    envelope.mockResolvedValueOnce({ data: [] });
    await organizationAnimalsApi.list('o1', 1, 50, 'K7M-4QXR');
    expect(envelope).toHaveBeenLastCalledWith({
      method: 'GET',
      url: '/organizations/o1/clinic-pets',
      params: { page: 1, pageSize: 50, search: 'K7M-4QXR' },
    });
  });

  it('list → tolerates a missing meta block', async () => {
    envelope.mockResolvedValueOnce({ data: [] });
    const page = await organizationAnimalsApi.list('o1', 2, 10);
    expect(page.meta).toEqual({ page: 2, pageSize: 10, total: 0, totalPages: 1 });
  });

  it('lookup → GET /organizations/:id/clinic-pets/lookup?code (a read — links nothing)', async () => {
    get.mockResolvedValueOnce({ animalId: 'a1', publicCode: 'K7M4QXR' });
    await organizationAnimalsApi.lookup('o1', 'K7M4QXR');
    expect(get).toHaveBeenCalledWith('/organizations/o1/clinic-pets/lookup', { code: 'K7M4QXR' });
  });

  it('has no grant / revoke endpoints any more', () => {
    expect(organizationAnimalsApi).not.toHaveProperty('grant');
    expect(organizationAnimalsApi).not.toHaveProperty('revoke');
  });
});
