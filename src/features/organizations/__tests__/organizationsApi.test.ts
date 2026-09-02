import { apiClient } from '@/services/api';

import { organizationsApi } from '../api';

describe('organizationsApi — endpoint wrappers (mirror the backend routes exactly)', () => {
  const envelope = jest.spyOn(apiClient, 'requestEnvelope');
  const get = jest.spyOn(apiClient, 'get');
  const post = jest.spyOn(apiClient, 'post');
  const patch = jest.spyOn(apiClient, 'patch');
  const del = jest.spyOn(apiClient, 'delete');

  beforeEach(() => jest.clearAllMocks());
  afterAll(() => jest.restoreAllMocks());

  it('listMine → GET /organizations with pagination, returns { items, meta }', async () => {
    envelope.mockResolvedValueOnce({
      data: [{ id: 'o1', myRole: 'OWNER' }],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    const page = await organizationsApi.listMine(1, 20);
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/organizations',
      params: { page: 1, pageSize: 20 },
    });
    expect(page.items).toHaveLength(1);
    expect(page.meta.total).toBe(1);
  });

  it('get → GET /organizations/:id', async () => {
    get.mockResolvedValueOnce({ id: 'o1', myRole: 'OWNER' });
    await organizationsApi.get('o1');
    expect(get).toHaveBeenCalledWith('/organizations/o1');
  });

  it('create → POST /organizations (no ownerUserId / status in the body)', async () => {
    post.mockResolvedValueOnce({ id: 'o1' });
    await organizationsApi.create({ type: 'VETERINARY_OFFICE', name: 'Office' });
    expect(post).toHaveBeenCalledWith('/organizations', {
      type: 'VETERINARY_OFFICE',
      name: 'Office',
    });
  });

  it('update → PATCH /organizations/:id', async () => {
    patch.mockResolvedValueOnce({ id: 'o1' });
    await organizationsApi.update('o1', { name: 'New', description: null });
    expect(patch).toHaveBeenCalledWith('/organizations/o1', { name: 'New', description: null });
  });

  it('leave → POST /organizations/:id/leave', async () => {
    post.mockResolvedValueOnce({ success: true });
    await organizationsApi.leave('o1');
    expect(post).toHaveBeenCalledWith('/organizations/o1/leave');
  });

  it('listMembers → GET /organizations/:id/members with filter params', async () => {
    envelope.mockResolvedValueOnce({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    await organizationsApi.listMembers('o1', {
      page: 1,
      pageSize: 20,
      status: 'ACTIVE',
      roleKey: 'STAFF',
    });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/organizations/o1/members',
      params: { page: 1, pageSize: 20, status: 'ACTIVE', roleKey: 'STAFF' },
    });
  });

  it('addMember → POST /organizations/:id/members', async () => {
    post.mockResolvedValueOnce({ id: 'm1' });
    await organizationsApi.addMember('o1', { userId: 'u2', role: 'STAFF' });
    expect(post).toHaveBeenCalledWith('/organizations/o1/members', { userId: 'u2', role: 'STAFF' });
  });

  it('updateMember → PATCH /organizations/:id/members/:memberId', async () => {
    patch.mockResolvedValueOnce({ id: 'm1' });
    await organizationsApi.updateMember('o1', 'm1', { status: 'SUSPENDED' });
    expect(patch).toHaveBeenCalledWith('/organizations/o1/members/m1', { status: 'SUSPENDED' });
  });

  it('removeMember → DELETE /organizations/:id/members/:memberId', async () => {
    del.mockResolvedValueOnce({ success: true });
    await organizationsApi.removeMember('o1', 'm1');
    expect(del).toHaveBeenCalledWith('/organizations/o1/members/m1');
  });

  it('listSupervisors → GET /organizations/:id/supervisors (plain array, not paged)', async () => {
    get.mockResolvedValueOnce([]);
    await organizationsApi.listSupervisors('o1');
    expect(get).toHaveBeenCalledWith('/organizations/o1/supervisors');
  });

  it('assignSupervisor → POST /organizations/:id/supervisors', async () => {
    post.mockResolvedValueOnce({ id: 's1' });
    await organizationsApi.assignSupervisor('o1', { userId: 'u3', permissions: ['member.read'] });
    expect(post).toHaveBeenCalledWith('/organizations/o1/supervisors', {
      userId: 'u3',
      permissions: ['member.read'],
    });
  });

  it('updateSupervisor → PATCH /organizations/:id/supervisors/:membershipId', async () => {
    patch.mockResolvedValueOnce({ id: 's1' });
    await organizationsApi.updateSupervisor('o1', 's1', { permissions: [] });
    expect(patch).toHaveBeenCalledWith('/organizations/o1/supervisors/s1', { permissions: [] });
  });

  it('removeSupervisor → DELETE /organizations/:id/supervisors/:membershipId', async () => {
    del.mockResolvedValueOnce({ success: true });
    await organizationsApi.removeSupervisor('o1', 's1');
    expect(del).toHaveBeenCalledWith('/organizations/o1/supervisors/s1');
  });

  it('getPublic → GET /organizations/discover/:id (Clinic Details)', async () => {
    get.mockResolvedValueOnce({ id: 'o1', veterinarians: [], engagement: {} });
    await organizationsApi.getPublic('o1');
    expect(get).toHaveBeenCalledWith('/organizations/discover/o1');
  });

  it('follow → POST /organizations/:id/follow', async () => {
    post.mockResolvedValueOnce({ success: true });
    await organizationsApi.follow('o1');
    expect(post).toHaveBeenCalledWith('/organizations/o1/follow');
  });

  it('unfollow → DELETE /organizations/:id/follow', async () => {
    del.mockResolvedValueOnce({ success: true });
    await organizationsApi.unfollow('o1');
    expect(del).toHaveBeenCalledWith('/organizations/o1/follow');
  });

  it('submitReview → POST /organizations/:id/reviews', async () => {
    post.mockResolvedValueOnce({ id: 'r1', rating: 5 });
    await organizationsApi.submitReview('o1', { rating: 5, comment: 'Great' });
    expect(post).toHaveBeenCalledWith('/organizations/o1/reviews', { rating: 5, comment: 'Great' });
  });
});
