import { apiClient } from '@/services/api';

import { chatApi } from '../api/chatApi';
import { chatKeys } from '../api/queryKeys';

describe('chatApi — request shape', () => {
  const get = jest.spyOn(apiClient, 'get');
  const post = jest.spyOn(apiClient, 'post');
  const del = jest.spyOn(apiClient, 'delete');
  const envelope = jest.spyOn(apiClient, 'requestEnvelope');

  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    del.mockReset();
    envelope.mockReset();
    envelope.mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
  });
  afterAll(() => jest.restoreAllMocks());

  it('listConversations forwards page/pageSize + optional organizationId', async () => {
    await chatApi.listConversations({ page: 2, pageSize: 20 });
    expect(envelope).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/conversations',
        params: { page: 2, pageSize: 20, organizationId: undefined },
      }),
    );
    await chatApi.listConversations({ page: 1, pageSize: 20, organizationId: 'o1' });
    expect(envelope).toHaveBeenLastCalledWith(
      expect.objectContaining({ params: expect.objectContaining({ organizationId: 'o1' }) }),
    );
  });

  it('maps a conversation, preserving a null unreadCount (dynamic clinic side)', async () => {
    envelope.mockResolvedValueOnce({
      data: [
        {
          id: 'c1',
          type: 'PET_OWNER_CLINIC',
          organizationId: 'o1',
          counterpartUserId: null,
          viewerSide: 'CLINIC',
          lastMessageAt: '2026-08-29',
          unreadCount: null,
          createdAt: '',
          updatedAt: '',
        },
        { id: 'c2', type: 'FARM_OWNER_MEMBER', organizationId: 'o2', unreadCount: 3 },
      ],
      meta: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
    });
    const page = await chatApi.listConversations({ page: 1, pageSize: 20 });
    expect(page.items[0]!.unreadCount).toBeNull();
    expect(page.items[1]!.unreadCount).toBe(3);
  });

  it('get / messages / send / read / delete / start hit the right endpoints', async () => {
    get.mockResolvedValue({ id: 'c1', type: 'PET_OWNER_CLINIC' });
    post.mockResolvedValue({ id: 'm1', conversationId: 'c1', type: 'TEXT' });
    del.mockResolvedValue({ id: 'm1', deletedAt: '2026-08-29' });

    await chatApi.getConversation('c1');
    expect(get).toHaveBeenCalledWith('/conversations/c1');

    await chatApi.listMessages('c1', 1, 30);
    expect(envelope).toHaveBeenLastCalledWith(
      expect.objectContaining({
        url: '/conversations/c1/messages',
        params: { page: 1, pageSize: 30 },
      }),
    );

    await chatApi.sendMessage('c1', 'hello');
    expect(post).toHaveBeenLastCalledWith('/conversations/c1/messages', { body: 'hello' });

    await chatApi.markRead('c1', 'm9');
    expect(post).toHaveBeenLastCalledWith('/conversations/c1/read', { messageId: 'm9' });

    await chatApi.deleteMessage('m1');
    expect(del).toHaveBeenCalledWith('/messages/m1');

    await chatApi.start({ organizationId: 'o5', targetUserId: 'u7' });
    expect(post).toHaveBeenLastCalledWith('/organizations/o5/conversations', {
      targetUserId: 'u7',
    });
  });
});

describe('chatKeys', () => {
  it('nests messages under detail and keeps list filters separate', () => {
    expect(chatKeys.messages('c1')).toEqual(['chat', 'detail', 'c1', 'messages']);
    expect(chatKeys.list({ pageSize: 20 })).not.toEqual(
      chatKeys.list({ pageSize: 20, organizationId: 'o1' }),
    );
    expect(chatKeys.unreadTotal()).toEqual(['chat', 'unread-total']);
  });
});
