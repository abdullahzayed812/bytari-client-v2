import { farmApi as farmJoinApi } from '@/features/farmShared';
import { apiClient } from '@/services/api';

import { poultryApi } from '../api';

// File-scope spies + a single file-level afterAll (a per-describe
// `restoreAllMocks` would un-spy the client for the next describe block).
const envelope = jest.spyOn(apiClient, 'requestEnvelope');
const get = jest.spyOn(apiClient, 'get');
const post = jest.spyOn(apiClient, 'post');
const patch = jest.spyOn(apiClient, 'patch');
const del = jest.spyOn(apiClient, 'delete');

beforeEach(() => [envelope, get, post, patch, del].forEach((s) => s.mockReset()));
afterAll(() => jest.restoreAllMocks());

describe('farmApi (farmShared) — Farm-ID join flow (organization id is never in the join body)', () => {
  it('joinByCode → POST /organizations/join with { joinCode } only', async () => {
    post.mockResolvedValueOnce({ id: 'm1', organizationId: 'o1' });
    await farmJoinApi.joinByCode({ joinCode: 'FARM-ABCD12' });
    expect(post).toHaveBeenCalledWith('/organizations/join', { joinCode: 'FARM-ABCD12' });
  });

  it('getJoinCode → GET /organizations/:id/join-code', async () => {
    get.mockResolvedValueOnce({ joinCode: 'FARM-ABCD12' });
    await farmJoinApi.getJoinCode('o1');
    expect(get).toHaveBeenCalledWith('/organizations/o1/join-code');
  });

  it('regenerateJoinCode → POST /organizations/:id/join-code/regenerate', async () => {
    post.mockResolvedValueOnce({ joinCode: 'FARM-NEW999' });
    await farmJoinApi.regenerateJoinCode('o1');
    expect(post).toHaveBeenCalledWith('/organizations/o1/join-code/regenerate');
  });
});

describe('poultryApi — always organization-scoped by the path', () => {
  it('list → GET /organizations/:id/poultry/flocks with page/pageSize + filters', async () => {
    envelope.mockResolvedValueOnce({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    await poultryApi.list('o1', { page: 1, pageSize: 20, status: 'ACTIVE', birdType: 'CHICKEN' });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/organizations/o1/poultry/flocks',
      params: { page: 1, pageSize: 20, status: 'ACTIVE', birdType: 'CHICKEN' },
    });
  });

  it('list → tolerates a missing meta block', async () => {
    envelope.mockResolvedValueOnce({ data: [] });
    const page = await poultryApi.list('o1', { page: 2, pageSize: 10 });
    expect(page.meta).toEqual({ page: 2, pageSize: 10, total: 0, totalPages: 1 });
  });

  it('get → GET .../poultry/flocks/:flockId', async () => {
    get.mockResolvedValueOnce({ id: 'f1' });
    await poultryApi.get('o1', 'f1');
    expect(get).toHaveBeenCalledWith('/organizations/o1/poultry/flocks/f1');
  });

  it('create → POST .../poultry/flocks (no organizationId / createdByUserId in the body)', async () => {
    post.mockResolvedValueOnce({ id: 'f1' });
    await poultryApi.create('o1', {
      name: 'North',
      birdType: 'CHICKEN',
      birdCount: 500,
      arrivalDate: '2026-01-02',
    });
    expect(post).toHaveBeenCalledWith('/organizations/o1/poultry/flocks', {
      name: 'North',
      birdType: 'CHICKEN',
      birdCount: 500,
      arrivalDate: '2026-01-02',
    });
  });

  it('update → PATCH .../poultry/flocks/:flockId', async () => {
    patch.mockResolvedValueOnce({ id: 'f1' });
    await poultryApi.update('o1', 'f1', { status: 'CLOSED' });
    expect(patch).toHaveBeenCalledWith('/organizations/o1/poultry/flocks/f1', { status: 'CLOSED' });
  });

  it('remove → DELETE .../poultry/flocks/:flockId', async () => {
    del.mockResolvedValueOnce({ deleted: true });
    await poultryApi.remove('o1', 'f1');
    expect(del).toHaveBeenCalledWith('/organizations/o1/poultry/flocks/f1');
  });
});
