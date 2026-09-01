import { Routes } from '@/constants/routes';
import { useAuthStore } from '@/features/auth/store';
import { organizationAnimalsApi } from '@/features/animals/api';
import OrganizationAnimalDetailScreen from '@/features/animals/screens/OrganizationAnimalDetailScreen';
import { organizationsApi } from '@/features/organizations';
import { petsApi } from '@/features/pets';
import PetDetailsScreen from '@/features/pets/screens/PetDetailsScreen';
import MyPetsScreen from '@/features/pets/screens/MyPetsScreen';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

function seedVet() {
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

describe('Phase 6 navigation (§34) + Pet Owner coexistence (§16)', () => {
  beforeEach(() => resetRouterMock());
  afterAll(() => {
    jest.restoreAllMocks();
    useAuthStore.setState({ session: null });
  });

  it('route builders are deep-link-safe absolute paths', () => {
    expect(Routes.orgAnimalMedicalRecords('o1', 'a1')).toBe(
      '/(app)/organizations/o1/animals/a1/medical-records',
    );
    expect(Routes.orgAnimalMedicalRecordCreate('o1', 'a1')).toBe(
      '/(app)/organizations/o1/animals/a1/medical-records/create',
    );
    expect(Routes.orgAnimalMedicalRecordEdit('o1', 'a1', 'r1')).toBe(
      '/(app)/organizations/o1/animals/a1/medical-records/r1/edit',
    );
    expect(Routes.orgAnimalVaccination('o1', 'a1', 'v1')).toBe(
      '/(app)/organizations/o1/animals/a1/vaccinations/v1',
    );
    expect(Routes.petMedicalRecords('p1')).toBe('/(app)/pets/p1/medical-records');
    expect(Routes.petVaccination('p1', 'v1')).toBe('/(app)/pets/p1/vaccinations/v1');
  });

  it('Organization Animal Details (CLINIC) shows the Medical Records + Vaccinations entries', async () => {
    seedVet();
    setSearchParams({ organizationId: 'o1', animalId: 'a1' });
    jest
      .spyOn(organizationsApi, 'get')
      .mockResolvedValue({ id: 'o1', type: 'CLINIC', myRole: 'OWNER' } as never);
    jest.spyOn(organizationAnimalsApi, 'list').mockResolvedValue({
      items: [
        {
          id: 'g1',
          animalId: 'a1',
          organizationId: 'o1',
          status: 'ACTIVE',
          grantedByUserId: 'u1',
          createdAt: '2026-01-01T00:00:00.000Z',
          animal: { name: 'لولو', species: 'DOG', status: 'ACTIVE' },
        },
      ],
      meta: { page: 1, pageSize: 50, total: 1, totalPages: 1 },
    });
    renderWithProviders(<OrganizationAnimalDetailScreen />);
    await waitFor(() => expect(screen.getByText('لولو')).toBeOnTheScreen());

    fireEvent.press(screen.getByLabelText('السجل الطبي'));
    expect(routerMock.push).toHaveBeenCalledWith(
      '/(app)/organizations/o1/animals/a1/medical-records',
    );

    fireEvent.press(screen.getByLabelText('التطعيمات'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/organizations/o1/animals/a1/vaccinations');
  });

  it('Pet Details (owner) shows read-only Medical Records + Vaccinations entries', async () => {
    const owner = {
      id: 'owner1',
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
      user: owner,
      session: {
        user: owner,
        roles: ['PET_OWNER'],
        permissions: [],
        isAdmin: false,
        supervisorDomains: [],
        veterinarian: { status: 'NOT_APPLIED', approved: false },
      },
    });
    setSearchParams({ petId: 'p1' });
    jest.spyOn(petsApi, 'get').mockResolvedValue({
      id: 'p1',
      name: 'ميمي',
      species: 'CAT',
      breed: null,
      sex: 'UNKNOWN',
      dateOfBirth: null,
      notes: null,
      status: 'ACTIVE',
      createdBy: 'owner1',
      currentOwnerUserId: 'owner1',
      createdAt: '',
      updatedAt: '',
    });
    renderWithProviders(<PetDetailsScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());

    fireEvent.press(screen.getByLabelText('السجل الطبي'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/pets/p1/medical-records');
  });

  it('Pet Owner "My Pets" (Phase 3) still renders', async () => {
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
          createdBy: 'owner1',
          currentOwnerUserId: 'owner1',
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
