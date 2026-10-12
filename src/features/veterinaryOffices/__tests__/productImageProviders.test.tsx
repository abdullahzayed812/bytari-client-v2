import { veterinaryOfficeProductsApi } from '../dashboard/api';
import {
  useNewVeterinaryOfficeProductImagePresignProvider,
  useReplaceVeterinaryOfficeProductImagePresignProvider,
} from '../dashboard/hooks';
import { renderHookWithQuery } from '@/test-utils/render';

const FILE = { uri: 'file:///p.jpg', name: 'p.jpg', mimeType: 'image/jpeg', size: 1024 };
const PRESIGNED = {
  storageKey: 'veterinary-office-products/k.jpg',
  uploadUrl: 'https://r2/put',
  method: 'PUT' as const,
  headers: {},
  expiresInSeconds: 300,
};

describe('product image presign providers', () => {
  afterEach(() => jest.restoreAllMocks());

  it('new product: presigns at the org level and hands the finished upload to the form', async () => {
    const presign = jest
      .spyOn(veterinaryOfficeProductsApi, 'requestNewProductImageUploadUrl')
      .mockResolvedValue(PRESIGNED);
    const onUploaded = jest.fn();
    const { result } = renderHookWithQuery(() =>
      useNewVeterinaryOfficeProductImagePresignProvider('org1', onUploaded),
    );
    await expect(result.current.requestUpload(FILE)).resolves.toEqual(PRESIGNED);
    expect(presign).toHaveBeenCalledWith('org1', {
      filename: 'p.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
    });
    await result.current.finalizeUpload?.(PRESIGNED.storageKey, FILE);
    expect(onUploaded).toHaveBeenCalledWith({
      storageKey: PRESIGNED.storageKey,
      mimeType: 'image/jpeg',
    });
  });

  it('replace: swaps the image only after the upload, via the replace endpoint', async () => {
    jest
      .spyOn(veterinaryOfficeProductsApi, 'requestReplaceImageUploadUrl')
      .mockResolvedValue(PRESIGNED);
    const replace = jest
      .spyOn(veterinaryOfficeProductsApi, 'replaceImage')
      .mockResolvedValue({} as never);
    const add = jest.spyOn(veterinaryOfficeProductsApi, 'addImage');
    const { result } = renderHookWithQuery(() =>
      useReplaceVeterinaryOfficeProductImagePresignProvider('org1', 'p1', 'img1'),
    );
    await result.current.requestUpload(FILE);
    expect(replace).not.toHaveBeenCalled();
    await result.current.finalizeUpload?.(PRESIGNED.storageKey, FILE);
    expect(replace).toHaveBeenCalledWith('org1', 'p1', 'img1', {
      storageKey: PRESIGNED.storageKey,
      mimeType: 'image/jpeg',
    });
    expect(add).not.toHaveBeenCalled();
  });

  it('replace: a failed presign never touches the current image', async () => {
    jest
      .spyOn(veterinaryOfficeProductsApi, 'requestReplaceImageUploadUrl')
      .mockRejectedValue(new Error('offline'));
    const replace = jest.spyOn(veterinaryOfficeProductsApi, 'replaceImage');
    const { result } = renderHookWithQuery(() =>
      useReplaceVeterinaryOfficeProductImagePresignProvider('org1', 'p1', 'img1'),
    );
    await expect(result.current.requestUpload(FILE)).rejects.toThrow('offline');
    expect(replace).not.toHaveBeenCalled();
  });
});
