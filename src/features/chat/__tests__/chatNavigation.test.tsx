import { Routes } from '@/constants/routes';
import { notificationHref } from '@/features/notifications/constants';

describe('chat routes', () => {
  it('are absolute deep-link-safe paths', () => {
    expect(Routes.chat).toBe('/(app)/chat');
    expect(Routes.chatThread('c1')).toBe('/(app)/chat/c1');
  });
});

describe('CHAT_MESSAGE_RECEIVED deep link', () => {
  const n = (over: Partial<Parameters<typeof notificationHref>[0]>) =>
    notificationHref({
      type: 'CHAT_MESSAGE_RECEIVED',
      entityType: null,
      entityId: null,
      data: {},
      ...over,
    });

  it('routes to the conversation thread from the REST DTO', () => {
    expect(n({ entityType: 'CONVERSATION', entityId: 'c1' })).toBe('/(app)/chat/c1');
  });

  it('routes to the conversation thread from an FCM push payload (data only)', () => {
    expect(
      n({ data: { type: 'CHAT_MESSAGE_RECEIVED', conversationId: 'c9', messageId: 'm1' } }),
    ).toBe('/(app)/chat/c9');
  });

  it('falls back to the chat list when no id is present', () => {
    expect(n({ entityType: 'CONVERSATION' })).toBe('/(app)/chat');
  });
});
