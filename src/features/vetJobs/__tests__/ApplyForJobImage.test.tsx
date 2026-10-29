import { TextInput } from 'react-native';

import type { LocalFile } from '@/services/files/types';
import { act, fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, setSearchParams } from '@/test-utils/routerMock';

import { vetJobsApi } from '../api';
import ApplyForJobScreen from '../screens/ApplyForJobScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);
const mockPickImage = jest.fn();
jest.mock('@/services/media', () => {
  const actual = jest.requireActual('@/services/media');
  return { ...actual, pickImage: (...a: unknown[]) => mockPickImage(...a) };
});

const file = (name: string): LocalFile => ({
  uri: `file:///tmp/${name}`,
  name,
  mimeType: 'image/jpeg',
  size: 1234,
});

const presign = jest.spyOn(vetJobsApi, 'requestAttachmentUploadUrl');
const apply = jest.spyOn(vetJobsApi, 'apply');

beforeEach(() => {
  resetRouterMock();
  setSearchParams({ offerId: 'o1' });
  mockPickImage.mockReset();
  presign.mockReset().mockImplementation(async (input: { filename: string }) => ({
    storageKey: `vet-job-attachments/2026/10/${input.filename}`,
    uploadUrl: 'https://example.test/put',
    method: 'PUT' as const,
    headers: {},
    expiresInSeconds: 900,
  }));
  apply.mockReset().mockResolvedValue({ id: 'a1' } as never);
  // @ts-expect-error test double for RN fetch used by the upload transfer
  global.fetch = jest.fn(async (url: string) =>
    String(url).startsWith('file://')
      ? ({ blob: async () => ({ size: 1234 }) } as unknown as Response)
      : ({ ok: true, status: 200 } as Response),
  );
});
afterAll(() => jest.restoreAllMocks());

async function fillRequired(): Promise<void> {
  // Fields in render order: fullName, specialty, qualifications, experienceYears, coverNote, phone, email.
  const inputs = screen.UNSAFE_getAllByType(TextInput);
  fireEvent.changeText(inputs[0]!, 'د. سارة');
  fireEvent.changeText(inputs[5]!, '07700000000');
}

async function pickFromLibrary(trigger: string, byText = false): Promise<void> {
  fireEvent.press(byText ? screen.getByText(trigger) : screen.getByLabelText(trigger));
  await act(async () => {
    fireEvent.press(screen.getByLabelText('اختيار من المعرض'));
  });
}

describe('ApplyForJobScreen — optional application image', () => {
  it('uploads, replaces, and submits the image key with THIS application', async () => {
    renderWithProviders(<ApplyForJobScreen />);
    await fillRequired();

    mockPickImage.mockResolvedValueOnce(file('first.jpg'));
    await pickFromLibrary('إضافة صورة');
    await waitFor(() => expect(screen.getByText('تغيير الصورة')).toBeOnTheScreen());

    // Replace before submitting — only the latest upload is sent.
    mockPickImage.mockResolvedValueOnce(file('second.jpg'));
    await pickFromLibrary('تغيير الصورة', true);
    await waitFor(() => expect(presign).toHaveBeenCalledTimes(2));

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'إرسال الطلب' }));
    });
    await waitFor(() => expect(apply).toHaveBeenCalled());
    expect(apply).toHaveBeenCalledWith(
      'o1',
      expect.objectContaining({ photoStorageKey: 'vet-job-attachments/2026/10/second.jpg' }),
    );
  });

  it('removing the image submits the application without one', async () => {
    renderWithProviders(<ApplyForJobScreen />);
    await fillRequired();

    mockPickImage.mockResolvedValueOnce(file('first.jpg'));
    await pickFromLibrary('إضافة صورة');
    await waitFor(() => expect(screen.getByText('حذف الصورة')).toBeOnTheScreen());
    fireEvent.press(screen.getByText('حذف الصورة'));
    await waitFor(() => expect(screen.getByLabelText('إضافة صورة')).toBeOnTheScreen());

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'إرسال الطلب' }));
    });
    await waitFor(() => expect(apply).toHaveBeenCalled());
    expect(apply).toHaveBeenCalledWith('o1', expect.objectContaining({ photoStorageKey: null }));
  });
});
