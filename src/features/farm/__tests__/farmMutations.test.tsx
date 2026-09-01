import { waitFor } from '@testing-library/react-native';

import { orgKeys } from '@/features/organizations/api';
import { ApiError } from '@/services/api';
import { makeTestQueryClient, renderHookWithQuery } from '@/test-utils/render';

import { farmApi, farmKeys, poultryApi, poultryKeys } from '../api';
import {
  useCreatePoultryFlock,
  useDeletePoultryFlock,
  useJoinFarmByCode,
  useRegenerateFarmJoinCode,
  useUpdatePoultryFlock,
} from '../hooks';

describe('farm & poultry mutations (§28 — no optimistic updates; backend authorises)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('useJoinFarmByCode → POSTs the code and refreshes "My Organizations"', async () => {
    jest
      .spyOn(farmApi, 'joinByCode')
      .mockResolvedValueOnce({ id: 'm1', organizationId: 'o1' } as never);
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useJoinFarmByCode(), { client });

    await result.current.mutateAsync({ joinCode: 'FARM-ABCD12' });

    expect(farmApi.joinByCode).toHaveBeenCalledWith({ joinCode: 'FARM-ABCD12' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: orgKeys.lists() });
  });

  it('useRegenerateFarmJoinCode → caches the new code', async () => {
    jest.spyOn(farmApi, 'regenerateJoinCode').mockResolvedValueOnce({ joinCode: 'FARM-NEW999' });
    const client = makeTestQueryClient();
    const { result } = renderHookWithQuery(() => useRegenerateFarmJoinCode('o1'), { client });

    await result.current.mutateAsync();

    expect(client.getQueryData(farmKeys.joinCode('o1'))).toEqual({ joinCode: 'FARM-NEW999' });
  });

  it('useCreatePoultryFlock → POSTs the body then invalidates the org poultry prefix', async () => {
    jest.spyOn(poultryApi, 'create').mockResolvedValueOnce({ id: 'f1' } as never);
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useCreatePoultryFlock('o1'), { client });

    await result.current.mutateAsync({
      name: 'North',
      birdType: 'CHICKEN',
      birdCount: 500,
      arrivalDate: '2026-01-02',
    });

    expect(poultryApi.create).toHaveBeenCalledWith(
      'o1',
      expect.objectContaining({ birdCount: 500 }),
    );
    expect(invalidate).toHaveBeenCalledWith({ queryKey: poultryKeys.forOrg('o1') });
  });

  it('useUpdatePoultryFlock → PATCHes then invalidates the detail + list prefix', async () => {
    jest.spyOn(poultryApi, 'update').mockResolvedValueOnce({ id: 'f1' } as never);
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useUpdatePoultryFlock('o1'), { client });

    await result.current.mutateAsync({ flockId: 'f1', body: { status: 'CLOSED' } });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: poultryKeys.detail('o1', 'f1') });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: poultryKeys.forOrg('o1') });
  });

  it('useDeletePoultryFlock → DELETEs then drops the detail', async () => {
    jest.spyOn(poultryApi, 'remove').mockResolvedValueOnce({ deleted: true });
    const client = makeTestQueryClient();
    const remove = jest.spyOn(client, 'removeQueries');
    const { result } = renderHookWithQuery(() => useDeletePoultryFlock('o1'), { client });

    await result.current.mutateAsync({ flockId: 'f1' });

    expect(remove).toHaveBeenCalledWith({ queryKey: poultryKeys.detail('o1', 'f1') });
  });

  it('a backend 403 propagates as an ApiError (client never re-authorises)', async () => {
    jest
      .spyOn(poultryApi, 'create')
      .mockRejectedValueOnce(new ApiError({ code: 'FORBIDDEN', message: 'no', status: 403 }));
    const { result } = renderHookWithQuery(() => useCreatePoultryFlock('o1'));
    await expect(
      result.current.mutateAsync({
        name: 'x',
        birdType: 'CHICKEN',
        birdCount: 1,
        arrivalDate: '2026-01-02',
      }),
    ).rejects.toBeInstanceOf(ApiError);
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
