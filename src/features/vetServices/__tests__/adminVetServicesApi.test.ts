import { apiClient } from '@/services/api';

import { adminVetServicesApi } from '../api';

const envelope = jest.spyOn(apiClient, 'requestEnvelope');
const get = jest.spyOn(apiClient, 'get');
const post = jest.spyOn(apiClient, 'post');

beforeEach(() => [envelope, get, post].forEach((s) => s.mockReset()));
afterAll(() => jest.restoreAllMocks());

describe('adminVetServicesApi — listing moderation queue', () => {
  it('listListings → GET /admin/vet-service-listings with page/pageSize/status', async () => {
    envelope.mockResolvedValueOnce({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } });
    await adminVetServicesApi.listListings(2, 20, { status: 'PENDING' });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/admin/vet-service-listings',
      params: { page: 2, pageSize: 20, status: 'PENDING' },
    });
  });

  it('listListings → tolerates a missing meta block', async () => {
    envelope.mockResolvedValueOnce({ data: [] });
    const page = await adminVetServicesApi.listListings(3, 10);
    expect(page.meta).toEqual({ page: 3, pageSize: 10, total: 0, totalPages: 1 });
  });

  it('getListing / approveListing / rejectListing hit the admin endpoints', async () => {
    get.mockResolvedValueOnce({ id: 'l1' });
    await adminVetServicesApi.getListing('l1');
    expect(get).toHaveBeenCalledWith('/admin/vet-service-listings/l1');

    post.mockResolvedValueOnce({ id: 'l1', status: 'APPROVED' });
    await adminVetServicesApi.approveListing('l1');
    expect(post).toHaveBeenCalledWith('/admin/vet-service-listings/l1/approve');

    post.mockResolvedValueOnce({ id: 'l1', status: 'REJECTED' });
    await adminVetServicesApi.rejectListing('l1', 'missing info');
    expect(post).toHaveBeenCalledWith('/admin/vet-service-listings/l1/reject', { reason: 'missing info' });
  });
});

describe('adminVetServicesApi — request moderation queue', () => {
  it('listRequests → GET /admin/vet-service-requests', async () => {
    envelope.mockResolvedValueOnce({ data: [] });
    await adminVetServicesApi.listRequests(1, 20, { status: 'APPROVED' });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/admin/vet-service-requests',
      params: { page: 1, pageSize: 20, status: 'APPROVED' },
    });
  });

  it('approveRequest / rejectRequest hit the admin endpoints', async () => {
    post.mockResolvedValueOnce({ id: 'r1', status: 'APPROVED' });
    await adminVetServicesApi.approveRequest('r1');
    expect(post).toHaveBeenCalledWith('/admin/vet-service-requests/r1/approve');

    post.mockResolvedValueOnce({ id: 'r1', status: 'REJECTED' });
    await adminVetServicesApi.rejectRequest('r1', 'out of scope');
    expect(post).toHaveBeenCalledWith('/admin/vet-service-requests/r1/reject', { reason: 'out of scope' });
  });
});
