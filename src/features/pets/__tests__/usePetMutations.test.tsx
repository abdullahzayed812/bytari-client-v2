import { waitFor } from '@testing-library/react-native';

import { ApiError } from '@/services/api';
import { makeTestQueryClient, renderHookWithQuery } from '@/test-utils/render';

import { petKeys, petsApi } from '../api';
import { useCreatePet, useDeactivatePet, useUpdatePet } from '../hooks';
import type { Pet } from '../types';

const pet: Pet = {
  id: 'p1',
  name: 'Lulu',
  species: 'CAT',
  breed: null,
  sex: 'UNKNOWN',
  dateOfBirth: null,
  notes: null,
  status: 'ACTIVE',
  createdBy: 'u1',
  currentOwnerUserId: 'u1',
  createdAt: '',
  updatedAt: '',
};

describe('pet mutations', () => {
  afterEach(() => jest.restoreAllMocks());

  it('useCreatePet → success seeds the detail cache and invalidates lists only', async () => {
    jest.spyOn(petsApi, 'create').mockResolvedValueOnce(pet);
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useCreatePet(), { client });

    await result.current.mutateAsync({ name: 'Lulu', species: 'CAT' });

    expect(client.getQueryData(petKeys.detail('p1'))).toEqual(pet);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: petKeys.lists() });
  });

  it('useCreatePet → propagates a backend rejection', async () => {
    jest
      .spyOn(petsApi, 'create')
      .mockRejectedValueOnce(new ApiError({ code: 'VALIDATION_ERROR', message: 'x', status: 422 }));
    const { result } = renderHookWithQuery(() => useCreatePet());
    await expect(result.current.mutateAsync({ name: '', species: 'CAT' })).rejects.toBeInstanceOf(
      ApiError,
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('useUpdatePet → success updates the detail cache + invalidates lists', async () => {
    const updated = { ...pet, name: 'Lu' };
    jest.spyOn(petsApi, 'update').mockResolvedValueOnce(updated);
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useUpdatePet('p1'), { client });

    await result.current.mutateAsync({ name: 'Lu' });

    expect(client.getQueryData(petKeys.detail('p1'))).toEqual(updated);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: petKeys.lists() });
  });

  it('useDeactivatePet → success caches the deactivated pet', async () => {
    jest.spyOn(petsApi, 'deactivate').mockResolvedValueOnce({ ...pet, status: 'DEACTIVATED' });
    const client = makeTestQueryClient();
    const { result } = renderHookWithQuery(() => useDeactivatePet('p1'), { client });

    await result.current.mutateAsync();

    expect((client.getQueryData(petKeys.detail('p1')) as Pet).status).toBe('DEACTIVATED');
  });
});
