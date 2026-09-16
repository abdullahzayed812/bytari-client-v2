import { useAuthStore } from '@/features/auth/store';
import { organizationsApi } from '@/features/organizations';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { globalChatApi } from '../api/globalChatApi';
import ChatRoomDetailsScreen from '../screens/ChatRoomDetailsScreen';
import EditChatRoomRulesScreen from '../screens/EditChatRoomRulesScreen';
import GlobalChatRoomsScreen from '../screens/GlobalChatRoomsScreen';
import type { ChatRoomDetail, ChatRoomSummary } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

function authed() {
  const user = {
    id: 'u1',
    email: 'u@x.c',
    firstName: 'ر',
    lastName: 'ز',
    phone: null,
    status: 'ACTIVE' as const,
    veterinarianStatus: 'APPROVED' as const,
    traderStatus: 'NOT_REGISTERED' as const,
    createdAt: '',
    updatedAt: '',
  };
  useAuthStore.setState({
    user,
    status: 'authenticated',
    session: {
      user,
      roles: ['VETERINARIAN'],
      permissions: [],
      isAdmin: false,
      supervisorDomains: [],
      veterinarian: { status: 'APPROVED', approved: true },
      trader: { status: 'NOT_REGISTERED', approved: false },
    },
  });
}

const room = (over: Partial<ChatRoomSummary> = {}): ChatRoomSummary => ({
  id: 'r1',
  name: 'الأغنام والماعز',
  description: 'كل ما يخص رعاية الأغنام',
  logoUrl: null,
  memberCount: 5,
  unreadCount: 0,
  isJoined: false,
  status: 'ACTIVE',
  createdAt: '',
  ...over,
});

const detail = (over: Partial<ChatRoomDetail> = {}): ChatRoomDetail => ({
  ...room(),
  rules: null,
  conversationId: 'c1',
  joinedAt: null,
  notificationsMuted: false,
  pinnedMessage: null,
  ...over,
});

const page = <T,>(items: T[]) => ({
  items,
  meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1 },
});

beforeEach(() => {
  resetRouterMock();
  setSearchParams({});
  authed();
});
afterEach(() => jest.restoreAllMocks());
afterAll(() => useAuthStore.setState({ session: null, user: null, status: 'unauthenticated' }));

describe('GlobalChatRoomsScreen', () => {
  it('lists rooms and opens one', async () => {
    jest.spyOn(globalChatApi, 'list').mockResolvedValue(page([room()]));
    renderWithProviders(<GlobalChatRoomsScreen />);
    expect(await screen.findByText('الأغنام والماعز')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('الأغنام والماعز'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/global-chat/r1');
  });

  it('shows the Arabic empty state', async () => {
    jest.spyOn(globalChatApi, 'list').mockResolvedValue(page([]));
    renderWithProviders(<GlobalChatRoomsScreen />);
    expect(await screen.findByText('لا توجد غرف بعد')).toBeOnTheScreen();
  });
});

describe('ChatRoomDetailsScreen', () => {
  it('shows a join CTA for a non-member', async () => {
    setSearchParams({ organizationId: 'r1' });
    jest.spyOn(globalChatApi, 'get').mockResolvedValue(detail({ isJoined: false }));
    renderWithProviders(<ChatRoomDetailsScreen />);
    expect(await screen.findByText('الانضمام إلى الغرفة')).toBeOnTheScreen();
  });

  it('shows mute/leave/open-chat for a member and opens the thread', async () => {
    setSearchParams({ organizationId: 'r1' });
    jest.spyOn(globalChatApi, 'get').mockResolvedValue(detail({ isJoined: true, joinedAt: '2026-01-01T00:00:00.000Z' }));
    jest
      .spyOn(organizationsApi, 'get')
      .mockResolvedValue({ id: 'r1', name: 'الأغنام والماعز', type: 'CHAT_ROOM', myRole: 'STAFF' } as never);

    renderWithProviders(<ChatRoomDetailsScreen />);
    await screen.findByText('فتح المحادثة');
    expect(screen.getByText('مغادرة الغرفة')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('فتح المحادثة'));
    await waitFor(() => expect(routerMock.push).toHaveBeenCalledWith('/(app)/global-chat/r1/thread'));
  });

  it('hides existence behind a not-available notice on 404', async () => {
    setSearchParams({ organizationId: 'r1' });
    jest
      .spyOn(globalChatApi, 'get')
      .mockRejectedValue(new (require('@/services/api').ApiError)({ code: 'NOT_FOUND', message: 'x', status: 404 }));
    renderWithProviders(<ChatRoomDetailsScreen />);
    expect(await screen.findByText('الغرفة غير متاحة')).toBeOnTheScreen();
  });
});

describe('EditChatRoomRulesScreen', () => {
  it('prefills the current rules and saves an edit', async () => {
    setSearchParams({ organizationId: 'r1' });
    jest.spyOn(globalChatApi, 'get').mockResolvedValue(detail({ rules: 'القاعدة القديمة' }));
    const updateRules = jest.spyOn(globalChatApi, 'updateRules').mockResolvedValue({ success: true });

    renderWithProviders(<EditChatRoomRulesScreen />);
    const input = await screen.findByDisplayValue('القاعدة القديمة');
    fireEvent.changeText(input, 'قاعدة جديدة');
    fireEvent.press(screen.getByText('حفظ'));
    await waitFor(() => expect(updateRules).toHaveBeenCalledWith('r1', 'قاعدة جديدة'));
    await waitFor(() => expect(routerMock.back).toHaveBeenCalled());
  });
});
