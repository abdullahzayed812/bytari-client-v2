/** Non-secret app constants. Tunables that aren't environment-specific. */
export const AppConfig = {
  /** Default page size for paginated lists (backend max is 100). */
  defaultPageSize: 20,
  /** Debounce for search inputs, ms. */
  searchDebounceMs: 300,
  /** Realtime reconnect backoff. */
  realtime: {
    baseDelayMs: 1_000,
    maxDelayMs: 30_000,
    /** Heartbeat ping interval — backend default sweep is 30s. */
    pingIntervalMs: 25_000,
  },
  /** Toasts auto-dismiss after this many ms unless `duration` is overridden. */
  toastDurationMs: 3_500,
} as const;

/** `ku` = Central Kurdish (Sorani, Arabic script, RTL) — falls back to Arabic for any missing string. */
export const SUPPORTED_LANGUAGES = ['ar', 'en', 'ku'] as const;
export const DEFAULT_LANGUAGE = 'ar' as const;
