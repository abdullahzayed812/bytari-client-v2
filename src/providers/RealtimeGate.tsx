import { useEffect } from 'react';

import { realtimeClient } from '@/services/realtime';
import { useAuthStore, useUiStore } from '@/store';

/**
 * Connects the realtime client while authenticated and tears it down on
 * sign-out. Mirrors the connection status into `uiStore` for status indicators.
 * Renders nothing.
 */
export function RealtimeGate() {
  const status = useAuthStore((s) => s.status);
  const setRealtimeStatus = useUiStore((s) => s.setRealtimeStatus);

  useEffect(() => {
    const unsubscribe = realtimeClient.onStatusChange((s) => {
      setRealtimeStatus(
        s === 'connected'
          ? 'connected'
          : s === 'connecting' || s === 'reconnecting'
            ? 'connecting'
            : 'disconnected',
      );
    });
    return unsubscribe;
  }, [setRealtimeStatus]);

  useEffect(() => {
    if (status === 'authenticated') {
      realtimeClient.connect();
    } else {
      realtimeClient.reset();
    }
  }, [status]);

  return null;
}
