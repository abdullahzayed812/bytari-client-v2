import { waitFor } from '@testing-library/react-native';

import { ApiError } from '@/services/api';
import { makeTestQueryClient, renderHookWithQuery } from '@/test-utils/render';

import { orgKeys, organizationsApi } from '../api';
import {
  useAddOrganizationMember,
  useAssignOrganizationSupervisor,
  useCreateOrganization,
  useRemoveOrganizationMember,
  useRemoveOrganizationSupervisor,
  useUpdateOrganization,
  useUpdateOrganizationMember,
  useUpdateOrganizationSupervisor,
} from '../hooks';

describe('organization mutations (§14 — no global invalidation; backend authorises)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('useCreateOrganization → seeds the detail cache as OWNER and invalidates lists only', async () => {
    jest
      .spyOn(organizationsApi, 'create')
      .mockResolvedValueOnce({ id: 'o1', name: 'Office' } as never);
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useCreateOrganization(), { client });

    await result.current.mutateAsync({ type: 'VETERINARY_OFFICE', name: 'Office' });

    expect(client.getQueryData(orgKeys.detail('o1'))).toMatchObject({ myRole: 'OWNER' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: orgKeys.lists() });
  });

  it('useUpdateOrganization → invalidates the detail + lists', async () => {
    jest.spyOn(organizationsApi, 'update').mockResolvedValueOnce({ id: 'o1' } as never);
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useUpdateOrganization('o1'), { client });

    await result.current.mutateAsync({ name: 'Renamed' });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: orgKeys.detail('o1') });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: orgKeys.lists() });
  });

  it('useAddOrganizationMember → invalidates members', async () => {
    jest.spyOn(organizationsApi, 'addMember').mockResolvedValueOnce({ id: 'm1' } as never);
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useAddOrganizationMember('o1'), { client });

    await result.current.mutateAsync({ userId: 'u2', role: 'STAFF' });

    expect(organizationsApi.addMember).toHaveBeenCalledWith('o1', { userId: 'u2', role: 'STAFF' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: orgKeys.members('o1') });
  });

  it('useUpdateOrganizationMember → passes { memberId, input } through', async () => {
    jest.spyOn(organizationsApi, 'updateMember').mockResolvedValueOnce({ id: 'm1' } as never);
    const { result } = renderHookWithQuery(() => useUpdateOrganizationMember('o1'));

    await result.current.mutateAsync({ memberId: 'm1', input: { status: 'SUSPENDED' } });

    expect(organizationsApi.updateMember).toHaveBeenCalledWith('o1', 'm1', { status: 'SUSPENDED' });
  });

  it('useRemoveOrganizationMember → calls DELETE with the membership id', async () => {
    jest.spyOn(organizationsApi, 'removeMember').mockResolvedValueOnce({ success: true });
    const { result } = renderHookWithQuery(() => useRemoveOrganizationMember('o1'));

    await result.current.mutateAsync({ memberId: 'm1' });

    expect(organizationsApi.removeMember).toHaveBeenCalledWith('o1', 'm1');
  });

  it('useAssignOrganizationSupervisor → forwards userId + selected permissions verbatim', async () => {
    jest.spyOn(organizationsApi, 'assignSupervisor').mockResolvedValueOnce({ id: 's1' } as never);
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useAssignOrganizationSupervisor('o1'), { client });

    await result.current.mutateAsync({ userId: 'u3', permissions: ['member.read', 'member.add'] });

    expect(organizationsApi.assignSupervisor).toHaveBeenCalledWith('o1', {
      userId: 'u3',
      permissions: ['member.read', 'member.add'],
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: orgKeys.supervisors('o1') });
  });

  it('useUpdateOrganizationSupervisor → PATCH permissions for a membership', async () => {
    jest.spyOn(organizationsApi, 'updateSupervisor').mockResolvedValueOnce({ id: 's1' } as never);
    const { result } = renderHookWithQuery(() => useUpdateOrganizationSupervisor('o1'));

    await result.current.mutateAsync({ membershipId: 's1', input: { permissions: [] } });

    expect(organizationsApi.updateSupervisor).toHaveBeenCalledWith('o1', 's1', { permissions: [] });
  });

  it('useRemoveOrganizationSupervisor → DELETE the supervisor membership', async () => {
    jest.spyOn(organizationsApi, 'removeSupervisor').mockResolvedValueOnce({ success: true });
    const { result } = renderHookWithQuery(() => useRemoveOrganizationSupervisor('o1'));

    await result.current.mutateAsync({ membershipId: 's1' });

    expect(organizationsApi.removeSupervisor).toHaveBeenCalledWith('o1', 's1');
  });

  it('a backend 403 propagates as an ApiError (never swallowed / re-authorised on the client)', async () => {
    jest
      .spyOn(organizationsApi, 'update')
      .mockRejectedValueOnce(new ApiError({ code: 'FORBIDDEN', message: 'no', status: 403 }));
    const { result } = renderHookWithQuery(() => useUpdateOrganization('o1'));

    await expect(result.current.mutateAsync({ name: 'x' })).rejects.toBeInstanceOf(ApiError);
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
