import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import { act } from 'react';

import { useAuthStore } from '@/features/auth/store';
import { SessionCacheGate } from '@/providers/SessionCacheGate';

function mountWith(client: QueryClient) {
  return render(
    <QueryClientProvider client={client}>
      <SessionCacheGate />
    </QueryClientProvider>,
  );
}

function seedCache(client: QueryClient) {
  client.setQueryData(['pets', 'list'], [{ id: 'a-secret-pet' }]);
  client.setQueryData(['chat', 'list'], [{ id: 'a-secret-conversation' }]);
}

afterEach(() => useAuthStore.setState({ status: 'unauthenticated', session: null, user: null }));

describe('SessionCacheGate — account-switch cache isolation', () => {
  it('wipes the query cache when the session ends (logout / expiry)', () => {
    useAuthStore.setState({ status: 'authenticated' });
    const client = new QueryClient();
    mountWith(client);
    seedCache(client);

    act(() => {
      useAuthStore.setState({ status: 'unauthenticated' });
    });

    expect(client.getQueryData(['pets', 'list'])).toBeUndefined();
    expect(client.getQueryData(['chat', 'list'])).toBeUndefined();
  });

  it('wipes again on the next login so User B never sees User A data', () => {
    useAuthStore.setState({ status: 'unauthenticated' });
    const client = new QueryClient();
    mountWith(client);
    seedCache(client); // stale data lingering from a previous session

    act(() => {
      useAuthStore.setState({ status: 'authenticated' });
    });

    expect(client.getQueryData(['pets', 'list'])).toBeUndefined();
  });

  it('does NOT wipe on a cold-start restore (bootstrapping → authenticated)', () => {
    useAuthStore.setState({ status: 'bootstrapping' });
    const client = new QueryClient();
    mountWith(client);

    act(() => {
      useAuthStore.setState({ status: 'authenticated' });
    });
    client.setQueryData(['pets', 'list'], [{ id: 'p1' }]);

    // a later no-op re-render must not clear it
    act(() => {
      useAuthStore.setState({ status: 'authenticated' });
    });
    expect(client.getQueryData(['pets', 'list'])).toEqual([{ id: 'p1' }]);
  });
});
