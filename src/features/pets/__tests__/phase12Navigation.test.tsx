import { Routes } from '@/constants/routes';
import { useAuthStore } from '@/features/auth/store';
import { usersApi } from '@/features/users';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { petsApi } from '../api';
import PetDetailsScreen from '../screens/PetDetailsScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const OWNER = '11111111-1111-1111-1111-111111111111';

function seedOwner(id = OWNER) {
  const user = {
    id,
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

const petFor = (ownerId: string) => ({
  id: 'p1',
  name: 'ميمي',
  species: 'CAT' as const,
  breed: null,
  sex: 'UNKNOWN' as const,
  dateOfBirth: null,
  notes: null,
  status: 'ACTIVE' as const,
  createdBy: ownerId,
  currentOwnerUserId: ownerId,
  createdAt: '',
  updatedAt: '',
});

beforeEach(() => {
  resetRouterMock();
  setSearchParams({ petId: 'p1' });
  seedOwner();
  jest.spyOn(petsApi, 'get').mockResolvedValue(petFor(OWNER));
  jest.spyOn(usersApi, 'getSummary').mockResolvedValue({
    id: OWNER,
    firstName: 'س',
    lastName: 'ع',
    veterinarianStatus: 'NOT_APPLIED',
  });
});
afterAll(() => {
  jest.restoreAllMocks();
  useAuthStore.setState({ session: null, user: null });
});

describe('Phase 12 navigation', () => {
  it('route builders are deep-link-safe absolute paths', () => {
    expect(Routes.petTransferRequests).toBe('/(app)/pets/transfer-requests');
    expect(Routes.petOwnership('p1')).toBe('/(app)/pets/p1/ownership');
    expect(Routes.petMedicalHistory('p1')).toBe('/(app)/pets/p1/medical-history');
    expect(Routes.orgAnimalMedicalHistory('o1', 'a1')).toBe(
      '/(app)/organizations/o1/animals/a1/medical-history',
    );
  });

  it('owner Pet Details shows Transfer + Ownership history + Full medical history and navigates', async () => {
    renderWithProviders(<PetDetailsScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());

    fireEvent.press(screen.getByLabelText('سجل الملكية'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/pets/p1/ownership');

    fireEvent.press(screen.getByRole('button', { name: 'نقل الملكية' }));
    expect(routerMock.push).toHaveBeenCalledWith({
      pathname: '/(app)/pets/transfer-requests',
      params: { petId: 'p1' },
    });

    fireEvent.press(screen.getByLabelText('السجل الطبي الكامل'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/pets/p1/medical-history');
  });

  it('a non-owner sees no Transfer button (backend still authoritative)', async () => {
    (petsApi.get as jest.Mock).mockResolvedValue(petFor('someone-else'));
    renderWithProviders(<PetDetailsScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());
    expect(screen.queryByRole('button', { name: 'نقل الملكية' })).toBeNull();
  });
});
