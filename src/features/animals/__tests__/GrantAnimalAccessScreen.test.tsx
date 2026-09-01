import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { organizationAnimalsApi } from '../api';
import GrantAnimalAccessScreen from '../screens/GrantAnimalAccessScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const UUID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const placeholder = 'مثال: 3fa85f64-5717-4562-b3fc-2c963f66afa6';

describe('GrantAnimalAccessScreen (§10 — grants access, never transfers ownership)', () => {
  const grant = jest.spyOn(organizationAnimalsApi, 'grant');

  beforeEach(() => {
    resetRouterMock();
    grant.mockReset();
    setSearchParams({ organizationId: 'o1' });
  });
  afterAll(() => jest.restoreAllMocks());

  it('an invalid animal id is rejected client-side and never hits the API', async () => {
    renderWithProviders(<GrantAnimalAccessScreen />);
    fireEvent.changeText(screen.getByPlaceholderText(placeholder), 'not-a-uuid');
    fireEvent.press(screen.getByRole('button', { name: 'ربط الحيوان' }));
    await waitFor(() =>
      expect(screen.getByText('أدخل معرّف حيوان صحيحاً (UUID).')).toBeOnTheScreen(),
    );
    expect(grant).not.toHaveBeenCalled();
  });

  it('a valid id POSTs { animalId } to the route organization then opens the animal', async () => {
    grant.mockResolvedValueOnce({
      id: 'g1',
      animalId: UUID,
      organizationId: 'o1',
      status: 'ACTIVE',
      grantedByUserId: 'u1',
      createdAt: '',
    });
    renderWithProviders(<GrantAnimalAccessScreen />);
    fireEvent.changeText(screen.getByPlaceholderText(placeholder), UUID);
    fireEvent.press(screen.getByRole('button', { name: 'ربط الحيوان' }));

    await waitFor(() => expect(grant).toHaveBeenCalledWith('o1', { animalId: UUID }));
    await waitFor(() =>
      expect(routerMock.replace).toHaveBeenCalledWith(`/(app)/organizations/o1/animals/${UUID}`),
    );
  });

  it('maps a 409 to the "already linked" message (raw text never shown)', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    grant.mockRejectedValueOnce(
      new ApiError({ code: 'CONFLICT', message: 'clinic already has access', status: 409 }),
    );
    renderWithProviders(<GrantAnimalAccessScreen />);
    fireEvent.changeText(screen.getByPlaceholderText(placeholder), UUID);
    fireEvent.press(screen.getByRole('button', { name: 'ربط الحيوان' }));

    await waitFor(() =>
      expect(screen.getByText('هذا الحيوان مرتبط بالمؤسسة بالفعل.')).toBeOnTheScreen(),
    );
    expect(screen.queryByText('clinic already has access')).toBeNull();
  });

  it('maps ORGANIZATION_TYPE_NOT_SUPPORTED to the "clinics only" message', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    grant.mockRejectedValueOnce(
      new ApiError({
        code: 'ORGANIZATION_TYPE_NOT_SUPPORTED' as never,
        message: 'nope',
        status: 400,
      }),
    );
    renderWithProviders(<GrantAnimalAccessScreen />);
    fireEvent.changeText(screen.getByPlaceholderText(placeholder), UUID);
    fireEvent.press(screen.getByRole('button', { name: 'ربط الحيوان' }));

    await waitFor(() =>
      expect(screen.getByText('الوصول البيطري متاح لمؤسسات العيادات فقط.')).toBeOnTheScreen(),
    );
  });
});
