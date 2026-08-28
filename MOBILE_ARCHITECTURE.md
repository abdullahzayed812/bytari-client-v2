# Bytari Mobile — Architecture

Companion to `server/ARCHITECTURE.md`. Covers **Mobile Phase 1 (foundation)**.
No business modules exist yet; this document is the contract future phases build
on.

---

## 1. Principles

1. **One app, many roles.** Pet Owner / Veterinarian / Org roles / Moderator /
   Admin all use the same binary. The experience is shaped at runtime by
   (a) the authoritative `/auth/me` capability snapshot and (b) a client-only
   `activeMode` (owner | veterinarian).
2. **Backend is authoritative.** The app never enforces authorization — it only
   hides UI for UX. Every action is re-checked server-side.
3. **Feature-oriented.** Cross-cutting concerns live in `src/{theme,components,
services,store,lib,i18n,hooks}`. Each business capability will be a
   self-contained `src/features/<name>/` folder (+ routes under `app/`).
4. **Tokens, not values.** Screens compose `@/components` and read `@/theme`
   tokens. No raw colours / font sizes / spacing numbers outside `src/theme`.
5. **Strict TypeScript, no `any`.** `noUncheckedIndexedAccess` on.
6. **Arabic-first / RTL-first**, with LTR + English kept working by construction.

---

## 2. Project structure

```
app/                         Expo Router (file-based routing)
  _layout.tsx                root: providers, fonts, i18n/RTL bootstrap, splash gate
  index.tsx                  redirect → (app) or (auth)
  +not-found.tsx
  (auth)/
    _layout.tsx
    sign-in.tsx              FOUNDATION PLACEHOLDER minimal sign-in
  (app)/
    _layout.tsx              authenticated stack
    (tabs)/
      _layout.tsx            <Tabs> with the custom BottomTabBar
      account.tsx animals.tsx index.tsx services.tsx more.tsx
    admin/
      _layout.tsx            gated on capabilities (Redirect if not allowed)
      index.tsx              Control Centre landing (placeholder)
    showcase.tsx             DEV design-system screen

src/
  theme/        colors typography fonts spacing radius shadows sizes zIndex
                index.ts (buildTheme) ThemeProvider.tsx
  components/    layout/ typography/ actions/ forms/ content/ feedback/
                navigation/ overlays/  (+ index.ts barrel)
  services/
    api/        client.ts errors.ts types.ts index.ts
    auth/       authService.ts tokenStorage.ts types.ts index.ts
    realtime/   realtimeClient.ts types.ts index.ts
    notifications/ notificationService.ts types.ts index.ts
    files/      fileUploadService.ts types.ts index.ts
  store/        authStore appModeStore preferencesStore uiStore persist.ts
  hooks/        useAuth useCapabilities useAppMode useDebouncedValue
  i18n/         index.ts  locales/ar/*  locales/en/index.ts
  lib/          env.ts logger.ts rtl.ts bootstrapDirection.ts queryClient.ts
  providers/    AppProviders.tsx useAppBootstrap.ts RealtimeGate.tsx
  navigation/   AuthRedirector.tsx PlaceholderScreen.tsx useAppHeaderGreeting.ts
  constants/    config.ts permissions.ts routes.ts
  types/        index.ts
  utils/        format.ts
  test-utils/   render.tsx (RTL wrapper with providers)
  __tests__/    foundation tests
  features/     README.md only — feature folders come later
```

Path alias: `@/*` → `src/*` (tsconfig + Metro/Babel via `babel-preset-expo`).

---

## 3. Navigation architecture

**Expo Router**, typed routes enabled. Groups:

| Group            | Purpose                  | Gate                                                          |
| ---------------- | ------------------------ | ------------------------------------------------------------- |
| `(auth)`         | Unauthenticated screens  | redirect _in_ when signed out                                 |
| `(app)`          | Everything authenticated | redirect _out_ to `(auth)` when signed out                    |
| `(app)/(tabs)`   | The shared 5-tab shell   | —                                                             |
| `(app)/admin`    | Internal Control Centre  | `useCapabilities().canAccessControlCentre`, else `<Redirect>` |
| `(app)/showcase` | Dev design-system screen | —                                                             |

