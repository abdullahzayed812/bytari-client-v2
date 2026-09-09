import { apiClient } from '@/services/api';

import { adminApi } from '../api';

const requestEnvelope = jest.spyOn(apiClient, 'requestEnvelope');
const get = jest.spyOn(apiClient, 'get');
const post = jest.spyOn(apiClient, 'post');
const del = jest.spyOn(apiClient, 'delete');

beforeEach(() => {
  requestEnvelope.mockReset().mockResolvedValue({
    data: [],
    meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
  });
  get.mockReset().mockResolvedValue({});
  post.mockReset().mockResolvedValue({});
  del.mockReset().mockResolvedValue({});
});
afterAll(() => jest.restoreAllMocks());

describe('adminApi — maps 1:1 to the backend admin surface', () => {
  it('listUsers → GET /admin/users with pagination + filters', async () => {
    await adminApi.listUsers({ page: 2, pageSize: 20, status: 'SUSPENDED', search: 'رنا' });
    expect(requestEnvelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/admin/users',
      params: expect.objectContaining({
        page: 2,
        pageSize: 20,
        status: 'SUSPENDED',
        search: 'رنا',
      }),
    });
  });

  it('getUser → GET /admin/users/:id', async () => {
    await adminApi.getUser('u1');
    expect(get).toHaveBeenCalledWith('/admin/users/u1');
  });

  it('changeUserStatus → POST /admin/users/:id/<action> with reason', async () => {
    await adminApi.changeUserStatus('u1', 'suspend', 'abuse');
    expect(post).toHaveBeenCalledWith('/admin/users/u1/suspend', { reason: 'abuse' });
    await adminApi.changeUserStatus('u1', 'activate');
    expect(post).toHaveBeenCalledWith('/admin/users/u1/activate', {});
  });

  it('addUserRole / removeUserRole → POST + DELETE /admin/users/:id/roles', async () => {
    await adminApi.addUserRole('u1', 'MODERATOR');
    expect(post).toHaveBeenCalledWith('/admin/users/u1/roles', { roleKey: 'MODERATOR' });
    await adminApi.removeUserRole('u1', 'MODERATOR');
    expect(del).toHaveBeenCalledWith('/admin/users/u1/roles/MODERATOR');
  });

  it('vet applications → GET /admin/veterinarians/pending, POST approve/reject', async () => {
    await adminApi.listPendingVetApplications(1, 20);
    expect(requestEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/admin/veterinarians/pending' }),
    );
    await adminApi.approveVetApplication('u9');
    expect(post).toHaveBeenCalledWith('/admin/veterinarians/u9/approve');
    await adminApi.rejectVetApplication('u9', 'bad licence');
    expect(post).toHaveBeenCalledWith('/admin/veterinarians/u9/reject', { reason: 'bad licence' });
  });

  it('organizations → list / pending / detail / members / decisions', async () => {
    await adminApi.listOrganizations({ page: 1, pageSize: 20, status: 'PENDING' });
    expect(requestEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/admin/organizations' }),
    );
    await adminApi.listPendingOrganizations(1, 20);
    expect(requestEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/admin/organizations/pending' }),
    );
    await adminApi.getOrganization('o1');
    expect(get).toHaveBeenCalledWith('/admin/organizations/o1');
    await adminApi.listOrganizationMembers('o1');
    expect(requestEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/admin/organizations/o1/members' }),
    );
    await adminApi.approveOrganization('o1');
    expect(post).toHaveBeenCalledWith('/admin/organizations/o1/approve');
    await adminApi.rejectOrganization('o1', 'incomplete');
    expect(post).toHaveBeenCalledWith('/admin/organizations/o1/reject', { reason: 'incomplete' });
    await adminApi.changeOrganizationStatus('o1', 'suspend');
    expect(post).toHaveBeenCalledWith('/admin/organizations/o1/suspend', {});
  });

  it('supervisors → GET list, POST assign, DELETE remove', async () => {
    await adminApi.listSupervisors({ page: 1, pageSize: 20, domain: 'CONTENT' });
    expect(requestEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/admin/supervisors' }),
    );
    await adminApi.assignSupervisor({ userId: 'u2', domain: 'ANIMAL' });
    expect(post).toHaveBeenCalledWith('/admin/supervisors', { userId: 'u2', domain: 'ANIMAL' });
    await adminApi.removeSupervisor('a1');
    expect(del).toHaveBeenCalledWith('/admin/supervisors/a1');
  });

  it('audit log → GET /admin/audit-logs', async () => {
    await adminApi.listAuditLog({ page: 1, pageSize: 20, action: 'USER_SUSPENDED' });
    expect(requestEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/audit-logs',
        params: expect.objectContaining({ action: 'USER_SUSPENDED' }),
      }),
    );
  });

  it('animals → GET /admin/animals (with owner + status filters), DELETE /admin/animals/:id', async () => {
    await adminApi.listAnimals({
      page: 1,
      pageSize: 20,
      status: 'ACTIVE',
      search: 'ريكس',
      ownerUserId: 'u7',
    });
    expect(requestEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/animals',
        params: expect.objectContaining({
          page: 1,
          pageSize: 20,
          status: 'ACTIVE',
          search: 'ريكس',
          ownerUserId: 'u7',
        }),
      }),
    );
    await adminApi.deleteAnimal('an1');
    expect(del).toHaveBeenCalledWith('/admin/animals/an1');
  });
});
