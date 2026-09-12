import { apiClient } from '@/services/api';

import { syndicatesApi } from '../api';

const envelope = jest.spyOn(apiClient, 'requestEnvelope');
const get = jest.spyOn(apiClient, 'get');
const post = jest.spyOn(apiClient, 'post');
const patch = jest.spyOn(apiClient, 'patch');
const del = jest.spyOn(apiClient, 'delete');

beforeEach(() => [envelope, get, post, patch, del].forEach((s) => s.mockReset()));
afterAll(() => jest.restoreAllMocks());

describe('syndicatesApi — profile', () => {
  it('listMain → GET /syndicates with filters', async () => {
    envelope.mockResolvedValueOnce({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } });
    await syndicatesApi.listMain({ page: 1, pageSize: 20, search: 'بيطري' });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/syndicates',
      params: { page: 1, pageSize: 20, search: 'بيطري' },
    });
  });

  it('getOne → GET /syndicates/:organizationId', async () => {
    get.mockResolvedValueOnce({});
    await syndicatesApi.getOne('s1');
    expect(get).toHaveBeenCalledWith('/syndicates/s1');
  });

  it('listBranches → GET /syndicates/:organizationId/branches', async () => {
    envelope.mockResolvedValueOnce({ data: [] });
    await syndicatesApi.listBranches('s1', { page: 1, pageSize: 20 });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/syndicates/s1/branches',
      params: { page: 1, pageSize: 20, search: undefined },
    });
  });

  it('updateProfile → PATCH /syndicates/:organizationId/profile', async () => {
    patch.mockResolvedValueOnce({});
    await syndicatesApi.updateProfile('s1', { name: 'محدث' });
    expect(patch).toHaveBeenCalledWith('/syndicates/s1/profile', { name: 'محدث' });
  });
});

describe('syndicatesApi — announcements', () => {
  it('listAnnouncements → GET /syndicates/:organizationId/announcements', async () => {
    envelope.mockResolvedValueOnce({ data: [] });
    await syndicatesApi.listAnnouncements('s1', { page: 1, pageSize: 20 });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/syndicates/s1/announcements',
      params: { page: 1, pageSize: 20 },
    });
  });

  it('createAnnouncement → POST /syndicates/:organizationId/announcements', async () => {
    post.mockResolvedValueOnce({});
    await syndicatesApi.createAnnouncement('s1', { type: 'ANNOUNCEMENT', title: 'عنوان', body: 'نص' });
    expect(post).toHaveBeenCalledWith(
      '/syndicates/s1/announcements',
      expect.objectContaining({ title: 'عنوان' }),
    );
  });

  it('deleteAnnouncement → DELETE /syndicates/:organizationId/announcements/:id', async () => {
    del.mockResolvedValueOnce({});
    await syndicatesApi.deleteAnnouncement('s1', 'a1');
    expect(del).toHaveBeenCalledWith('/syndicates/s1/announcements/a1');
  });
});

describe('syndicatesApi — submissions', () => {
  it('createSubmission → POST /syndicates/:organizationId/submissions', async () => {
    post.mockResolvedValueOnce({});
    await syndicatesApi.createSubmission('s1', { kind: 'INQUIRY', message: 'استفسار' });
    expect(post).toHaveBeenCalledWith(
      '/syndicates/s1/submissions',
      expect.objectContaining({ kind: 'INQUIRY' }),
    );
  });

  it('respondToSubmission → POST .../respond', async () => {
    post.mockResolvedValueOnce({});
    await syndicatesApi.respondToSubmission('s1', 'sub1', 'الرد');
    expect(post).toHaveBeenCalledWith('/syndicates/s1/submissions/sub1/respond', { responseText: 'الرد' });
  });

  it('closeSubmission → POST .../close', async () => {
    post.mockResolvedValueOnce({});
    await syndicatesApi.closeSubmission('s1', 'sub1');
    expect(post).toHaveBeenCalledWith('/syndicates/s1/submissions/sub1/close');
  });

  it('listMySubmissions → GET /syndicates/submissions/mine', async () => {
    envelope.mockResolvedValueOnce({ data: [] });
    await syndicatesApi.listMySubmissions({ page: 1, pageSize: 20, kind: 'REQUEST' });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/syndicates/submissions/mine',
      params: { page: 1, pageSize: 20, kind: 'REQUEST' },
    });
  });

  it('getMySubmission → GET /syndicates/submissions/mine/:id', async () => {
    get.mockResolvedValueOnce({});
    await syndicatesApi.getMySubmission('sub1');
    expect(get).toHaveBeenCalledWith('/syndicates/submissions/mine/sub1');
  });
});
