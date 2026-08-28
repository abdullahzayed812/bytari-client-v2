# `features/` — how to add a feature module

Each business capability (pets, clinics, chat, consultations, content, jobs,
subscriptions, admin, …) is a self-contained folder here. **None are implemented
yet** — Mobile Phase 1 is foundation only.

## Standard shape

```
features/<feature>/
  api.ts          # endpoint calls — import { apiClient } from '@/services/api'
  types.ts        # request/response + view models for this feature
  queries.ts      # TanStack Query read hooks  (keys: ['<feature>', <entity>, <params>])
  mutations.ts    # TanStack Query write hooks + cache invalidation
  hooks.ts        # feature-specific composed hooks (optional)
  components/      # feature-only components (reuse @/components for primitives)
  index.ts        # public surface of the feature
```

Screens live under `app/(app)/...` (Expo Router) and should be thin: they call
feature hooks and render `@/components`. **No API calls or business rules in
screen files.**

## Rules

1. **API config is centralised.** Never create an axios instance — use
   `apiClient` from `@/services/api`. Never hard-code a base URL.
2. **Server state → React Query.** Client/UI state → a small Zustand slice in
   `@/store` only if genuinely global.
3. **Authorization is the backend's job.** Use `useCapabilities()` to hide UI for
   UX; never treat a hidden button as a security boundary.
4. **Respect the design system.** Use `@/components` + `@/theme` tokens. No raw
   hex, font sizes, or spacing numbers.
5. **i18n everything user-facing.** Add a namespace under `src/i18n/locales/*`.
6. **RTL:** rely on flexbox + logical props; only use `flipForDirection()` for
   truly directional glyphs.
7. **Types:** strict, no `any`. Mirror backend contracts from
   `server/src/modules/<module>` — inspect the real route, don't guess.
8. **Uploads:** implement a `PresignProvider` (`@/services/files`) against the
   feature's backend presign endpoint. No R2 credentials in the app.
9. **Realtime:** subscribe via `realtimeClient.on('<event>', cb, '<room>')` from
   `@/services/realtime`. Clean up on unmount.
10. **Tests:** cover API mapping, query/mutation behaviour, and any non-trivial
    component. Use `jest-expo` + `@testing-library/react-native`.

See `MOBILE_ARCHITECTURE.md` for the full picture.
