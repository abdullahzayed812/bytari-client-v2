import { AppConfig } from '@/constants/config';
import { realtimeEndpoint } from '@/lib/env';
import { createLogger } from '@/lib/logger';

import type {
  RealtimeAuthProvider,
  RealtimeConnectionStatus,
  RealtimeEvent,
  RealtimeEventListener,
  RealtimeStatusListener,
  RealtimeSubscription,
} from './types';

const log = createLogger('realtime');

/**
 * Transport-only realtime client for the backend WebSocket gateway
 * (`server/src/infra/realtime`). Knows nothing about business events — feature
 * modules call `on('chat.message.created', …)` etc. and own their payload types.
 *
 * Responsibilities:
 *  - connection lifecycle + status broadcasting
 *  - auth via `?access_token=` query (RN WebSocket can't set headers)
 *  - exponential-backoff reconnect (resubscribes rooms on reconnect)
 *  - heartbeat ping
 *  - subscribe/unsubscribe room API with ref-counting
 */
export class RealtimeClient {
  private socket: WebSocket | null = null;
  private status: RealtimeConnectionStatus = 'idle';
  private manuallyClosed = false;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;

  private readonly roomRefCounts = new Map<string, number>();
  private readonly eventListeners = new Map<string, Set<RealtimeEventListener>>();
  private readonly statusListeners = new Set<RealtimeStatusListener>();

  constructor(private readonly auth: RealtimeAuthProvider) {}

  getStatus(): RealtimeConnectionStatus {
    return this.status;
  }

  onStatusChange(listener: RealtimeStatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  /** Open the connection. No-op if already open/connecting. */
  connect(): void {
    if (this.socket && (this.status === 'connected' || this.status === 'connecting')) return;
    const token = this.auth.getAccessToken();
    if (!token) {
      log.info('connect skipped — no access token');
      return;
    }
    this.manuallyClosed = false;
    this.open(token);
  }

  /** Close and stop reconnecting. Room subscriptions are retained for the next connect. */
  disconnect(): void {
    this.manuallyClosed = true;
    this.clearTimers();
    this.socket?.close();
    this.socket = null;
    this.setStatus('disconnected');
  }

  /** Drop everything — connection, listeners, room refcounts. Use on sign-out. */
  reset(): void {
    this.disconnect();
    this.roomRefCounts.clear();
    this.eventListeners.clear();
    this.setStatus('idle');
  }

  /**
   * Listen for an event `type`, optionally joining `room`. Returns an
   * `unsubscribe` that also leaves the room when its last listener goes.
   */
  on(type: string, listener: RealtimeEventListener, room?: string): RealtimeSubscription {
    let set = this.eventListeners.get(type);
    if (!set) {
      set = new Set();
      this.eventListeners.set(type, set);
    }
    set.add(listener);
    if (room) this.joinRoom(room);

    return {
      unsubscribe: () => {
        set?.delete(listener);
        if (set && set.size === 0) this.eventListeners.delete(type);
        if (room) this.leaveRoom(room);
      },
    };
  }

  // --- rooms ----------------------------------------------------------
  private joinRoom(room: string): void {
    const next = (this.roomRefCounts.get(room) ?? 0) + 1;
    this.roomRefCounts.set(room, next);
    if (next === 1) this.send({ type: 'subscribe', data: { room } });
  }

  private leaveRoom(room: string): void {
    const next = (this.roomRefCounts.get(room) ?? 1) - 1;
    if (next <= 0) {
      this.roomRefCounts.delete(room);
      this.send({ type: 'unsubscribe', data: { room } });
    } else {
      this.roomRefCounts.set(room, next);
    }
  }

  // --- socket plumbing ---------------------------------------------
  private open(token: string): void {
    this.clearTimers();
    const url = `${realtimeEndpoint}?access_token=${encodeURIComponent(token)}`;
    this.setStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    const socket = new WebSocket(url);
    this.socket = socket;

    socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.setStatus('connected');
      // resubscribe rooms after a reconnect
      for (const room of this.roomRefCounts.keys()) {
        this.send({ type: 'subscribe', data: { room } });
      }
      this.startHeartbeat();
    };

    socket.onmessage = (message: WebSocketMessageEvent) => {
      this.handleFrame(message.data);
    };

    socket.onerror = () => {
      log.debug('socket error');
    };

    socket.onclose = () => {
      this.stopHeartbeat();
      this.socket = null;
      if (this.manuallyClosed) {
        this.setStatus('disconnected');
        return;
      }
      this.scheduleReconnect();
    };
  }

  private handleFrame(raw: unknown): void {
    if (typeof raw !== 'string') return;
    let event: RealtimeEvent;
    try {
      const parsed = JSON.parse(raw) as Partial<RealtimeEvent>;
      if (typeof parsed.type !== 'string') return;
      event = { type: parsed.type, data: parsed.data, meta: parsed.meta };
    } catch {
      log.debug('unparseable frame');
      return;
    }
    if (event.type === 'pong') return;
    const listeners = this.eventListeners.get(event.type);
    listeners?.forEach((listener) => {
      try {
        listener(event);
      } catch {
        log.warn('event listener threw', { type: event.type });
      }
    });
  }

  private send(message: { type: string; data?: Record<string, unknown> }): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  private scheduleReconnect(): void {
    if (this.manuallyClosed || !this.auth.getAccessToken()) {
      this.setStatus('disconnected');
      return;
    }
    this.reconnectAttempts += 1;
    const delay = Math.min(
      AppConfig.realtime.baseDelayMs * 2 ** (this.reconnectAttempts - 1),
      AppConfig.realtime.maxDelayMs,
    );
    this.setStatus('reconnecting');
    log.debug('reconnecting', { attempt: this.reconnectAttempts, delay });
    this.reconnectTimer = setTimeout(() => {
      const token = this.auth.getAccessToken();
      if (token) this.open(token);
      else this.setStatus('disconnected');
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingTimer = setInterval(
      () => this.send({ type: 'ping' }),
      AppConfig.realtime.pingIntervalMs,
    );
  }

  private stopHeartbeat(): void {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = null;
  }

  private clearTimers(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.stopHeartbeat();
  }

  private setStatus(status: RealtimeConnectionStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }
}
