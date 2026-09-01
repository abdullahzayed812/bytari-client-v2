import { apiClient } from '@/services/api';
import { useAuthStore } from '@/features/auth/store';
import type { SessionSnapshot } from '@/features/auth/types';
import type { LocalFile } from '@/services/files/types';
import {
  act,
  fireEvent,
  makeTestQueryClient,
  renderHookWithQuery,
  renderWithProviders,
  screen,
  waitFor,
} from '@/test-utils/render';
import { resetRouterMock } from '@/test-utils/routerMock';

import { veterinarianApi, vetKeys } from '../api';
import { useApplyForVeterinarian } from '../hooks';
import VeterinarianApplyScreen from '../screens/VeterinarianApplyScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const mockPickImage = jest.fn();
jest.mock('@/services/media', () => {
  const actual = jest.requireActual('@/services/media');
  return { ...actual, pickImage: (...a: unknown[]) => mockPickImage(...a) };
});

const FILE: LocalFile = {
  uri: 'file:///tmp/license.jpg',
  name: 'license.jpg',
  mimeType: 'image/jpeg',
  size: 1234,
};

function seed(status: SessionSnapshot['veterinarian']['status']) {
  useAuthStore.setState({
    refreshSession: jest.fn().mockResolvedValue(undefined),
    session: {
      user: {
        id: 'u1',
        email: 'e@x.c',
        firstName: 'ريم',
        lastName: 'أ',
        phone: null,
        status: 'ACTIVE',
        veterinarianStatus: status,
        createdAt: '',
        updatedAt: '',
      },
      roles: ['PET_OWNER'],
      permissions: [],
      isAdmin: false,
      supervisorDomains: [],
      veterinarian: { status, approved: status === 'APPROVED' },
    },
  });
}

describe('veterinarianApi.apply', () => {
  const post = jest.spyOn(apiClient, 'post');
  afterAll(() => jest.restoreAllMocks());

  it('POST /veterinarians/apply with the full body', async () => {
    const body = {
      note: 'licence 123',
      subType: 'VETERINARIAN' as const,
      documents: [
        {
          kind: 'LICENSE_OR_ID' as const,
          storageKey: 'k1',
          filename: 'f.jpg',
          mimeType: 'image/jpeg',
        },
      ],
    };
    post.mockResolvedValueOnce({ id: 'a1' });
    await veterinarianApi.apply(body);
    expect(post).toHaveBeenCalledWith('/veterinarians/apply', body);
  });
});

describe('useApplyForVeterinarian', () => {
  beforeEach(() => seed('NOT_APPLIED'));
  afterEach(() => jest.restoreAllMocks());
  afterAll(() => useAuthStore.setState({ session: null }));

  it('calls the API then refreshes the /auth/me snapshot', async () => {
    jest.spyOn(veterinarianApi, 'apply').mockResolvedValueOnce({ id: 'a1' } as never);
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useApplyForVeterinarian(), { client });

    const input = { note: 'hi', subType: 'VETERINARIAN' as const, documents: [] };
    await result.current.mutateAsync(input);

    expect(veterinarianApi.apply).toHaveBeenCalledWith(input);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: vetKeys.status() });
    expect(useAuthStore.getState().refreshSession).toHaveBeenCalled();
  });
});

describe('VeterinarianApplyScreen', () => {
  beforeEach(() => {
    resetRouterMock();
    seed('NOT_APPLIED');
    mockPickImage.mockReset();
    // @ts-expect-error test double for RN fetch used by the upload transfer
    global.fetch = jest.fn(async (url: string) => {
      if (String(url).startsWith('file://')) {
        return { blob: async () => ({ size: FILE.size }) } as unknown as Response;
      }
      return { ok: true, status: 200 } as Response;
    });
  });
  afterEach(() => jest.restoreAllMocks());
  afterAll(() => useAuthStore.setState({ session: null }));

  it('submits an application once the required document is uploaded', async () => {
    jest.spyOn(veterinarianApi, 'requestDocumentUploadUrl').mockResolvedValueOnce({
      storageKey: 'vet-docs/license.jpg',
      uploadUrl: 'https://example.test/put',
      method: 'PUT',
      headers: {},
      expiresInSeconds: 600,
    });
    const applySpy = jest
      .spyOn(veterinarianApi, 'apply')
      .mockResolvedValueOnce({ id: 'a1' } as never);
    mockPickImage.mockResolvedValue(FILE);

    renderWithProviders(<VeterinarianApplyScreen />);

    // Default subType is VETERINARIAN — the first (and only enabled) uploader
    // is the required LICENSE_OR_ID slot.
    fireEvent.press(screen.getAllByLabelText('إضافة صورة')[0]!);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('اختيار من المعرض'));
    });
    await waitFor(() => expect(veterinarianApi.requestDocumentUploadUrl).toHaveBeenCalled());

    fireEvent.press(screen.getByRole('button', { name: 'تقديم طلب الاعتماد' }));
    await waitFor(() =>
      expect(applySpy).toHaveBeenCalledWith({
        note: undefined,
        subType: 'VETERINARIAN',
        documents: [
          expect.objectContaining({ kind: 'LICENSE_OR_ID', storageKey: 'vet-docs/license.jpg' }),
        ],
      }),
    );
  });

  it('blocks submission without the required document', async () => {
    const applySpy = jest.spyOn(veterinarianApi, 'apply');
    renderWithProviders(<VeterinarianApplyScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'تقديم طلب الاعتماد' }));
    await waitFor(() => {
      expect(screen.getByText('صورة مزاولة المهنة أو الهوية الرسمية مطلوبة.')).toBeOnTheScreen();
    });
    expect(applySpy).not.toHaveBeenCalled();
  });

  it('an already-approved user sees a blocked state, not the form', async () => {
    seed('APPROVED');
    renderWithProviders(<VeterinarianApplyScreen />);
    expect(screen.getByText('حسابك معتمَد بالفعل كطبيب بيطري.')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'تقديم طلب الاعتماد' })).toBeNull();
  });
});