**The auth routing seam** is a single component, `src/navigation/AuthRedirector`,
mounted once in the root layout. It watches auth status + route segments and
performs the only auth redirects in the app. Nothing else redirects for auth.

**Owner ⇄ Veterinarian mode** — `src/hooks/useAppMode()` exposes
`activeMode`, `availableModes`, `setMode`, `toggleMode`. `activeMode` is
persisted (AsyncStorage) and **decoupled from authorization**: choosing
`veterinarian` grants nothing; `canEnterVeterinarianMode` (approved vet or admin)
merely decides whether the switch is offered, and the hook self-corrects to
`owner` if capability is lost. Later phases mount per-mode navigation subtrees
that read `activeMode`; Phase 1 only builds the seam.

**Bottom navigation** — custom `src/components/navigation/BottomTabBar` passed to
`<Tabs tabBar={…}>`. Five destinations (`account`, `animals`, `index`/Home,
`services`, `more`) with the centre Home raised into a circular brand-green
button. Layout is logical, so order reads correctly right-to-left in RTL. The
`account` tab carries the notification badge from `uiStore`.

---

## 4. Design system

`src/theme` — every value centralised:

| File            | Tokens                                                                                                                                                                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `colors.ts`     | Semantic `ColorTokens` (background, surface, `surfaceAccent`, text*, primary*, success/warning/danger/info + soft variants, tabBar*, overlay, skeleton). Light palette authoritative; **dark palette is a structural placeholder** (`buildTheme('dark')` works; not visually finished). |
| `typography.ts` | `fontFamily` (Tajawal body, Cairo display) + `typography` variants: `display heading title subtitle body bodyMedium bodyStrong label caption overline`, each with size + lineHeight + family.                                                                                           |
| `spacing.ts`    | 4pt scale `none…giant` + `screenPadding`.                                                                                                                                                                                                                                               |
| `radius.ts`     | `none sm md lg xl xxl pill`.                                                                                                                                                                                                                                                            |
| `shadows.ts`    | Cross-platform soft elevations `none xs card raised overlay`.                                                                                                                                                                                                                           |
| `sizes.ts`      | Control heights, icon sizes, avatar sizes, tab-bar/header dims, `touchTarget: 44`.                                                                                                                                                                                                      |
| `zIndex.ts`     | Overlay stacking order.                                                                                                                                                                                                                                                                 |

`ThemeProvider` resolves a `ThemePreference` (`light` | `dark` | `system`) from
`preferencesStore` and exposes `useTheme()` + `useThemedStyles(factory)`.

**Components** (`src/components/*`, one barrel `@/components`):

- **layout** — `Screen`, `ScrollScreen`, `SafeAreaScreen`, `Section`, `Row`,
  `Column`
- **typography** — `Text` (the only text primitive; RTL `writingDirection`),
  `Heading`, `Label`, `Caption`
- **actions** — `Button` (5 variants × 3 sizes, loading/disabled/icons),
  `IconButton`, `TextButton`
- **forms** — `Input`, `PasswordInput`, `SearchInput`, `Select` (opens a
  `BottomSheet`), `Checkbox`, `Radio`, `Switch`
- **content** — `Icon` (Ionicons wrapper, `directional` mirrors in RTL), `Card`,
  `ImageCard`, `Avatar` (image / initials), `Badge`, `Chip`, `Divider`, `Banner`
- **feedback** — `Loading`, `Skeleton` / `SkeletonText`, `EmptyState`,
  `ErrorState` (user-safe messages only — never leaks internal detail),
  `Alert`, `ConfirmationDialog`, `ToastProvider` + `useToast()`
- **navigation** — `AppHeader`, `BackButton`, `BottomTabBar`, `TabButton`
- **overlays** — `Modal`, `BottomSheet` (Phase 1: slide-up `Modal`, same API a
  gesture-driven sheet would use)

The **`showcase` screen** (`app/(app)/showcase.tsx`, dev-only) renders every
group with Arabic sample text.

---

## 5. Theme tokens summary

Brand green `#0BAA55` (`colors.primary`). White backgrounds, very-light-green
`surfaceAccent`, dark text, `radius.xl`/`xxl` cards, `shadows.card` soft
elevation, large rounded `Banner`. Green is used for primary actions, active
states, key indicators and branding — not everywhere.

---

## 6. API client foundation

