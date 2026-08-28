export type RealtimeConnectionStatus =
  'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

/** Frame sent by the backend gateway: `{ type, data, meta? }`. */
export interface RealtimeEvent<T = unknown> {
  type: string;
  data: T;
  meta?: Record<string, unknown>;
}

/** Frame the client sends: `{ type, data }`. */
export interface RealtimeClientMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping' | (string & {});
  data?: Record<string, unknown>;
}

export type RealtimeEventListener = (event: RealtimeEvent) => void;
export type RealtimeStatusListener = (status: RealtimeConnectionStatus) => void;

export interface RealtimeSubscription {
  /** Stop receiving this event and (if it's the last one) leave the room. */
  unsubscribe: () => void;
}

export interface RealtimeAuthProvider {
  /** Current access token, or `null` when signed out. */
  getAccessToken: () => string | null;
}
