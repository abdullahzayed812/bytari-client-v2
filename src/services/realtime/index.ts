import { useAuthStore } from '@/store/authStore';

import { RealtimeClient } from './realtimeClient';

export { RealtimeClient } from './realtimeClient';
export type {
  RealtimeConnectionStatus,
  RealtimeEvent,
  RealtimeEventListener,
  RealtimeStatusListener,
  RealtimeSubscription,
} from './types';

/**
 * Process-wide realtime client, wired to the auth store for its access token.
 * The app connects/disconnects it in response to auth state (see
 * `providers/RealtimeGate`).
 */
export const realtimeClient = new RealtimeClient({
  getAccessToken: () => useAuthStore.getState().tokens?.accessToken ?? null,
});
