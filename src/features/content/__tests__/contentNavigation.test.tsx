import { Routes } from '@/constants/routes';
import { useAuthStore } from '@/features/auth/store';
import { petsApi } from '@/features/pets';
import ServicesHubScreen from '@/features/hub/screens/ServicesHubScreen';
import MyPetsScreen from '@/features/pets/screens/MyPetsScreen';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { contentApi } from '../api';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

function seedOwner() {
  const user = {
    id: 'u1',
    email: 'o@x.c',
    firstName: 'س',
    lastName: 'ع',
    phone: null,
    status: 'ACTIVE' as const,
    veterinarianStatus: 'NOT_APPLIED' as const,
    createdAt: '',
    updatedAt: '',
  };
  useAuthStore.setState({
    user,
    session: {
      user,
      roles: ['PET_OWNER'],
      permissions: [],
      isAdmin: false,
      supervisorDomains: [],
      veterinarian: { status: 'NOT_APPLIED', approved: false },
    },
  });
}

beforeEach(() => {
  resetRouterMock();
  setSearchParams({});
  seedOwner();
  jest.spyOn(petsApi, 'list').mockResolvedValue({
    items: [],
    meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
  });
  jest.spyOn(contentApi, 'list').mockResolvedValue({
    items: [],
    meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
  });
});
afterAll(() => {
  jest.restoreAllMocks();
  useAuthStore.setState({ session: null, user: null });
});

describe('Phase 11 content navigation + Pet Owner coexistence', () => {
  it('route builders are deep-link-safe absolute paths', () => {
    expect(Routes.contentHome).toBe('/(app)/content');
    expect(Routes.contentType('articles')).toBe('/(app)/content/articles');
    expect(Routes.contentItem('c1')).toBe('/(app)/content/item/c1');
    expect(Routes.contentFile('c1', 'f1')).toBe('/(app)/content/item/c1/files/f1');
  });

  it('Services hub shows the Knowledge entry and navigates to it', async () => {
    renderWithProviders(<ServicesHubScreen />);
    await waitFor(() => expect(screen.getAllByText('المكتبة المعرفية').length).toBeGreaterThan(0));
    fireEvent.press(screen.getByLabelText('المكتبة المعرفية'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/content');
  });

  it('Pet Owner "My Pets" still renders (existing functionality intact)', async () => {
    (petsApi.list as jest.Mock).mockResolvedValueOnce({
      items: [
        {
          id: 'p1',
          name: 'ميمي',
          species: 'CAT',
          breed: null,
          sex: 'UNKNOWN',
          dateOfBirth: null,
          notes: null,
          status: 'ACTIVE',
          createdBy: 'u1',
          currentOwnerUserId: 'u1',
          createdAt: '',
          updatedAt: '',
        },
      ],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders(<MyPetsScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());
  });
});
