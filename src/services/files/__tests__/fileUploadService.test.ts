import { FileUploadService } from '../fileUploadService';
import type { PresignProvider } from '../types';

describe('FileUploadService — declared size', () => {
  const realFetch = global.fetch;
  const realXhr = global.XMLHttpRequest;

  beforeEach(() => {
    // Local file read → a 1234-byte blob; the presigned PUT → 200.
    global.fetch = jest.fn(async (url: string) =>
      url.startsWith('file://')
        ? ({ blob: async () => ({ size: 1234 }) } as unknown as Response)
        : ({ ok: true, status: 200 } as Response),
    ) as unknown as typeof fetch;
    // Force the fetch upload path.
    (global as { XMLHttpRequest?: unknown }).XMLHttpRequest = undefined;
  });
  afterEach(() => {
    global.fetch = realFetch;
    global.XMLHttpRequest = realXhr;
  });

  it('measures the bytes when the picker/editor gave no size (never presigns size 0)', async () => {
    const requestUpload = jest.fn(async () => ({
      storageKey: 'k',
      uploadUrl: 'https://r2.example/put',
      method: 'PUT' as const,
      headers: {},
      expiresInSeconds: 600,
    }));
    const provider: PresignProvider = { requestUpload };
    await new FileUploadService(provider).upload({
      uri: 'file:///edited.jpg',
      name: 'edited.jpg',
      mimeType: 'image/jpeg',
    });
    expect(requestUpload).toHaveBeenCalledWith(expect.objectContaining({ size: 1234 }));
  });

  it('keeps a size the picker already reported', async () => {
    const requestUpload = jest.fn(async () => ({
      storageKey: 'k',
      uploadUrl: 'https://r2.example/put',
      method: 'PUT' as const,
      headers: {},
      expiresInSeconds: 600,
    }));
    await new FileUploadService({ requestUpload }).upload({
      uri: 'file:///a.jpg',
      name: 'a.jpg',
      mimeType: 'image/jpeg',
      size: 999,
    });
    expect(requestUpload).toHaveBeenCalledWith(expect.objectContaining({ size: 999 }));
  });
});
