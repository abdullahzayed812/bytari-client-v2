import { apiClient } from '@/services/api';

import { adminPublicationsApi } from '../api';

const envelope = jest.spyOn(apiClient, 'requestEnvelope');
const get = jest.spyOn(apiClient, 'get');
const post = jest.spyOn(apiClient, 'post');

beforeEach(() => {
  envelope.mockReset().mockResolvedValue({
    data: [],
    meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
  });
  get.mockReset().mockResolvedValue({});
  post.mockReset().mockResolvedValue({});
});
afterAll(() => jest.restoreAllMocks());

describe('adminPublicationsApi — Lost/Adoption/Mating moderation queue', () => {
  it('list → GET /admin/animal-publications with kind + status', async () => {
    await adminPublicationsApi.list(1, 20, { kind: 'ADOPTION', status: 'PENDING' });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/admin/animal-publications',
      params: { page: 1, pageSize: 20, kind: 'ADOPTION', status: 'PENDING' },
    });
  });

  it('get / approve / reject hit the id-scoped routes', async () => {
    await adminPublicationsApi.get('p1');
    expect(get).toHaveBeenCalledWith('/admin/animal-publications/p1');

    await adminPublicationsApi.approve('p1');
    expect(post).toHaveBeenCalledWith('/admin/animal-publications/p1/approve');

    await adminPublicationsApi.reject('p1', 'incomplete details');
    expect(post).toHaveBeenCalledWith('/admin/animal-publications/p1/reject', {
      reason: 'incomplete details',
    });
  });
});
