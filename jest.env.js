/**
 * Runs before any module is imported (Jest `setupFiles` phase).
 *
 * Pin the API + realtime origins to a dead loopback port for the whole test
 * run. `src/lib/env.ts` reads `process.env.EXPO_PUBLIC_*` at import time, and
 * jest-expo would otherwise surface the developer's `.env` — pointing the suite
 * at a live backend. Component tests that make an unmocked authenticated call
 * would then get a real `401`, which trips the auth store's forced sign-out and
 * wipes the seeded session mid-render. Loopback:1 refuses instantly instead.
 */
process.env.EXPO_PUBLIC_API_BASE_URL = 'http://127.0.0.1:1';
process.env.EXPO_PUBLIC_REALTIME_URL = 'ws://127.0.0.1:1';
process.env.EXPO_PUBLIC_ENVIRONMENT = 'development';
