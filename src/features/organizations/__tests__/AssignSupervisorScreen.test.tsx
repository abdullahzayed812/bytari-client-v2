import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, setSearchParams } from '@/test-utils/routerMock';

import { organizationsApi } from '../api';
import AssignSupervisorScreen from '../screens/AssignSupervisorScreen';
import type { OrganizationSupervisor } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const UUID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

describe('AssignSupervisorScreen (§29 — permission catalogue mirrors the backend)', () => {
  const assign = jest.spyOn(organizationsApi, 'assignSupervisor');
  const patch = jest.spyOn(organizationsApi, 'updateSupervisor');
  const listSupervisors = jest.spyOn(organizationsApi, 'listSupervisors');

  beforeEach(() => {
    resetRouterMock();
    assign.mockReset();
    patch.mockReset();
    listSupervisors.mockReset();
  });
  afterAll(() => jest.restoreAllMocks());

  it('create mode → sends { userId, permissions } with the checked permission keys', async () => {
    setSearchParams({ organizationId: 'o1' });
    assign.mockResolvedValue({ id: 's1' } as never);
    renderWithProviders(<AssignSupervisorScreen />);

    fireEvent.changeText(
      screen.getByPlaceholderText('مثال: 3fa85f64-5717-4562-b3fc-2c963f66afa6'),
      UUID,
    );
    fireEvent.press(screen.getByText('عرض الأعضاء')); // permissions.member.read.label
    fireEvent.press(screen.getByRole('button', { name: 'تعيين مشرف' }));

    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith('o1', {
        userId: UUID,
        permissions: ['member.read'],
      }),
    );
  });

  it('create mode → an invalid user id is rejected client-side and never hits the API', async () => {
    setSearchParams({ organizationId: 'o1' });
    renderWithProviders(<AssignSupervisorScreen />);
    fireEvent.changeText(
      screen.getByPlaceholderText('مثال: 3fa85f64-5717-4562-b3fc-2c963f66afa6'),
      'not-a-uuid',
    );
    fireEvent.press(screen.getByRole('button', { name: 'تعيين مشرف' }));
    await waitFor(() =>
      expect(screen.getByText('أدخل معرّف مستخدم صحيحاً (UUID).')).toBeOnTheScreen(),
    );
    expect(assign).not.toHaveBeenCalled();
  });

  it('edit mode → prefills the existing permissions and PATCHes the membership', async () => {
    setSearchParams({ organizationId: 'o1', membershipId: 's1' });
    const existing: OrganizationSupervisor = {
      id: 's1',
      organizationId: 'o1',
      userId: 'u3',
      roleKey: 'SUPERVISOR',
      status: 'ACTIVE',
      addedBy: 'u1',
      createdAt: '',
      updatedAt: '',
      user: { id: 'u3', email: 'sup@x.c', firstName: 'ن', lastName: 'ص' },
      permissions: ['member.read'],
    };
    listSupervisors.mockResolvedValue([existing]);
    patch.mockResolvedValue({ ...existing } as never);
    renderWithProviders(<AssignSupervisorScreen />);

    await waitFor(() => expect(screen.getByText(/sup@x\.c/)).toBeOnTheScreen());
    fireEvent.press(screen.getByRole('button', { name: 'حفظ الصلاحيات' }));

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith('o1', 's1', { permissions: ['member.read'] }),
    );
  });
});
