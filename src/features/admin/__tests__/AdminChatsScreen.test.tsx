import { useAuthStore } from '@/features/auth/store';
import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import { adminApi } from '../api';
import AdminChatsScreen from '../screens/AdminChatsScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

function asAdmin() {
  const user = {
    id: 'admin1',
    email: 'a@x.c',
    firstName: 'أ',
    lastName: 'د',
    phone: null,
    status: 'ACTIVE' as const,
    veterinarianStatus: 'NOT_APPLIED' as const,
    traderStatus: 'NOT_REGISTERED' as const,
    createdAt: '',
    updatedAt: '',
  };
  useAuthStore.setState({
    user,
    status: 'authenticated',
    session: {
      user,
      roles: ['ADMIN'],
      permissions: [],
      isAdmin: true,
      supervisorDomains: [],
      veterinarian: { status: 'NOT_APPLIED', approved: false },
      trader: { status: 'NOT_REGISTERED', approved: false },
    },
  });
}

const page = <T,>(items: T[]) => ({
  items,
  meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1 },
});

beforeEach(() => {
  resetRouterMock();
  asAdmin();
});
afterEach(() => jest.restoreAllMocks());
afterAll(() => useAuthStore.setState({ session: null, user: null, status: 'unauthenticated' }));

describe('AdminChatsScreen', () => {
  it('shows conversations by default, then switches to the chat rooms tab', async () => {
    jest.spyOn(adminApi, 'listChatConversations').mockResolvedValue(
      page([
        {
          id: 'c1',
          type: 'PET_OWNER_CLINIC',
          status: 'OPEN',
          organizationId: 'o1',
          lastMessageAt: '2026-01-01T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
        } as never,
      ]),
    );
    const listOrgs = jest.spyOn(adminApi, 'listOrganizations').mockResolvedValue(
      page([
        {
          id: 'r1',
          type: 'CHAT_ROOM',
          name: 'الأغنام والماعز',
          description: null,
          status: 'ACTIVE',
          ownerUserId: 'admin1',
          decidedBy: null,
          decidedAt: null,
          decisionReason: null,
          createdAt: '',
          updatedAt: '',
        } as never,
      ]),
    );

    renderWithProviders(<AdminChatsScreen />);
    expect(await screen.findByText('محادثة مع عيادة')).toBeOnTheScreen();

    fireEvent.press(screen.getByText('غرف الدردشة'));
    expect(await screen.findByText('الأغنام والماعز')).toBeOnTheScreen();
    expect(listOrgs).toHaveBeenCalledWith(expect.objectContaining({ type: 'CHAT_ROOM' }));

    fireEvent.press(screen.getByText('الأغنام والماعز'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/admin/organizations/r1');
  });
});
