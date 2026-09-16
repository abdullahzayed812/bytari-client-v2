/**
 * Global Chat — public discussion rooms. A room is a platform `organizations`
 * row (`type = 'CHAT_ROOM'`), reusing the existing membership/supervisor RBAC
 * and the `@/features/chat` module's message endpoints as-is (only
 * `/chat-rooms/*` browse/join/leave/mute/moderate + `/reports` are new).
 */
export { globalChatApi, globalChatKeys, type GlobalChatApi } from './api';
export * from './hooks';
export * from './components';
export * from './screens';
export * from './types';
