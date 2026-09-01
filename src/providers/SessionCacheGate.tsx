import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { useAuthStore } from '@/features/auth/store';

/**
 * Account-switch cache isolation (§40 / §55 / §61). The `QueryClient` is created
 * once and lives for the whole process, so without this a logout → different-user
 * login on the **same device** could briefly surface the previous user's cached
 * lists (pets, conversations, notifications, organization data, …) before each
 * query refetches.
 *
 * This wipes the entire React Query cache on:
 *  - any transition **into** `unauthenticated` (explicit logout / logout-all /
 *    server-forced session expiry), and
 *  - a real **login** (`unauthenticated → authenticated`) as a belt-and-braces
 *    second wipe.
 *
 * A cold-start session restore (`bootstrapping → authenticated`) does NOT clear —
 * it is a fresh process with nothing to leak. Renders nothing.
 */
export function SessionCacheGate() {
  const qc = useQueryClient();
  const status = useAuthStore((s) => s.status);
  const prev = useRef(status);

  useEffect(() => {
    const was = prev.current;
    prev.current = status;
    if (was === status) return;
    if (status === 'unauthenticated' && was !== 'bootstrapping') qc.clear();
    if (status === 'authenticated' && was === 'unauthenticated') qc.clear();
  }, [status, qc]);

  return null;
}
