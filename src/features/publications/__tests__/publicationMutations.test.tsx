import { waitFor } from '@testing-library/react-native';

import { ApiError } from '@/services/api';
import { makeTestQueryClient, renderHookWithQuery } from '@/test-utils/render';

import { publicationKeys, publicationsApi } from '../api';
import { useCreatePublication } from '../hooks';

describe('useCreatePublication (§29 — no optimistic updates; approval workflow respected)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('POSTs { kind, note } for the route animal then invalidates the owner + public lists', async () => {
    jest
      .spyOn(publicationsApi, 'create')
      .mockResolvedValueOnce({ id: 'p1', kind: 'ADOPTION', status: 'PENDING' } as never);
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useCreatePublication('a1'), { client });

    await result.current.mutateAsync({ kind: 'ADOPTION', note: 'friendly cat' });

    expect(publicationsApi.create).toHaveBeenCalledWith('a1', {
      kind: 'ADOPTION',
      note: 'friendly cat',
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: publicationKeys.forAnimal('a1') });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: publicationKeys.publicList('ADOPTION') });
  });

  it('a backend 404 (non-owned animal) propagates as an ApiError — never swallowed', async () => {
    jest
      .spyOn(publicationsApi, 'create')
      .mockRejectedValueOnce(new ApiError({ code: 'NOT_FOUND', message: 'no', status: 404 }));
    const { result } = renderHookWithQuery(() => useCreatePublication('a1'));
    await expect(result.current.mutateAsync({ kind: 'LOST' })).rejects.toBeInstanceOf(ApiError);
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
