import { useAuthStore } from '@/features/auth/store';
import { chatApi } from '@/features/chat/api/chatApi';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { organizationsApi } from '../api';
import OrganizationFollowersScreen from '../screens/OrganizationFollowersScreen';
import type { OrganizationDetail } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

function org(over: Partial<OrganizationDetail> = {}): OrganizationDetail {
  return {
    id: 'o1',
    type: 'VETERINARY_OFFICE',
    name: 'مكتب',
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

describe('OrganizationFollowersScreen — names + Send Message only', () => {
  const get = jest.spyOn(organizationsApi, 'get');
  const listFollowers = jest.spyOn(organizationsApi, 'listFollowers');
  const start = jest.spyOn(chatApi, 'start');

  beforeEach(() => {
    resetRouterMock();
    get.mockReset().mockResolvedValue(org());
    listFollowers.mockReset().mockResolvedValue({
      items: [
        { userId: 'f1', firstName: 'سارة', lastName: 'م' },
        { userId: 'f2', firstName: 'أحمد', lastName: 'ك' },
      ],
      meta: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
    });
    start.mockReset().mockResolvedValue({ id: 'c9' } as never);
    setSearchParams({ organizationId: 'o1' });
    useAuthStore.setState({ session: null });
  });
  afterAll(() => jest.restoreAllMocks());

  it('lists follower names; rows do not open a profile', async () => {
    renderWithProviders(<OrganizationFollowersScreen />);
    await waitFor(() => expect(screen.getByText('سارة م')).toBeOnTheScreen());
    expect(screen.getByText('أحمد ك')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('سارة م'));
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  it('"Send Message" opens the organization chat with that follower', async () => {
    renderWithProviders(<OrganizationFollowersScreen />);
    await waitFor(() => expect(screen.getByText('سارة م')).toBeOnTheScreen());
    fireEvent.press(screen.getByLabelText('إرسال رسالة إلى سارة م'));
    await waitFor(() =>
      expect(start).toHaveBeenCalledWith({ organizationId: 'o1', targetUserId: 'f1' }),
    );
    await waitFor(() => expect(routerMock.push).toHaveBeenCalledWith('/(app)/chat/c9'));
  });

  it('a member without the follower permission sees a locked state and nothing is fetched', async () => {
    get.mockResolvedValue(org({ myRole: 'VETERINARIAN', myPermissions: ['organization.read'] }));
    renderWithProviders(<OrganizationFollowersScreen />);
    await waitFor(() =>
      expect(screen.getByText('لا تملك صلاحية عرض متابعي هذه المؤسسة.')).toBeOnTheScreen(),
    );
    expect(listFollowers).not.toHaveBeenCalled();
  });
});
