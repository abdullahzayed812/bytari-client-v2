import { waitFor } from '@testing-library/react-native';

import { i18n } from '@/i18n';
import { ApiError, apiClient } from '@/services/api';
import { makeTestQueryClient, renderHookWithQuery } from '@/test-utils/render';

import { petKeys, petsApi } from '../api';
import { usePetOwnershipHistory, useTransferOwnership } from '../hooks';
import { buildTransferSchema, transferErrorMessage } from '../validation/schemas';

const t = i18n.getFixedT('ar', 'pets');

describe('petsApi ownership wrappers', () => {
  const get = jest.spyOn(apiClient, 'get');
  const post = jest.spyOn(apiClient, 'post');

  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });
  afterAll(() => jest.restoreAllMocks());

  it('ownershipHistory → GET /animals/:id/ownership/history', async () => {
    get.mockResolvedValueOnce([{ id: 'o1', isCurrent: true }]);
    await petsApi.ownershipHistory('p1');
    expect(get).toHaveBeenCalledWith('/animals/p1/ownership/history');
  });

  it('transferOwnership → POST /animals/:id/ownership/transfer with { toUserId, reason }', async () => {
    post.mockResolvedValueOnce({ id: 'o2', isCurrent: true });
    await petsApi.transferOwnership('p1', { toUserId: 'u2', reason: 'بيع' });
    expect(post).toHaveBeenCalledWith('/animals/p1/ownership/transfer', {
      toUserId: 'u2',
      reason: 'بيع',
    });
  });
});

describe('useTransferOwnership', () => {
  afterEach(() => jest.restoreAllMocks());

  it('on success invalidates the pet lists, this pet detail, and its ownership history', async () => {
    jest.spyOn(petsApi, 'transferOwnership').mockResolvedValueOnce({ id: 'o2' } as never);
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useTransferOwnership('p1'), { client });

    await result.current.mutateAsync({ toUserId: 'u2' });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: petKeys.lists() });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: petKeys.detail('p1') });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: petKeys.ownership('p1') });
  });

  it('a 403 propagates as an ApiError (no optimistic change)', async () => {
    jest
      .spyOn(petsApi, 'transferOwnership')
      .mockRejectedValueOnce(
        new ApiError({ code: 'PERMISSION_DENIED', message: 'x', status: 403 }),
      );
    const { result } = renderHookWithQuery(() => useTransferOwnership('p1'), {
      client: makeTestQueryClient(),
    });
    await expect(result.current.mutateAsync({ toUserId: 'u2' })).rejects.toBeInstanceOf(ApiError);
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('usePetOwnershipHistory', () => {
  afterEach(() => jest.restoreAllMocks());

  it('does not retry a 404 / 403', async () => {
    const spy = jest
      .spyOn(petsApi, 'ownershipHistory')
      .mockRejectedValue(new ApiError({ code: 'NOT_FOUND', message: 'x', status: 404 }));
    const { result } = renderHookWithQuery(() => usePetOwnershipHistory('p1'), {
      client: makeTestQueryClient(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('buildTransferSchema / transferErrorMessage', () => {
  const schema = buildTransferSchema(t);

  it('requires a UUID recipient', () => {
    expect(schema.safeParse({ toUserId: '' }).success).toBe(false);
    expect(schema.safeParse({ toUserId: 'not-a-uuid' }).success).toBe(false);
    expect(schema.safeParse({ toUserId: '11111111-2222-3333-4444-555555555555' }).success).toBe(
      true,
    );
  });

  it('maps the known backend codes; never surfaces raw text', () => {
    expect(
      transferErrorMessage(
        new ApiError({ code: 'ANIMAL_NOT_ACTIVE' as never, message: 'x', status: 409 }),
        t,
      ),
    ).toBe(t('transfer.errors.animalNotActive'));
    expect(
      transferErrorMessage(
        new ApiError({ code: 'INVALID_TRANSFER_TARGET' as never, message: 'x', status: 400 }),
        t,
      ),
    ).toBe(t('transfer.errors.invalidTarget'));
    expect(
      transferErrorMessage(new ApiError({ code: 'NOT_FOUND', message: 'x', status: 404 }), t),
    ).toBe(t('transfer.errors.recipientNotFound'));
    const generic = transferErrorMessage(
      new ApiError({ code: 'INTERNAL_ERROR', message: 'db boom', status: 500 }),
      t,
    );
    expect(generic).not.toContain('db boom');
  });
});
