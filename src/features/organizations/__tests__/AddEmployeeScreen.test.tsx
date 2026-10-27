import { useAuthStore } from '@/features/auth/store';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, setSearchParams } from '@/test-utils/routerMock';

import { organizationsApi } from '../api';
import AddEmployeeScreen from '../screens/AddEmployeeScreen';
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

const staff = mkMember({});

describe('AddEmployeeScreen — email + role, routed to the right backend endpoint', () => {
  const get = jest.spyOn(organizationsApi, 'get');
  const addMember = jest.spyOn(organizationsApi, 'addMember');
  const assign = jest.spyOn(organizationsApi, 'assignSupervisor');

  beforeEach(() => {
    resetRouterMock();
    get.mockReset().mockResolvedValue(org());
    addMember.mockReset().mockResolvedValue(staff);
    assign.mockReset().mockResolvedValue({ id: 's1' } as never);
    useAuthStore.setState({ session: null });
  });
  afterAll(() => jest.restoreAllMocks());

  it('a regular employee is added through POST /members as STAFF', async () => {
    setSearchParams({ organizationId: 'o1' });
    renderWithProviders(<AddEmployeeScreen />);
    await waitFor(() => expect(screen.getByPlaceholderText('example@email.com')).toBeOnTheScreen());
    fireEvent.changeText(screen.getByPlaceholderText('example@email.com'), 'New@X.com');
    fireEvent.press(screen.getByRole('button', { name: 'إضافة موظف' }));
    await waitFor(() =>
      expect(addMember).toHaveBeenCalledWith('o1', { email: 'new@x.com', role: 'STAFF' }),
    );
    expect(assign).not.toHaveBeenCalled();
  });

  it('a supervisor is assigned through POST /supervisors with the chosen permissions', async () => {
    setSearchParams({ organizationId: 'o1', email: 'sup@x.com', role: 'SUPERVISOR' });
    renderWithProviders(<AddEmployeeScreen />);
    await waitFor(() => expect(screen.getByText('عرض الأعضاء')).toBeOnTheScreen());
    fireEvent.press(screen.getByText('عرض الأعضاء'));
    fireEvent.press(screen.getByRole('button', { name: 'إضافة موظف' }));
    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith('o1', {
        email: 'sup@x.com',
        permissions: ['member.read'],
      }),
    );
    expect(addMember).not.toHaveBeenCalled();
  });

  it('someone who may not add anyone gets a notice and a disabled submit', async () => {
    get.mockResolvedValue(org({ myRole: 'STAFF', myPermissions: ['member.read'] }));
    setSearchParams({ organizationId: 'o1' });
    renderWithProviders(<AddEmployeeScreen />);
    await waitFor(() =>
      expect(screen.getByText('لا تملك صلاحية إضافة موظفين في هذه المؤسسة.')).toBeOnTheScreen(),
    );
    expect(screen.getByRole('button', { name: 'إضافة موظف' })).toBeDisabled();
  });
});
