import { waitFor } from '@testing-library/react-native';

import { i18n } from '@/i18n';
import { ApiError, apiClient } from '@/services/api';
import { makeTestQueryClient, renderHookWithQuery } from '@/test-utils/render';

import { petsApi } from '../api';
import { usePetOwnershipHistory } from '../hooks';
import { buildTransferRequestSchema, transferRequestErrorMessage } from '../validation/schemas';

const t = i18n.getFixedT('ar', 'pets');

describe('petsApi ownership wrappers', () => {
  const get = jest.spyOn(apiClient, 'get');

  beforeEach(() => {
    get.mockReset();
  });
  afterAll(() => jest.restoreAllMocks());

  it('ownershipHistory → GET /animals/:id/ownership/history', async () => {
    get.mockResolvedValueOnce([{ id: 'o1', isCurrent: true }]);
    await petsApi.ownershipHistory('p1');
    expect(get).toHaveBeenCalledWith('/animals/p1/ownership/history');
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

describe('buildTransferRequestSchema / transferRequestErrorMessage', () => {
  const schema = buildTransferRequestSchema(t);

  it('requires a UUID recipient', () => {
    expect(schema.safeParse({ toUserId: '' }).success).toBe(false);
    expect(schema.safeParse({ toUserId: 'not-a-uuid' }).success).toBe(false);
    expect(schema.safeParse({ toUserId: '11111111-2222-3333-4444-555555555555' }).success).toBe(
      true,
    );
  });

  it('maps the known backend codes; never surfaces raw text', () => {
    expect(
      transferRequestErrorMessage(
        new ApiError({ code: 'ANIMAL_NOT_ACTIVE' as never, message: 'x', status: 409 }),
        t,
      ),
    ).toBe(t('transferRequests.errors.animalNotActive'));
    expect(
      transferRequestErrorMessage(
        new ApiError({ code: 'INVALID_TRANSFER_TARGET' as never, message: 'x', status: 400 }),
        t,
      ),
    ).toBe(t('transferRequests.errors.invalidTarget'));
    expect(
      transferRequestErrorMessage(
        new ApiError({ code: 'TRANSFER_REQUEST_ALREADY_OPEN' as never, message: 'x', status: 409 }),
        t,
      ),
    ).toBe(t('transferRequests.errors.alreadyOpen'));
    expect(
      transferRequestErrorMessage(
        new ApiError({ code: 'NOT_FOUND', message: 'x', status: 404 }),
        t,
      ),
    ).toBe(t('transferRequests.errors.recipientNotFound'));
    const generic = transferRequestErrorMessage(
      new ApiError({ code: 'INTERNAL_ERROR', message: 'db boom', status: 500 }),
      t,
    );
    expect(generic).not.toContain('db boom');
  });
});
