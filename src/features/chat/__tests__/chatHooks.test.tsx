import { waitFor } from '@testing-library/react-native';

import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/services/api';
import { makeTestQueryClient, renderHookWithQuery } from '@/test-utils/render';

import { chatApi } from '../api/chatApi';
import { chatKeys } from '../api/queryKeys';
import {
  useChatListRealtime,
  useConversation,
  useConversationRealtime,
  useConversations,
  useDeleteMessage,
  useMarkConversationRead,
  useMessages,
  useSendMessage,
} from '../hooks';
import type { ChatMessage, Conversation, Paginated } from '../types';

const realtimeHandlers: Record<string, () => void> = {};
jest.mock('@/services/realtime', () => ({
  realtimeClient: {
    on: (type: string, fn: () => void) => {
      realtimeHandlers[type] = fn;
      return { unsubscribe: jest.fn() };
    },
  },
}));

function authed() {
  const user = {
    id: 'u1',
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
  counterpartUserId: null,
  viewerSide: 'PET_OWNER',
  subjectType: null,
  subjectId: null,
  status: 'OPEN',
  lastMessageAt: null,
  unreadCount: 0,
  createdAt: '',
  updatedAt: '',
  ...over,
});

const page = <T,>(items: T[], totalPages = 1): Paginated<T> => ({
  items,
  meta: { page: 1, pageSize: 20, total: items.length, totalPages },
});

beforeEach(() => authed());
afterEach(() => jest.restoreAllMocks());
afterAll(() => useAuthStore.setState({ session: null, user: null, status: 'unauthenticated' }));

describe('useConversations', () => {
  it('flattens pages and sums unread (ignoring the null clinic side)', async () => {
    jest
      .spyOn(chatApi, 'listConversations')
      .mockResolvedValueOnce(
        page([
          conv({ id: 'a', unreadCount: 2 }),
          conv({ id: 'b', unreadCount: null }),
          conv({ id: 'd', unreadCount: 5 }),
        ]),
      );
    const { result } = renderHookWithQuery(() => useConversations(), {
      client: makeTestQueryClient(),
    });
    await waitFor(() => expect(result.current.conversations).toHaveLength(3));
    expect(result.current.unreadTotal).toBe(7);
  });
});

describe('useConversation', () => {
  it('does not retry a 404 (non-participant)', async () => {
    const spy = jest
      .spyOn(chatApi, 'getConversation')
      .mockRejectedValue(new ApiError({ code: 'NOT_FOUND', message: 'x', status: 404 }));
    const { result } = renderHookWithQuery(() => useConversation('c1'), {
      client: makeTestQueryClient(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('useMessages', () => {
  it('flattens oldest→newest', async () => {
    const m = (id: string): ChatMessage => ({
      id,
      conversationId: 'c1',
      senderUserId: 'u1',
      body: id,
      type: 'TEXT',
      deletedAt: null,
      createdAt: '',
    });
    jest.spyOn(chatApi, 'listMessages').mockResolvedValueOnce(page([m('m1'), m('m2')]));
    const { result } = renderHookWithQuery(() => useMessages('c1'), {
      client: makeTestQueryClient(),
    });
    await waitFor(() => expect(result.current.messages.map((x) => x.id)).toEqual(['m1', 'm2']));
  });
});

describe('chat mutations — invalidation', () => {
  it('useSendMessage invalidates messages + detail + lists', async () => {
    jest.spyOn(chatApi, 'sendMessage').mockResolvedValueOnce({
      id: 'm9',
      conversationId: 'c1',
      senderUserId: 'u1',
      body: 'hi',
      type: 'TEXT',
      deletedAt: null,
      createdAt: '',
    });
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useSendMessage('c1'), { client });
    await result.current.mutateAsync('hi');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: chatKeys.messages('c1') });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: chatKeys.detail('c1') });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: chatKeys.lists() });
  });

  it('useMarkConversationRead invalidates detail + lists', async () => {
    jest.spyOn(chatApi, 'markRead').mockResolvedValueOnce(undefined);
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useMarkConversationRead('c1'), { client });
    await result.current.mutateAsync('m1');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: chatKeys.detail('c1') });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: chatKeys.lists() });
  });

  it('useDeleteMessage invalidates the conversation messages', async () => {
    jest.spyOn(chatApi, 'deleteMessage').mockResolvedValueOnce({
      id: 'm1',
      conversationId: 'c1',
      senderUserId: 'u1',
      body: null,
      type: 'TEXT',
      deletedAt: '2026-08-29',
      createdAt: '',
    });
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useDeleteMessage('c1'), { client });
    await result.current.mutateAsync('m1');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: chatKeys.messages('c1') });
  });
});

describe('chat realtime', () => {
  it('useConversationRealtime invalidates messages + detail on chat.message.created', async () => {
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    renderHookWithQuery(() => useConversationRealtime('c1'), { client });
    await waitFor(() => expect(realtimeHandlers['chat.message.created']).toBeDefined());
    realtimeHandlers['chat.message.created']!();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: chatKeys.messages('c1') });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: chatKeys.detail('c1') });
    expect(realtimeHandlers['chat.message.deleted']).toBeDefined();
  });

  it('useChatListRealtime invalidates the conversation list on chat.conversation.created', async () => {
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    renderHookWithQuery(() => useChatListRealtime(), { client });
    await waitFor(() => expect(realtimeHandlers['chat.conversation.created']).toBeDefined());
    realtimeHandlers['chat.conversation.created']!();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: chatKeys.lists() });
  });
});
