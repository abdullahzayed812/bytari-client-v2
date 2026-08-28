import { env } from './env';

/**
 * Tiny leveled logger. Two hard rules:
 *  1. NEVER pass a JWT, refresh token, password, or raw notification payload.
 *  2. `debug` is silent unless `EXPO_PUBLIC_DEBUG_LOGGING=true`.
 *
 * Known-sensitive keys are redacted defensively before anything is printed.
 */
type Level = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_KEY = /(token|authorization|password|secret|refresh|jwt|cookie|otp|pin)/i;

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[…]';
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEY.test(k) ? '[REDACTED]' : redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

function emit(level: Level, scope: string, message: string, meta?: unknown): void {
  if (level === 'debug' && !env.debugLogging) return;
  const prefix = `[${scope}]`;
  const payload = meta === undefined ? [] : [redact(meta)];
  // eslint-disable-next-line no-console
  const sink = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  sink(prefix, message, ...payload);
}

export interface Logger {
  debug(message: string, meta?: unknown): void;
  info(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
  child(scope: string): Logger;
}

export function createLogger(scope: string): Logger {
  return {
    debug: (m, meta) => emit('debug', scope, m, meta),
    info: (m, meta) => emit('info', scope, m, meta),
    warn: (m, meta) => emit('warn', scope, m, meta),
    error: (m, meta) => emit('error', scope, m, meta),
    child: (sub) => createLogger(`${scope}:${sub}`),
  };
}

export const logger = createLogger('app');
