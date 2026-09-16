import { apiClient } from '@/services/api';

import { globalChatApi } from '../api/globalChatApi';
import { globalChatKeys } from '../api/queryKeys';

describe('globalChatApi — request shape', () => {
  const get = jest.spyOn(apiClient, 'get');
  const post = jest.spyOn(apiClient, 'post');
  const patch = jest.spyOn(apiClient, 'patch');
  const del = jest.spyOn(apiClient, 'delete');
  const envelope = jest.spyOn(apiClient, 'requestEnvelope');

  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    patch.mockReset();
    del.mockReset();
    envelope.mockReset();
    envelope.mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
  });
  afterAll(() => jest.restoreAllMocks());

  it('list forwards page/pageSize/search', async () => {
    await globalChatApi.list({ page: 2, pageSize: 20, search: 'دواجن' });
    expect(envelope).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/chat-rooms',
        params: { page: 2, pageSize: 20, search: 'دواجن' },
      }),
    );
  });

  it('get / join / leave / mute / rules / pin / unpin / delete hit the right endpoints', async () => {
    get.mockResolvedValue({ id: 'r1' });
    post.mockResolvedValue({ id: 'r1' });
    patch.mockResolvedValue({ success: true });
    del.mockResolvedValue({ success: true });

    await globalChatApi.get('r1');
    expect(get).toHaveBeenCalledWith('/chat-rooms/r1');

    await globalChatApi.join('r1');
    expect(post).toHaveBeenLastCalledWith('/chat-rooms/r1/join');

    await globalChatApi.leave('r1');
    expect(post).toHaveBeenLastCalledWith('/chat-rooms/r1/leave');

    await globalChatApi.setMuted('r1', true);
    expect(post).toHaveBeenLastCalledWith('/chat-rooms/r1/mute', { muted: true });

    await globalChatApi.updateRules('r1', 'be nice');
    expect(patch).toHaveBeenLastCalledWith('/chat-rooms/r1/rules', { rules: 'be nice' });

    await globalChatApi.pinMessage('r1', 'm1');
    expect(post).toHaveBeenLastCalledWith('/chat-rooms/r1/messages/m1/pin');

    await globalChatApi.unpinMessage('r1');
    expect(del).toHaveBeenLastCalledWith('/chat-rooms/r1/pinned-message');

    await globalChatApi.deleteMessage('r1', 'm1');
    expect(del).toHaveBeenLastCalledWith('/chat-rooms/r1/messages/m1');

    await globalChatApi.createAdmin({ name: 'الدواجن' });
    expect(post).toHaveBeenLastCalledWith('/admin/chat-rooms', { name: 'الدواجن' });

    await globalChatApi.submitReport({ targetType: 'ROOM', targetId: 'r1', reason: 'SPAM' });
    expect(post).toHaveBeenLastCalledWith('/reports', {
      targetType: 'ROOM',
      targetId: 'r1',
      reason: 'SPAM',
    });
  });

  it('listMembers hits the room roster endpoint', async () => {
    await globalChatApi.listMembers('r1', 1, 20);
    expect(envelope).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/chat-rooms/r1/members',
        params: { page: 1, pageSize: 20 },
      }),
    );
  });
});

describe('globalChatKeys', () => {
  it('keeps list filters and detail ids separate', () => {
    expect(globalChatKeys.detail('r1')).toEqual(['global-chat', 'detail', 'r1']);
    expect(globalChatKeys.list({ pageSize: 20 })).not.toEqual(
      globalChatKeys.list({ pageSize: 20, search: 'x' }),
    );
  });
});
