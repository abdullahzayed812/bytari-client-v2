import { Routes } from '@/constants/routes';
import { useAuthStore } from '@/features/auth/store';
import { organizationsApi } from '@/features/organizations';
import OrganizationDetailsScreen from '@/features/organizations/screens/OrganizationDetailsScreen';
import { petsApi } from '@/features/pets';
import MyPetsScreen from '@/features/pets/screens/MyPetsScreen';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

function seedOwner() {
  useAuthStore.setState({
    session: {
      user: {
        id: 'u1',
        email: 'v@x.c',
        firstName: 'ريم',
        lastName: 'أحمد',
        phone: null,
        status: 'ACTIVE',
        veterinarianStatus: 'APPROVED',
        createdAt: '',
        updatedAt: '',
      },
      roles: ['PET_OWNER', 'VETERINARIAN'],
      permissions: [],
      isAdmin: false,
      supervisorDomains: [],
      veterinarian: { status: 'APPROVED', approved: true },
    },
  });
}

const orgDetail = (type: string) =>
  ({
    id: 'o1',
    type,
    name: 'مؤسسة',
    description: null,
    ownerUserId: 'u1',
    status: 'ACTIVE',
    decidedBy: null,
    decidedAt: null,
    decisionReason: null,
    createdAt: '',
    updatedAt: '',
    details: {},
    myRole: 'OWNER',
  }) as const;

describe('Phase 5 navigation (§24) + Pet Owner coexistence (§15)', () => {
  const get = jest.spyOn(organizationsApi, 'get');

  beforeEach(() => {
    resetRouterMock();
    get.mockReset();
    seedOwner();
  });
  afterAll(() => {
    jest.restoreAllMocks();
    useAuthStore.setState({ session: null });
  });

  it('the route builders produce deep-link-safe absolute paths', () => {
    expect(Routes.organizationAnimals('o1')).toBe('/(app)/organizations/o1/animals');
    expect(Routes.organizationAnimalsGrant('o1')).toBe('/(app)/organizations/o1/animals/grant');
    expect(Routes.organizationAnimalDetail('o1', 'a1')).toBe('/(app)/organizations/o1/animals/a1');
  });

  it('a CLINIC organization detail shows the Animals entry and navigates to it', async () => {
    get.mockResolvedValue(orgDetail('CLINIC') as never);
    setSearchParams({ organizationId: 'o1' });
    renderWithProviders(<OrganizationDetailsScreen />);
    await waitFor(() => expect(screen.getByText('مؤسسة')).toBeOnTheScreen());

    fireEvent.press(screen.getByLabelText('الحيوانات'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/organizations/o1/animals');
  });

  it('a non-CLINIC organization detail does NOT show the Animals entry', async () => {
    get.mockResolvedValue(orgDetail('VETERINARY_OFFICE') as never);
    setSearchParams({ organizationId: 'o1' });
    renderWithProviders(<OrganizationDetailsScreen />);
    await waitFor(() => expect(screen.getByText('مؤسسة')).toBeOnTheScreen());
    expect(screen.queryByLabelText('الحيوانات')).toBeNull();
  });

  it('Pet Owner "My Pets" (Phase 3) still renders unchanged', async () => {
    jest.spyOn(petsApi, 'list').mockResolvedValue({
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
