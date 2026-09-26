import Constants from 'expo-constants';
import { z } from 'zod';

/**
 * Typed, validated PUBLIC configuration.
 *
 * Values come from `EXPO_PUBLIC_*` environment variables — Expo inlines these at
 * build time, so each MUST be read with a static literal key (no dynamic
 * lookup). Falls back to `app.json` → `expo.extra` then a dev default.
 *
 * Everything here ships in the app bundle. Never put a secret in this file, an
 * `EXPO_PUBLIC_*` var, or `expo.extra`. Secrets live on the backend only.
 */

const rawEnv = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
  apiVersion: process.env.EXPO_PUBLIC_API_VERSION,
  realtimeUrl: process.env.EXPO_PUBLIC_REALTIME_URL,
  realtimePath: process.env.EXPO_PUBLIC_REALTIME_PATH,
  environment: process.env.EXPO_PUBLIC_ENVIRONMENT,
  requestTimeoutMs: process.env.EXPO_PUBLIC_REQUEST_TIMEOUT_MS,
  debugLogging: process.env.EXPO_PUBLIC_DEBUG_LOGGING,
  webUrl: process.env.EXPO_PUBLIC_WEB_URL,
} as const;

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

function pick(value: string | undefined, extraKey: string, fallback?: string): string | undefined {
  if (typeof value === 'string' && value.length > 0) return value;
  const fromExtra = extra[extraKey];
  if (typeof fromExtra === 'string' && fromExtra.length > 0) return fromExtra;
  return fallback;
}

/**
 * Local fallbacks for a dev build only. `__DEV__` is statically `false` in a
 * release bundle, so these strings are dead-code-eliminated there and a
 * release build without `EXPO_PUBLIC_API_BASE_URL` fails fast instead of
 * silently talking to localhost.
 */
const DEV_DEFAULTS = __DEV__
  ? ({ apiBaseUrl: 'http://localhost:3000', realtimeUrl: 'ws://localhost:3000' } as const)
  : ({ apiBaseUrl: undefined, realtimeUrl: undefined } as const);

const LOCAL_HOST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

const schema = z
  .object({
    /** Backend API origin, WITHOUT the `/api/v1` suffix. */
    apiBaseUrl: z.string().url(),
    apiVersion: z.string().default('v1'),
    /** WebSocket origin for the realtime gateway. */
    realtimeUrl: z.string().url(),
    realtimePath: z.string().startsWith('/').default('/realtime'),
    environment: z.enum(['development', 'staging', 'production']).default('development'),
    requestTimeoutMs: z.coerce.number().int().positive().default(20_000),
    debugLogging: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .default('false'),
    /**
     * Public web-app origin used to build shareable links (clinic / office
     * details). The Expo Web build is served there, and its router opens the
     * exact screen for a shared path.
     */
    webUrl: z.string().url().default('https://baytari.com'),
  })
  // A production build must talk to a public, TLS-protected backend.
  .superRefine((v, ctx) => {
    if (v.environment !== 'production') return;
    const api = new URL(v.apiBaseUrl);
    const rt = new URL(v.realtimeUrl);
    if (api.protocol !== 'https:' || LOCAL_HOST.test(api.hostname)) {
      ctx.addIssue({
        code: 'custom',
        path: ['apiBaseUrl'],
        message: 'production requires a public https:// URL',
      });
    }
    if (rt.protocol !== 'wss:' || LOCAL_HOST.test(rt.hostname)) {
      ctx.addIssue({
        code: 'custom',
        path: ['realtimeUrl'],
        message: 'production requires a public wss:// URL',
      });
    }
  });

function load() {
  const parsed = schema.safeParse({
    apiBaseUrl: pick(rawEnv.apiBaseUrl, 'apiBaseUrl', DEV_DEFAULTS.apiBaseUrl),
    apiVersion: pick(rawEnv.apiVersion, 'apiVersion'),
    realtimeUrl: pick(rawEnv.realtimeUrl, 'realtimeUrl', DEV_DEFAULTS.realtimeUrl),
    realtimePath: pick(rawEnv.realtimePath, 'realtimePath'),
    environment: pick(rawEnv.environment, 'environment'),
    requestTimeoutMs: pick(rawEnv.requestTimeoutMs, 'requestTimeoutMs'),
    debugLogging: pick(rawEnv.debugLogging, 'debugLogging'),
    webUrl: pick(rawEnv.webUrl, 'webUrl'),
  });

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid mobile environment configuration:\n${issues}`);
  }
  return parsed.data;
}

export const env = load();
export type Env = typeof env;

/** Fully-qualified API base, e.g. `http://localhost:3000/api/v1`. */
export const apiBaseUrl = `${env.apiBaseUrl.replace(/\/+$/, '')}/api/${env.apiVersion}`;

/** Fully-qualified realtime endpoint, e.g. `ws://localhost:3000/realtime`. */
export const realtimeEndpoint = `${env.realtimeUrl.replace(/\/+$/, '')}${env.realtimePath}`;

export const isProduction = env.environment === 'production';
export const isDevelopment = env.environment === 'development';

/**
 * Gates development-only convenience data (form pre-fills, quick-fill test
 * buttons, …): true in a dev/simulator build, false in release AND under
 * Jest — so component tests that assert on an empty/required field still see
 * one. `__DEV__` is statically replaced at build time, so the release branch
 * of every `devDataEnabled ? … : …` call site is dead-code-eliminated.
 */
export const devDataEnabled = __DEV__ && process.env.NODE_ENV !== 'test';
