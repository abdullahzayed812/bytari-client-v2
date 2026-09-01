import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import { organizationsApi } from '../api';
import MyOrganizationsScreen from '../screens/MyOrganizationsScreen';
import type { MyOrganization } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const org: MyOrganization = {
  id: 'o1',
  type: 'CLINIC',
  name: 'عيادة الرحمة',
  description: null,
  ownerUserId: 'u1',
  status: 'ACTIVE',
  decidedBy: null,
  decidedAt: null,
  decisionReason: null,
  createdAt: '',
  updatedAt: '',
  myRole: 'OWNER',
};

describe('MyOrganizationsScreen (§26)', () => {
  const list = jest.spyOn(organizationsApi, 'listMine');

  beforeEach(() => {
    resetRouterMock();
    list.mockReset();
  });
  afterAll(() => jest.restoreAllMocks());

  it('renders the organization list', async () => {
    list.mockResolvedValue({
      items: [org],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders(<MyOrganizationsScreen />);
    await waitFor(() => expect(screen.getByText('عيادة الرحمة')).toBeOnTheScreen());
  });

  it('shows the empty state with a create CTA', async () => {
    list.mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    renderWithProviders(<MyOrganizationsScreen />);
    await waitFor(() => expect(screen.getByText('لا توجد مؤسسات بعد')).toBeOnTheScreen());
  });

  it('shows a safe error state on a backend failure (no raw message)', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    list.mockRejectedValue(
      new ApiError({ code: 'INTERNAL_ERROR', message: 'raw db error', status: 500 }),
    );
    renderWithProviders(<MyOrganizationsScreen />);
    await waitFor(() => expect(screen.queryByText('raw db error')).toBeNull());
  });

  it('tapping a card navigates to the organization detail', async () => {
    list.mockResolvedValue({
      items: [org],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders(<MyOrganizationsScreen />);
    await waitFor(() => expect(screen.getByText('عيادة الرحمة')).toBeOnTheScreen());
    fireEvent.press(screen.getByRole('button', { name: /عيادة الرحمة/ }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/organizations/o1');
  });

  it('the header action opens the create screen', async () => {
    list.mockResolvedValue({
      items: [org],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders(<MyOrganizationsScreen />);
    await waitFor(() => expect(screen.getByText('عيادة الرحمة')).toBeOnTheScreen());
    fireEvent.press(screen.getByLabelText('إنشاء مؤسسة'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/organizations/create');
  });
});
