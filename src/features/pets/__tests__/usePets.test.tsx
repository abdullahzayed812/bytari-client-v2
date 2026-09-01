import { waitFor } from '@testing-library/react-native';

import { ApiError } from '@/services/api';
import { renderHookWithQuery } from '@/test-utils/render';

import { petsApi } from '../api';
import { usePet } from '../hooks';
import { usePets } from '../hooks/usePets';
import type { Pet } from '../types';

const pet = (id: string, name = id): Pet => ({
  id,
  name,
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
});

const list = jest.spyOn(petsApi, 'list');
const get = jest.spyOn(petsApi, 'get');

afterEach(() => {
  list.mockReset();
  get.mockReset();
});
afterAll(() => jest.restoreAllMocks());

describe('usePets (list)', () => {
  it('loads and flattens the first page + exposes total', async () => {
    list.mockResolvedValueOnce({
      items: [pet('p1'), pet('p2')],
      meta: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
    });
    const { result } = renderHookWithQuery(() => usePets());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.pets.map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(result.current.total).toBe(2);
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ page: 1, status: 'ACTIVE' }));
  });

  it('handles an empty list', async () => {
    list.mockResolvedValueOnce({
      items: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    const { result } = renderHookWithQuery(() => usePets());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.pets).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('surfaces an API error', async () => {
    list.mockRejectedValueOnce(new ApiError({ code: 'INTERNAL_ERROR', message: 'x', status: 500 }));
    const { result } = renderHookWithQuery(() => usePets());
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.pets).toEqual([]);
  });

  it('appends the next page on fetchNextPage', async () => {
    list
      .mockResolvedValueOnce({
        items: [pet('p1')],
        meta: { page: 1, pageSize: 1, total: 2, totalPages: 2 },
      })
      .mockResolvedValueOnce({
        items: [pet('p2')],
        meta: { page: 2, pageSize: 1, total: 2, totalPages: 2 },
      });
    const { result } = renderHookWithQuery(() => usePets({ pageSize: 1 }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);

    await result.current.fetchNextPage();
    await waitFor(() => expect(result.current.pets).toHaveLength(2));
    expect(result.current.pets.map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(result.current.hasNextPage).toBe(false);
  });
});

describe('usePet (detail)', () => {
  it('loads a pet', async () => {
    get.mockResolvedValueOnce(pet('p1', 'Lulu'));
    const { result } = renderHookWithQuery(() => usePet('p1'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe('Lulu');
  });

  it('is disabled without a petId', () => {
    const { result } = renderHookWithQuery(() => usePet(undefined));
    expect(result.current.fetchStatus).toBe('idle');
    expect(get).not.toHaveBeenCalled();
  });

  it('does not retry a 404 (ownership is hidden as not-found)', async () => {
    get.mockRejectedValue(new ApiError({ code: 'NOT_FOUND', message: 'x', status: 404 }));
    const { result } = renderHookWithQuery(() => usePet('other-users-pet'));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(get).toHaveBeenCalledTimes(1);
    expect(result.current.error?.status).toBe(404);
  });
});
