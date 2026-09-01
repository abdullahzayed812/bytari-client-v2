import { renderWithProviders, screen, fireEvent, waitFor, act } from '@/test-utils/render';
import type { LocalFile, PresignProvider } from '@/services/files/types';

import { ImageUploader } from '../ImageUploader';

const mockPickImage = jest.fn();
jest.mock('@/services/media', () => {
  const actual = jest.requireActual('@/services/media');
  return { ...actual, pickImage: (...a: unknown[]) => mockPickImage(...a) };
});

const FILE: LocalFile = {
  uri: 'file:///tmp/photo.jpg',
  name: 'photo.jpg',
  mimeType: 'image/jpeg',
  size: 1234,
};

function fakeProvider(overrides: Partial<PresignProvider> = {}): PresignProvider {
  return {
    requestUpload: jest.fn().mockResolvedValue({
      storageKey: 'users/2026/08/abc.jpg',
      uploadUrl: 'https://example.test/put',
      method: 'PUT',
      headers: {},
      expiresInSeconds: 600,
    }),
    finalizeUpload: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

beforeEach(() => {
  mockPickImage.mockReset();
  // @ts-expect-error test double for RN fetch used by the upload transfer
  global.fetch = jest.fn(async (url: string) => {
    if (String(url).startsWith('file://')) {
      return { blob: async () => ({ size: FILE.size }) } as unknown as Response;
    }
    return { ok: true, status: 200 } as Response;
  });
});

describe('ImageUploader — secure presigned upload flow', () => {
  it('picks an image, uploads via the provider, and reports the result', async () => {
    mockPickImage.mockResolvedValue(FILE);
    const provider = fakeProvider();
    const onChange = jest.fn();

    renderWithProviders(
      <ImageUploader value={null} provider={provider} onChange={onChange} label="الصورة" />,
    );

    fireEvent.press(screen.getByLabelText('إضافة صورة'));
    await act(async () => {
      fireEvent.press(screen.getByLabelText('اختيار من المعرض'));
    });

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(provider.requestUpload).toHaveBeenCalledWith(FILE);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ storageKey: 'users/2026/08/abc.jpg' }),
    );
  });

  it('surfaces a provider failure without calling onChange with a result', async () => {
    mockPickImage.mockResolvedValue(FILE);
    const provider = fakeProvider({
      requestUpload: jest.fn().mockRejectedValue(new Error('boom')),
    });
    const onChange = jest.fn();

    renderWithProviders(<ImageUploader value={null} provider={provider} onChange={onChange} />);
    fireEvent.press(screen.getByLabelText('إضافة صورة'));
    await act(async () => {
      fireEvent.press(screen.getByLabelText('اختيار من المعرض'));
    });

    await waitFor(() => expect(provider.requestUpload).toHaveBeenCalled());
    expect(onChange).not.toHaveBeenCalledWith(
      expect.objectContaining({ storageKey: expect.any(String) }),
    );
  });
});
