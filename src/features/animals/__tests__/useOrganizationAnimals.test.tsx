import { waitFor } from '@testing-library/react-native';

import { ApiError } from '@/services/api';
import { makeTestQueryClient, renderHookWithQuery } from '@/test-utils/render';

import { orgAnimalKeys, organizationAnimalsApi } from '../api';
import { useOrganizationAnimal, useOrganizationAnimals } from '../hooks';
import type { OrganizationAnimalGrant } from '../types';

const grant = (over: Partial<OrganizationAnimalGrant> = {}): OrganizationAnimalGrant => ({
  id: 'g1',
  animalId: 'a1',
  organizationId: 'o1',
  status: 'ACTIVE',
  grantedByUserId: 'u1',
  createdAt: '2026-01-01T00:00:00.000Z',
  animal: { name: 'Lulu', species: 'DOG', status: 'ACTIVE' },
  ...over,
});

describe('useOrganizationAnimals', () => {
  afterEach(() => jest.restoreAllMocks());

  it('flattens pages and exposes total; appends on fetchNextPage', async () => {
    const list = jest.spyOn(organizationAnimalsApi, 'list');
    list.mockResolvedValueOnce({
      items: [grant()],
      meta: { page: 1, pageSize: 1, total: 2, totalPages: 2 },
    });
    list.mockResolvedValueOnce({
      items: [
        grant({
          id: 'g2',
          animalId: 'a2',
          animal: { name: 'Mimi', species: 'CAT', status: 'ACTIVE' },
        }),
      ],
      meta: { page: 2, pageSize: 1, total: 2, totalPages: 2 },
    });
    const { result } = renderHookWithQuery(() => useOrganizationAnimals('o1', { pageSize: 1 }));

    await waitFor(() => expect(result.current.animals).toHaveLength(1));
    expect(result.current.total).toBe(2);
    expect(result.current.hasNextPage).toBe(true);

    await result.current.fetchNextPage();
    await waitFor(() => expect(result.current.animals).toHaveLength(2));
    expect(list).toHaveBeenNthCalledWith(2, 'o1', 2, 1);
  });

  it('is disabled without an organization id', () => {
    const list = jest.spyOn(organizationAnimalsApi, 'list');
    const { result } = renderHookWithQuery(() => useOrganizationAnimals(undefined));
    expect(result.current.fetchStatus).toBe('idle');
    expect(list).not.toHaveBeenCalled();
  });
});

describe('useOrganizationAnimal — no detail endpoint, resolves from the list', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns the row from the infinite-list cache without a network call', async () => {
    const list = jest.spyOn(organizationAnimalsApi, 'list');
    const client = makeTestQueryClient();
    client.setQueryData(orgAnimalKeys.list('o1'), {
      pages: [{ items: [grant()], meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 } }],
      pageParams: [1],
    });
    const { result } = renderHookWithQuery(() => useOrganizationAnimal('o1', 'a1'), { client });

    await waitFor(() => expect(result.current.data?.animalId).toBe('a1'));
    expect(list).not.toHaveBeenCalled();
  });

  it('pages the list to find a cold-linked animal, then returns null when absent', async () => {
    const list = jest.spyOn(organizationAnimalsApi, 'list').mockResolvedValue({
      items: [grant({ animalId: 'other' })],
      meta: { page: 1, pageSize: 50, total: 1, totalPages: 1 },
    });
    const { result } = renderHookWithQuery(() => useOrganizationAnimal('o1', 'missing'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
    expect(list).toHaveBeenCalledWith('o1', 1, 50);
  });

  it('does not retry a forbidden (403) lookup', async () => {
    jest
      .spyOn(organizationAnimalsApi, 'list')
      .mockRejectedValue(new ApiError({ code: 'FORBIDDEN', message: 'no', status: 403 }));
    const { result } = renderHookWithQuery(() => useOrganizationAnimal('o1', 'a1'));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ApiError).status).toBe(403);
  });
});