`src/services/api`:

- **`client.ts`** — `ApiClient` over a single axios instance.
  - Base URL `env.apiBaseUrl` (`${EXPO_PUBLIC_API_BASE_URL}/api/v1`), timeout
    from env.
  - **Auth bridge** (`configureApiAuth`) — injected by `authStore` at startup, so
    api ↔ auth has no import cycle. Provides `getAccessToken`, `refresh`,
    `onSessionExpired`.
  - Request interceptor adds `Authorization: Bearer <token>` unless
    `{ anonymous: true }`.
  - Response interceptor: on `401` (and not already retried / not anonymous),
    runs a **single-flight refresh** then retries once; on failure calls
    `onSessionExpired`. All errors normalised to `ApiError`.
  - `get/post/patch/put/delete` unwrap the `{ data }` envelope;
    `requestEnvelope` keeps `meta` for pagination.
- **`errors.ts`** — `ApiError { code, status, requestId, details }` with
  `isAuthError`, `isPermissionError`, `isValidationError`, `isNetworkError`,
  `isRetryable`. Network / timeout / unknown failures become `ApiError` too.
- **`types.ts`** — envelope contract (`ApiSuccess<T>`, `ApiErrorBody`,
  `PageMeta`), `ApiErrorCode` map, `RequestOptions`.

**Backend contract used** (verified against `server/src`):

| Endpoint                                 | Shape                                                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `POST /auth/register` (201)              | `{ user, tokens }`                                                                               |
| `POST /auth/login`                       | `{ user, tokens }`                                                                               |
| `POST /auth/refresh`                     | `{ user, tokens }` (rotates the refresh token)                                                   |
| `POST /auth/logout` / `/auth/logout-all` | `{ success, … }`                                                                                 |
| `GET /auth/me`                           | `{ user, roles[], permissions[], isAdmin, supervisorDomains[], veterinarian:{status,approved} }` |
| `POST /notifications/devices`            | `{ token, platform:'ios'                                                                         | 'android'                                          | 'web', deviceId?, appVersion? }` |
| `DELETE /notifications/devices/:id`      | —                                                                                                |
| WebSocket `/realtime?access_token=<jwt>` | frames `{ type, data, meta? }`; client sends `{ type:'subscribe'                                 | 'unsubscribe', data:{ room } }`, `{ type:'ping' }` |

`AuthTokens = { accessToken, refreshToken, tokenType:'Bearer', expiresIn }`.
Response envelope `{ data, meta? }` / `{ error:{ code, message, details?, requestId? } }`.

Future feature modules: `src/features/<f>/api.ts` importing `{ apiClient }` — no
new axios instance, no hard-coded URL.

---

## 7. Authentication architecture

