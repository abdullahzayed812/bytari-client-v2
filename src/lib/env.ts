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
} as const;

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

function pick(value: string | undefined, extraKey: string, fallback?: string): string | undefined {
  if (typeof value === 'string' && value.length > 0) return value;
  const fromExtra = extra[extraKey];
  if (typeof fromExtra === 'string' && fromExtra.length > 0) return fromExtra;
  return fallback;
}

const DEV_DEFAULTS = {
  apiBaseUrl: 'http://localhost:3000',
  realtimeUrl: 'ws://localhost:3000',
} as const;

const schema = z.object({
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
