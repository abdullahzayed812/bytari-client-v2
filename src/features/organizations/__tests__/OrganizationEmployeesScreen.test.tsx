import { useAuthStore } from '@/features/auth/store';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { organizationsApi } from '../api';
import OrganizationEmployeesScreen from '../screens/OrganizationEmployeesScreen';
import type { OrganizationDetail, OrganizationMember } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

function org(over: Partial<OrganizationDetail> = {}): OrganizationDetail {
  return {
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
    ...over,
  };
}

const mkMember = (over: Partial<OrganizationMember>): OrganizationMember => ({
  id: 'm1',
  organizationId: 'o1',
  userId: 'u2',
  roleKey: 'STAFF',
  status: 'ACTIVE',
  addedBy: 'u1',
  createdAt: '',
  updatedAt: '',
  user: { id: 'u2', email: 'staff@x.c', firstName: 'سالم', lastName: 'ع' },
  ...over,
});

const owner = mkMember({
  id: 'm0',
  userId: 'u1',
  roleKey: 'OWNER',
  user: { id: 'u1', email: 'owner@x.c', firstName: 'ريم', lastName: 'أ' },
});
const staff = mkMember({});
const vet = mkMember({
  id: 'm2',
  userId: 'u3',
  roleKey: 'VETERINARIAN',
  user: { id: 'u3', email: 'vet@x.c', firstName: 'هدى', lastName: 'ب' },
});
const sup = mkMember({
  id: 'm3',
  userId: 'u4',
  roleKey: 'SUPERVISOR',
  user: { id: 'u4', email: 'sup@x.c', firstName: 'علي', lastName: 'ج' },
});
const page = (items: OrganizationMember[]) => ({
  items,
  meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1 },
});

describe('OrganizationEmployeesScreen — one page for staff, vets and supervisors', () => {
  const get = jest.spyOn(organizationsApi, 'get');
  const listMembers = jest.spyOn(organizationsApi, 'listMembers');
  const removeMember = jest.spyOn(organizationsApi, 'removeMember');
  const removeSupervisor = jest.spyOn(organizationsApi, 'removeSupervisor');

  beforeEach(() => {
    resetRouterMock();
    get.mockReset().mockResolvedValue(org());
    listMembers.mockReset().mockResolvedValue(page([owner, staff, vet, sup]));
    removeMember.mockReset().mockResolvedValue(undefined as never);
    removeSupervisor.mockReset().mockResolvedValue(undefined as never);
    setSearchParams({ organizationId: 'o1' });
    useAuthStore.setState({ session: null });
  });
  afterAll(() => jest.restoreAllMocks());

  it('lists every non-owner role on one page; the role filter narrows the server query', async () => {
    renderWithProviders(<OrganizationEmployeesScreen />);
    await waitFor(() => expect(screen.getByText('staff@x.c')).toBeOnTheScreen());
    expect(screen.getByText('vet@x.c')).toBeOnTheScreen();
    expect(screen.getByText('sup@x.c')).toBeOnTheScreen();
    expect(screen.queryByText('owner@x.c')).toBeNull();

    fireEvent.press(screen.getByText('مشرفون'));
    await waitFor(() =>
      expect(listMembers).toHaveBeenLastCalledWith(
        'o1',
        expect.objectContaining({ roleKey: 'SUPERVISOR' }),
      ),
    );
  });

  it('the add action opens the Add Employee form', async () => {
    renderWithProviders(<OrganizationEmployeesScreen />);
    await waitFor(() => expect(screen.getByText('staff@x.c')).toBeOnTheScreen());
    fireEvent.press(screen.getByLabelText('إضافة موظف'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/organizations/o1/employees/add');
  });

  it('removing a supervisor uses the supervisor route; an employee the member route', async () => {
    renderWithProviders(<OrganizationEmployeesScreen />);
    await waitFor(() => expect(screen.getByText('sup@x.c')).toBeOnTheScreen());

    fireEvent.press(screen.getByLabelText('إدارة علي ج'));
    fireEvent.press(screen.getByText('إزالة الموظف'));
    fireEvent.press(screen.getAllByRole('button', { name: 'إزالة الموظف' }).at(-1)!);
    await waitFor(() => expect(removeSupervisor).toHaveBeenCalledWith('o1', 'm3'));
    expect(removeMember).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText('إدارة سالم ع'));
    fireEvent.press(screen.getByText('إزالة الموظف'));
    fireEvent.press(screen.getAllByRole('button', { name: 'إزالة الموظف' }).at(-1)!);
    await waitFor(() => expect(removeMember).toHaveBeenCalledWith('o1', 'm1'));
  });

  it('a read-only member (member.read only) sees the list but no add / manage actions', async () => {
    get.mockResolvedValue(
      org({ myRole: 'STAFF', myPermissions: ['organization.read', 'member.read'] }),
    );
    renderWithProviders(<OrganizationEmployeesScreen />);
    await waitFor(() => expect(screen.getByText('staff@x.c')).toBeOnTheScreen());
    expect(screen.queryByLabelText('إضافة موظف')).toBeNull();
    expect(screen.queryByLabelText('إدارة سالم ع')).toBeNull();
  });
});
