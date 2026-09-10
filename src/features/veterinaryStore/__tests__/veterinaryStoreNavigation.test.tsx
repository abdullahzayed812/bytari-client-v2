import { Routes } from '@/constants/routes';
import { useAuthStore } from '@/features/auth/store';
import { organizationAnimalsApi } from '@/features/animals/api';
import { orgCapabilities, organizationsApi } from '@/features/organizations';
import OrganizationDetailsScreen from '@/features/organizations/screens/OrganizationDetailsScreen';
import { petsApi } from '@/features/pets';
import MyPetsScreen from '@/features/pets/screens/MyPetsScreen';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { veterinaryStoreProductsApi } from '../api';
import { organizationOwnsVeterinaryStoreProducts } from '../constants';

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
        traderStatus: 'NOT_REGISTERED' as const,
        createdAt: '',
        updatedAt: '',
      },
      roles: ['PET_OWNER', 'VETERINARIAN'],
      permissions: [],
      isAdmin: false,
      supervisorDomains: [],
      veterinarian: { status: 'APPROVED', approved: true },
      trader: { status: 'NOT_REGISTERED', approved: false },
    },
  });
}

const orgDetail = (type: string, myRole = 'OWNER') =>
  ({
    id: 'o1',
    type,
    name: 'واحة الدواء',
    description: null,
    ownerUserId: 'u1',
    status: 'ACTIVE',
    decidedBy: null,
    decidedAt: null,
    decisionReason: null,
    createdAt: '',
    updatedAt: '',
    details: {},
    myRole,
  }) as const;

describe('Phase 10 store navigation + capability gates + Pet Owner coexistence', () => {
  const get = jest.spyOn(organizationsApi, 'get');
  const listProducts = jest.spyOn(veterinaryStoreProductsApi, 'list');

  beforeEach(() => {
    resetRouterMock();
    get.mockReset();
    listProducts.mockReset().mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
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
    expect(Routes.organizationStoreProducts('o1')).toBe('/(app)/organizations/o1/store-products');
    expect(Routes.organizationStoreProductCreate('o1')).toBe('/(app)/organizations/o1/store-products/create');
    expect(Routes.organizationStoreProduct('o1', 'p1')).toBe('/(app)/organizations/o1/store-products/p1');
    expect(Routes.organizationStoreProductEdit('o1', 'p1')).toBe(
      '/(app)/organizations/o1/store-products/p1/edit',
    );
  });

  it('organizationOwnsVeterinaryStoreProducts matches VETERINARY_STORE only — VETERINARY_OFFICE is a separate catalog', () => {
    expect(organizationOwnsVeterinaryStoreProducts('VETERINARY_STORE')).toBe(true);
    expect(organizationOwnsVeterinaryStoreProducts('VETERINARY_OFFICE')).toBe(false);
    expect(organizationOwnsVeterinaryStoreProducts('CLINIC')).toBe(false);
    expect(organizationOwnsVeterinaryStoreProducts('FARM')).toBe(false);
    expect(organizationOwnsVeterinaryStoreProducts(undefined)).toBe(false);
  });

  it('orgCapabilities: OWNER manages, STAFF is read-only, VETERINARIAN gets nothing', () => {
    const owner = orgCapabilities('OWNER', false);
    expect(owner.canViewStoreProducts).toBe(true);
    expect(owner.canManageStoreProducts).toBe(true);

    const staff = orgCapabilities('STAFF', false);
    expect(staff.canViewStoreProducts).toBe(true);
    expect(staff.canManageStoreProducts).toBe(false);

    const supervisor = orgCapabilities('SUPERVISOR', false);
    expect(supervisor.canViewStoreProducts).toBe(true);
    expect(supervisor.canManageStoreProducts).toBe(true);

    const vet = orgCapabilities('VETERINARIAN', false);
    expect(vet.canViewStoreProducts).toBe(false);
    expect(vet.canManageStoreProducts).toBe(false);
  });

  it('a VETERINARY_STORE dashboard shows the Products entry and navigates to it', async () => {
    get.mockResolvedValue(orgDetail('VETERINARY_STORE') as never);
    setSearchParams({ organizationId: 'o1' });
    renderWithProviders(<OrganizationDetailsScreen />);
    await waitFor(() => expect(screen.getByText('واحة الدواء')).toBeOnTheScreen());

    fireEvent.press(screen.getByLabelText('المنتجات'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/organizations/o1/store-products');
  });

  it('a CLINIC / FARM dashboard never shows the Products entry', async () => {
    get.mockResolvedValue(orgDetail('CLINIC') as never);
    setSearchParams({ organizationId: 'o1' });
    renderWithProviders(<OrganizationDetailsScreen />);
    await waitFor(() => expect(screen.getByText('واحة الدواء')).toBeOnTheScreen());
    expect(screen.queryByLabelText('المنتجات')).toBeNull();
  });

  it('a store STAFF member still sees the Products entry (read-only view)', async () => {
    get.mockResolvedValue(orgDetail('VETERINARY_STORE', 'STAFF') as never);
    setSearchParams({ organizationId: 'o1' });
    renderWithProviders(<OrganizationDetailsScreen />);
    await waitFor(() => expect(screen.getByText('واحة الدواء')).toBeOnTheScreen());
    expect(screen.getByLabelText('المنتجات')).toBeOnTheScreen();
  });

  it('Pet Owner "My Pets" still renders (existing functionality intact)', async () => {
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
