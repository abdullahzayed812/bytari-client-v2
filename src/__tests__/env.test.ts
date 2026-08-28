import { apiBaseUrl, env, realtimeEndpoint } from '@/lib/env';

describe('environment configuration', () => {
  it('parses to a typed config object with safe dev defaults', () => {
    expect(env.environment).toBe('development');
    expect(env.requestTimeoutMs).toBeGreaterThan(0);
    expect(env.apiVersion).toBe('v1');
  });

  it('derives the fully-qualified API base with the version suffix', () => {
    expect(apiBaseUrl).toMatch(/\/api\/v1$/);
    expect(apiBaseUrl.startsWith('http')).toBe(true);
  });

  it('derives the realtime endpoint from origin + path', () => {
    expect(realtimeEndpoint).toMatch(/^wss?:\/\/.+\/realtime$/);
  });

  it('never exposes a secret-looking key', () => {
    const keys = Object.keys(env);
    expect(keys.some((k) => /secret|password|privateKey|accessKey/i.test(k))).toBe(false);
  });
});
