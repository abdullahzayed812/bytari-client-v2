import { useAuthStore } from '@/features/auth/store';
import { organizationsApi } from '@/features/organizations';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { organizationAnimalsApi } from '../api';
import OrganizationAnimalDetailScreen from '../screens/OrganizationAnimalDetailScreen';
import type { OrganizationAnimalGrant } from '../types';

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

const orgDetail = {
  id: 'o1',
  type: 'CLINIC',
  name: 'عيادة',
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
} as const;

const grant: OrganizationAnimalGrant = {
  id: 'g1',
  animalId: 'a1',
  organizationId: 'o1',
  status: 'ACTIVE',
  grantedByUserId: 'u1',
  createdAt: '2026-02-03T00:00:00.000Z',
  animal: { name: 'لولو', species: 'DOG', status: 'ACTIVE' },
};

describe('OrganizationAnimalDetailScreen (§8, §12, §14)', () => {
  const get = jest.spyOn(organizationsApi, 'get');
  const list = jest.spyOn(organizationAnimalsApi, 'list');
  const revoke = jest.spyOn(organizationAnimalsApi, 'revoke');

  beforeEach(() => {
    resetRouterMock();
    get.mockReset().mockResolvedValue(orgDetail as never);
    list.mockReset();
    revoke.mockReset();
    setSearchParams({ organizationId: 'o1', animalId: 'a1' });
    seedOwner();
  });
  afterAll(() => {
    jest.restoreAllMocks();
    useAuthStore.setState({ session: null });
  });

  it('shows the animal overview, an explicit owner-not-shared block, and future-module placeholders', async () => {
    list.mockResolvedValue({
      items: [grant],
      meta: { page: 1, pageSize: 50, total: 1, totalPages: 1 },
    });
    renderWithProviders(<OrganizationAnimalDetailScreen />);

    await waitFor(() => expect(screen.getByText('لولو')).toBeOnTheScreen());
    expect(screen.getByText('معلومات المالك')).toBeOnTheScreen();
    expect(screen.getByText('بيانات المالك غير متاحة')).toBeOnTheScreen();
    expect(screen.getByText('السجل الطبي')).toBeOnTheScreen();
    expect(screen.getByText('التطعيمات')).toBeOnTheScreen();
    // no medical business logic rendered — only the "coming soon" placeholders
    expect(screen.getAllByText('قريباً').length).toBeGreaterThan(0);
  });

  it('renders a plain "not linked" state when the animal is not in the organization', async () => {
    list.mockResolvedValue({ items: [], meta: { page: 1, pageSize: 50, total: 0, totalPages: 1 } });
    renderWithProviders(<OrganizationAnimalDetailScreen />);
    await waitFor(() => expect(screen.getByText('الحيوان غير مرتبط بالمؤسسة')).toBeOnTheScreen());
  });

  it('renders a safe forbidden state on a 403 (no authorization detail leaked)', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    list.mockRejectedValue(new ApiError({ code: 'FORBIDDEN', message: 'secret', status: 403 }));
    renderWithProviders(<OrganizationAnimalDetailScreen />);
    await waitFor(() => expect(screen.getByText('الحيوان غير متاح')).toBeOnTheScreen());
    expect(screen.queryByText('secret')).toBeNull();
  });

  it('an OWNER can revoke access: confirm → DELETE by animalId', async () => {
    list.mockResolvedValue({
      items: [grant],
      meta: { page: 1, pageSize: 50, total: 1, totalPages: 1 },
    });
    revoke.mockResolvedValue({ revoked: true });
    renderWithProviders(<OrganizationAnimalDetailScreen />);
    await waitFor(() => expect(screen.getByText('لولو')).toBeOnTheScreen());

    fireEvent.press(screen.getByText('إلغاء وصول المؤسسة'));
    await waitFor(() =>
      expect(screen.getByText(/ستفقد المؤسسة صلاحية الوصول إلى هذا الحيوان/)).toBeOnTheScreen(),
    );
    const confirms = screen.getAllByText('إلغاء وصول المؤسسة');
    fireEvent.press(confirms[confirms.length - 1]!);

    await waitFor(() => expect(revoke).toHaveBeenCalledWith('o1', 'a1'));
    await waitFor(() =>
      expect(routerMock.replace).toHaveBeenCalledWith('/(app)/organizations/o1/animals'),
    );
  });
});