- **`services/auth/authService.ts`** — stateless wrappers over `/auth/*`.
- **`services/auth/tokenStorage.ts`** — `expo-secure-store` only
  (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`). Access + refresh token + small meta
  (`expiresIn`, `issuedAt`). Never AsyncStorage, never logged.
- **`store/authStore.ts`** (Zustand) — the session lifecycle + state machine:
  `status: idle → restoring → authenticated | unauthenticated`, plus `user`,
  `session` (the `/auth/me` snapshot), in-memory `tokens`.
  - `bootstrap()` — load tokens → `GET /auth/me`; on `401` do one `refresh`;
    on any failure clear + `unauthenticated`. Runs once (root layout).
  - `signIn` / `register` → `applyResult` (persist tokens, fetch `/auth/me`).
  - `signOut` / `signOutEverywhere` → best-effort backend call + local teardown.
  - `refreshSession()` — re-fetch `/auth/me` (after vet approval, role change,
    app resume).
  - Registers the API **auth bridge** (`getAccessToken` / `refresh` /
    `onSessionExpired`) exactly once.
- **`hooks/useAuth()`** — ergonomic selector + actions.

Compatible with the backend's stateless HS256 access token (15 min) + rotating
opaque refresh session. A rotated-token replay revokes the family server-side;
the app just lands on `unauthenticated`.

---

## 8. Capabilities & roles

`hooks/useCapabilities()` derives everything from `session` (`/auth/me`):
`isAdmin`, `isModerator`, `isApprovedVeterinarian`, `roles`,
`supervisorDomains`, `can(permission)` / `canAny` / `canAll` (admin ⇒ always
true), `hasRole`, `isSupervisorOf(domain)`, `canAccessControlCentre`
(admin OR any supervisor domain), `canEnterVeterinarianMode`.

`constants/permissions.ts` mirrors backend permission keys **for typo-safety
only** — `session.permissions` is authoritative and wins on drift. Role checks
are never scattered through the UI; they go through this hook.

---

## 9. State management

| Concern                                           | Where                                                 |
| ------------------------------------------------- | ----------------------------------------------------- |
| Server data (lists, entities, …)                  | **React Query** — never Zustand                       |
| Auth session                                      | `store/authStore` (in-memory; tokens in secure-store) |
| Active mode (owner/vet)                           | `store/appModeStore` (persisted, AsyncStorage)        |
| Theme / language preference                       | `store/preferencesStore` (persisted)                  |
| Notification badge, realtime status, offline flag | `store/uiStore` (ephemeral)                           |

Only genuinely global client state goes in a store. Persistence for
non-sensitive slices uses `store/persist.ts` (AsyncStorage). Tokens are the sole
exception and use secure-store.

---

## 10. React Query

`lib/queryClient.ts` → `createQueryClient()` (one per app, in `AppProviders`).
Defaults: `staleTime` 30 s, `gcTime` 5 min, retry transient/5xx twice (never auth
or client errors — keyed off `ApiError.isRetryable`), no refetch-on-focus,
refetch-on-reconnect.

Conventions for later phases: query keys `['<feature>', '<entity>', params]`;
reads in `features/<f>/queries.ts`, writes in `features/<f>/mutations.ts`;
invalidate by prefix. Optimistic updates layered per feature later.

---

## 11. Realtime foundation

`services/realtime/realtimeClient.ts` — transport only, no business events.

- Connects to `${EXPO_PUBLIC_REALTIME_URL}${EXPO_PUBLIC_REALTIME_PATH}?access_token=<jwt>`
  (query param — RN `WebSocket` can't set headers).
- Lifecycle: `connect` / `disconnect` / `reset`; status
  `idle | connecting | connected | reconnecting | disconnected` with
  `onStatusChange`.
- Exponential-backoff reconnect (1 s → 30 s), heartbeat ping (25 s),
  auto-resubscribe rooms on reconnect.
- `on(type, listener, room?)` → ref-counted room join; `unsubscribe` leaves the
  room when its last listener goes.

`providers/RealtimeGate` connects while `authStore.status === 'authenticated'`
and `reset()`s on sign-out, mirroring status into `uiStore`. Feature modules do
`realtimeClient.on('chat.message.created', cb, rooms.conversation(id))` and own
their payload types — **no business event names are baked into the foundation.**

---

## 12. Push notifications foundation

`services/notifications/notificationService.ts` (`expo-notifications` +
`expo-device`):

- `requestPermission()` / `getPermissionStatus()`
- `getDevicePushToken()` — **native FCM/APNs device token** (what the Firebase
  backend expects), `null` on simulator / Expo Go / denied
- `registerDevice(token)` → `POST /notifications/devices` (`platform` mapped to
  `ios|android|web`; `deviceId` + `appVersion` attached; a `404` is treated as
  "backend endpoint not ready" and skipped)
- `unregisterDevice(deviceId)` → `DELETE /notifications/devices/:id`
- `onForegroundNotification` / `onNotificationTap` / `getInitialNotification` —
  emit a neutral `ReceivedNotification { title?, body?, data }`
- `setBadgeCount`

**No business routing.** A feature phase registers a `NotificationTapHandler`
that maps `data` → a screen. Payloads are never logged. Real device tokens
require a Dev Client / production build with `google-services.json` /
`GoogleService-Info.plist` + the notifications config plugin (documented, not
wired).

---

## 13. R2 / file upload foundation

`services/files` — the app holds **no Cloudflare R2 credentials** (no access
key, no secret, no bucket policy). Flow:

1. A feature supplies a `PresignProvider` that calls _its_ backend endpoint for a
   short-lived `PresignedUpload { storageKey, uploadUrl, method, headers, expiresInSeconds }`
   (mirrors the Phase-14 content contract — the server owns `storageKey`).
2. `FileUploadService.upload(file)` → `PUT` bytes to `uploadUrl` → optional
   `finalizeUpload` so the backend records the file.
3. `uploadToPresignedUrl(presigned, file)` for retry / advanced flows.

Client-side guards: 25 MB cap, mime prefix allow-list (backend re-validates
authoritatively). **Phase 1 ships the abstraction + types only** — no business
`PresignProvider` is wired (no general upload endpoint exists yet).

---

## 14. i18n & RTL

- **i18next** (`src/i18n`), namespaces `common | nav | errors | showcase`,
  locales `ar` (authoritative shape) + `en` (typed by `TranslationResources`, so
  a missing key is a compile error). `t()` is fully typed via
  `CustomTypeOptions`.
- `initI18n(language)` runs once in `useAppBootstrap` _after_ preferences
  hydrate, so the persisted language wins over the device locale.
- **RTL strategy** (`src/lib/rtl.ts` + `bootstrapDirection.ts`):
  - `bootstrapDirection.ts` is imported first in the root layout and forces RTL
    for the default (Arabic) language synchronously — the first frame is already
    RTL, no first-launch reload for the common case.
  - `applyDirectionForLanguage(lang)` returns `{ changed }`; a runtime AR↔EN
    switch that flips direction needs a native reload (surfaced in the UI, not
    done silently).
  - Components rely on flexbox + logical props; `flipForDirection()` /
    `directional` on `Icon` handle the few truly directional glyphs.
  - `<Text>` sets `writingDirection` so mixed AR/Latin content aligns.
- LTR + English stay first-class — nothing hard-codes `'right'`/`'rtl'` except
  through these helpers.

---

## 15. Environment configuration

`src/lib/env.ts` — Zod-validated, typed, **public** config. Reads `EXPO_PUBLIC_*`
with static literal keys (Expo inlines them at build), falling back to
`app.json → expo.extra` then a dev default. Throws a descriptive error on an
invalid set.

| Var                              | Default                 | Purpose                                          |
| -------------------------------- | ----------------------- | ------------------------------------------------ |
| `EXPO_PUBLIC_API_BASE_URL`       | `http://localhost:3000` | Backend origin (no `/api/v1`)                    |
| `EXPO_PUBLIC_API_VERSION`        | `v1`                    | API version segment                              |
| `EXPO_PUBLIC_REALTIME_URL`       | `ws://localhost:3000`   | WebSocket origin                                 |
| `EXPO_PUBLIC_REALTIME_PATH`      | `/realtime`             | Gateway path                                     |
| `EXPO_PUBLIC_ENVIRONMENT`        | `development`           | `development                                     | staging | production` |
| `EXPO_PUBLIC_REQUEST_TIMEOUT_MS` | `20000`                 | HTTP timeout                                     |
| `EXPO_PUBLIC_DEBUG_LOGGING`      | `false`                 | Verbose client logs (tokens redacted regardless) |

**No secret ever belongs in an `EXPO_PUBLIC_*` var, `expo.extra`, or JS.**
Firebase native config files and R2 are backend concerns — see `.env.example`.

---

## 16. Error / loading / empty / offline UX

- All API failures are `ApiError` with a user-safe `message` + `requestId`.
- `ErrorState` shows the friendly message + `Ref: <requestId>` and a retry
  button — **never** a stack trace, SQL, or a raw 500 body. 5xx / network get
  generic copy.
- `EmptyState`, `Loading`, `Skeleton` / `SkeletonText` cover the other states.
- `uiStore.isOffline` + the `errors.offline` strings back an offline banner
  (wired per screen by feature phases).
- `Toast` for transient confirmations; `Alert` for inline status;
  `ConfirmationDialog` for irreversible actions.

---

## 17. Accessibility

`touchTarget = 44` (hitSlop expands smaller controls). Every interactive
primitive sets `accessibilityRole` + `accessibilityLabel` +
`accessibilityState` (disabled/busy/selected/checked). `allowFontScaling` on
`Text` (capped at 1.6×). Colour tokens chosen for contrast on white.
`Skeleton` is hidden from screen readers.

---

## 18. Performance defaults

- One `QueryClient`; `staleTime` avoids refetch storms.
- Selectors on Zustand stores (`useStore(s => s.x)`) to limit re-renders;
  hooks return memoised objects.
- `Image` uses `resizeMode="cover"` + fixed aspect ratios; avatars fall back to
  initials on error.
- No premature memoisation or virtualization abstractions — feature lists will
  use `FlatList` with `keyExtractor` + item `React.memo` where measured.

---

## 19. Security posture

- Tokens: secure-store only; never AsyncStorage / Zustand-persist / logs.
- `logger.ts` redacts any key matching `token|authorization|password|secret|
refresh|jwt|cookie|otp|pin` before printing; `debug` off unless
  `EXPO_PUBLIC_DEBUG_LOGGING=true`.
- No secrets in source or `EXPO_PUBLIC_*`.
- Authorization is the backend's; `useCapabilities()` gates UI for UX only and
  does not re-encode backend rules in a way that can silently drift (it consumes
  the live `permissions` list).
- Upload = presigned URL from backend; no R2 credentials client-side.
- Realtime auth = the same access token; a user can only join their own
  `user:<id>` room (backend-enforced).

---

## 20. Testing

`jest-expo` + `@testing-library/react-native`. `jest.setup.ts` mocks
`@react-native-async-storage/async-storage` (official mock), `expo-secure-store`
(in-memory), `expo-localization`. `src/test-utils/render.tsx` wraps components in
`SafeAreaProvider + ThemeProvider + ToastProvider`.

Phase 1 suites (`src/__tests__/`, 8 files / 41 tests):

| Suite                   | Covers                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `theme.test.ts`         | token completeness, brand green, dark-theme shape parity, typography variants, touch target                     |
| `rtl.test.ts`           | language classification, direction-change detection, writing direction                                          |
| `env.test.ts`           | typed parse, `apiBaseUrl` / `realtimeEndpoint` derivation, no secret-looking keys                               |
| `apiClient.test.ts`     | envelope unwrap, HTTP-error → `ApiError`, network-error mapping, `ApiError` classification                      |
| `tokenStorage.test.ts`  | secure round-trip, clear, near-expiry heuristic                                                                 |
| `authStore.test.ts`     | idle→unauthenticated / →authenticated, sign-in, sign-out, expired-token refresh recovery                        |
| `capabilities.test.tsx` | admin override, explicit grants, vet-mode gated on approval, supervisor ⇒ control-centre                        |
| `components.test.tsx`   | render + press for `Text`/`Button`/`Badge`/`Card`/`EmptyState`/`TextButton`; `ErrorState` hides internal detail |

---

## 21. How future phases add a feature

1. Read the real backend routes in `server/src/modules/<module>` — don't guess.
2. `src/features/<feature>/` with `api.ts` (uses `@/services/api` `apiClient`),
   `types.ts`, `queries.ts`, `mutations.ts`, optional `components/`, `index.ts`.
3. Routes under `app/(app)/...`; screens are thin (call feature hooks, render
   `@/components`).
4. i18n: add a namespace under `src/i18n/locales/*` (both `ar` and `en`).
5. New global client state only if unavoidable → a small Zustand slice.
6. Realtime: `realtimeClient.on(...)` with cleanup on unmount.
7. Uploads: implement a `PresignProvider` against the feature's presign endpoint.
8. Capability-gate UI with `useCapabilities()`; rely on the backend for the real
   check.
9. Tests for API mapping, query/mutation behaviour, non-trivial components.
10. `npm run typecheck && npm run lint && npm run format:check && npm test`.

See `src/features/README.md` for the checklist.

---

## 22. Known limitations (Phase 1)

- **No business features** — by design.
- Dark theme is a token placeholder, not a finished visual pass.
- `BottomSheet` is a slide-up `Modal` (no drag) — same API a gesture sheet
  would use.
- Real push tokens need a Dev Client / prod build + Firebase native files
  (foundation only; endpoint contract wired).
- No `PresignProvider` wired (no general upload endpoint yet) — abstraction only.
- Sign-in is a minimal foundation placeholder (no register / recovery /
  vet application UI).
- `npm audit` reports advisories in the Expo dev/build toolchain (transitive,
  baseline for SDK 53) — not app-runtime; `audit fix --force` would break SDK
  alignment.
- Offline detection is a `uiStore` flag with UX copy; no `@react-native-community/
netinfo` wired yet.
