import { waitFor } from '@testing-library/react-native';

import { renderHookWithQuery } from '@/test-utils/render';

import { organizationAnimalsApi } from '../api';
import { useOrganizationAnimals } from '../hooks';
import type { ClinicPet } from '../types';

const grant = (over: Partial<ClinicPet> = {}): ClinicPet => ({
  animalId: 'a1',
  publicCode: 'K7M4QXR',
  firstActivityAt: '2026-01-01T00:00:00.000Z',
  lastActivityAt: '2026-01-02T00:00:00.000Z',
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
