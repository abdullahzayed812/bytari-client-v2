import { renderWithProviders, screen, waitFor, fireEvent } from '@/test-utils/render';
import { resetRouterMock, expoRouter } from '@/test-utils/routerMock';

import { adminApi } from '../api';
import AdminUsersScreen from '../screens/AdminUsersScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const listUsers = jest.spyOn(adminApi, 'listUsers');

const USER = {
  id: 'u1',
  email: 'rana@example.test',
  firstName: 'رنا',
  lastName: 'خالد',
  phone: null,
  status: 'ACTIVE' as const,
  veterinarianStatus: 'NOT_APPLIED' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  resetRouterMock();
  listUsers.mockReset().mockResolvedValue({
    items: [USER],
    meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
  });
});
afterAll(() => jest.restoreAllMocks());

describe('AdminUsersScreen', () => {
  it('shows the user list from the API and opens the detail on press', async () => {
    renderWithProviders(<AdminUsersScreen />);

    await waitFor(() => expect(screen.getByText('rana@example.test')).toBeTruthy());
    expect(listUsers).toHaveBeenCalled();

    fireEvent.press(screen.getByText('rana@example.test'));
    expect(expoRouter.router.push).toHaveBeenCalledWith('/(app)/admin/users/u1');
  });

  it('renders the empty state when the API returns nothing', async () => {
    listUsers.mockResolvedValueOnce({
      items: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    renderWithProviders(<AdminUsersScreen />);
    await waitFor(() => expect(screen.getByText('لا يوجد مستخدمون')).toBeTruthy());
  });
});
