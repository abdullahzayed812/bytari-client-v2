import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { realtimeClient } from '@/services/realtime';

import { supportKeys } from '../api';
import { SUPPORT_KIND_META, threadRoom } from '../constants';
import type { ThreadKind } from '../types';

/**
 * Live updates for one open thread, through the **existing** realtime transport
 * (`src/services/realtime`, connected by `RealtimeGate`). Subscribes to the
 * `consultation:<id>` / `inquiry:<id>` room and, on a `*.message.created` /
 * `*.closed` / `*.sender_blocked` / `*.sender_unblocked` event, invalidates the
 * thread's messages + detail queries so `useThreadMessages` / `useThread`
 * refetch. Payloads are ids-only — the data still comes from REST.
 *
 * No new websocket code: the client owns connect / reconnect / room ref-counting
 * (§33). If the socket is down the screen still works via pull-to-refresh and
 * post-send invalidation.
 */
export function useThreadRealtime(
  kind: ThreadKind,
  threadId: string | undefined,
  options: { enabled?: boolean } = {},
): void {
  const qc = useQueryClient();
  const enabled = Boolean(threadId) && (options.enabled ?? true);

  useEffect(() => {
    if (!enabled || !threadId) return;
    const room = threadRoom(kind, threadId);
    const singular = SUPPORT_KIND_META[kind].singular;

    const refetch = (): void => {
      void qc.invalidateQueries({ queryKey: supportKeys.messages(kind, threadId) });
      void qc.invalidateQueries({ queryKey: supportKeys.detail(kind, threadId) });
    };

    const subs = [
      `${singular}.message.created`,
      `${singular}.closed`,
      `${singular}.sender_blocked`,
      `${singular}.sender_unblocked`,
    ].map((type, i) => realtimeClient.on(type, refetch, i === 0 ? room : undefined));

    return () => subs.forEach((s) => s.unsubscribe());
  }, [enabled, kind, threadId, qc]);
}
