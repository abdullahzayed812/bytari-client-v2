import { waitFor } from '@testing-library/react-native';

import { ApiError } from '@/services/api';
import { makeTestQueryClient, renderHookWithQuery } from '@/test-utils/render';

import { orgAnimalKeys, organizationAnimalsApi } from '../api';
import { useGrantOrganizationAnimalAccess, useRevokeOrganizationAnimalAccess } from '../hooks';

describe('organization-animal mutations (§13 — backend authorises; no ownership transfer)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('useGrantOrganizationAnimalAccess → posts { animalId } and invalidates the org-animal cache', async () => {
    jest
      .spyOn(organizationAnimalsApi, 'grant')
      .mockResolvedValueOnce({ id: 'g1', animalId: 'a1', status: 'ACTIVE' } as never);
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useGrantOrganizationAnimalAccess('o1'), {
      client,
    });

    await result.current.mutateAsync({ animalId: 'a1' });

    expect(organizationAnimalsApi.grant).toHaveBeenCalledWith('o1', { animalId: 'a1' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: orgAnimalKeys.forOrg('o1') });
  });

  it('useRevokeOrganizationAnimalAccess → deletes by animalId and drops the detail cache', async () => {
    jest.spyOn(organizationAnimalsApi, 'revoke').mockResolvedValueOnce({ revoked: true });
    const client = makeTestQueryClient();
    const remove = jest.spyOn(client, 'removeQueries');
    const { result } = renderHookWithQuery(() => useRevokeOrganizationAnimalAccess('o1'), {
      client,
    });

    await result.current.mutateAsync({ animalId: 'a1' });

    expect(organizationAnimalsApi.revoke).toHaveBeenCalledWith('o1', 'a1');
    expect(remove).toHaveBeenCalledWith({ queryKey: orgAnimalKeys.detail('o1', 'a1') });
  });

  it('a backend 403 propagates as an ApiError (client never re-authorises)', async () => {
    jest
      .spyOn(organizationAnimalsApi, 'grant')
      .mockRejectedValueOnce(new ApiError({ code: 'FORBIDDEN', message: 'no', status: 403 }));
    const { result } = renderHookWithQuery(() => useGrantOrganizationAnimalAccess('o1'));

    await expect(result.current.mutateAsync({ animalId: 'a1' })).rejects.toBeInstanceOf(ApiError);
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
