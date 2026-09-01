import type { AxiosAdapter, AxiosHeaders } from 'axios';

import { ApiClient, configureApiAuth, createHttpClient } from '@/services/api/client';

/**
 * §7 — refresh concurrency. Several requests failing 401 at the same time must
 * trigger exactly ONE `/auth/refresh`; all of them then retry with the new
 * token. Exercised against the real interceptor in `services/api/client.ts`.
 */
const tick = () => new Promise((r) => setTimeout(r, 10));

function authHeader(headers: unknown): string {
  const h = headers as AxiosHeaders | Record<string, unknown> | undefined;
  if (h && typeof (h as AxiosHeaders).get === 'function') {
    return String((h as AxiosHeaders).get('Authorization') ?? '');
  }
  return String((h as Record<string, unknown>)?.Authorization ?? '');
}

interface Harness {
  client: ApiClient;
  refreshCalls: () => number;
  onExpired: jest.Mock;
}

function harness(opts: { refreshYields: string | null; rotates: boolean }): Harness {
  let token = 'stale';
  let calls = 0;
  const onExpired = jest.fn();

  configureApiAuth({
    getAccessToken: () => token,
    refresh: async () => {
      calls += 1;
      await tick();
      if (opts.refreshYields && opts.rotates) token = opts.refreshYields;
      return opts.refreshYields;
    },
    onSessionExpired: onExpired,
  });

  const http = createHttpClient();
  const adapter: AxiosAdapter = async (config) => {
    if (authHeader(config.headers) === 'Bearer fresh') {
      return { status: 200, statusText: 'OK', data: { data: { ok: true } }, headers: {}, config };
    }
    return Promise.reject(
      Object.assign(new Error('401'), {
        isAxiosError: true,
        config,
        response: {
          status: 401,
          data: { error: { code: 'INVALID_TOKEN', message: 'expired' } },
          headers: {},
          config,
        },
      }),
    );
  };
  http.defaults.adapter = adapter;
  return { client: new ApiClient(http), refreshCalls: () => calls, onExpired };
}

afterEach(() => {
  configureApiAuth({
    getAccessToken: () => null,
    refresh: () => Promise.resolve(null),
    onSessionExpired: () => {},
  });
});

describe('single-flight token refresh', () => {
  it('coalesces concurrent 401s into ONE refresh, then retries every request', async () => {
    const h = harness({ refreshYields: 'fresh', rotates: true });
    const results = await Promise.all([
      h.client.get('/a'),
      h.client.get('/b'),
      h.client.get('/c'),
      h.client.get('/d'),
    ]);
    expect(h.refreshCalls()).toBe(1);
    expect(results).toEqual([{ ok: true }, { ok: true }, { ok: true }, { ok: true }]);
  });

  it('rejects all pending requests and signals session-expired when refresh fails', async () => {
    const h = harness({ refreshYields: null, rotates: false });
    const outcomes = await Promise.allSettled([
      h.client.get('/a'),
      h.client.get('/b'),
      h.client.get('/c'),
    ]);
    expect(h.refreshCalls()).toBe(1);
    expect(outcomes.every((o) => o.status === 'rejected')).toBe(true);
    expect(h.onExpired).toHaveBeenCalled();
  });

  it('retries at most once per request (no infinite loop)', async () => {
    const h = harness({ refreshYields: 'still-stale', rotates: true });
    await expect(h.client.get('/a')).rejects.toMatchObject({ status: 401 });
    expect(h.refreshCalls()).toBe(1);
  });
});
