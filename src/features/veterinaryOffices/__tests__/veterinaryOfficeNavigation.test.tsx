import { Routes } from '@/constants/routes';
import { useAuthStore } from '@/features/auth/store';
import { orgCapabilities, organizationsApi } from '@/features/organizations';
import OrganizationDetailsScreen from '@/features/organizations/screens/OrganizationDetailsScreen';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { veterinaryOfficeProductsApi } from '../dashboard/api';
import { organizationOwnsVeterinaryOfficeProducts } from '../constants';

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
    name: 'مكتب الرحمة البيطري',
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

describe('Veterinary Office management navigation + capability gates', () => {
  const get = jest.spyOn(organizationsApi, 'get');
  const listProducts = jest.spyOn(veterinaryOfficeProductsApi, 'list');

  beforeEach(() => {
    resetRouterMock();
    get.mockReset();
    listProducts.mockReset().mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    seedOwner();
  });
  afterAll(() => {
    jest.restoreAllMocks();
    useAuthStore.setState({ session: null });
  });

  it('route builders are deep-link-safe absolute paths', () => {
    expect(Routes.organizationOfficeProducts('o1')).toBe('/(app)/organizations/o1/office-products');
    expect(Routes.organizationOfficeProductCreate('o1')).toBe(
      '/(app)/organizations/o1/office-products/create',
    );
    expect(Routes.organizationOfficeProduct('o1', 'p1')).toBe(
      '/(app)/organizations/o1/office-products/p1',
    );
    expect(Routes.organizationOfficeProductEdit('o1', 'p1')).toBe(
      '/(app)/organizations/o1/office-products/p1/edit',
    );
  });

  it('organizationOwnsVeterinaryOfficeProducts matches VETERINARY_OFFICE only — VETERINARY_STORE is a separate catalog', () => {
    expect(organizationOwnsVeterinaryOfficeProducts('VETERINARY_OFFICE')).toBe(true);
    expect(organizationOwnsVeterinaryOfficeProducts('VETERINARY_STORE')).toBe(false);
    expect(organizationOwnsVeterinaryOfficeProducts('CLINIC')).toBe(false);
    expect(organizationOwnsVeterinaryOfficeProducts('FARM')).toBe(false);
    expect(organizationOwnsVeterinaryOfficeProducts(undefined)).toBe(false);
  });

  it('orgCapabilities: OWNER manages, STAFF is read-only', () => {
    const owner = orgCapabilities('OWNER', false);
    expect(owner.canViewStoreProducts).toBe(true);
    expect(owner.canManageStoreProducts).toBe(true);

    const staff = orgCapabilities('STAFF', false);
    expect(staff.canViewStoreProducts).toBe(true);
    expect(staff.canManageStoreProducts).toBe(false);
  });

  it('a VETERINARY_OFFICE dashboard shows the Products entry and navigates to the office-products route', async () => {
    get.mockResolvedValue(orgDetail('VETERINARY_OFFICE') as never);
    setSearchParams({ organizationId: 'o1' });
    renderWithProviders(<OrganizationDetailsScreen />);
    await waitFor(() => expect(screen.getByText('مكتب الرحمة البيطري')).toBeOnTheScreen());

    fireEvent.press(screen.getByLabelText('المنتجات'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/organizations/o1/office-products');
  });

  it('a VETERINARY_STORE dashboard never routes the Products entry into the office-products path', async () => {
    get.mockResolvedValue(orgDetail('VETERINARY_STORE') as never);
    setSearchParams({ organizationId: 'o1' });
    renderWithProviders(<OrganizationDetailsScreen />);
    await waitFor(() => expect(screen.getByText('مكتب الرحمة البيطري')).toBeOnTheScreen());

    fireEvent.press(screen.getByLabelText('المنتجات'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/organizations/o1/store-products');
  });
});
