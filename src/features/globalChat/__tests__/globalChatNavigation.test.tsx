import { Routes } from '@/constants/routes';

describe('Global Chat routes', () => {
  it('are absolute deep-link-safe paths', () => {
    expect(Routes.globalChat).toBe('/(app)/global-chat');
    expect(Routes.globalChatRoom('r1')).toBe('/(app)/global-chat/r1');
    expect(Routes.globalChatRoomThread('r1')).toBe('/(app)/global-chat/r1/thread');
    expect(Routes.globalChatReport).toBe('/(app)/global-chat/report');
  });

  it('admin create-room route matches the admin router mount', () => {
    expect(Routes.adminCreateChatRoom).toBe('/(app)/admin/chat-rooms/new');
  });
});
