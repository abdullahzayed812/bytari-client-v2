import { waitFor } from '@testing-library/react-native';

import { ApiError } from '@/services/api';
import { makeTestQueryClient, renderHookWithQuery } from '@/test-utils/render';

import { productsApi, productKeys } from '../api';
import { useAdjustStock, useCreateProduct, useDeleteProduct, useUpdateProduct } from '../hooks';

describe('store product mutations (§33 — no optimistic updates; backend authorises)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('useCreateProduct → POSTs the body then invalidates the store catalogue prefix', async () => {
    jest.spyOn(productsApi, 'create').mockResolvedValueOnce({ id: 'p1' } as never);
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useCreateProduct('o1'), { client });

    await result.current.mutateAsync({ name: 'x', productType: 'MEDICINE' });

    expect(productsApi.create).toHaveBeenCalledWith('o1', { name: 'x', productType: 'MEDICINE' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: productKeys.forOrg('o1') });
  });

  it('useUpdateProduct → invalidates both the detail key and the catalogue prefix', async () => {
    jest.spyOn(productsApi, 'update').mockResolvedValueOnce({ id: 'p1' } as never);
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useUpdateProduct('o1'), { client });

    await result.current.mutateAsync({ productId: 'p1', body: { name: 'y' } });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: productKeys.detail('o1', 'p1') });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: productKeys.forOrg('o1') });
  });

  it('useDeleteProduct → soft-delete; invalidates the detail key + the catalogue prefix', async () => {
    jest
      .spyOn(productsApi, 'remove')
      .mockResolvedValueOnce({ id: 'p1', status: 'INACTIVE' } as never);
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useDeleteProduct('o1'), { client });

    await result.current.mutateAsync({ productId: 'p1' });

    expect(productsApi.remove).toHaveBeenCalledWith('o1', 'p1');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: productKeys.detail('o1', 'p1') });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: productKeys.forOrg('o1') });
  });

  it('useAdjustStock → POSTs the signed delta then invalidates detail + catalogue', async () => {
    jest.spyOn(productsApi, 'adjustStock').mockResolvedValueOnce({ id: 'p1' } as never);
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useAdjustStock('o1'), { client });

    await result.current.mutateAsync({ productId: 'p1', body: { delta: -5 } });

    expect(productsApi.adjustStock).toHaveBeenCalledWith('o1', 'p1', { delta: -5 });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: productKeys.detail('o1', 'p1') });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: productKeys.forOrg('o1') });
  });

  it('a 403 from the backend propagates as an ApiError (client never assumes success)', async () => {
    jest
      .spyOn(productsApi, 'update')
      .mockRejectedValueOnce(
        new ApiError({ code: 'PERMISSION_DENIED', message: 'x', status: 403 }),
      );
    const client = makeTestQueryClient();
    const { result } = renderHookWithQuery(() => useUpdateProduct('o1'), { client });

    await expect(
      result.current.mutateAsync({ productId: 'p1', body: { name: 'z' } }),
    ).rejects.toBeInstanceOf(ApiError);
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
