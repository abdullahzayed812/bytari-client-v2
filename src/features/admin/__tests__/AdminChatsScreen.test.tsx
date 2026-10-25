import { useAuthStore } from '@/features/auth/store';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
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

  it('keeps both tabs visible above a long conversation list (the list can never squeeze them)', async () => {
    jest.spyOn(adminApi, 'listChatConversations').mockResolvedValue(
      page(
        Array.from({ length: 60 }, (_, i) => ({
          id: `c${i}`,
          type: 'PET_OWNER_CLINIC',
          status: 'OPEN',
          organizationId: 'o1',
          lastMessageAt: '2026-01-01T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
        })) as never,
      ),
    );
    jest.spyOn(adminApi, 'listOrganizations').mockResolvedValue(page([]));

    renderWithProviders(<AdminChatsScreen />);
    // The type filter chip carries the same label — wait for several list rows.
    await waitFor(() => expect(screen.getAllByText('محادثة مع عيادة').length).toBeGreaterThan(3));

    const bar = screen.getByTestId('admin-list-filter-bar');
    expect(bar).toHaveStyle({ flexShrink: 0 });
    expect(screen.getByText('المحادثات')).toBeOnTheScreen();
    expect(screen.getByText('غرف الدردشة')).toBeOnTheScreen();
    // Still usable: switching tabs works with the long list rendered.
    fireEvent.press(screen.getByText('غرف الدردشة'));
    expect(await screen.findByText('لا توجد غرف دردشة بعد')).toBeOnTheScreen();
    expect(screen.getByTestId('admin-list-filter-bar')).toHaveStyle({ flexShrink: 0 });
  });

  it('shows each room’s own image in the rooms tab, with the icon fallback when none is set', async () => {
    jest.spyOn(adminApi, 'listChatConversations').mockResolvedValue(page([]));
    const room = (id: string, name: string, logoUrl: string | null) =>
      ({
        id,
        type: 'CHAT_ROOM',
        name,
        description: null,
        status: 'ACTIVE',
        ownerUserId: 'admin1',
        decidedBy: null,
        decidedAt: null,
        decisionReason: null,
        createdAt: '',
        updatedAt: '',
        logoUrl,
      }) as never;
    jest
      .spyOn(adminApi, 'listOrganizations')
      .mockResolvedValue(
        page([room('r1', 'الدواجن', 'https://cdn.test/rooms/r1.jpg'), room('r2', 'الأبقار', null)]),
      );

    renderWithProviders(<AdminChatsScreen />);
    fireEvent.press(await screen.findByText('غرف الدردشة'));
    expect(await screen.findByText('الدواجن')).toBeOnTheScreen();
    type Node = { props: { source?: { uri?: string } } };
    const withSource = (uri: string) =>
      screen.UNSAFE_root.findAll((n: Node) => n.props.source?.uri === uri);
    expect(withSource('https://cdn.test/rooms/r1.jpg').length).toBeGreaterThan(0);
    expect(
      screen.UNSAFE_root.findAll((n: Node) => String(n.props.source?.uri ?? '').includes('r2')),
    ).toHaveLength(0);
  });

  it('searches by name and filters by type / status (sent to the server)', async () => {
    const list = jest.spyOn(adminApi, 'listChatConversations').mockResolvedValue(
      page([
        {
          id: 'c1',
          type: 'PET_OWNER_CLINIC',
          status: 'OPEN',
          organizationId: 'o1',
          organizationName: 'عيادة النور',
          people: [{ userId: 'u1', side: 'PET_OWNER', firstName: 'زينب', lastName: 'كريم' }],
          participantCount: 0,
          lastMessageAt: '2026-01-01T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
        } as never,
      ]),
    );
    jest.spyOn(adminApi, 'listOrganizations').mockResolvedValue(page([]));

    renderWithProviders(<AdminChatsScreen />);
    // Conversation name + participant names on the row.
    expect(await screen.findByText('عيادة النور')).toBeOnTheScreen();
    expect(screen.getByText(/زينب كريم/)).toBeOnTheScreen();

    fireEvent.changeText(screen.getByLabelText('ابحث باسم المحادثة أو اسم المشارك'), 'زينب');
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'زينب' })),
    );
    fireEvent.press(screen.getByText('مغلقة'));
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'زينب', status: 'CLOSED' }),
      ),
    );
    fireEvent.press(screen.getAllByText('محادثة مع عيادة')[0]!);
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({ type: 'PET_OWNER_CLINIC', status: 'CLOSED' }),
      ),
    );

    // Each filter change is a new query key, so the list is in its loading view
    // until the refetch resolves — wait for the row to come back before pressing.
    fireEvent.press(await screen.findByText('عيادة النور', {}, { timeout: 5000 }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/admin/chat-conversation/c1');
  });
});
