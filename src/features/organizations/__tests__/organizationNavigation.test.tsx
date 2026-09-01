import { Routes } from '@/constants/routes';
import { useAuthStore } from '@/features/auth/store';
import type { SessionSnapshot } from '@/features/auth/types';
import { veterinarianApi } from '@/features/veterinarian';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { organizationsApi } from '../api';
import OrganizationDetailsScreen from '../screens/OrganizationDetailsScreen';
import type { OrganizationDetail } from '../types';

import VeterinarianHomeScreen from '@/features/veterinarian/screens/VeterinarianHomeScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

function approvedVet(over: Partial<SessionSnapshot> = {}) {
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
      ...over,
    },
  });
}

const detail: OrganizationDetail = {
  id: 'o1',
  type: 'CLINIC',
  name: 'عيادة الرحمة البيطرية',
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
};

describe('Phase 4 navigation (§32): Vet Home → Organizations → Details → Members / Supervisors / Edit', () => {
  const listMine = jest.spyOn(organizationsApi, 'listMine');
  const get = jest.spyOn(organizationsApi, 'get');
  const myStatus = jest.spyOn(veterinarianApi, 'myStatus');

  beforeEach(() => {
    resetRouterMock();
    listMine.mockReset().mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 1, total: 0, totalPages: 1 },
    });
    get.mockReset().mockResolvedValue(detail);
    myStatus.mockReset().mockResolvedValue({ veterinarianStatus: 'APPROVED', application: null });
    approvedVet();
  });
  afterAll(() => {
    jest.restoreAllMocks();
    useAuthStore.setState({ session: null });
  });

  it('the route builders produce deep-link-safe absolute paths', () => {
    expect(Routes.organizations).toBe('/(app)/organizations');
    expect(Routes.organizationsCreate).toBe('/(app)/organizations/create');
    expect(Routes.organizationDetail('o1')).toBe('/(app)/organizations/o1');
    expect(Routes.organizationMembers('o1')).toBe('/(app)/organizations/o1/members');
    expect(Routes.organizationSupervisors('o1')).toBe('/(app)/organizations/o1/supervisors');
    expect(Routes.organizationEdit('o1')).toBe('/(app)/organizations/o1/edit');
    expect(Routes.veterinarianApply).toBe('/(app)/veterinarian/apply');
  });

  it('Veterinarian Home → My Organizations', async () => {
    renderWithProviders(<VeterinarianHomeScreen />);
    await waitFor(() => expect(screen.getByText('مؤسساتي')).toBeOnTheScreen());
    fireEvent.press(screen.getByText('مؤسساتي'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/organizations');
  });

  it('Organization Details → Members, Supervisors and Edit', async () => {
    setSearchParams({ organizationId: 'o1' });
    renderWithProviders(<OrganizationDetailsScreen />);
    await waitFor(() => expect(screen.getByText('عيادة الرحمة البيطرية')).toBeOnTheScreen());

    fireEvent.press(screen.getByLabelText('الأعضاء'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/organizations/o1/members');

    fireEvent.press(screen.getByLabelText('المشرفون'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/organizations/o1/supervisors');
  });
});
