import { useAuthStore } from '@/features/auth/store';
import { organizationsApi } from '@/features/organizations';
import { usersApi } from '@/features/users';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { chatApi } from '../api/chatApi';
import ConversationListScreen from '../screens/ConversationListScreen';
import ConversationThreadScreen from '../screens/ConversationThreadScreen';
import type { ChatMessage, Conversation, Paginated } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);
jest.mock('@/services/realtime', () => ({
  realtimeClient: { on: jest.fn(() => ({ unsubscribe: jest.fn() })) },
}));

const ME = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';

function authed(id = ME) {
  const user = {
    id,
    email: 'u@x.c',
    firstName: 'ر',
    lastName: 'ز',
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
      roles: ['PET_OWNER'],
      permissions: [],
      isAdmin: false,
      supervisorDomains: [],
      veterinarian: { status: 'NOT_APPLIED', approved: false },
      trader: { status: 'NOT_REGISTERED', approved: false },
    },
  });
}

const conv = (over: Partial<Conversation> = {}): Conversation => ({
  id: 'c1',
  type: 'PET_OWNER_CLINIC',
  organizationId: 'o1',
  counterpartUserId: OTHER,
  viewerSide: 'PET_OWNER',
  subjectType: null,
  subjectId: null,
  status: 'OPEN',
  lastMessageAt: '2026-08-29T09:00:00.000Z',
  unreadCount: 2,
  createdAt: '',
  updatedAt: '',
  ...over,
});

const msg = (over: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 'm1',
  conversationId: 'c1',
  senderUserId: OTHER,
  body: 'مرحبا',
  type: 'TEXT',
  deletedAt: null,
  createdAt: '2026-08-29T09:00:00.000Z',
  ...over,
});

const page = <T,>(items: T[]): Paginated<T> => ({
  items,
  meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1 },
});

beforeEach(() => {
  resetRouterMock();
  setSearchParams({});
  authed();
  jest
    .spyOn(organizationsApi, 'get')
    .mockResolvedValue({ id: 'o1', name: 'عيادة النور', type: 'CLINIC' } as never);
  jest.spyOn(usersApi, 'getSummary').mockResolvedValue({
    id: OTHER,
    firstName: 'سارة',
    lastName: 'ن',
    veterinarianStatus: 'APPROVED',
    avatarUrl: null,
  });
});
afterEach(() => jest.restoreAllMocks());
afterAll(() => useAuthStore.setState({ session: null, user: null, status: 'unauthenticated' }));

describe('ConversationListScreen', () => {
  it('lists conversations (org name for the pet-owner side) and opens one', async () => {
    jest.spyOn(chatApi, 'listConversations').mockResolvedValue(page([conv({ id: 'c9' })]));
    renderWithProviders(<ConversationListScreen />);
    expect(await screen.findByText('عيادة النور')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('عيادة النور'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/chat/c9');
  });

  it('shows the Arabic empty state', async () => {
    jest.spyOn(chatApi, 'listConversations').mockResolvedValue(page([]));
    renderWithProviders(<ConversationListScreen />);
    expect(await screen.findByText('لا توجد محادثات')).toBeOnTheScreen();
  });
});

describe('ConversationThreadScreen', () => {
  it('hides existence behind a not-available notice on 404', async () => {
    setSearchParams({ conversationId: 'c1' });
    jest
      .spyOn(chatApi, 'getConversation')
      .mockRejectedValue(
        new (require('@/services/api').ApiError)({ code: 'NOT_FOUND', message: 'x', status: 404 }),
      );
    jest.spyOn(chatApi, 'listMessages').mockResolvedValue(page([]));
    renderWithProviders(<ConversationThreadScreen />);
    expect(await screen.findByText('المحادثة غير متاحة')).toBeOnTheScreen();
  });

  it('renders messages, marks the newest counterpart message read, and sends', async () => {
    setSearchParams({ conversationId: 'c1' });
    jest.spyOn(chatApi, 'getConversation').mockResolvedValue(conv());
    jest.spyOn(chatApi, 'listMessages').mockResolvedValue(page([msg({ id: 'm7' })]));
    const markRead = jest.spyOn(chatApi, 'markRead').mockResolvedValue(undefined);
    const sendMessage = jest
      .spyOn(chatApi, 'sendMessage')
      .mockResolvedValue(msg({ id: 'm8', senderUserId: ME, body: 'رد' }));

    renderWithProviders(<ConversationThreadScreen />);
    await screen.findByText('مرحبا');
    await waitFor(() => expect(markRead).toHaveBeenCalledWith('c1', 'm7'));

    fireEvent.changeText(screen.getByLabelText('اكتب رسالة…'), 'رد');
    fireEvent.press(screen.getByLabelText('إرسال'));
    await waitFor(() => expect(sendMessage).toHaveBeenCalledWith('c1', 'رد'));
  });
});
