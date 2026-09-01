import { Routes } from '@/constants/routes';
import { useAuthStore } from '@/features/auth/store';
import { organizationAnimalsApi } from '@/features/animals/api';
import { organizationsApi } from '@/features/organizations';
import OrganizationDetailsScreen from '@/features/organizations/screens/OrganizationDetailsScreen';
import OrganizationMembersScreen from '@/features/organizations/screens/OrganizationMembersScreen';
import { petsApi } from '@/features/pets';
import MyPetsScreen from '@/features/pets/screens/MyPetsScreen';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { farmApi } from '../api';

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

describe('Phase 7 organization dashboard (§2–§8) + Pet Owner coexistence (§24)', () => {
  const get = jest.spyOn(organizationsApi, 'get');
  const listMembers = jest.spyOn(organizationsApi, 'listMembers');

  beforeEach(() => {
    resetRouterMock();
    get.mockReset();
    listMembers.mockReset();
    jest.spyOn(farmApi, 'getJoinCode').mockResolvedValue({ joinCode: 'FARM-8F3K9Q' });
    jest.spyOn(organizationAnimalsApi, 'list').mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 50, total: 0, totalPages: 1 },
    });
    seedOwner();
  });
  afterAll(() => {
    jest.restoreAllMocks();
    useAuthStore.setState({ session: null });
  });

  it('route builders are deep-link-safe absolute paths', () => {
    expect(Routes.organizationPoultry('o1')).toBe('/(app)/organizations/o1/poultry');
    expect(Routes.organizationPoultryFlock('o1', 'f1')).toBe('/(app)/organizations/o1/poultry/f1');
    expect(Routes.veterinarianJoinFarm).toBe('/(app)/veterinarian/join-farm');
  });

  it('a CLINIC dashboard shows Animals + Members + Veterinarians + Supervisors, NOT Poultry / join code', async () => {
    get.mockResolvedValue(orgDetail('CLINIC') as never);
    setSearchParams({ organizationId: 'o1' });
    renderWithProviders(<OrganizationDetailsScreen />);
    await waitFor(() => expect(screen.getByText('مؤسسة')).toBeOnTheScreen());

    expect(screen.getByLabelText('الحيوانات')).toBeOnTheScreen();
    expect(screen.getByLabelText('الأعضاء')).toBeOnTheScreen();
    expect(screen.getByLabelText('الأطباء البيطريون')).toBeOnTheScreen();
    expect(screen.getByLabelText('المشرفون')).toBeOnTheScreen();
    expect(screen.queryByLabelText('الدواجن')).toBeNull();
    expect(screen.queryByText('رمز انضمام المزرعة')).toBeNull();
  });

  it('a FARM dashboard adds the Poultry entry and the owner join-code card', async () => {
    get.mockResolvedValue(orgDetail('FARM') as never);
    setSearchParams({ organizationId: 'o1' });
    renderWithProviders(<OrganizationDetailsScreen />);
    await waitFor(() => expect(screen.getByText('مؤسسة')).toBeOnTheScreen());

    expect(screen.getByText('رمز انضمام المزرعة')).toBeOnTheScreen();
    await waitFor(() => expect(screen.getByText('FARM-8F3K9Q')).toBeOnTheScreen());

    fireEvent.press(screen.getByLabelText('الدواجن'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/organizations/o1/poultry');
  });

  it('a VETERINARY_OFFICE dashboard shows only Members / Veterinarians / Supervisors (no animals / poultry)', async () => {
    get.mockResolvedValue(orgDetail('VETERINARY_OFFICE') as never);
    setSearchParams({ organizationId: 'o1' });
    renderWithProviders(<OrganizationDetailsScreen />);
    await waitFor(() => expect(screen.getByText('مؤسسة')).toBeOnTheScreen());
    expect(screen.queryByLabelText('الحيوانات')).toBeNull();
    expect(screen.queryByLabelText('الدواجن')).toBeNull();
    expect(screen.getByLabelText('الأعضاء')).toBeOnTheScreen();
  });

  it('the members screen with ?roleKey=VETERINARIAN retitles + filters', async () => {
    get.mockResolvedValue(orgDetail('CLINIC') as never);
    listMembers.mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    setSearchParams({ organizationId: 'o1', roleKey: 'VETERINARIAN' });
    renderWithProviders(<OrganizationMembersScreen />);
    await waitFor(() =>
      expect(screen.getByText('لا يوجد أطباء مرتبطون بهذه المؤسسة')).toBeOnTheScreen(),
    );
    expect(listMembers).toHaveBeenCalledWith(
      'o1',
      expect.objectContaining({ roleKey: 'VETERINARIAN' }),
    );
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
