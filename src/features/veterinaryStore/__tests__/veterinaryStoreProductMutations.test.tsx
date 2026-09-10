import { waitFor } from '@testing-library/react-native';

import { ApiError } from '@/services/api';
import { makeTestQueryClient, renderHookWithQuery } from '@/test-utils/render';

import { veterinaryStoreProductsApi, veterinaryStoreProductKeys } from '../api';
import { useAdjustVeterinaryStoreStock, useCreateVeterinaryStoreProduct, useDeleteVeterinaryStoreProduct, useUpdateVeterinaryStoreProduct } from '../hooks';

describe('store product mutations (§33 — no optimistic updates; backend authorises)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('useCreateVeterinaryStoreProduct → POSTs the body then invalidates the store catalogue prefix', async () => {
    jest.spyOn(veterinaryStoreProductsApi, 'create').mockResolvedValueOnce({ id: 'p1' } as never);
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useCreateVeterinaryStoreProduct('o1'), { client });

    await result.current.mutateAsync({ name: 'x', productType: 'MEDICINE' });

    expect(veterinaryStoreProductsApi.create).toHaveBeenCalledWith('o1', { name: 'x', productType: 'MEDICINE' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: veterinaryStoreProductKeys.forOrg('o1') });
  });

  it('useUpdateVeterinaryStoreProduct → invalidates both the detail key and the catalogue prefix', async () => {
    jest.spyOn(veterinaryStoreProductsApi, 'update').mockResolvedValueOnce({ id: 'p1' } as never);
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useUpdateVeterinaryStoreProduct('o1'), { client });

    await result.current.mutateAsync({ productId: 'p1', body: { name: 'y' } });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: veterinaryStoreProductKeys.detail('o1', 'p1') });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: veterinaryStoreProductKeys.forOrg('o1') });
  });

  it('useDeleteVeterinaryStoreProduct → soft-delete; invalidates the detail key + the catalogue prefix', async () => {
    jest
      .spyOn(veterinaryStoreProductsApi, 'remove')
      .mockResolvedValueOnce({ id: 'p1', status: 'INACTIVE' } as never);
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useDeleteVeterinaryStoreProduct('o1'), { client });

    await result.current.mutateAsync({ productId: 'p1' });

    expect(veterinaryStoreProductsApi.remove).toHaveBeenCalledWith('o1', 'p1');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: veterinaryStoreProductKeys.detail('o1', 'p1') });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: veterinaryStoreProductKeys.forOrg('o1') });
  });

  it('useAdjustVeterinaryStoreStock → POSTs the signed delta then invalidates detail + catalogue', async () => {
    jest.spyOn(veterinaryStoreProductsApi, 'adjustStock').mockResolvedValueOnce({ id: 'p1' } as never);
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useAdjustVeterinaryStoreStock('o1'), { client });

    await result.current.mutateAsync({ productId: 'p1', body: { delta: -5 } });

    expect(veterinaryStoreProductsApi.adjustStock).toHaveBeenCalledWith('o1', 'p1', { delta: -5 });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: veterinaryStoreProductKeys.detail('o1', 'p1') });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: veterinaryStoreProductKeys.forOrg('o1') });
  });

  it('a 403 from the backend propagates as an ApiError (client never assumes success)', async () => {
    jest
      .spyOn(veterinaryStoreProductsApi, 'update')
      .mockRejectedValueOnce(
        new ApiError({ code: 'PERMISSION_DENIED', message: 'x', status: 403 }),
      );
    const client = makeTestQueryClient();
    const { result } = renderHookWithQuery(() => useUpdateVeterinaryStoreProduct('o1'), { client });

    await expect(
      result.current.mutateAsync({ productId: 'p1', body: { name: 'z' } }),
    ).rejects.toBeInstanceOf(ApiError);
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
