# Bytari Mobile — Architecture

Companion to `server/ARCHITECTURE.md`. Covers **Mobile Phases 1–8 + 10–13**
(foundation · auth · Pet Owner · Veterinarian Mode & Organization Management ·
Organization Animal Management · Medical Records & Vaccinations ·
Organization Operations: Farm join-code & Poultry ·
Animal Community: Adoption / Mating / Lost publications ·
Veterinary Store product catalogue ·
Content & Knowledge: articles / magazines / books ·
Animals & Veterinary Medical Records: ownership transfer + medical
timeline + user name resolution ·
Consultations & Inquiries: thread + message experience for Pet Owner /
Veterinarian / system Supervisor / Admin ·
**Notifications: in-app inbox + FCM device lifecycle + realtime unread count +
deep links ·
**Chat: Pet Owner ↔ Clinic / Farm Owner ↔ member conversations, realtime,
read state, notification deep links**). Appointments, Follow-ups and Jobs /
Freelance Offers are **not in the product spec** (`server/ARCHITECTURE.md §21`)
and were not built — see the sections below.
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

---

# Mobile Phase 2 — Authentication, Session & User Identity

Phase 2 turns the Phase 1 auth _foundation_ into a working, screen-backed
authentication layer wired to the real backend. Still **no business features**.

## 23. Auth feature module

Everything auth-related now lives in one isolated feature (`src/features/auth/`):

```
features/auth/
  api/authApi.ts            /auth/* endpoint wrappers (contract-verified)
  services/tokenStorage.ts  secure token persistence (on services/storage)
  store/authStore.ts        Zustand session store + API auth-bridge wiring
  hooks/
    useAuth.ts              the public interface (user, isAuthenticated, …)
    useAuthMutations.ts     useLogin/Register/Logout/LogoutAll mutations
    useVeterinarianStatus.ts vet-approval status foundation
  validation/schemas.ts     zod login/register schemas (mirror the backend)
  errors/authErrorMessages.ts  backend code → Arabic message + field errors
  components/
    AuthScreenLayout.tsx    keyboard-aware shell + brand header
    FormField.tsx           RHF ↔ Phase 1 Input glue
    VeterinarianStatusBadge.tsx
  screens/{LoginScreen,RegisterScreen}.tsx
  __tests__/…
  index.ts                  public surface
```

`src/features/account/` (Account screen) and `src/features/management/`
(`useManagementAccess` + placeholder screen) are sibling features.

Legacy paths `@/services/auth` and `@/store/authStore` are kept as thin
`@deprecated` re-export shims so nothing else churned.

## 24. Backend API integration

Contract verified against `server/src/modules/auth/*` + `server/src/openapi/phase2.ts`
(not assumed). `authApi` wraps:

| Method      | Endpoint                         | Request                                                                | Success                                                                                          | Notable errors                                              |
| ----------- | -------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `register`  | `POST /auth/register`            | `email, password(≥10,≤128), firstName(1–100), lastName(1–100), phone?` | 201 `{ user, tokens }`                                                                           | 409 `CONFLICT` (dup email), 422, 429                        |
| `login`     | `POST /auth/login`               | `email, password`                                                      | 200 `{ user, tokens }`                                                                           | 401 `INVALID_CREDENTIALS`, 403 `ACCOUNT_INACTIVE`, 422, 429 |
| `refresh`   | `POST /auth/refresh`             | `{ refreshToken }`                                                     | 200 **`{ tokens }` — no user**                                                                   | 401 `INVALID_REFRESH_TOKEN`, 429                            |
| `logout`    | `POST /auth/logout` (bearer)     | `{ refreshToken? }`                                                    | `{ success }`                                                                                    | 401                                                         |
| `logoutAll` | `POST /auth/logout-all` (bearer) | —                                                                      | `{ success, revokedSessions }`                                                                   | 401                                                         |
| `me`        | `GET /auth/me` (bearer)          | —                                                                      | `{ user, roles[], permissions[], isAdmin, supervisorDomains[], veterinarian:{status,approved} }` | 401                                                         |

> **Contract fix (Phase 1 bug):** `/auth/refresh` returns tokens **only**. The
> Phase 1 client typed it as `{ user, tokens }` and blanked `user` on every
> background refresh. The refresh bridge now swaps tokens and leaves
> `user`/`session` intact (identity doesn't change on rotation).

`register` requests carry only backend-supported fields — no invented ones.

## 25. Token storage strategy

- `src/services/storage/secureStorage.ts` — a **generic** `expo-secure-store`
  abstraction (`getItem/setItem/removeItem/removeMany/isAvailable`,
  `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, reads never throw). No domain knowledge.
- `features/auth/services/tokenStorage.ts` — builds on it: `getAccessToken`,
  `getRefreshToken`, `setAccessToken`, `setRefreshToken`, `saveTokens`,
  `getStoredTokens`, `clearTokens`, plus `isAccessTokenNearExpiry(meta)`.
  Stores the pair + `{ tokenType, expiresIn, issuedAt }` meta.
- Tokens are **never** in AsyncStorage, a persisted Zustand slice, logs, or
  navigation params. `logger.ts` also redacts any `token|authorization|password|
refresh|jwt|…` key defensively.

## 26. Refresh strategy & concurrency (§6–§7)

Implemented in `src/services/api/client.ts` (response interceptor):

1. A `401` on a non-anonymous, not-yet-retried request triggers `refreshOnce()`.
2. **Single-flight:** `refreshInFlight` is a module-level promise — every
   concurrent `401` awaits the _same_ `/auth/refresh` call.
3. On success: the retried requests get the new `Authorization` header and are
   replayed once (`cfg._retried` guards against loops).
4. On failure: `onSessionExpired()` → tokens cleared, store set to
   `unauthenticated` → `AuthRedirector` sends the user to the auth flow.
5. `/auth/refresh` itself is sent with `{ anonymous: true, skipAuthRefresh: true }`
   so it can never recurse.

Covered by `refreshConcurrency.test.ts` (4 parallel 401s → 1 refresh; failure →
all reject + `onSessionExpired`; no double-retry).

## 27. Session lifecycle (§8, §21)

`authStore` is the single source of session truth. Status:

```
bootstrapping ──initialize()──▶ authenticated  (tokens valid or refreshed, /auth/me loaded)
              └───────────────▶ unauthenticated (no tokens, or restore failed)
```

`initialize()` (idempotent, run once from `useAppBootstrap`):
load stored tokens → `GET /auth/me` → on `401` do **exactly one** `refresh` →
`GET /auth/me` again → on any failure clear tokens + `unauthenticated`.

The root layout shows the splash until `status !== 'bootstrapping'`, so the
app never flickers between login and the tabs.

Actions: `login`, `register` (both → persist tokens → `/auth/me` →
`authenticated`), `logout`, `logoutAll` (best-effort backend call, always clear
locally), `refreshSession` (re-pull `/auth/me` only — tokens untouched).

## 28. Auth navigation (§11, §24)

- Groups: `(auth)/{sign-in,register}` ⇄ `(app)/{(tabs),admin,showcase}`.
- **One seam:** `src/navigation/AuthRedirector` (mounted once in the root
  layout) is the only component that redirects for auth. It no-ops while
  `bootstrapping` (avoids races), sends unauth users out of `(app)`, and sends
  authed users out of `(auth)`. It does **not** bounce between `sign-in` and
  `register`.
- Route files are thin `export { default } from '@/features/…'` re-exports —
  routing stays decoupled from feature code, and paths remain deep-link
  compatible (`Routes` constants; §30).
- Management group (`app/(app)/admin/_layout.tsx`) guards on
  `useManagementAccess()` and `<Redirect>`s non-privileged users to the tabs.

## 29. Mode architecture (§14–§15)

- `activeMode: 'owner' | 'veterinarian'` — a **client UI** concern in
  `appModeStore` (persisted), never authorization.
- `useAppMode()` derives `availableModes`, `veterinarianModeAvailable`
  (backend `veterinarian.approved || isAdmin`), and `veterinarianLockReasonKey`.
  `setMode('veterinarian')` is a no-op → falls back to `owner` when not allowed,
  and self-corrects if approval is revoked mid-session.
- **UX decision (§15):** Veterinarian mode is _always shown_ in the Account
  screen; it's disabled with an explanatory caption when the user isn't an
  approved vet (`PENDING` → "قيد المراجعة", `REJECTED` → "تم رفض الطلب",
  `NOT_APPLIED` → "غير مفعّل — يتطلب اعتماداً"). Rationale: a hidden option
  can't explain itself or hint at the future "apply" path. The machine-truth
  `availableModes` still excludes it, so nothing can actually enter vet mode
  without approval.

## 30. Management / admin access (§16)

- Same app, no separate binary. `useCapabilities().canAccessManagementArea`
  (= `isAdmin || supervisorDomains.length > 0`, straight from `/auth/me`) is the
  single gate — no hard-coded role strings anywhere.
- `features/management/`: `useManagementAccess()` + a **placeholder**
  `ManagementScreen` listing the areas the future dashboard covers, filtered by
  real permissions. No CRUD. The `/(app)/admin` route + guard already exist.

## 31. Error mapping (§19–§20)

`features/auth/errors/authErrorMessages.ts`:

```
backend error code / HTTP status  →  authErrorMessage(err, context)  →  Arabic string
```

Distinguishes: invalid credentials · duplicate email (register only) · inactive
account · session expired · rate limited · validation · forbidden · **network**
· **timeout** · **server error (5xx)** · unknown → generic. Never returns the
raw backend message, a stack, or any internal detail. `fieldErrors(err)` maps a
`422`'s `details[]` (`body.email`, `body.password`, …) to per-field Arabic
messages shown inline by the form screens.

## 32. Auth UI (§25–§27)

Login + Register screens use only Phase 1 design-system components + tokens
(no separate auth style). `AuthScreenLayout` wraps `KeyboardAvoidingView` +
`ScrollView` (`keyboardShouldPersistTaps="handled"`, interactive dismiss) so
fields/buttons stay reachable with the keyboard open. Inputs set
`keyboardType`, `autoComplete`, `textContentType`, `returnKeyType`, and
`accessibilityLabel`; passwords use the Phase 1 `PasswordInput` (secure entry +
show/hide). RHF + `zodResolver`; the submit button shows the mutation's
`isPending`; top-level backend errors render in an `<Alert tone="danger">`.

## 33. Server-state decision (§23)

Phase 1 chose Zustand for the _session_ (identity + capability snapshot) and
React Query for _server data_. Phase 2 follows that (permitted by §23):
`user`/`session` stay in `authStore` (§21 mandates one centralised auth state);
`useAuthMutations` are thin React Query wrappers over the store actions purely
for `isPending`/`error` ergonomics. No `useQuery(['auth','me'])` — it would
duplicate the store.

## 34. Security review (Phase 2)

- Tokens only in `expo-secure-store`; never logged, never in nav params, never
  in a persisted UI slice. Passwords never stored.
- `Authorization: Bearer` attached centrally by the API client; screens never
  see tokens (`useAuth` exposes none).
- Client capability checks are presentation-only; the backend authorises every
  request. `useCapabilities` reads the live `permissions` list so it can't
  silently drift from the backend.
- Registration/login validation mirrors — never exceeds — the backend rules;
  the server re-validates and its `422` wins.
- `refresh` can't recurse; retry is capped at once per request.

## 35. Tests (Phase 2)

`jest.setup.ts` now also stubs `@expo/vector-icons` (the real one loads fonts
async → act warnings / hangs). `renderWithProviders` gained a `QueryClientProvider`.

New / rewritten suites (auth): `tokenStorage`, `secureStorage`, `authApi`,
`authStore` (initialize / refresh-recovery / refresh-failure→logout / login /
login-failure / register / logout / logout-all / refreshSession),
`refreshConcurrency` (single-flight), `authErrorMessages` (code→Arabic, no
leak, field errors), `authNavigation` (unauth→auth, auth→app, bootstrapping
no-op, no bounce), `appMode` (approved→available, pending/rejected/not-applied
→locked + reason), `LoginScreen` (render, validation error, mapped backend
error, trimmed submit). **85 tests / 15 suites, all passing.**

## 36. Phase 2 known limitations

- Veterinarian **application submission** is not built — it lives under
  `/veterinarians/*`, outside the Phase 2 auth contract (§13). Status is
  read-only for now.
- No "forgot password" / email verification / profile editing / password
  change / account deletion — none are in the current backend auth contract.
- Access-token refresh is reactive (on `401`), not pre-emptive
  (`isAccessTokenNearExpiry` exists but isn't yet used to refresh ahead of time).
- Offline detection is still a `uiStore` flag (no `netinfo`); auth error copy
  distinguishes network failures, which covers the practical case.

---

# Mobile Phase 3 — Pet Owner Home & Pet Management

The first business functionality: the Pet Owner Home and full Pet (backend
"Animal") CRUD. Still **no** medical records, vaccinations, adoption, mating,
lost pets, chat, consultations, jobs, organizations, or admin CRUD.

## 37. Feature modules added

```
src/features/pets/
  api/petsApi.ts        /animals/* wrappers (list · get · create · update · deactivate)
  api/queryKeys.ts      petKeys.{all,lists,list(filter),details,detail(id)}
  hooks/
    usePets.ts          useInfiniteQuery — owner-scoped list + paging + pull-to-refresh
    usePet.ts           useQuery — one pet; a 404 is NOT retried
    usePetMutations.ts  useCreatePet · useUpdatePet · useDeactivatePet
  validation/schemas.ts buildPetSchema(t) + toCreateInput() — mirrors the backend exactly
  constants.ts          species→icon map, Select option lists, petAge()
  components/            PetCard · PetCardSkeleton · PetImage · PetForm ·
                         PetFormLayout · FutureSectionRow  (all presentational)
  screens/              MyPetsScreen · PetDetailsScreen · AddPetScreen · EditPetScreen
  types/index.ts        Pet DTO + PET_SPECIES / PET_SEXES / PET_STATUSES (exact backend values)

src/features/home/
  screens/HomeScreen.tsx        the real Pet Owner Home
  components/                    HomeSectionHeader · ComingSoonTile
```

`FormField` (RHF ↔ `Input` glue) was promoted from `features/auth/components` to
`@/components/forms` and is now shared; a `@deprecated` re-export keeps the old
path working. `ErrorState` was localised (Arabic, via the `errors` i18n
namespace + `apiErrorMessage`).

## 38. Pet API integration

Verified against `server/src/modules/animals` (`animal.routes.ts`,
`animal.schemas.ts`, `animal.types.ts`, `animal.constants.ts`) + OpenAPI
`phase4` — nothing assumed.

| Method                                             | Endpoint | Notes                                                                                                                                                                            |
| -------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /animals?page&pageSize&status&species&search` | list     | **Owner-scoped by the backend** — only ever the caller's own animals. `{ data: Animal[], meta: PageMeta }`. `usePets` sends `status=ACTIVE` so "My Pets" hides archived animals. |
| `GET /animals/:id`                                 | detail   | Owner-or-admin. A pet owned by someone else comes back as **404** (ownership is hidden, never 403).                                                                              |
| `POST /animals`                                    | create   | 201. Body: `name, species` (required) + `breed?, sex?, dateOfBirth?, notes?`. **No `ownerId`** — the caller becomes the owner server-side.                                       |
| `PATCH /animals/:id`                               | update   | Profile fields only. Deactivated animal → 409 (`ANIMAL_NOT_ACTIVE`).                                                                                                             |
| `DELETE /animals/:id`                              | archive  | Soft — returns the pet with `status: DEACTIVATED`. Idempotent.                                                                                                                   |

`Animal` DTO (all the mobile model has): `id, name, species, breed|null, sex,
dateOfBirth|null (YYYY-MM-DD), notes|null, status, createdBy,
currentOwnerUserId|null, createdAt, updatedAt`. **No image field yet** — see §41.

Controlled values (used directly, no second enum — §12):
species `DOG CAT BIRD RABBIT REPTILE FISH HORSE OTHER`, sex `MALE FEMALE UNKNOWN`,
status `ACTIVE DEACTIVATED`. `breed` is a free-form string (no lookup API).

## 39. Query strategy

- **`usePets`** — `useInfiniteQuery`, key `petKeys.list({ pageSize, status,
species, search })`. `getNextPageParam` reads `meta.page < meta.totalPages`.
  The screen flattens `data.pages`, drives `onEndReached → fetchNextPage`, and
  pull-to-refresh → `refetch`. `staleTime` 15 s.
- **`usePet`** — `useQuery`, key `petKeys.detail(id)`, disabled without an id,
  `retry` predicate skips 404s.
- **Mutations** invalidate the **narrowest** prefix (§14):
  create → `petKeys.lists()`; update / deactivate → `setQueryData` on
  `petKeys.detail(id)` + invalidate `petKeys.lists()`. No global invalidation.
- Add / Edit screens hold a `useRef` in-flight flag for a **synchronous**
  double-submit guard (the button also shows `isPending`).

## 40. Pet ownership assumptions (§9, §10, §25)

- **The backend is the sole authority.** The app never does a client-side
  ownership check as a gate — it consumes the response and handles `403` / `404`
  with a friendly state.
- Create/update payloads contain **only profile fields** — never `ownerId`,
  `userId`, `currentOwnerUserId`, `status`, or `createdBy`. Ownership is
  backend-derived from the JWT.
- Pet Details shows an "أنت المالك" badge only when
  `pet.currentOwnerUserId === session user id`; other users' ids are never
  surfaced.
- **Not implemented** (later phases): ownership transfer, adoption, mating, lost
  pet. The backend `POST /animals/:id/ownership/transfer` and
  `GET .../ownership/history` endpoints are deliberately not wired.

## 41. Pet images

The backend has no image field on an animal. `PetImage` renders a soft-green
species placeholder today and takes a `uri` prop, so a future upload phase is a
prop change, not a rewrite. **No fake upload** was built (§11).

## 42. Navigation routes (§15)

```
app/(app)/
  (tabs)/index.tsx     → HomeScreen           (Pet Owner Home)
  (tabs)/animals.tsx   → MyPetsScreen         (the Animals tab IS "My Pets")
  pets/
    _layout.tsx        Stack
    index.tsx          → MyPetsScreen         (deep-link entry `/pets`)
    create.tsx         → AddPetScreen
    [petId]/index.tsx  → PetDetailsScreen
    [petId]/edit.tsx   → EditPetScreen
```

`Routes` gained `pets`, `petsCreate`, `petDetail(id)`, `petEdit(id)`. Flows:
Home → My Pets → Pet Details → Edit; My Pets → Add Pet. All screens are RTL,
use the Phase 1 design system, and localise every string via the new `pets`
i18n namespace (ar + en).

## 43. Mode compatibility (§16–§17)

Pet Owner screens are reachable in **both** app modes — pet data is owner-scoped
by the backend regardless of the user's role, so a veterinarian in Pet Owner
mode uses Home / My Pets / Details / Add exactly like anyone else. The Phase 2
mode architecture is untouched; no veterinarian dashboard was added.

## 44. Tests (Phase 3)

New suites (`src/features/pets/__tests__/`, + `src/test-utils/routerMock.ts` for
a shared Expo Router mock):

| Suite             | Covers                                                                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `petsApi`         | every endpoint: URL + params/body shape; missing-`meta` tolerance                                                                               |
| `queryKeys`       | key nesting + prefix relationships                                                                                                              |
| `petValidation`   | schema mirrors backend (name/species required, DOB format + not-future, optional blanks, notes ≤2000); `toCreateInput` drops blanks             |
| `usePets`         | list success / empty / API error / `fetchNextPage` appends; `usePet` success / disabled-without-id / no-retry-on-404                            |
| `usePetMutations` | create → seeds detail cache + invalidates lists only; update; deactivate; error propagates                                                      |
| `PetCard`         | renders name/species/breed, press, archived badge, breed fallback                                                                               |
| `MyPetsScreen`    | empty state + CTA; error + retry; list + count + card→detail nav                                                                                |
| `AddPetScreen`    | validation blocks the API call; success → create + navigate; backend 422 → mapped Arabic (raw hidden); duplicate-submit guard (3 taps → 1 call) |
| `petNavigation`   | Home→My Pets, My Pets→Details, My Pets→Add, Details→Edit                                                                                        |

**128 tests / 24 suites, all passing.**

## 45. Phase 3 known limitations

- **No pet image upload** — the backend exposes no animal-image field/endpoint
  yet. `PetImage` is placeholder-only but upload-ready.
- `dateOfBirth` is a plain `YYYY-MM-DD` text input (no date picker) and the age
  string uses a simple "{{n}} سنة / شهر" form (Arabic number grammar is not fully
  applied).
- Pet-count label is a simple `{{count}} حيوان` (no Arabic dual/plural forms).
- `notes` uses the standard single-line-styled `Input` with `multiline` — it
  works but isn't a purpose-built textarea.
- Owner display is limited to a "you're the owner" badge — the backend returns
  only `currentOwnerUserId` (a uuid), and exposing other users' identities is
  out of scope.

---

# Mobile Phase 4 — Veterinarian Mode & Organization Management

## 46. Scope

Made **Veterinarian Mode** a real experience and built organization management
on top of the existing backend `/organizations/*` and `/veterinarians/*` APIs:

```
Authenticated user
  → Veterinarian Mode            (client-only activeMode, gated on APPROVED vet / admin)
    → Veterinarian Home          (features/veterinarian)
      → My Organizations         (features/organizations)
        → Organization Details
          → Members  → Add member
          → Supervisors → Assign / edit permissions
          → Edit organization profile
```

Pet Owner Mode is **unchanged** — the Home tab renders `ModeAwareHomeScreen`,
which picks the Pet Owner Home or the Veterinarian Home from `useAppMode()`.
Switching to Veterinarian Mode never removes a pet feature. The
admin/moderator Management Centre entry point (`features/management`) is
untouched.

**Not built** (later phases, by instruction): medical records, vaccinations,
poultry, products/store, chat, consultations, jobs, content, adoption, mating,
lost pets, notifications, the full admin dashboard, org approval/rejection
(admin-only), a user directory/search, org ownership transfer.

## 47. New feature modules

### `src/features/veterinarian/`

| Piece                                 | Purpose                                                                                                                                                           |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api/veterinarianApi.ts`              | `apply({ note? })` → `POST /veterinarians/apply`; `myStatus()` → `GET /veterinarians/me/status`                                                                   |
| `hooks/useVeterinarianApplication.ts` | `useApplyForVeterinarian` (mutation, refreshes `/auth/me` on success); `useVeterinarianApplicationStatus` (query — carries the rejection reason `/auth/me` omits) |
| `screens/VeterinarianHomeScreen.tsx`  | greeting/identity · vet approval status card · org-management entry (approved only) · switch-to-owner · account access                                            |
| `screens/VeterinarianApplyScreen.tsx` | optional-note form; blocks when already `PENDING` / `APPROVED`; backend decides eligibility                                                                       |

### `src/features/organizations/`

| Piece                     | Purpose                                                                                                                                                                      |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types/index.ts`          | enums + DTOs mirroring `organization.types.ts` / `organization-rbac.constants.ts` verbatim                                                                                   |
| `api/organizationsApi.ts` | 1:1 wrappers for all 13 `/organizations/*` routes (create, listMine, get, update, leave, members ×4, supervisors ×4)                                                         |
| `api/queryKeys.ts`        | `orgKeys` — `lists()` / `detail(id)` / `members(id)` / `supervisors(id)`; invalidate by narrowest prefix                                                                     |
| `constants.ts`            | type→icon, status/role→tone, `ORG_PERMISSION_GROUPS` (grouped subset of the backend catalogue), `orgCapabilities()`                                                          |
| `validation/schemas.ts`   | `buildCreateOrganizationSchema` / `buildEditOrganizationSchema` / `buildUserIdSchema` — same lengths/enums as backend                                                        |
| `hooks/`                  | `useOrganizations` (infinite), `useOrganization`, `useOrganizationMembers` (infinite), `useOrganizationSupervisors` (plain), + 9 mutation hooks                              |
| `components/`             | `OrganizationCard` (+ skeleton), `OrganizationTypeBadge`, `OrganizationStatusBadge`, `MemberRow`, `SupervisorRow`, `PermissionSelector`, `OrganizationForm`, `OrgFormLayout` |
| `screens/`                | `MyOrganizations`, `CreateOrganization`, `OrganizationDetails`, `OrganizationEdit`, `OrganizationMembers`, `AddMember`, `OrganizationSupervisors`, `AssignSupervisor`        |

## 48. Navigation routes (§18)

```
app/(app)/
  (tabs)/index.tsx                                   → ModeAwareHomeScreen (owner | vet)
  veterinarian/
    _layout.tsx                                      Stack
    index.tsx                                        → VeterinarianHomeScreen  (deep-link `/veterinarian`)
    apply.tsx                                        → VeterinarianApplyScreen
  organizations/
    _layout.tsx                                      Stack
    index.tsx                                        → MyOrganizationsScreen
    create.tsx                                       → CreateOrganizationScreen
    [organizationId]/index.tsx                       → OrganizationDetailsScreen
    [organizationId]/edit.tsx                        → OrganizationEditScreen
    [organizationId]/members/index.tsx               → OrganizationMembersScreen
    [organizationId]/members/add.tsx                 → AddMemberScreen
    [organizationId]/supervisors/index.tsx           → OrganizationSupervisorsScreen
    [organizationId]/supervisors/assign.tsx          → AssignSupervisorScreen  (`?membershipId=` → edit mode)
```

`Routes` gained `veterinarian`, `veterinarianApply`, `organizations`,
`organizationsCreate`, `organizationDetail(id)`, `organizationEdit(id)`,
`organizationMembers(id)`, `organizationMembersAdd(id)`,
`organizationSupervisors(id)`, `organizationSupervisorsAssign(id)`. Registered in
`app/(app)/_layout.tsx` (`veterinarian`, `organizations` stacks).

## 49. Authorization model — client vs. backend

The backend is the **only** authorization layer. The mobile client mirrors
_nothing_ about who may do what except to decide which buttons to render:

- **Vet approval** — `useVeterinarianStatus()` (from `/auth/me`) +
  `useAppMode()` gate Veterinarian Mode to APPROVED vets / admins. `PENDING` /
  `REJECTED` / `NOT_APPLIED` users see a clear status and the apply path; Pet
  Owner Mode keeps working. Creating a CLINIC / FARM is additionally gated in
  the form for non-approved vets — but the backend
  (`OrganizationPolicy.assertCanCreate` → `VETERINARIAN_APPROVAL_REQUIRED`) is
  what actually enforces it.
- **Org role** — `GET /organizations/:id` returns `myRole` (`OWNER` /
  `VETERINARIAN` / `SUPERVISOR` / `STAFF` / `null` for a non-member admin) but
  **not** the resolved permission set. `orgCapabilities(myRole, isAdmin)`
  mirrors the seeded `ORG_ROLE_PERMISSIONS`: OWNER/ADMIN → everything;
  VETERINARIAN → read members; STAFF → read profile only; SUPERVISOR → shown a
  **read-only** view (their real permissions are owner-selected and unknown to
  the client). Any action a hidden button would have triggered still 403s
  server-side, and `apiErrorMessage()` turns that into a safe Arabic message.
- **Client-controlled state is never trusted.** `organizationId` comes from the
  route; `userId` for add-member / assign-supervisor is typed by the user and
  validated only as a UUID — the backend checks it resolves to an ACTIVE
  account / APPROVED vet, is not the owner, etc. Permissions are held in form
  state and sent as an array; editing that state cannot grant anything.

## 50. Permission catalogue (§20)

`ORG_PERMISSION_GROUPS` is a **presentation grouping of the backend
`ORG_PERMISSION_KEYS`** — the 11 organization-management keys copied verbatim
(`organization.*`, `member.*`, `supervisor.*`, `organization.veterinarian.*`),
split into Organization / Members / Supervisors / Veterinarians groups with
Arabic labels + hints. The ~19 domain permissions in the same backend catalogue
(`medical_record.*`, `vaccination.*`, `farm.poultry.*`, `product.*`,
`animal.veterinary.access.*`) belong to Phases 5 / 6 / 10 and are deliberately
not surfaced yet; the backend still validates every submitted key against the
full catalogue. No second catalogue is hardcoded.

## 51. Organization / member / supervisor rules honoured

- New organizations are created `PENDING`; the client never sends
  `ownerUserId`, `status`, or any approval field. The details screen shows the
  PENDING / REJECTED (+ reason) state.
- `type` is create-only — never sent on `PATCH` (edit sends `name` /
  `description`, `description: null` to clear).
- The **owner membership** row is non-interactive in the members screen
  (no role/status/remove), matching the backend `ForbiddenError`.
- **Leaving**: offered to non-owners only; the owner's "leave" is hidden
  (backend `ConflictError`).
- Removing an organization supervisor is described in the UI as removing their
  _organization_ permissions — their **global** `VETERINARIAN` role is
  untouched (and the client has no endpoint to touch it).
- FARM `details.joinCode` is shown read-only on the details screen when present.

## 52. i18n

Two new namespaces registered in `src/i18n/index.ts` and mirrored in `ar` + `en`
(`en` is typed against `ar`, so a missing key fails `tsc`):

- **`veterinarian`** — vet home, approval status, apply/re-apply flow.
- **`organizations`** — types, statuses, roles, list, forms, detail, members,
  supervisors, permission groups + per-key labels/hints.

Counts use a single `{{count}} …` form (Arabic dual/plural grammar not applied),
consistent with the Phase 3 precedent.

## 53. Tests (Phase 4)

New suites under `src/features/{organizations,veterinarian,home}/__tests__/`:

| Suite                       | Covers                                                                                                                                   |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `organizationsApi`          | all 13 endpoint wrappers: URL + params/body shape; no `ownerUserId`/`status` in create body                                              |
| `orgCapabilities`           | OWNER / ADMIN / VETERINARIAN / SUPERVISOR / STAFF gates; mobile catalogue = backend org-management subset                                |
| `organizationMutations`     | create seeds detail as OWNER + invalidates lists only; each member/supervisor mutation calls the right API; 403 propagates as `ApiError` |
| `MyOrganizationsScreen`     | list · empty + CTA · safe error (raw hidden) · card→detail nav · header→create nav                                                       |
| `OrganizationDetailsScreen` | OWNER sees manage entries; STAFF sees none; 403 → "not available" (no auth detail); PENDING notice; nav to members                       |
| `OrganizationMembersScreen` | lists members; owner row locked; add CTA nav; remove → confirm → `DELETE`                                                                |
| `AssignSupervisorScreen`    | create sends `{ userId, permissions }` from checked keys; invalid UUID blocked client-side; edit prefills + `PATCH`s                     |
| `organizationNavigation`    | route builders are deep-link-safe; Vet Home→Organizations; Details→Members/Supervisors                                                   |
| `veterinarianApply`         | `apply` → `POST /veterinarians/apply`; hook refreshes `/auth/me`; screen submits; already-approved shows blocked state                   |
| `VeterinarianHomeScreen`    | APPROVED → org section + count; PENDING → hint, no org section; REJECTED → reason + re-apply; NOT_APPLIED → apply CTA                    |
| `ModeAwareHomeScreen`       | owner mode → Pet Owner Home; vet mode → Vet Home; non-approved vet mode → falls back to Pet Owner Home                                   |

**186 tests / 35 suites, all passing** (128 / 24 before Phase 4). Full gate:
`tsc` clean · `eslint` clean · `prettier` clean · `expo-doctor` 18/18 · web
export OK.

## 54. Phase 4 known limitations

- **No `myPermissions` from the backend** on `GET /organizations/:id` — the
  client derives coarse gates from `myRole` (§49). A `SUPERVISOR` with real
  management permissions still sees a read-only UI and must rely on the backend
  accepting their action; surfacing their exact permissions needs a backend
  change (add `myPermissions` to the detail response).
- **No user directory / search** — add-member and assign-supervisor take a raw
  user UUID. A picker needs a backend user-lookup endpoint that does not exist.
- **No org approval / rejection** in the app — that is an admin-only
  `/admin/organizations/*` flow, out of scope. The client only _displays_
  PENDING / REJECTED.
- **Supervisor edit** prefill filters the stored permissions down to the 11
  management keys the selector shows; any domain permission a supervisor already
  holds is preserved server-side only if re-sent — the mobile edit screen would
  drop it. Domain-permission editing lands with its feature phase.
- Member list filters (`status`, `roleKey`) are supported by the hook but not
  yet exposed as UI controls.
- Counts use a simple `{{count}}` form (no Arabic dual/plural).

---

# Mobile Phase 5 — Organization Animal Management

## 55. Scope

Organization-side animal management: the animals a **CLINIC** organization has
been granted **veterinary access** to. Built entirely on the existing backend
`server/src/modules/veterinary-care` routes (mounted under
`/organizations/:organizationId/...`):

```
Veterinarian Mode → My Organizations → Organization Details
  → Animals (list, filter, paginate, refresh)
    → Animal Details (overview · owner block · future-module placeholders · revoke)
  → Link an animal (grant veterinary access by animal id)

Pet Owner Mode → My Pets → Pet Details   (Phase 3 — untouched)
```

The **organization ↔ animal relationship is `animal_clinic_access`** — a
revocable veterinary-access GRANT. It is **not ownership**: the animal stays
owned by its Pet Owner, whose experience (`features/pets`) is unchanged. No
ownership transfer anywhere in this flow.

**Not built** (later phases, by instruction): medical records, vaccinations,
treatments, appointments, chat, realtime, notifications, R2 upload,
consultations, jobs, adoption/mating/lost, products, content, subscriptions,
admin/supervisor dashboards, and all Farm poultry/cattle/sheep operations. The
Animal Details screen only carries **disabled placeholders** for the future
medical modules.

## 56. New feature module — `src/features/animals/`

| Piece                                     | Purpose                                                                                                                                              |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types/index.ts`                          | `OrganizationAnimalGrant` (list item), `ClinicAnimalAccess`, `ClinicAccessStatus`, `GrantAnimalAccessInput` — mirror `veterinary-care.types.ts`      |
| `constants.ts`                            | `VETERINARY_ANIMAL_ORG_TYPES` (`['CLINIC']`, from backend `VETERINARY_ORG_TYPES`), `organizationManagesAnimals()`, species→icon, status tones        |
| `api/organizationAnimalsApi.ts`           | `list` / `grant` / `revoke` — 1:1 with `GET`/`POST`/`DELETE /organizations/:id/animal-access[/:animalId]`                                            |
| `api/queryKeys.ts`                        | `orgAnimalKeys` — `forOrg(id)` / `list(id)` / `detail(id, animalId)`                                                                                 |
| `hooks/useOrganizationAnimals.ts`         | infinite list (`animal.veterinary.access.read`)                                                                                                      |
| `hooks/useOrganizationAnimal.ts`          | one grant by `animalId` — **cache-first, then pages the list** (no detail endpoint exists — §58)                                                     |
| `hooks/useOrganizationAnimalMutations.ts` | `useGrantOrganizationAnimalAccess`, `useRevokeOrganizationAnimalAccess` (`animal.veterinary.access.manage`)                                          |
| `validation/schemas.ts`                   | `buildGrantAnimalAccessSchema` (animalId uuid) + `grantAnimalAccessErrorMessage` (maps `ORGANIZATION_TYPE_NOT_SUPPORTED` / 404 / 409 to safe Arabic) |
| `components/`                             | `AnimalCard` (+ skeleton) — presentation-only, renders only backend-returned fields                                                                  |
| `screens/`                                | `OrganizationAnimalsScreen`, `OrganizationAnimalDetailScreen`, `GrantAnimalAccessScreen`                                                             |

## 57. API endpoints integrated

| Mobile call                                   | Backend route                                        | Org permission                    |
| --------------------------------------------- | ---------------------------------------------------- | --------------------------------- |
| `organizationAnimalsApi.list(id,p,ps)`        | `GET /organizations/:id/animal-access?page&pageSize` | `animal.veterinary.access.read`   |
| `organizationAnimalsApi.grant(id,{animalId})` | `POST /organizations/:id/animal-access`              | `animal.veterinary.access.manage` |
| `organizationAnimalsApi.revoke(id,animalId)`  | `DELETE /organizations/:id/animal-access/:animalId`  | `animal.veterinary.access.manage` |

The list item is `ClinicAnimalAccess` + a small joined summary
`animal: { name, species, status }` — the **only** animal data an organization
receives. No breed / sex / date-of-birth / notes / image, and **no owner
identity**.

## 58. Query strategy

- **List**: `useInfiniteQuery` keyed `orgAnimalKeys.list(orgId)`, `getNextPageParam`
  from `meta.page < meta.totalPages`. Pull-to-refresh = `refetch()`. Skeletons on
  first load, `ErrorState` + retry on failure, `EmptyState` when empty.
- **Detail**: the backend has **no** organization-scoped animal-detail endpoint,
  so `useOrganizationAnimal` reads the row from the list — first the infinite
  cache, then (cold deep-link) by paging `animal-access` up to 10 pages of 50.
  `null` ⇒ a plain "not linked to this organization" state; a `403` ⇒ "not
  available". No cross-user `GET /animals/:id` is attempted (it 404s for a
  clinic).
- **Mutations**: `grant` / `revoke` invalidate `orgAnimalKeys.forOrg(orgId)`
  (list + every detail) — narrow prefix, no global invalidation. `revoke` also
  `removeQueries` the specific detail.
- **Search**: there is no server-side org-animal search (the list endpoint takes
  only `page`/`pageSize`). `OrganizationAnimalsScreen` has a **debounced local
  filter** (`useDebouncedValue`) that narrows the already-loaded rows by name —
  a convenience over _this clinic's_ animals, explicitly **not** a database
  search, and disabled paging while a filter is active. See §59 for the missing
  backend capability.

## 59. Navigation (§24)

```
app/(app)/organizations/[organizationId]/animals/
  index.tsx        → OrganizationAnimalsScreen        (deep-link `/organizations/:id/animals`)
  grant.tsx        → GrantAnimalAccessScreen          (static segment wins over [animalId])
  [animalId].tsx   → OrganizationAnimalDetailScreen
```

`Routes` gained `organizationAnimals(id)`, `organizationAnimalsGrant(id)`,
`organizationAnimalDetail(id, animalId)`. No new Expo Router stack — the
existing `organizations` stack (`app/(app)/organizations/_layout.tsx`) already
covers the nested folder. The **Animals** entry is added to
`OrganizationDetailsScreen`'s manage section, shown only when
`organizationManagesAnimals(org.type) && caps.canViewOrganizationAnimals` — the
one place the CLINIC-only rule lives (§18); Farm-specific animal handling later
extends `VETERINARY_ANIMAL_ORG_TYPES` + that helper, not scattered `if`s.

## 60. Authorization & security review

- **Backend is the only authority.** `orgCapabilities(myRole, isAdmin)` gained
  `canViewOrganizationAnimals` (privileged / VETERINARIAN / SUPERVISOR — the
  VETERINARIAN org role is seeded `animal.veterinary.access.read`) and
  `canManageOrganizationAnimalAccess` (privileged only — grant/revoke need
  `.manage`, seeded to OWNER-override / empowered SUPERVISOR, **not** the plain
  VETERINARIAN role). These only hide buttons; every list/grant/revoke is
  re-authorised server-side and a `401/403/404/409/422` is mapped to a safe
  Arabic message (`apiErrorMessage` / `grantAnimalAccessErrorMessage`), never
  raw text.
- **Organization scope** — `organizationId` always comes from the route param
  and is passed as a path segment (never a body field), matching
  `withOrganization` + `authorizeOrg`. Cross-organization access is left to the
  backend (`403`/`404`) — the client never assumes "vet ⇒ sees all animals".
- **Client-controlled state is not trusted** — the grant `animalId` is typed by
  the user and validated only as a UUID; the backend checks the animal exists,
  the org is a CLINIC, and there is no existing ACTIVE grant. `grantedByUserId`,
  `ownerId`, roles and permissions from responses are display-only.
- **Owner privacy (§12)** — the backend discloses no owner information to an
  organization, so `OrganizationAnimalDetailScreen` renders an explicit
  "owner information not available" block instead of inventing fields.

## 61. Future medical-module extension points (§14)

`OrganizationAnimalDetailScreen` is laid out as **Overview → (future modules) →
management**. The future section renders `FutureSectionRow` placeholders
(reused from `features/pets`) for **Medical Records / Vaccinations / Treatments /
Appointments** — no press target, no data, no hooks. A later phase adds each as
its own `features/<name>/` module + a real row here, without touching the
overview or the access/revoke logic. The medical routes already exist on the
backend (`/organizations/:id/animals/:animalId/medical-records|vaccinations|
medical-history`, gated by `withVeterinaryAnimalAccess`) and are deliberately
**not** wired in this phase.

## 62. Tests (Phase 5)

New suites under `src/features/animals/__tests__/` (+ the Pet Owner coexistence
check):

| Suite                            | Covers                                                                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `organizationAnimalsApi`         | `list` / `grant` / `revoke` — exact URL + params/body; missing-`meta` tolerance; `{ animalId }`-only body                                                     |
| `constants`                      | `organizationManagesAnimals` = CLINIC only; species-icon fallback; the two new `orgCapabilities` gates                                                        |
| `useOrganizationAnimals`         | pages flatten + `fetchNextPage` appends; disabled without org id                                                                                              |
| `useOrganizationAnimal`          | cache-hit returns without network; cold lookup pages the list then returns `null`; no retry on 403                                                            |
| `organizationAnimalMutations`    | grant posts `{ animalId }` + invalidates `forOrg`; revoke deletes by animalId + drops the detail; 403 propagates                                              |
| `OrganizationAnimalsScreen`      | list scoped to route `organizationId`; empty / safe-error / **403 → forbidden message**; local filter narrows + no-match; card→detail nav; pull-to-refresh    |
| `OrganizationAnimalDetailScreen` | overview + owner-not-shared block + placeholders (no medical logic); not-linked state; **403 → "not available"** (no leak); OWNER revoke → confirm → `DELETE` |
| `GrantAnimalAccessScreen`        | invalid UUID blocked client-side; valid id POSTs to the route org then opens the animal; 409 / `ORGANIZATION_TYPE_NOT_SUPPORTED` → mapped Arabic (raw hidden) |
| `animalsNavigation`              | route builders are deep-link-safe; CLINIC detail shows Animals entry + navigates; non-CLINIC hides it; **Pet Owner "My Pets" still renders**                  |

**221 tests / 43 suites, all passing** (186 / 35 before Phase 5). Full gate:
`tsc` clean · `eslint` clean · `prettier` clean · `expo-doctor` 18/18 · web
export OK.

## 63. Phase 5 known limitations / backend dependencies

- **No organization-scoped animal SEARCH.** `GET /organizations/:id/animal-access`
  accepts only `page`/`pageSize`. `GET /animals?search=` is Pet-Owner-self-scoped
  (the caller's own animals by name) and unusable here. The mobile filter is
  local-only. _Backend dependency:_ a `search` / `name` / `identifier` param on
  the `animal-access` list, or a clinic animal-search endpoint.
- **No animal lookup by identifier for veterinarians.** To grant access the vet
  must already know the animal's **UUID** — `GET /animals/:id` is owner-or-admin
  only (a clinic with a grant gets `404`). _Backend dependency:_ a lookup that
  resolves a public/owner-shared animal identifier to an id for the "link an
  animal" flow.
- **No organization-scoped animal DETAIL endpoint.** The detail screen is built
  from the `animal-access` list row (`name`, `species`, `status` only).
  _Backend dependency:_ `GET /organizations/:id/animals/:animalId` returning the
  clinic-visible animal projection.
- **No owner information exposed** to organizations in Phase 5 — the detail
  screen states this explicitly rather than inventing fields.
- **No animal image field** on the backend (as in Phase 3) — `AnimalCard` uses a
  species-icon tile.
- **No "update animal from org context"** — `PATCH /animals/:id` is
  owner-or-admin only; not surfaced.
- Grant/revoke gating uses the Phase 4 `myRole` heuristic (no `myPermissions`
  from `GET /organizations/:id`); a `SUPERVISOR` empowered with
  `animal.veterinary.access.manage` sees a read-only animals view and relies on
  the backend accepting the action.
- The animal-access list has no `status` / `species` filter params, so none are
  offered as UI controls.
- Counts use a simple `{{count}}` form (no Arabic dual/plural), per the Phase 3/4
  precedent.

## 64. Recommended Mobile Phase 6

**Clinic Veterinary Care — Medical Records & Vaccinations.** Wire the medical
routes that already exist on the backend
(`/organizations/:id/animals/:animalId/medical-records`, `.../vaccinations`,
`.../medical-history`), replacing the Animal Details placeholders with real
`features/medical-records` + `features/vaccinations` modules (list / create /
edit / delete, `medical_record.*` + `vaccination.*` org permissions, animal must
be ACTIVE). Also add the **owner-facing** read views
(`GET /animals/:animalId/medical-records|vaccinations|medical-history`) to the
Phase 3 Pet Details screen so a Pet Owner can see their animal's history. Before
starting, raise the §63 backend dependencies (org animal search + detail
endpoint) so the "link an animal" flow can move off raw UUIDs.

---

# Mobile Phase 6 — Medical Records & Vaccinations

## 65. Scope

The veterinary medical-record & vaccination experience, built on the backend
`server/src/modules/veterinary-care` routes that Phase 5 deliberately left
unwired. Two access paths, **same DTOs**:

- **CLINIC** — organization-scoped, **full CRUD**. Requires `medical_record.*` /
  `vaccination.*` org permissions (seeded to the VETERINARIAN org role) **and**
  an ACTIVE veterinary-access grant for the animal. A clinic reads the animal's
  **complete** history (every clinic's entries) but may **edit / delete only
  entries it recorded** (`organizationId` match — the backend hides the rest
  behind a 404).
- **OWNER** — animal-scoped, **read-only**. The animal's current owner (or
  ADMIN) reads the complete history via `/animals/:animalId/...`. Owners never
  create / update / delete; no approval / confirmation dialog exists (§2).

```
Vet Mode → Organizations → Organization Details → Animals → Animal Details
   ├── Medical Records → list · detail · create · edit · delete
   └── Vaccinations    → list · detail · create · edit · delete

Pet Owner Mode → My Pets → Pet Details
   ├── Medical Records → list · detail          (read-only)
   └── Vaccinations    → list · detail          (read-only)
```

The Animal Details placeholders from Phase 5 are now live nav rows for Medical
Records + Vaccinations (gated on `canViewOrganizationMedical`); **Treatments**
and **Appointments** stay `FutureSectionRow` placeholders. Nothing outside
records / vaccinations was built — no attachments, chat, realtime,
notifications, appointments, treatments (§38).

## 66. New feature module — `src/features/medical/`

| Piece                      | Purpose                                                                                                                                                                                                        |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types/index.ts`           | `MedicalRecord`, `Vaccination`, `MedicalRecordInput`, `VaccinationInput`, `MedicalScope` — mirror `veterinary-care.types.ts`                                                                                   |
| `api/medicalRecordsApi.ts` | `listForClinic` / `getForClinic` / `create` / `update` / `remove` + `listForOwner` / `getForOwner`                                                                                                             |
| `api/vaccinationsApi.ts`   | same shape for vaccinations                                                                                                                                                                                    |
| `api/queryKeys.ts`         | `medicalKeys` — `records(animalId)` / `record(animalId, id)` / `vaccinations(animalId)` / `vaccination(animalId, id)`; list keys carry a `scope` tag (`clinic:<orgId>` / `owner`)                              |
| `hooks/`                   | `useMedicalRecords` / `useMedicalRecord` / `useVaccinations` / `useVaccination` (scope-aware queries) + 6 CLINIC-only mutation hooks                                                                           |
| `validation/schemas.ts`    | `buildMedicalRecordSchema` (≥1 of reason/diagnosis/treatment/notes; `visitDate` ≤ today) · `buildVaccinationSchema` (name + `administeredOn` required; `nextDueOn` ≥ `administeredOn`) · `medicalErrorMessage` |
| `constants.ts`             | `recordedByThisClinic()` (organizationId match) · `displayDateOnly()` (raw `YYYY-MM-DD`, never through `Date` — §24)                                                                                           |
| `components/`              | `MedicalRecordCard` / `VaccinationCard` (+ skeleton) — presentation-only; `MedicalRecordForm` / `VaccinationForm` (RHF + zod)                                                                                  |
| `screens/`                 | 6 scope-aware screens + `useMedicalRouteScope` (resolves `animalId` from `animalId`\|`petId`, CLINIC context from `organizationId`)                                                                            |

## 67. API endpoints integrated

| Mobile call                                        | Backend route                                                             | Auth                                                                                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `medicalRecordsApi.listForClinic` / `getForClinic` | `GET /organizations/:orgId/animals/:animalId/medical-records[/:recordId]` | `medical_record.read` + veterinary access                                                                                    |
| `medicalRecordsApi.create` / `update` / `remove`   | `POST` / `PATCH /:recordId` / `DELETE /:recordId`                         | `medical_record.{create,update,delete}` + access; animal must be ACTIVE for create/update; own-clinic only for update/delete |
| `medicalRecordsApi.listForOwner` / `getForOwner`   | `GET /animals/:animalId/medical-records[/:recordId]`                      | current owner or ADMIN (read-only)                                                                                           |
| `vaccinationsApi.*`                                | same shape at `.../vaccinations`                                          | `vaccination.*` + access                                                                                                     |

Request bodies carry **only** the form fields. `organizationId` / `animalId`
come from the route; `recordedByUserId` is set by the backend from the JWT —
never sent, never editable (§19).

## 68. Query & mutation architecture (§21, §32, §33)

- **Reads** — `useInfiniteQuery` for the lists (`page`/`pageSize`),
  `useQuery` for a single record/vaccination (a real detail endpoint exists —
  no list-scan workaround). Both branch clinic vs owner endpoint on the
  presence of `organizationId`. Skeleton on first load, `ErrorState` + retry on
  failure, `EmptyState` when empty. No `dueFrom` filter UI in this phase.
- **Mutations** — CLINIC only. **No optimistic updates** — mutate → server
  success → invalidate:
  - create record → `medicalKeys.records(animalId)`
  - update record → `medicalKeys.record(animalId, id)` + `medicalKeys.records(animalId)`
  - delete record → `removeQueries(medicalKeys.record(animalId, id))` + invalidate `medicalKeys.records(animalId)`
  - equivalent rules for vaccinations under `medicalKeys.vaccinations(animalId)`.
    The `records(animalId)` / `vaccinations(animalId)` prefixes cover both the
    clinic and owner list keys, so a clinic edit refreshes any open owner view too.
- **Duplicate-submit guard** — `useRef(false)` set synchronously in the form
  screens, cleared in `onSettled` (the Phase 3 pattern).

## 69. Navigation (§34)

```
app/(app)/organizations/[organizationId]/animals/[animalId]/
  index.tsx                              (Phase 5 — [animalId].tsx migrated to a folder)
  medical-records/index.tsx              → MedicalRecordsScreen        (CLINIC)
  medical-records/create.tsx             → MedicalRecordFormScreen
  medical-records/[recordId]/index.tsx   → MedicalRecordDetailScreen
  medical-records/[recordId]/edit.tsx    → MedicalRecordFormScreen
  vaccinations/… (index · create · [vaccinationId]/index · [vaccinationId]/edit)

app/(app)/pets/[petId]/
  medical-records/index.tsx              → MedicalRecordsScreen        (OWNER, read-only)
  medical-records/[recordId].tsx         → MedicalRecordDetailScreen
  vaccinations/index.tsx · vaccinations/[vaccinationId].tsx
```

The same six screen components serve both mount points — `useMedicalRouteScope`
reads `animalId` from `animalId` **or** `petId` and treats a present
`organizationId` as CLINIC context. `Routes` gained the 8 clinic
`orgAnimal{MedicalRecord,Vaccination}*` builders and the 4 owner
`pet{MedicalRecords,MedicalRecord,Vaccinations,Vaccination}` builders. No new
Expo Router stack — the existing `organizations` / `pets` stacks cover the
nested folders.

## 70. Authorization & security review (§36)

- **Backend is the only authority.** `orgCapabilities` gained
  `canViewOrganizationMedical` / `canManageOrganizationMedical` (both `privileged
|| isVet || isSupervisor` — the VETERINARIAN org role is seeded the full
  `medical_record.*` + `vaccination.*` set). These only decide which buttons
  render; every list / detail / mutation is re-authorised server-side and a
  `401/403/404/409/422` is mapped to a safe Arabic message
  (`apiErrorMessage` / `medicalErrorMessage`), never raw text.
- **IDOR / cross-organization** — `organizationId` + `animalId` always come
  from the route and are passed as path segments (never body fields), matching
  `withOrganization` + `authorizeOrg` + `withVeterinaryAnimalAccess`. A vet in
  Org A opening Org B's animal gets a backend `404` → the screen shows a plain
  "not found" state; the client never works around it. Another clinic's record
  is a `404` on the write paths and read-only on the detail screen (edit /
  delete hidden + an explicit note).
- **Authorship** — `recordedByUserId` is server-assigned; the client cannot set
  or spoof it. There is no veterinarian-id field anywhere in the forms.
- **Owner exposure (§16)** — the owner routes call the dedicated read-only
  endpoints; the owner screens never render an add / edit / delete control. The
  owner sees medical data because the **backend** returns it to the animal
  owner, not because the vet UI has it.
- **Deep links (§35)** — every screen fetches its own data; a route param is
  never treated as proof of access.

## 71. Dates (§24)

Backend medical dates are **date-only `YYYY-MM-DD` strings**. `displayDateOnly()`
shows them verbatim — never parsed through `Date` (which would shift the day by
the device's timezone offset). `createdAt` / `updatedAt` are real ISO
timestamps and use `formatDate` from `@/utils`. Form date inputs are plain
`YYYY-MM-DD` text fields (placeholder + hint + regex), consistent with the
Phase 3 date-of-birth field — the design system still has no date-picker
component (a tracked gap).

## 72. Future medical-module extension points (§14 / §39)

`OrganizationAnimalDetailScreen` and `PetDetailsScreen` keep the
**Overview → medical modules → management** layout. Adding **Treatments** or
**Appointments** later is a new `features/<name>/` module + one nav row in each
screen — the overview, access/revoke and the records/vaccinations sections are
untouched. The `medicalKeys` factory and the `useMedicalRouteScope` clinic/owner
split generalise to any future animal-scoped medical resource.

## 73. Tests (Phase 6)

New suites under `src/features/medical/__tests__/`:

| Suite                       | Covers                                                                                                                                                                                                      |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `medicalApi`                | every clinic + owner wrapper: exact URL + params/body; missing-`meta` tolerance; no ids in the body                                                                                                         |
| `medicalMutations`          | create / update / delete for records **and** vaccinations → API args + the §33 invalidation keys; 403 propagates as `ApiError`                                                                              |
| `medicalValidation`         | medical schema (≥1 field, future/format dates); vaccination schema (name + date required, future, `nextDueOn ≥ administeredOn`); `medicalErrorMessage` maps `ANIMAL_NOT_ACTIVE` / 404 (raw hidden)          |
| `MedicalRecordsScreen`      | CLINIC: list scoped to route org+animal · empty + add nav · **403 → forbidden message** (no leak). OWNER: reads the owner endpoint · **no add button**                                                      |
| `MedicalRecordDetailScreen` | CLINIC own record → edit + delete, confirm → `DELETE` → back to list. CLINIC other-clinic record → controls hidden + note. OWNER → read-only, owner endpoint. **404 → plain not-found**                     |
| `MedicalRecordFormScreen`   | blocks submit until ≥1 clinical field · create (animal id from route) → `POST` → back · **409 `ANIMAL_NOT_ACTIVE` → mapped Arabic** · duplicate-submit guard (3 taps → 1 call) · edit prefill → `PATCH`     |
| `VaccinationScreens`        | list (clinic scope + add nav; owner read-only) · empty · detail delete confirm → `DELETE` · 404 · form: name/date required · **`nextDueOn` before `administeredOn` rejected** · create with route animal id |
| `medicalNavigation`         | route builders are deep-link-safe · Animal Details (CLINIC) → Medical Records + Vaccinations entries · Pet Details (owner) → read-only entries · **Pet Owner "My Pets" still renders**                      |

**279 tests / 51 suites, all passing** (221 / 43 before Phase 6). Full gate:
`tsc` clean · `eslint` clean · `prettier` clean · `expo-doctor` 18/18 · web
export OK.

## 74. Phase 6 known limitations / backend dependencies

- **No name resolution for `recordedByUserId` / `organizationId`.** The DTO
  gives UUIDs only; there is no user- or organization-lookup endpoint, so the
  UI shows "recorded by this clinic / another clinic" (derived from the
  `organizationId` match) and a note that authorship is server-set — never a
  veterinarian or clinic **name**. _Backend dependency:_ include a small
  `recordedBy { name }` / `organization { name }` projection on the DTO.
- **No attachments / files** — the medical DTOs have no attachment field. R2 is
  out of scope (§38).
- **No date picker** — dates are `YYYY-MM-DD` text inputs (design-system gap,
  shared with Phase 3).
- **No `dueFrom` vaccination filter UI** — the backend supports `?dueFrom=` on
  the vaccination list; not surfaced as a control this phase.
- **No combined medical-history timeline** — the backend
  `GET .../medical-history` composed read model exists but is left for a later
  phase; Phase 6 ships the two separate resource lists that the DoD requires.
- Medical-record update sends every editable field (clearing blanks to `null`);
  the backend `minProperties: 1` refine is always satisfied, but a true
  partial-patch (only touched fields) would need field-level dirty tracking.
- Counts use a simple `{{count}}` form (no Arabic dual/plural), per precedent.

## 75. Recommended Mobile Phase 7

**Animal lifecycle publications — Lost / Adoption / Mating.** The backend
Phase 7 module is already mounted (`/animals/:animalId/publications`,
`/animal-publications` public browse, `/admin/animal-publications` moderation).
Build the Pet Owner flow to publish a pet as LOST / FOR_ADOPTION / FOR_MATING
from Pet Details, a public browse/search surface (the first genuinely
public-facing list in the app), and the owner's "my publications" management
(update / close). Keep it read-only-public + owner-write; leave moderation to
the admin dashboard. Before starting, raise the §74 name-resolution dependency
so medical entries (and publication contacts) can show real names.

---

# Mobile Phase 7 — Organization Operations: Farm join-code & Poultry

## 76. Scope

The organization-type-aware operational layer. Phases 4–6 already cover generic
organization management (members, supervisors, edit), clinic animals and
medical records — **Phase 7 does not rebuild any of that**. It adds only the
FARM-specific backend surface (`server/src/modules/farms`) plus the dashboard
wiring that surfaces every capability per organization type:

| Type                                 | Dashboard entries (permission-gated)                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| CLINIC                               | Animals · Members · Veterinarians · Supervisors · Edit                                            |
| FARM                                 | Animals · **Poultry** · Members · Veterinarians · Supervisors · **Farm join code** (owner) · Edit |
| VETERINARY_OFFICE / VETERINARY_STORE | Members · Veterinarians · Supervisors · Edit                                                      |

**Not built** (by instruction): cattle / sheep operations (backend has no
finalised API — §16), farm chat (Phase 12, §36), analytics dashboards (no
backend analytics endpoint — the dashboard is navigation, never fake numbers),
plus everything in §36.

## 77. New feature module — `src/features/farm/`

| Piece                   | Purpose                                                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types/index.ts`        | `PoultryFlock`, `PoultryBirdType`, `PoultryFlockStatus`, `FarmJoinCode`, inputs — mirror `farm.types.ts`                                             |
| `constants.ts`          | `FARM_ORG_TYPE` / `organizationIsFarm()`, bird-type icon + order, flock-status tone                                                                  |
| `api/farmApi.ts`        | `joinByCode` / `getJoinCode` / `regenerateJoinCode`                                                                                                  |
| `api/poultryApi.ts`     | `list` / `get` / `create` / `update` / `remove` flocks                                                                                               |
| `api/queryKeys.ts`      | `farmKeys.joinCode(orgId)`; `poultryKeys.forOrg(orgId)` / `list(orgId,filter)` / `detail(orgId,flockId)`                                             |
| `hooks/`                | `useFarmJoinCode` · `useRegenerateFarmJoinCode` · `useJoinFarmByCode` · `usePoultryFlocks` (infinite) · `usePoultryFlock` · 3 poultry mutation hooks |
| `validation/schemas.ts` | `buildJoinFarmSchema` (4–40, upper-cased) · `buildPoultryFlockSchema` · `farmErrorMessage`                                                           |
| `components/`           | `FarmJoinCodeCard` (view / share / rotate) · `PoultryCard` (+ skeleton) · `PoultryFlockForm`                                                         |
| `screens/`              | `JoinFarmScreen` · `PoultryFlocksScreen` · `PoultryFlockDetailScreen` · `PoultryFlockFormScreen`                                                     |

## 78. API endpoints integrated

| Mobile call                                         | Backend route                                            | Auth                                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `farmApi.joinByCode({ joinCode })`                  | `POST /organizations/join`                               | APPROVED veterinarian (route + backend). No org id in the body — the backend resolves it from the code                    |
| `farmApi.getJoinCode(orgId)` / `regenerateJoinCode` | `GET` / `POST /organizations/:id/join-code[/regenerate]` | `organization.update` (OWNER via override)                                                                                |
| `poultryApi.list` / `get`                           | `GET /organizations/:id/poultry/flocks[/:flockId]`       | `farm.poultry.read`                                                                                                       |
| `poultryApi.create` / `update` / `remove`           | `POST` / `PATCH /:flockId` / `DELETE /:flockId`          | `farm.poultry.{create,update,delete}`; content edits need the flock ACTIVE; a status-only PATCH may reopen a CLOSED flock |

Poultry request bodies carry only form fields; `organizationId` /
`createdByUserId` are set by the server. Every poultry lookup is scoped by
`organization_id` — a flock id not under the URL's farm returns `404`
(cross-farm isolation).

## 79. Farm join-code workflow (§9)

```
Farm OWNER                          Veterinarian
────────────────                   ────────────────
Organization dashboard (FARM)
  → Farm join-code card
     · view the Farm-ID
     · Share… (native share sheet)
     · Rotate (confirm → old code dies)   ── shares the code ──▶  Veterinarian Home
                                                                   → "Join a farm with a code"
                                                                   → JoinFarmScreen
                                                                      · enter Farm-ID (upper-cased)
                                                                      · submit
                                                                        → backend creates the
                                                                          VETERINARIAN membership
                                                                        → navigate to the farm
```

**No invitation / acceptance / owner approval** — this is the whole point of
the flow, and the mobile client adds no such step. Idempotent for an existing
ACTIVE member (backend returns `200`). `farmErrorMessage` maps
`INVALID_JOIN_CODE` → "invalid code", `ORGANIZATION_NOT_ACTIVE` → "farm not
active", `VETERINARIAN_APPROVAL_REQUIRED` → "must be approved", and the
`PERMISSION_DENIED` 403 (membership ended by the org) → "contact the owner".

## 80. Poultry workflow

- **List** — `usePoultryFlocks` (`useInfiniteQuery`, `page`/`pageSize`, optional
  `status`/`birdType` filters supported by the hook, not yet exposed as UI).
  Skeleton / empty / error+retry / pull-to-refresh. Add button gated on
  `canManageFarmPoultry`.
- **Detail** — sections map **1:1 to backend fields** (§14): "Basic
  information" (name, bird type, count, arrival date, status) + optional Notes +
  a meta card (created / closed). There is **no** health / production / feed /
  mortality / vaccination data in the backend, so there are no such sections.
  Manage actions (edit · close/reopen · delete-with-confirm) show only for
  `canManageFarmPoultry`.
- **Create / edit** — `PoultryFlockForm` (RHF + zod mirroring
  `farm.schemas.ts`): name 1–120, bird type enum, bird count `0…100_000_000`
  (held as a validated string, sent as a number), arrival date `YYYY-MM-DD`
  ≤ today, notes ≤ 4000. A CLOSED flock rejects content edits
  (`POULTRY_FLOCK_NOT_ACTIVE` → mapped Arabic); the detail screen's
  close/reopen sends a status-only PATCH which the backend allows.
- **Invalidation** (§28): create → `poultryKeys.forOrg(orgId)`; update → detail
  key + `forOrg`; delete → `removeQueries(detail)` + invalidate `forOrg`. No
  optimistic updates.

## 81. Dashboard, navigation & reuse

`OrganizationDetailsScreen` **is** the organization dashboard (§3) — Phase 7
made its manage section fully type-aware rather than adding a parallel screen:

- **Veterinarians** entry → the existing `OrganizationMembersScreen` opened with
  `?roleKey=VETERINARIAN`; the screen retitles and passes `roleKey` to
  `useOrganizationMembers` (which has supported the filter since Phase 4). No
  new screen, no duplicated member logic.
- **Poultry** entry (FARM + `canViewFarmPoultry`) → `PoultryFlocksScreen`.
- **Farm join-code card** (FARM + `canViewFarmJoinCode`) → `FarmJoinCodeCard`.
- Clinic → Animals → Animal Details → Medical Records / Vaccinations is the
  Phase 5/6 route tree, unchanged and unduplicated (§18).

New routes: `veterinarianJoinFarm`, `organizationPoultry(id)`,
`organizationPoultryCreate(id)`, `organizationPoultryFlock(id, flockId)`,
`organizationPoultryFlockEdit(id, flockId)`. Route files:
`app/(app)/veterinarian/join-farm.tsx` and
`app/(app)/organizations/[organizationId]/poultry/{index,create,[flockId]/{index,edit}}.tsx`
— no new Expo Router stack.

## 82. Organization permissions (§20–§22)

`orgCapabilities(myRole, isAdmin)` gained:

- `canViewFarmPoultry` — `privileged || vet || supervisor || staff`
  (`farm.poultry.read` is seeded to **every** FARM org role, STAFF included)
- `canManageFarmPoultry` — `privileged || vet || supervisor` (STAFF is
  read-only per seed — no `farm.poultry.{create,update,delete}`)
- `canViewFarmJoinCode` — `privileged` only (`organization.update`)

These stay **UX-only**: the backend `authorizeOrg('farm.poultry.*')` +
per-flock organization scoping is the security boundary, and a SUPERVISOR whose
owner-selected permissions differ still relies on the backend accepting or
403-ing the action (mapped to a safe Arabic message). **Organization
supervisors** (Phase 4, `AssignSupervisorScreen`) remain veterinarians granted
an owner-selected subset of the org permission catalogue — never a globally
privileged role, and rendered dynamically from that catalogue. System
supervisors (admin-assigned domain supervisors) are a separate concept surfaced
only through the Management Centre entry point, which Phase 7 leaves untouched.

## 83. Security review (§34)

- **Backend is the only authorization layer.** Every farm/poultry read + write
  is re-authorised server-side; the mobile gates only hide controls.
- **IDOR / cross-organization / cross-farm** — `organizationId` and `flockId`
  always come from the route and are passed as path segments (never body
  fields). A member of Farm A opening Farm B's flock, or any flock id not under
  the URL's farm, gets a backend `404` → a plain "not found" state; the client
  never probes or works around it.
- **Farm join-code abuse** — the join body is `{ joinCode }` only; the backend
  resolves the organization, checks APPROVED-vet status and farm ACTIVE status,
  and refuses a self-service rejoin after the org ended the membership. The code
  card + rotate are `organization.update`-gated (owner). A rotated code
  invalidates the old one immediately.
- **Authorship / impersonation** — `createdByUserId` is server-assigned; no
  such field exists in any form. Roles / permissions in responses are
  display-only.
- **Deep links (§35)** — every screen fetches and validates its own data; a
  route param is never treated as proof of access.

## 84. Tests (Phase 7)

New suites under `src/features/farm/__tests__/`:

| Suite                    | Covers                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `farmApi`                | join / join-code / regenerate + poultry list/get/create/update/delete — exact URL + params/body; no ids in bodies; missing-`meta` tolerance                                                                                                                                                                                                                         |
| `constants`              | `organizationIsFarm` = FARM only; bird-icon fallback; the three new `orgCapabilities` gates (STAFF read-only)                                                                                                                                                                                                                                                       |
| `farmMutations`          | join refreshes "My Organizations"; regenerate caches the new code; poultry create/update/delete → API args + §28 invalidation; 403 propagates                                                                                                                                                                                                                       |
| `farmValidation`         | join schema (min length, upper-case); poultry schema (name/count/date required, count cap, future/format date); `farmErrorMessage` mapping                                                                                                                                                                                                                          |
| `JoinFarmScreen`         | non-approved vet gate; too-short code blocked client-side; join with upper-cased code → nav to the farm; **INVALID_JOIN_CODE → safe Arabic** (raw hidden)                                                                                                                                                                                                           |
| `PoultryScreens`         | list scoped to route org · empty · **403 → forbidden** · STAFF sees list but no add · detail sections are backend-only (no invented "health" section) · close → status PATCH · delete → confirm → DELETE → back · 404 → not-found (no leak) · form validation · create sends numeric `birdCount` · edit prefill → PATCH · **409 POULTRY_FLOCK_NOT_ACTIVE → mapped** |
| `FarmJoinCodeCard`       | renders the code · unavailable state on 403/404 · rotate → confirm → backend → new code shown                                                                                                                                                                                                                                                                       |
| `orgDashboardNavigation` | route builders deep-link-safe · CLINIC dashboard = Animals+Members+Vets+Supervisors (no Poultry/join code) · FARM dashboard adds Poultry + owner join-code card · VETERINARY_OFFICE = Members/Vets/Supervisors only · `?roleKey=VETERINARIAN` retitles + filters · **Pet Owner "My Pets" still renders**                                                            |

**331 tests / 59 suites, all passing** (279 / 51 before Phase 7). Full gate:
`tsc` clean · `eslint` clean · `prettier` clean · `expo-doctor` 18/18 · web
export OK.

## 85. Phase 7 known limitations / backend dependencies

- **No cattle / sheep API** — the product spec defers their (different)
  operations and the backend has no finalised endpoint, so nothing was built.
  The `features/farm/` module and the type-aware dashboard generalise: a future
  `features/livestock/` module + one dashboard entry adds them without a
  redesign.
- **No name resolution** — poultry `createdByUserId` and farm memberships give
  UUIDs only; there is no user-lookup endpoint, so no "recorded by <name>" is
  shown (shared with the §74 dependency).
- **No farm/clinic analytics** — the backend exposes no counts / trends /
  activity feed, so the dashboards are navigation-only (no fabricated numbers,
  per §4).
- **No poultry health / production / feed / mortality / vaccination data** —
  those fields do not exist on `PoultryFlock`; only name, bird type, count,
  arrival date, status, notes and timestamps are shown.
- **Join code copy** — the app has no clipboard dependency; the card offers the
  native **Share** sheet and a selectable code instead of a copy button.
- Poultry `status` / `birdType` list filters are supported by the hook but not
  yet surfaced as UI controls.
- Bird count is entered as free text (`number-pad` keyboard) — no stepper; the
  design system still has no numeric-input or date-picker component.

## 86. Recommended Mobile Phase 8

**Animal lifecycle publications — Lost / Adoption / Mating** (still the best
next step, deferred from Phase 6's recommendation). The backend Phase 7 module
is mounted (`/animals/:animalId/publications`, public `/animal-publications`
browse, `/admin/animal-publications` moderation). Build: publish a pet as LOST /
FOR_ADOPTION / FOR_MATING from Pet Details; the first genuinely public-facing
browse/search surface in the app; the owner's "my publications" management
(update / close). Public-read + owner-write; leave moderation to the admin
dashboard. Raise the name-resolution dependency (§74/§85) first so publication
contacts and medical/poultry authorship can show real names.

---

# Mobile Phase 8 — Animal Community: Adoption / Mating / Lost

Publish one of the owner's own animals as an **Adoption**, **Mating** or **Lost**
listing; every authenticated user browses the **APPROVED** listings. Built
against `server/src/modules/veterinary-care` publications
(`/animals/:animalId/publications` + public `/animal-publications`). Moderation
stays server-side (`/admin/animal-publications/*`, **out of scope** — §22).

## 87. What was built vs. the Phase 8 brief

The backend model is deliberately minimal — **one** `AnimalPublication` row with
`{ kind, note? }` as its only writable fields, three statuses
(`PENDING | APPROVED | REJECTED`), and no update / delete / close / "mark found"
route. The mobile surface is scoped to exactly what that supports:

| Brief theme                | Delivered                                                                                                                    |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Publish from Pet Details   | Community section on `PetDetailsScreen` (owner + `status === 'ACTIVE'` only) → `PublishAnimalScreen`                         |
| Approval workflow (§1, §7) | Form always shows `سيتم مراجعة الإعلان قبل ظهوره للمستخدمين.`; new rows are `PENDING`, never promised live                   |
| Own animals only (§6, §32) | Animal comes from the route (`/pets/[petId]/publish/[kind]`) — never a free-text id; backend re-verifies ownership           |
| Public browse (§4)         | `PublicationsBrowseScreen` (`/publications/[kind]`) — any authenticated user, APPROVED only                                  |
| Data separation (§5, §33)  | Public detail renders `PublicPublicationDTO` only — no owner PII, no status, no contact, no ids beyond the listing/animal id |
| Contact mechanism (§17)    | Backend exposes none → an explicit "معلومات التواصل غير متاحة" card; no phone number is invented                             |
| Media / R2 (§24)           | Animals carry **no image field** anywhere → species-icon tile; the form states photos are unsupported                        |
| Search / filter (§26)      | Only `kind` is a backend query param → that is the only filter; no client-side search box                                    |
| Admin moderation (§22)     | Not built                                                                                                                    |

## 88. New feature module — `src/features/publications/`

| Piece                    | Purpose                                                                                                                                                                                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types/index.ts`         | `PublicationKind` (`LOST \| ADOPTION \| MATING`), `PublicationStatus` (`PENDING \| APPROVED \| REJECTED`), `AnimalPublication` (owner DTO), `PublicPublication` (public DTO), `CreatePublicationInput`, `Paginated<T>` — header doc enumerates the backend limits         |
| `constants.ts`           | `PUBLICATION_KIND_META` (icon + url slug per kind), `publicationKindFromSlug` / `publicationKindSlug`, `PUBLICATION_KIND_TONE`, `PUBLICATION_STATUS_TONE` (PENDING=warning, APPROVED=success, REJECTED=danger), `publicationSpeciesIcon` (fallback `help-circle-outline`) |
| `api/queryKeys.ts`       | `publicationKeys` — `public()` / `publicList(kind)` / `publicDetail(id)` and `forAnimal(animalId)` / `animalList` / `animalDetail`                                                                                                                                        |
| `api/publicationsApi.ts` | `listPublic` / `getPublic` (public browse) · `listForAnimal` / `getForAnimal` (owner) · `create` — bodies carry `{ kind, note }` only                                                                                                                                     |
| `validation/schemas.ts`  | `buildPublicationSchema` (note: trimmed, ≤ 2000, optional) · `publicationErrorMessage` (feature-specific → Arabic, generic fallback)                                                                                                                                      |
| `hooks/`                 | `usePublicPublications` (infinite, per kind) · `usePublicPublication` · `useAnimalPublications` (infinite) · `useAnimalPublication` · `useCreatePublication`                                                                                                              |
| `components/`            | `PublicationKindBadge` · `PublicationStatusBadge` (owner-only) · `PublicationCard` (+ skeleton) · `PublicationForm`                                                                                                                                                       |
| `screens/`               | `PublicationsBrowseScreen` · `PublicationDetailScreen` (dual-mode) · `PublishAnimalScreen`                                                                                                                                                                                |

`PetDetailsScreen` and `HomeScreen` import from the module's **deep paths**
(`@/features/publications/{hooks,components,constants}`), not the barrel, to
avoid a `publications ↔ pets` cycle (`PublishAnimalScreen` imports `usePet`).

## 89. API endpoints integrated

| Mobile call                                        | Backend route                             | Auth / notes                                                                                                                                                                                                          |
| -------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `publicationsApi.create(animalId, { kind, note })` | `POST /animals/:animalId/publications`    | Owner only — route 404s a non-owner, `assertIsCurrentOwner` 403 backstop. Animal must be `ACTIVE` (`409 ANIMAL_NOT_ACTIVE`); no open row of the same kind (`409 PUBLICATION_ALREADY_OPEN`). Returns the `PENDING` row |
| `publicationsApi.listForAnimal(animalId, p, ps)`   | `GET /animals/:animalId/publications`     | Owner / ADMIN / ANIMAL-supervisor — full `AnimalPublicationDTO[]` + page meta                                                                                                                                         |
| `publicationsApi.getForAnimal(animalId, id)`       | `GET /animals/:animalId/publications/:id` | Same auth — full DTO (`status`, `rejectionReason`, `reviewedAt`)                                                                                                                                                      |
| `publicationsApi.listPublic(p, ps, kind?)`         | `GET /animal-publications?kind=`          | **Any authenticated user** — `PublicPublicationDTO[]`, APPROVED only, + page meta                                                                                                                                     |
| `publicationsApi.getPublic(id)`                    | `GET /animal-publications/:id`            | Any authenticated user — `404` unless APPROVED (a PENDING/REJECTED id is indistinguishable from a missing one)                                                                                                        |

No `animalId` / `createdByUserId` / `status` is ever sent from a form — the
server assigns them. There is **no** update / delete / close / reopen /
mark-found / cross-animal "my publications" route (see §94).

## 90. Approval lifecycle

```
owner publishes ─▶ PENDING ─┬─▶ APPROVED  → appears in /animal-publications browse
   (from Pet Details)        └─▶ REJECTED  → owner sees the reason on the owner detail
```

- **Create** returns `PENDING`; `PublishAnimalScreen` toasts "sent for review"
  and `router.back()` — it never implies the listing is live.
- **Owner visibility** — `PetDetailsScreen` lists this animal's rows (any
  status) with a `PublicationStatusBadge`; `PublicationDetailScreen` (owner
  mode) shows a per-status line and, for `REJECTED`, `rejectionReason`.
- **Public visibility** — only `APPROVED` rows are reachable; the public DTO
  omits `status` entirely, so the browse/detail UI has no status concept.
- **State transitions are admin-only** — the mobile client cannot approve,
  reject, edit or withdraw; that is the moderation dashboard (§22, out of
  scope).

## 91. Owner view vs. public view

| Screen / mode                      | Route                                        | Data source                              | Shows                                                                                        |
| ---------------------------------- | -------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| `PublicationsBrowseScreen`         | `/publications/[kind]`                       | `usePublicPublications(kind)`            | APPROVED cards: species-icon tile, animal name/species/breed, kind badge, published date     |
| `PublicationDetailScreen` — public | `/publications/[kind]/[publicationId]`       | `usePublicPublication(id)`               | Animal info, note, published date, **"contact info not available"** card. No status, no PII  |
| `PublicationDetailScreen` — owner  | `/pets/[petId]/publications/[publicationId]` | `useAnimalPublication(petId,id)`         | Kind + **status** badge, per-status line, rejection reason (if `REJECTED`), note, timestamps |
| `PublishAnimalScreen`              | `/pets/[petId]/publish/[kind]`               | `usePet(petId)` + `useCreatePublication` | Animal name card, approval notice (always), one `note` field, "photos unsupported" caption   |

`PublicationDetailScreen` picks its mode from the presence of the `petId` param
(`isOwnerView = Boolean(petId)`) and only enables the matching query. A `404` /
`403` in either mode collapses to the same neutral "الإعلان غير متاح" empty
state — no raw backend message, no leak of whether the row exists.

## 92. Navigation & Pet Owner integration (§2)

- **Home** — `HomeScreen` gains an "Animal community" section (3 cards →
  `/publications/{adoption,mating,lost}`), before "Quick access". Visible to
  every signed-in user; no role gate (the browse endpoint is open to all
  authenticated users).
- **Pet Details** — a "Community" section renders **only** when
  `isOwner && pet.status === 'ACTIVE'`: three publish rows
  (`Routes.petPublish(pet.id, slug)`) plus, when `useAnimalPublications` returns
  rows, a list of this animal's existing listings
  (`Routes.petPublication(pet.id, pub.id)`). A non-owner viewing the same screen
  sees neither, and `listForAnimal` is never called.
- **Route builders** (`src/constants/routes.ts`) — `publications(kind)`,
  `publicationDetail(kind, id)`, `petPublish(petId, kind)`,
  `petPublication(petId, id)`; all return absolute `/(app)/…` strings so deep
  links resolve without a warm navigation stack (§35).
- **Route files** — `app/(app)/publications/{_layout,[kind]/index,[kind]/[publicationId]}.tsx`
  and `app/(app)/pets/[petId]/{publish/[kind],publications/[publicationId]}.tsx`;
  `publications` is registered on the `(app)` stack. No new tab — the Pet Owner
  module is not duplicated.

## 93. Query keys & mutation invalidation (§28)

- **Keys** — `publicationKeys.publicList(kind)` scopes the browse infinite query
  per kind (`enabled` only once the slug resolves); `publicationKeys.forAnimal(animalId)`
  is the owner prefix (`animalList` / `animalDetail` under it).
- **Infinite lists** — `page` / `pageSize`, `getNextPageParam` from
  `meta.page < meta.totalPages`, `staleTime: 15_000`; `retry` skips `403` / `404`.
- **`useCreatePublication(animalId)`** — on success invalidates the narrowest
  prefixes: `publicationKeys.forAnimal(animalId)` (owner's Pet Details list) and
  `publicationKeys.publicList(created.kind)` (in case the row is auto-approved in
  some future backend). **No optimistic insert** — a `PENDING` row must not
  appear in a public list. An in-flight `useRef` guard + `onSettled` reset
  blocks a double submit.

## 94. Security review (§33)

- **IDOR / arbitrary animal id** — the publish flow has no animal-id input; the
  id is a route param and the backend route 404s any non-owner
  (`assertIsCurrentOwner` 403 backstop). `publicationErrorMessage` maps both to
  the same "لا يمكنك نشر حيوان لا تملكه." — the client never distinguishes
  "not found" from "not yours".
- **Cross-user listing manipulation** — there is no edit / delete / status
  mobile call to attempt; approval state is server-only.
- **Private-data leakage** — the public browse/detail screens consume
  `PublicPublicationDTO` exclusively: `{ id, kind, note, publishedAt, animal:{ id, name, species, breed } }`.
  No owner id/name/phone, no `createdByUserId` / `reviewedByUserId` /
  `rejectionReason` / `status`, no internal moderation metadata. Owner-only
  fields render **only** in the `petId`-scoped owner mode.
- **Contact info** — not exposed. The backend has no contact channel, so the
  detail screen states so plainly rather than surfacing a phone number.
- **Deep links (§35)** — every publications screen fetches and validates its own
  data; a route param is proof of nothing.
- **Enumeration** — `getPublic` returns `404` for a PENDING/REJECTED/missing id
  alike, so a public viewer cannot probe for un-approved listings.

## 95. Tests (Phase 8)

New suites under `src/features/publications/__tests__/` (**33 tests / 7 suites**):

| Suite                      | Covers                                                                                                                                                                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `publicationsApi`          | `listPublic` / `getPublic` / `listForAnimal` / `getForAnimal` / `create` — exact URL + params/body; body is `{ kind, note }` only; missing-`meta` tolerance                                                                                                        |
| `publicationMutations`     | `useCreatePublication` POSTs `{ kind, note }` and invalidates `forAnimal` + `publicList(kind)`; a `404` propagates as `ApiError`                                                                                                                                   |
| `publicationValidation`    | schema accepts empty / normal note, rejects > 2000; `publicationErrorMessage` maps `ANIMAL_NOT_ACTIVE` / `PUBLICATION_ALREADY_OPEN` / 404 / `PERMISSION_DENIED`, hides raw text                                                                                    |
| `PublicationsBrowseScreen` | list scoped by `[kind]` slug · kind-specific empty state · safe error state (no raw message) · unknown slug → guard, `listPublic` not called · card → public detail route                                                                                          |
| `PublicationDetailScreen`  | **public**: animal + note + "معلومات التواصل غير متاحة", no status text, `getForAnimal` not called; 404 → neutral not-found (no leak). **owner**: `REJECTED` → status + reason; `PENDING` → under-review line, no rejection block; `getPublic` not called          |
| `PublishAnimalScreen`      | approval notice + "no photos" note always shown · empty-note submit POSTs `(animalId, { kind, note: undefined })` + `router.back()` · lost report with note · 404 → "not your animal" (raw hidden) · 409 `PUBLICATION_ALREADY_OPEN` → mapped · triple-tap → 1 call |
| `publicationNavigation`    | route builders are deep-link-safe absolute paths · Pet Details (owner, ACTIVE) shows publish rows → publish flow · non-owner sees none, `listForAnimal` not called · owner listings section → owner detail · **Pet Owner "My Pets" still renders**                 |

**364 tests / 66 suites, all passing** (331 / 59 before Phase 8). Full gate:
`tsc` clean · `eslint` clean · `prettier` clean · `expo-doctor` 18/18 · web
export OK.

## 96. Phase 8 known limitations / backend dependencies

- **No update / delete / close / withdraw / "mark found" endpoint** — a listing
  cannot be edited or taken down from the app once created; the owner can only
  view its status. Documented, not mocked.
- **No cross-animal "my publications" endpoint** — the owner's listings are only
  reachable per-animal (`GET /animals/:animalId/publications`), so they surface
  on each Pet Details screen rather than in one "My listings" hub.
- **No location / date-lost / description / photo fields** — the model is
  `{ kind, note? }`. "Lost" listings carry only the free-text note; there is no
  structured last-seen location or date.
- **No image field on animals** (since Phase 3) and **no media/R2 flow for
  publications** — the UI uses a species-icon tile and the form states photos
  are unsupported (§24).
- **No contact mechanism** — the backend shares nothing to reach the owner; the
  public detail screen says so instead of exposing a phone number (§17).
- **Only `kind` is filterable** — no species / breed / location / free-text
  search parameter exists, so none is offered (§26).
- **Name resolution** — `createdByUserId` / `reviewedByUserId` are UUIDs with no
  user-lookup endpoint (shared with §74 / §85); no "published by <name>" is
  shown.
- **Moderation is admin-only** — `/admin/animal-publications/*` (approve /
  reject) is deliberately out of scope (§22).

## 97. Recommended Mobile Phase 9

**Consultations / vet Q&A** or **name resolution + notifications**. The
strongest pick is a small **`/users/:id` public-profile lookup** (unblocks
authorship on medical records, poultry and publications — §74 / §85 / §96) paired
with the **notifications** surface (`src/services/notifications/` already stubs
the device-token flow), so an owner learns when a listing is APPROVED or
REJECTED without polling Pet Details. If a larger feature is wanted instead,
**consultations** (`server` has the module) is the next self-contained Pet
Owner ↔ Veterinarian workflow.

---

# Mobile Phase 9 — Veterinary Jobs & Freelance Offers — NOT IMPLEMENTED (no backend)

**Status: blocked. No code was written.** The Phase 9 brief asks for a
freelance-marketplace workflow — Pet Owner publishes a veterinary _request /
job_, veterinarians browse open requests and submit priced _offers_, the owner
compares offers and _accepts_ one, the request becomes _assigned_ to that vet,
then runs to _completion_. The brief's own rules govern the outcome: _"DO NOT
invent backend APIs, fields, statuses, permissions, DTOs, or workflows. The
backend is the source of truth. If something required by this phase does not
exist in the backend, document it instead of creating fake/mock APIs."_

## 98. Backend investigation (what was checked)

| Source inspected                                                                        | Result                                                                                                                                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server/src/modules/` (17 modules)                                                      | animals · audit · auth · authorization · chat · consultations · content · farms · health · notifications · organizations · rbac · supervisors · users · veterinarians · veterinary-care · veterinary-store. **No** jobs / requests / offers / freelance / marketplace module                                    |
| `server/src/routes/index.ts` (every mounted route)                                      | Phases 2–15 mounts enumerated. **No** `/jobs`, `/requests`, `/veterinary-requests`, `/offers`, `/proposals`, `/assignments`                                                                                                                                                                                     |
| `server/src/database/migrations/` (19 migrations)                                       | init · users · rbac · sessions · vet-applications · supervisors · audit · organizations · org-rbac · org-memberships · animals · veterinary-care · farms · animal-publications · store-products · chat · consultations-inquiries · content · notifications. **No** job / request / offer / bid / proposal table |
| `server/src/openapi/*` (all 12 phase fragments)                                         | Every path dumped. **No** job/offer/request path. Highest documented surface is Phase 15 notifications                                                                                                                                                                                                          |
| Seeded permissions (`seeds/0010_rbac.ts`, `0030_organization_rbac.ts`)                  | **No** `job.*` / `request.*` / `offer.*` / `hire.*` permission key                                                                                                                                                                                                                                              |
| `docs/01_SCOPE.md` §1.7 (system boundaries)                                             | "Included in Current Scope" **and** "Future Scope" lists — **no** jobs / freelance / service-request / marketplace concept anywhere in the product vision                                                                                                                                                       |
| `docs/04_MODULES_FEATURES.md`, `docs/05_USE_CASES.md`                                   | No such module or use case. "Clinic Request" (UC-008) is the org-approval request for creating a Clinic — unrelated                                                                                                                                                                                             |
| Full-source grep: `freelance\|serviceRequest\|proposal\|\bbid\b\|marketplace\|jobOffer` | Zero non-incidental hits (only "background job runner", a `this.assignments` RBAC helper)                                                                                                                                                                                                                       |

**Conclusion:** the Veterinary Jobs / Freelance Offers system does not exist at
any layer of the backend and is not a planned ("Future Scope") capability. There
is nothing to integrate against.

## 99. Why the adjacent modules are not a substitute

- **Consultations** (`/consultations`) — Pet Owner posts a question; it is
  answered by AI / Admin / a Consultation **Supervisor**. No veterinarian
  responder, no priced offer, no comparison, no acceptance, no assignment. It is
  a support thread, not a marketplace.
- **Inquiries** (`/inquiries`) — a Veterinarian's general question to
  Admin/Supervisor. Same thread model, opposite direction. Not a job.
- **Chat** (`/conversations`) — direct Pet Owner ↔ Clinic messaging. No request
  object, no offer object, no lifecycle.
- **Clinic animal-access** (Phase 5) — a clinic gains access to an animal's
  records via an admin/owner grant, not by bidding on an owner-posted job.

Reshaping any of these into a job board would mean inventing the request DTO,
the offer DTO, both status enums, the accept/assign transition and the
authorization model — exactly what the brief forbids.

## 100. Missing backend APIs (required before Mobile Phase 9 can be built)

A future backend "Veterinary Jobs" module would need, at minimum:

| Capability                            | Expected shape (illustrative — **not** implemented)                                                                                                                                                             |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create / list / get request           | `POST /veterinary-requests`, `GET /veterinary-requests?mine`, `GET /veterinary-requests/:id`                                                                                                                    |
| Public (vet) browse                   | `GET /veterinary-requests/open` with backend visibility filtering + pagination + filters (category / species / status)                                                                                          |
| Request DTO                           | `{ id, title, description, animalId?, category, status, offerCount, createdAt, … }` — plus a **public** projection with no owner PII                                                                            |
| Request lifecycle + edit/cancel/close | status enum (`OPEN → ASSIGNED → …`), `PATCH` / `POST :id/cancel` / `:id/close` with server-enforced immutability post-assignment                                                                                |
| Submit / list / get offer             | `POST /veterinary-requests/:id/offers`, `GET /veterinary-requests/:id/offers` (owner), `GET /me/offers` (vet), `GET /offers/:id`                                                                                |
| Offer DTO + lifecycle                 | `{ id, requestId, veterinarian: { public fields }, price?, message, status, createdAt }`; status enum (`PENDING → ACCEPTED / REJECTED / WITHDRAWN`)                                                             |
| Accept offer                          | `POST /offers/:id/accept` — server rejects a second accept, flips request → ASSIGNED, sets the selected vet                                                                                                     |
| Edit / withdraw offer                 | `PATCH /offers/:id`, `POST /offers/:id/withdraw` with "already accepted" guard                                                                                                                                  |
| Assigned requests (vet)               | `GET /me/assigned-requests`                                                                                                                                                                                     |
| Ownership / authorization             | request mutation restricted to the creating owner; offer mutation to the submitting **approved** veterinarian; accept restricted to the request owner; open-browse for approved vets only — all server-enforced |
| Media (optional)                      | request/offer attachments would reuse the R2 presigned-upload flow **if** the backend adds those fields (no animal/publication media exists today either)                                                       |

## 101. Mobile-side impact / what was NOT changed

No feature module, screen, route, hook, query key, i18n namespace or navigation
entry was added. Pet Owner Mode and Veterinarian Mode are untouched. The
`src/features/` tree still ends at `publications/` (Phase 8). Verification
(`tsc` / `eslint` / `prettier` / `jest` 364·66 / `expo-doctor` 18·18) re-run to
confirm the tree is unchanged and green.

## 102. Recommended path forward

1. **Backend first** — implement the module sketched in §100 (DTOs, two status
   enums, the accept/assign transition, the visibility model). Ship its OpenAPI
   fragment so the mobile client has a contract to build against.
2. **Then Mobile Phase 9** — the mobile architecture is ready to absorb it with
   no redesign: a `src/features/vet-requests/` module mirroring `publications/`
   (infinite lists, centralized query-key factory, no optimistic writes,
   narrowest-prefix invalidation), an owner tab entry next to
   "Adoption / Mating / Lost", a Veterinarian-Home entry for "Open requests /
   My offers / Assigned", and a dual-mode `RequestDetailsScreen` following the
   `PublicationDetailScreen` owner-vs-public pattern.
3. **If a smaller Phase 9 is wanted now**, fall back to §97's recommendation
   (a `/users/:id` public-profile lookup + the notifications inbox) — both of
   which _do_ have backend support today.

---

# Mobile Phase 10 — Veterinary Store product catalogue

Product-catalogue management for a **Veterinary Store** organization's own
members, against `server/src/modules/veterinary-store`
(`/organizations/:orgId/products`). A Veterinary Store is an Organization of
type `VETERINARY_STORE` (Phase 3) — its profile / members / supervisors / staff
reuse the Phase 3–4 `features/organizations` APIs and screens unchanged.

## 103. What the backend actually provides vs. the Phase 10 brief

The brief describes a two-store consumer marketplace (Pet Owner Store +
Veterinary Store, home feed, categories, cart, checkout, addresses, delivery,
payment, orders, order history). **Almost none of that exists.** The entire
backend surface is six org-scoped product-management routes:

| Route                                                  | Permission                                    |
| ------------------------------------------------------ | --------------------------------------------- |
| `GET /organizations/:orgId/products`                   | `product.read`                                |
| `POST /organizations/:orgId/products`                  | `product.create`                              |
| `GET /organizations/:orgId/products/:productId`        | `product.read`                                |
| `PATCH /organizations/:orgId/products/:productId`      | `product.update`                              |
| `DELETE /organizations/:orgId/products/:productId`     | `product.delete` (soft — `status = INACTIVE`) |
| `POST /organizations/:orgId/products/:productId/stock` | `product.inventory.adjust`                    |

Every route is `authenticate → withOrganization → withVeterinaryStore (400 if
not a store) → authorizeOrg(<product perm>)`. The OpenAPI fragment says it
outright: _"Products are private to the store's members. There is no public
browse."_ The products migration says it outright too: _"NOT modelled … Pet
Owner Store products (separate future domain), product categories, product
images (R2 storage seam), SKU / barcode, orders / purchasing, an inventory
movement ledger."_

So Phase 10 mobile is a **store-operator catalogue tool**, structurally a twin
of Phase 7's poultry-for-farms: list / detail / create / edit / deactivate +
a dedicated stock-adjust action, surfaced on the org dashboard for
`VETERINARY_STORE` orgs. Everything consumer-facing is documented as a backend
gap in §108 and **not mocked**.

| Brief theme                                  | Delivered                                                                                                                                                                  |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Store separation (Pet Owner / Vet)           | Only the Veterinary Store exists. Pet Owner Store: documented gap (§108).                                                                                                  |
| Mode-aware access (§2)                       | The store is an org you're a member of → reached via **My Organizations** in either mode; the dashboard shows a "Products" entry for `VETERINARY_STORE` types. No new tab. |
| Store home / categories / search (§3–§9)     | Backend list filters `status` / `type` / `search` / `sort` → a search box + a product-type chip row. No categories (none exist), no "featured/popular" (no such endpoint). |
| Product list / detail (§5, §6)               | `ProductsScreen` + `ProductDetailScreen` — every backend DTO field, nothing invented                                                                                       |
| Product media (§24)                          | No image field, no R2 seam → an icon tile; **no upload UI**                                                                                                                |
| Cart / checkout / orders / payment (§10–§22) | Documented gaps (§108). Not built, not mocked.                                                                                                                             |
| Vendor privacy (§25, §33)                    | The DTO carries no vendor contact / address / owner PII; `createdByUserId` is a UUID shown to nobody                                                                       |
| Veterinarian approval (§27)                  | Store access is org membership, not a second approval; a non-member's request 403s and surfaces the shared forbidden copy                                                  |

## 104. New feature module — `src/features/store/`

| Piece                   | Purpose                                                                                                                                                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types/index.ts`        | `Product`, `ProductType` (`MEDICINE \| EQUIPMENT \| SUPPLY \| OTHER`), `ProductStatus` (`ACTIVE \| INACTIVE`), `CreateProductInput`, `UpdateProductInput`, `AdjustStockInput`, `ProductListFilter` — header doc enumerates the backend limits |
| `constants.ts`          | `VETERINARY_STORE_ORG_TYPE` / `organizationIsVeterinaryStore()`, product-type icon + order, `PRODUCT_STATUS_TONE`, `PRODUCT_SORT_OPTIONS`, `LOW_STOCK_THRESHOLD` (presentation only)                                                          |
| `api/productsApi.ts`    | `list` / `get` / `create` / `update` / `remove` / `adjustStock` — the DTO field is `productType`, the list query param is `type`; `readMeta` tolerates a missing envelope `meta`                                                              |
| `api/queryKeys.ts`      | `productKeys.forOrg(orgId)` / `list(orgId, filter)` / `detail(orgId, productId)` — store id is always in the key so two stores never collide (§32)                                                                                            |
| `validation/schemas.ts` | `buildProductSchema` (name 1–200, price `^\d{1,8}(\.\d{1,2})?$` or blank, opening stock uint or blank, description ≤ 4000) · `buildAdjustStockSchema` (signed non-zero int + reason ≤ 500) · `storeErrorMessage`                              |
| `hooks/`                | `useProducts` (infinite, with `status` / `type` / `search` / `sort`) · `useProduct` · `useCreateProduct` · `useUpdateProduct` · `useDeleteProduct` · `useAdjustStock`                                                                         |
| `components/`           | `ProductCard` (+ skeleton) · `ProductForm` · `AdjustStockForm`                                                                                                                                                                                |
| `screens/`              | `ProductsScreen` · `ProductDetailScreen` · `ProductFormScreen`                                                                                                                                                                                |

`OrganizationDetailsScreen` imports `organizationIsVeterinaryStore` from the
module's **deep path** (`@/features/store/constants`), not the barrel — same
cycle-avoidance rule as `farm` (`store/screens/*` import the `@/features/organizations`
barrel).

## 105. API endpoints integrated

| Mobile call                                | Backend route                        | Auth / notes                                                                                                                                                                                  |
| ------------------------------------------ | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `productsApi.list(orgId, filter)`          | `GET /organizations/:orgId/products` | `product.read`. `filter.productType` → the `type` query param; `search` is a name substring; `sort` ∈ `name \| price \| createdAt`, `order` ∈ `asc \| desc`. Returns `Product[]` + page meta. |
| `productsApi.get(orgId, id)`               | `GET …/products/:id`                 | `product.read`. A product id not under this store → `404` (cross-store isolation).                                                                                                            |
| `productsApi.create(orgId, body)`          | `POST …/products`                    | `product.create`. Body: `{ name, productType, price?, description?, stockQuantity? }`. `organizationId` / `createdByUserId` / post-create `status` are server-set.                            |
| `productsApi.update(orgId, id, body)`      | `PATCH …/products/:id`               | `product.update`. Body: profile fields + `status` only; **never** `stockQuantity`.                                                                                                            |
| `productsApi.remove(orgId, id)`            | `DELETE …/products/:id`              | `product.delete`. Soft-delete (`status = INACTIVE`), idempotent, returns the product.                                                                                                         |
| `productsApi.adjustStock(orgId, id, body)` | `POST …/products/:id/stock`          | `product.inventory.adjust` (a permission distinct from `product.update`). Body: `{ delta (signed non-zero int), reason? }`. Result may not be negative → `409 INSUFFICIENT_STOCK`.            |

No form ever sends `organizationId` / `createdByUserId` / `stockQuantity` (via
update) / `status` (via create). Prices are decimal **strings** end to end —
never parsed into a JS number (§37).

## 106. Store-operator flow, lifecycle & navigation

```
VETERINARY_STORE member
  → My Organizations → <the store> (OrganizationDetailsScreen)
     → "Products" entry (shown when isVeterinaryStore && canViewStoreProducts)
        → ProductsScreen  (search · type chips · infinite list · pull-to-refresh)
           → ProductDetailScreen
              · Edit         → ProductFormScreen (PATCH)
              · Adjust stock → AdjustStockForm    (POST …/stock, signed delta)
              · Deactivate   → confirm → DELETE   (status → INACTIVE)
              · Reactivate   → PATCH { status: ACTIVE }   (INACTIVE products only)
        → add (canManageStoreProducts) → ProductFormScreen (POST)
```

- **Product lifecycle** is just `ACTIVE ⇄ INACTIVE`. `DELETE` is the documented
  path to `INACTIVE` (products are never hard-deleted — future Orders will
  reference history); `PATCH { status: 'ACTIVE' }` is the only way back, so the
  detail screen shows **Deactivate** (confirm) for an ACTIVE product and
  **Reactivate** (direct) for an INACTIVE one.
- **Stock** changes only through `AdjustStockForm` → `POST …/stock` with a
  signed integer delta; an `useRef` in-flight guard blocks a double submit and
  `INSUFFICIENT_STOCK` maps to a plain Arabic "can't go below zero" line.
- **Route builders** (`src/constants/routes.ts`): `organizationProducts`,
  `organizationProductCreate`, `organizationProduct`, `organizationProductEdit`
  — absolute `/(app)/…` strings (deep-link safe, §—). Route files under
  `app/(app)/organizations/[organizationId]/products/{index,create,[productId]/{index,edit}}.tsx`.
- **No new tab, no Pet Owner surface.** Pet Owner Mode and Veterinarian Mode are
  untouched; the store is reached the same way clinics and farms are.

## 107. Query keys, invalidation & capabilities

- **Keys** — `productKeys.list(orgId, filter)` scopes the infinite query per
  store **and** per filter set; `productKeys.forOrg(orgId)` is the store prefix
  (`detail` under it). `useInfiniteQuery` with `page` / `pageSize`,
  `getNextPageParam` from `meta.page < meta.totalPages`, `staleTime: 15_000`,
  `retry` skips `403` / `404`.
- **Invalidation (§33)** — no optimistic writes. `useCreateProduct` →
  `forOrg(orgId)`. `useUpdateProduct` / `useDeleteProduct` / `useAdjustStock` →
  `detail(orgId, id)` + `forOrg(orgId)`. A soft-deleted product's detail entry
  is refreshed, not removed (its status just flips).
- **Capabilities** — two new UX-only gates in `orgCapabilities`
  (`src/features/organizations/constants.ts`), mirroring the seeded
  `ORG_ROLE_PERMISSIONS`:
  - `canViewStoreProducts` = `privileged || isSupervisor || isStaff` — STAFF has
    `product.read`; a SUPERVISOR's real grants are owner-selected and unknown to
    the client, so we show the list and let the backend 403 anything more.
  - `canManageStoreProducts` = `privileged || isSupervisor` — OWNER via
    override; SUPERVISOR optimistically (backend authoritative); **STAFF is
    read-only**; the plain VETERINARIAN org role gets nothing.
    Both are still backend-enforced on every call.

## 108. Security & privacy review (§36, §37)

- **IDOR / arbitrary ids** — `organizationId` and `productId` are route params;
  the backend scopes every product lookup by `organization_id` and 404s a
  product from another store (`withProduct`). `withVeterinaryStore` 400s a
  non-store org. There is no product-id input anywhere in the UI.
- **Cross-store / cross-user** — no client call can target another store's
  catalogue; `authorizeOrg` re-checks the permission on every route; a
  non-member's request 403s and shows the shared `errors.forbidden` copy.
- **Price / total / stock integrity (§37)** — the client sends a price
  **string** and a signed stock **delta** and never computes a total, a
  discount, or an absolute stock value. `stockQuantity` cannot be set through
  create-time trust or `PATCH`; it moves only via the audited stock endpoint,
  and `INSUFFICIENT_STOCK` is enforced server-side (+ a DB CHECK).
- **Vendor / owner data** — `ProductDTO` is `{ id, organizationId, name,
description, productType, price, stockQuantity, status, createdByUserId,
createdAt, updatedAt }`. No vendor phone / address / owner name; the store
  name/profile is the existing Phase 3 organization data. `createdByUserId` is a
  UUID rendered to nobody (no user-lookup endpoint — shared §74 / §85 / §96).
- **Deep links** — every store screen fetches and validates its own data; a
  route param is proof of nothing. A `404` / `403` on the detail collapses to a
  neutral "product unavailable" empty state with no raw backend message.

## 109. Tests (Phase 10)

New suites under `src/features/store/__tests__/` (**42 tests / 7 suites**):

| Suite                 | Covers                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `productsApi`         | exact URL + params/body for all six calls; `productType` → `type` param mapping; missing-`meta` tolerance                                                                                                                                                                                                                                                                        |
| `productMutations`    | create → `forOrg`; update / delete / adjustStock → `detail` + `forOrg`; no optimistic writes; a `403` propagates as `ApiError`                                                                                                                                                                                                                                                   |
| `productValidation`   | schema accepts a minimal product, rejects a bad price pattern / non-integer stock / empty name / unknown type; adjust-stock rejects zero / decimal / empty; `storeErrorMessage` maps `ORGANIZATION_TYPE_NOT_SUPPORTED` / `INSUFFICIENT_STOCK` / 404 / 403, hides raw text                                                                                                        |
| `ProductsScreen`      | list scoped to the route org; **server-side** search passes `search`; a type chip passes `type`; empty / safe-error states; STAFF sees the list but no add button; card → detail route                                                                                                                                                                                           |
| `ProductDetailScreen` | renders only DTO fields; STAFF sees no manage actions; deactivate → confirm → `DELETE`; reactivate (INACTIVE) → `PATCH { status: ACTIVE }`; adjust stock → `POST …/stock` with a numeric signed delta; `409 INSUFFICIENT_STOCK` → mapped; `404` → neutral not-found, no leak, no auto-redirect                                                                                   |
| `ProductFormScreen`   | create `POST`s `{ name, productType, price, stockQuantity }`; blank price / stock → `undefined`; edit prefill → `PATCH`, a cleared price → `null`; no opening-stock field in edit mode; triple-tap → 1 call; `400 ORGANIZATION_TYPE_NOT_SUPPORTED` → mapped, raw hidden                                                                                                          |
| `storeNavigation`     | route builders are deep-link-safe absolute paths; `organizationIsVeterinaryStore` matches only `VETERINARY_STORE`; the two new `orgCapabilities` gates (OWNER manages, STAFF read-only, SUPERVISOR manages, VETERINARIAN nothing); dashboard shows the Products entry for `VETERINARY_STORE` + never for CLINIC/FARM; STAFF still sees it; **Pet Owner "My Pets" still renders** |

**406 tests / 73 suites, all passing** (364 / 66 before Phase 10). Full gate:
`tsc` clean · `eslint` clean · `prettier` clean · `expo-doctor` 18/18 · web
export OK.

## 110. Phase 10 backend limitations / missing APIs

Everything the brief calls for beyond store-member catalogue management is
absent from the backend and was **documented, not mocked**:

- **No Pet Owner Store** — no module, no table. `products.organization_type` is
  pinned to `VETERINARY_STORE` by a DB CHECK + composite FK, so a product can
  never belong to any other org type. Pet Owners have no store surface at all.
- **No public / consumer product browse** — every product route requires
  `product.read` on the owning store. A Pet Owner (or a vet who is not a member
  of that store) gets `403`. There is no "browse all stores" endpoint.
- **No categories** — no table, no endpoint; the mobile filter is the backend's
  `type` enum only.
- **No cart / checkout / orders** — no cart API, no order model, no order
  history / status / cancellation, no addresses, no delivery, no payment (COD
  or gateway), no `orderId`. The products migration lists Orders / Purchasing as
  a future concern.
- **No product media** — no image field on `Product`, no R2 upload seam for
  products (animals and publications have none either). `ProductCard` /
  `ProductDetailScreen` use a product-type icon tile; the form offers no upload.
- **No discounts / SKU / barcode / brand / vendor public profile / ratings /
  "featured" / "popular"** — none of these fields or endpoints exist.
- **No name resolution** — `createdByUserId` is a UUID with no lookup endpoint
  (shared §74 / §85 / §96); no "added by <name>".
- **No `sort` / `status` UI** — the hook supports both (backend params) but only
  `search` + `type` are surfaced; `sort` defaults to the backend's own
  `createdAt desc`.

## 111. Recommended Mobile Phase 11

**Notifications inbox + `/users/:id` public profile** (still the standing §97 /
§102 pick, and both have live backend support): `/notifications` +
`/notifications/devices` + `/notifications/preferences` + `unread-count` give
Pet Owners and vets a real inbox (the `src/services/notifications/`
device-token stub is already in place), and a `/users/:id` lookup finally lets
medical-record / poultry / publication / **product** authorship show a name
instead of a UUID. If a larger self-contained feature is wanted, **chat**
(`/conversations`, Pet Owner ↔ Clinic — the backend module is mounted) is the
next Pet Owner ↔ organization workflow. The consumer marketplace (Pet Owner
Store, cart, orders, payment) must wait for the backend modules in §110.

---

# Mobile Phase 11 — Content & Knowledge

The user-facing reading experience for the backend's educational content —
**articles / books / magazines** and their files — against
`server/src/modules/content` **public** routes only. Content is authored and
published by admins / CONTENT system-supervisors through the backend admin API;
there is no mobile content-management area (§113 IMPLEMENTED vs. §114 BACKEND
SUPPORTED BUT NOT MOBILE).

## 112. Backend surface consumed

| Route                                            | Auth                   | Notes                                                                                                                                                                                             |
| ------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /content?page&pageSize&type&categoryId&q`   | any authenticated user | **PUBLISHED, non-deleted only.** `type` ∈ `ARTICLE\|BOOK\|MAGAZINE`; `q` = free-text (1–200). No `sort` / author / date param exists.                                                             |
| `GET /content/:contentId`                        | any authenticated user | A DRAFT / ARCHIVED / deleted id → `404` (indistinguishable from missing).                                                                                                                         |
| `GET /content/:contentId/files/:fileId/download` | any authenticated user | Returns `{ url, expiresInSeconds }` — a stable public CDN URL (`expiresInSeconds: null`) or a ~5-minute signed URL. This IS the backend-authorized media URL (§9, §34); the app never touches R2. |
| `GET /content-categories`                        | any authenticated user | Flat list for the filter chips.                                                                                                                                                                   |

The backend public `ContentDTO` still carries `status` / `createdByUserId` /
`updatedByUserId` / `deletedAt` (its body doc: _"stored verbatim as untrusted
text and never rendered by the API — clients MUST escape / sanitise on
display"_). `contentApi` **trims those four fields off** before anything
downstream sees them, and downgrades each file to `{ id, kind,
originalFilename, mimeType, sizeBytes }` (the backend's `PublicContentFileDTO`
shape — no `storageKey`). So no screen, hook or test can render moderation or
authorship metadata (§5, §17, §18).

## 113. IMPLEMENTED — new feature module `src/features/content/`

| Piece                   | Purpose                                                                                                                                                                                                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types/index.ts`        | `ContentType`, `ContentFileKind`, `ContentCategory`, `ContentFile` (public shape), **`ContentItem`** (the trimmed projection — no `status` / author-id / `deletedAt`), `ContentDownload`, `ContentListFilter`                                                                     |
| `constants.ts`          | `CONTENT_TYPE_META` (icon + url slug + badge tone), `contentTypeFromSlug` / `contentTypeSlug`, `VIEWABLE_MIME` + `isViewableMime` (pdf / epub / png / jpeg / webp — exactly the backend's `ALLOWED_MIME`), `mimeLabel`, `formatFileSize` (presentation only)                      |
| `api/contentApi.ts`     | `list` / `get` / `fileDownload` / `listCategories` — maps `search` → the backend `q` param; `toContentItem()` does the trim; `readMeta` tolerates a missing envelope `meta`                                                                                                       |
| `api/queryKeys.ts`      | `contentKeys.list(filter)` (full filter set in the key), `.detail(id)`, `.file(contentId, fileId)`, `.categories()`                                                                                                                                                               |
| `validation/schemas.ts` | `contentErrorMessage` — 404 / 403 → Arabic; generic fallback (§32)                                                                                                                                                                                                                |
| `openExternal.ts`       | `openExternalUrl` — the ONLY way a URL is handed to the OS; **http/https only** (rejects `javascript:` / `file:` / `data:` / custom schemes / unparseable — §25, §33). `extractLinks` pulls bare `http(s)://` URLs out of a plain-text body.                                      |
| `hooks/useContent.ts`   | `useContentList` (infinite) · `useContentItem` (404/403 no-retry) · `useContentCategories` (5-min stale) · `useContentFileUrl` (**lazy** — `enabled`-gated so a list never fires N download-URL calls; `staleTime: 0`, `gcTime: 60s` so a signed URL is not held long — §21, §35) |
| `components/`           | `ContentCard` (+ skeleton) · `ContentFilters` (type chips + category chips) · `ContentBody` (safe plain-text renderer) · `ContentFileRow`                                                                                                                                         |
| `screens/`              | `ContentHomeScreen` · `ContentListScreen` · `ContentDetailScreen` · `ContentFileScreen`                                                                                                                                                                                           |

### Screens & navigation

| Screen                | Route                                      | What                                                                                                                                                                                                                                                                                                                        |
| --------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ContentHomeScreen`   | `/content`                                 | Search (server-side `q`, debounced) + category chips + type-filter chips + one infinite list. Three type entry cards (Articles / Magazines / Books) on top, hidden once a search / filter is active. **No "featured" / "popular"** — the backend has no such ranking (§2).                                                  |
| `ContentListScreen`   | `/content/[type]`                          | Type-scoped infinite list (`articles` / `magazines` / `books`; unknown slug → all). Same search + category filter.                                                                                                                                                                                                          |
| `ContentDetailScreen` | `/content/item/[contentId]`                | Cover (resolved lazily via `useContentFileUrl`, icon fallback), type badge, title, author, category chips, published date, description, **`ContentBody`**, then a files list (non-COVER) → `ContentFileScreen`. `404`/`403` → neutral "content unavailable" (covers unpublished / archived / deleted / invalid — §17, §18). |
| `ContentFileScreen`   | `/content/item/[contentId]/files/[fileId]` | The reader entry (§10, §11). Resolves the backend URL, shows file name / type / size, a signed-URL expiry note, and an **Open / Read** button → `openExternalUrl` (OS viewer renders PDF / EPUB / image natively). Non-viewable MIME → an "open externally" affordance instead.                                             |

Entry points: a "Knowledge" card on the Pet Owner **Home** and on **Veterinarian
Home** → `/content`. Route files under
`app/(app)/content/{_layout,index,[type]/index,item/[contentId]/{index,files/[fileId]}}.tsx`;
`content` registered on the `(app)` stack. No new tab; existing navigation
untouched.

## 114. Reader implementation — why no in-app PDF canvas

`ContentFileScreen` hands the backend-authorized URL to the OS via
`Linking.openURL` (from **`expo-linking`, already a dependency** — no new
package). A true in-app paginated / zoomable PDF renderer (`react-native-pdf`
or a WebView-based viewer) needs a **native module + `expo prebuild` / a dev
client**, which this project — a managed Expo app with a green
`expo export --platform web` gate — deliberately does not use (§11: "check Expo
SDK compatibility, native requirements … Do not blindly install packages").
The OS PDF viewer / browser renders `application/pdf` and images natively, which
satisfies §10 ("provide the backend-supported download/open behavior … Do not
implement a custom document renderer unless required"). An in-app PDF canvas is
**BACKEND-INDEPENDENT future work** — it only needs a dev-client build.

## 115. Article body rendering & link safety (§6, §25, §33)

`ContentBody` renders `item.body` inside a single React Native `<Text>`
element. RN `<Text>` **never interprets HTML, Markdown or scripts** — the string
is shown literally, which is the sanitisation the backend asks clients to do. No
`WebView`, no HTML parser, no `dangerouslySetInnerHTML` equivalent exists in the
content module. Bare `http(s)://` URLs found in the body are surfaced as a
separate tappable list (not inline-linkified, to avoid parsing ambiguity) and
opened only through `openExternalUrl`, which allows `http:` / `https:` and
nothing else.

## 116. Query keys & cache (§26–§28)

- **Keys** — `contentKeys.list({ type, categoryId, search, pageSize })` puts the
  whole filter set in the key, so an Articles query, a Books query and a search
  query never overwrite each other. `contentKeys.detail(id)` and
  `contentKeys.file(contentId, fileId)` are separate namespaces.
- **Lists** — `useInfiniteQuery`, `page` / `pageSize`, `getNextPageParam` from
  `meta.page < meta.totalPages`, `staleTime: 15_000`; the detail / file queries
  skip retry on `403` / `404`.
- **Invalidation** — there are **no mobile content mutations** (management is
  backend admin only), so there is nothing to invalidate. If a future phase adds
  a mobile management area, it would invalidate `contentKeys.lists()` on
  create / publish / archive / delete and `contentKeys.detail(id)` on update
  (§28) — noted, not built.

## 117. Security & privacy review (§33, §34, §35)

- **Unpublished / rejected content** — unreachable: `GET /content` returns only
  PUBLISHED non-deleted rows and `GET /content/:id` 404s anything else. The app
  has no "status" concept and no admin list call.
- **Moderation / authorship metadata** — stripped in `contentApi.toContentItem`
  before it leaves the API layer (verified by test). Screens render only the
  trimmed `ContentItem`.
- **Private files / IDOR** — file bytes are reached only through
  `GET /content/:id/files/:fileId/download`, which re-checks
  `content.status === 'PUBLISHED'`; the id pair is a route param and the backend
  authorizes each call. No `storageKey` is ever sent to the client.
- **R2 credentials** — none anywhere. A repo-wide grep for `R2_` /
  `SECRET_ACCESS_KEY` / `ACCESS_KEY_ID` / bucket secrets is clean (§44.24). All
  storage access is the backend-issued URL.
- **Unsafe HTML / JS** — impossible: plain-text `<Text>` rendering + an
  http/https-only URL opener (§115).
- **Signed-URL leakage** — `useContentFileUrl` uses `staleTime: 0` /
  `gcTime: 60s` and is never persisted; the URL is opened, not stored (§35).
- **Sharing (§24)** — not implemented: the backend exposes no public shareable
  content URL and internal ids / private file URLs must not be shared, so no
  share affordance is offered.

## 118. Tests (Phase 11)

New suites under `src/features/content/__tests__/` (**41 tests / 8 suites**):

| Suite                 | Covers                                                                                                                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `contentApi`          | `list` GETs `/content`, maps `search` → `q`; **trims `status` / `createdByUserId` / `updatedByUserId` / `deletedAt` and the file `storageKey` off every item**; missing-`meta` tolerance; get / fileDownload / listCategories URLs                            |
| `openExternal`        | `openExternalUrl` opens http(s), **rejects `javascript:` / `file:` / `data:` / `ftp:` / malformed / empty without calling `openURL`**; returns false when the OS can't open it; `extractLinks` pulls unique http(s) URLs, ignores everything else             |
| `contentHooks`        | list key differs per filter set; infinite pagination via backend meta; `useContentItem` does **not** retry a 404; `useContentFileUrl` is lazy until enabled                                                                                                   |
| `ContentHomeScreen`   | three type cards → type routes; search → backend `q`; category chip → `categoryId`; empty state; safe error state; card → detail                                                                                                                              |
| `ContentListScreen`   | `[type]` slug scopes the list (`magazines` → `MAGAZINE`); unknown slug → all; type-specific empty; card → detail                                                                                                                                              |
| `ContentDetailScreen` | renders title / description / body / categories / author; **a body with `<script>` / `<b>` markup is shown as literal text**, bare URL surfaced as a link entry; `404` → neutral not-found, raw message hidden; COVER file not listed, MAIN file → file route |
| `ContentFileScreen`   | resolves the backend URL, viewable PDF → **Open** calls `openURL(url)`; non-viewable → "open externally" label; expiry hint shown for a signed URL; `404` → file-unavailable, no leak                                                                         |
| `contentNavigation`   | route builders are deep-link-safe absolute paths; Pet Owner Home shows the Knowledge entry → `/content`; **Pet Owner "My Pets" still renders**                                                                                                                |

**447 tests / 81 suites, all passing** (406 / 73 before Phase 11). Full gate:
`tsc` clean · `eslint` clean · `prettier` clean · `expo-doctor` 18/18 · web
export OK · repo-wide R2-credential grep clean.

## 119. BACKEND SUPPORTED BUT NOT MOBILE-IMPLEMENTED

- **Content management** — `/admin/content*` and `/admin/content-categories*`
  (create / update / publish / unpublish=archive / delete / restore, file
  upload-URL + register + delete, category CRUD) are fully implemented
  server-side and gated by `authorizeContent(<permission>)` (ADMIN override /
  CONTENT supervisor domain, + approved-vet; `content.delete` is ADMIN-only).
  The mobile app has **no content-management area** and Phase 11 is scoped to
  the user-facing read experience (§19), so none of it was built. When a mobile
  admin content area is added, the R2 upload flow to reuse is
  `POST …/files/upload-url` → PUT to the returned URL → `POST …/files`
  (register); the invalidation rules are in §116.
- **Admin file download** — `GET /admin/content/:id/files/:fileId/download`
  (any state, `content.read`) — not wired; the public `/download` route covers
  every user-facing need.

## 120. BACKEND DEPENDENCY (missing / absent — documented, not mocked)

- **No `sort` parameter** on `GET /content` — so no "Newest / Oldest / Recently
  updated" control is offered (§16). The list uses the backend's default order.
- **No author / date / tag filter** — only `type`, `categoryId`, `q` exist
  (§15).
- **No "featured" / "popular" / "recommended" / "recently viewed" ranking** — no
  endpoint, so no such section (§2).
- **No bookmarks / favorites** — no backend model. Not faked with local storage
  (§22).
- **No reading-progress model** — no backend endpoint, and a local-only
  progress store was judged not useful enough to add for a mostly
  article/PDF corpus (§23).
- **No public shareable content URL** — so native sharing is not exposed (§24).
- **No name resolution** — `authorName` is a free-text string the backend
  stores; there is no user-lookup endpoint for the (stripped) `createdByUserId`
  (shared §74 / §85 / §96 / §110).
- **Cover images cost one extra round-trip** — a COVER file has no inline URL;
  `ContentDetailScreen` resolves it via `useContentFileUrl`. List cards use the
  type-icon tile rather than firing a download-URL call per row.

## 121. Recommended Mobile Phase 12

**Notifications inbox + `/users/:id` public profile** — unchanged from §111,
still the highest-value pair with live backend support. `/notifications` +
`/notifications/devices` + `/notifications/preferences` + `unread-count` give
every user a real inbox (the `src/services/notifications/` device-token stub is
in place), and a `/users/:id` lookup finally turns the UUIDs behind
medical-record / poultry / publication / product / content authorship into
names. After that, **chat** (`/conversations`, Pet Owner ↔ Clinic) or
**consultations** (`/consultations`) are the next self-contained workflows with
mounted backend modules. A mobile **content-management area** (§119) is a
smaller, well-specified follow-up if content editors need to work from the
phone.

---

# Mobile Phase 12 — Animals & Veterinary Medical Records

Phase 12 is a **fill-the-gaps** phase over the already-shipped animal + medical
surface: Pet CRUD (Phase 3, `features/pets/`), organization animal management
(Phase 5, `features/animals/`), medical records + vaccinations (Phase 6,
`features/medical/`) and poultry (Phase 7, `features/farm/`) were all built
earlier. The pre-Phase-12 **backend gap audit** confirmed every use case
(UC-001…UC-017) is supported and added one endpoint — `GET /users/:id`. Phase 12
consumes that endpoint and the two animal/medical backend capabilities the app
had not yet wired: **ownership transfer + history** and the **medical-history
timeline**.

## 122. What was built (IMPLEMENTED)

| Area                         | Delivered                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User name resolution**     | New leaf feature `src/features/users/` — `usersApi.getSummary(id)` → `GET /users/:id` → `{ id, firstName, lastName, veterinarianStatus }`; `useUserSummary(id)` (10-min stale, 404/403 no-retry); `<UserName userId={…} fallback={…}/>` inline component. Wired into `MedicalRecordCard` / `VaccinationCard` / their detail screens ("recorded by …"), `MedicalTimelineItem`, `OwnershipHistoryScreen` and the transfer recipient field. Closes the recurring §74 / §85 / §96 "no name resolution" limitation.                                                                                                            |
| **Ownership transfer**       | `PATCH`-free `POST /animals/:id/ownership/transfer` (`petsApi.transferOwnership`) + `useTransferOwnership` mutation. `TransferOwnershipScreen` (`/pets/[petId]/transfer`): a user-id field (there is **no backend user search** — §28-style search is not offered), live name resolution via `useUserSummary`, a self-target guard, a `ConfirmationDialog`, then the transfer. On success invalidates `petKeys.lists()` + `petKeys.detail(id)` + `petKeys.ownership(id)`. No request / acceptance step (§8).                                                                                                              |
| **Ownership history**        | `GET /animals/:id/ownership/history` (`petsApi.ownershipHistory`) + `usePetOwnershipHistory`. `OwnershipHistoryScreen` (`/pets/[petId]/ownership`): the owner chain newest-first, `owner` name from the DTO's own join (fallback `<UserName>`), a "current" badge, transfer date + reason + "transferred by". A `404` / `403` → neutral "not available" state.                                                                                                                                                                                                                                                            |
| **Medical-history timeline** | New `medicalHistoryApi` (`listForOwner` / `listForClinic` → `GET [/organizations/:orgId]/animals/:id/medical-history?page&pageSize&type`), `useMedicalTimeline` (infinite, scope-aware, `type` backend filter), `MedicalTimelineItem`, and `MedicalTimelineScreen` mounted at **both** `/pets/[petId]/medical-history` (owner) and `/organizations/[organizationId]/animals/[animalId]/medical-history` (clinic) via the existing `useMedicalRouteScope`. One backend-ordered list of records + vaccinations; All / Records / Vaccinations filter chips; tapping an entry opens the matching record / vaccination detail. |
| **Navigation**               | `PetDetailsScreen` gains an **Ownership** section (current owner, "Ownership history", "Transfer ownership" when `isOwner && ACTIVE`) and a "Full medical history" row in the medical section. `OrganizationAnimalDetailScreen` gains a "Full medical history" row (gated on `canViewOrganizationMedical`). Route builders `petTransfer` / `petOwnership` / `petMedicalHistory` / `orgAnimalMedicalHistory` in `src/constants/routes.ts`.                                                                                                                                                                                 |

## 123. Query keys & cache invalidation (§37, §38)

- `userKeys.summary(userId)` — one shared entry per user id; long `staleTime`.
- `petKeys.ownership(petId)` = `[...petKeys.detail(petId), 'ownership']`.
- `medicalKeys.timeline(animalId)` / `medicalKeys.timelineList(animalId, scope, type)` —
  `scope` is `clinic:<orgId>` / `owner`, `type` is `MEDICAL_RECORD` / `VACCINATION` / `ALL`,
  so owner / clinic / filtered timelines never collide.
- **After a transfer** — invalidate `petKeys.lists()` (the pet leaves the
  caller's list), `petKeys.detail(petId)`, `petKeys.ownership(petId)`. No
  optimistic write.
- Medical record / vaccination mutations already invalidate
  `medicalKeys.forAnimal(animalId)` (Phase 6), whose prefix now also covers the
  new `timeline` sub-tree — so a new record / vaccination refreshes the timeline
  with no extra wiring.

## 124. Authorization, security & privacy

- **Ownership transfer** — the backend requires the caller to be the current
  owner (or ADMIN) and the recipient to be an ACTIVE user who is not already the
  owner; the client only _hides_ the button for a non-owner and re-maps the
  backend errors (`ANIMAL_NOT_ACTIVE` → archived, `INVALID_TRANSFER_TARGET` →
  can't transfer to this user, `404` → recipient not found, `409` → concurrent
  change, `403` → not the owner). No arbitrary owner change is possible — there
  is no "set owner" field, only "transfer to a user id", server-verified.
- **`GET /users/:id`** exposes only a name + veterinarian status — no email,
  phone, account status or roles. `<UserName>` shows the fallback (never a raw
  UUID) on `404` / `403` / null id and does not retry.
- **Medical timeline** reuses the Phase 6 authorization exactly: OWNER path
  (`withAnimal` → current owner / ADMIN) or CLINIC path (`withOrganization` →
  `authorizeOrg('medical_record.read')` → `withVeterinaryAnimalAccess`). No
  client shortcut ("is a vet → sees everything"). Medical notes / diagnoses are
  never logged or put in analytics (§42) — the app has no analytics layer.
- **Cross-org / cross-user** — every screen fetches and validates its own data
  by route param; the backend 404s a pet / record / animal-history request the
  caller is not entitled to, and the screens collapse those to neutral
  not-found / not-available states.

## 125. Tests (Phase 12)

New suites (**+27 tests / +7 suites**):

| Suite                               | Covers                                                                                                                                                                                                                                                                           |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users/usersApi` · `users/UserName` | `getSummary` URL; `<UserName>` renders the resolved name, the fallback for a null / unresolvable id (never the raw id), no retry on `404`                                                                                                                                        |
| `pets/ownership`                    | `ownershipHistory` / `transferOwnership` URLs + body; `useTransferOwnership` invalidates lists + detail + ownership; `403` propagates; `usePetOwnershipHistory` no-retry on `404`/`403`; `buildTransferSchema` (UUID recipient); `transferErrorMessage` mapping, raw text hidden |
| `pets/TransferOwnershipScreen`      | resolves the recipient id → name → confirm → `POST` with `{ toUserId, reason }` → `router.replace`; self-target blocked (no API call); `404` → mapped message, raw hidden; a non-owner sees the "not allowed" state                                                              |
| `pets/OwnershipHistoryScreen`       | renders the owner chain, current badge, transfer reason; `403` → neutral state, no raw error                                                                                                                                                                                     |
| `pets/phase12Navigation`            | route builders are deep-link-safe; owner Pet Details shows + navigates Transfer / Ownership history / Full medical history; a non-owner sees no Transfer button                                                                                                                  |
| `medical/medicalTimeline`           | `medicalHistoryApi` owner + clinic URLs (`type` param); `MedicalTimelineScreen` scope-aware (owner vs `/organizations/…`), records + vaccinations listed, filter chip narrows the backend query, entry → matching detail route, empty state                                      |

**474 tests / 88 suites, all passing** (447 / 81 before Phase 12). Full gate:
`tsc` clean · `eslint` clean · `prettier` clean · `expo-doctor` 18/18 · web
export OK.

## 126. BACKEND SUPPORTED BUT NOT MOBILE-IMPLEMENTED

- **Admin animal / medical operations** — none exist as distinct endpoints; ADMIN
  uses the same owner / clinic routes via the override, already reachable.
- **`GET /animals?species=` / `?status=` filters** — the backend accepts them
  and `PetListFilter` carries `species`; only `search` is surfaced in the My
  Pets UI today (Phase 3 decision), the rest is a one-line addition when needed.

## 127. BACKEND DEPENDENCY (absent — documented, not mocked)

- **Animal images / photos (§4, §5)** — no image column on `animals`, no R2 seam
  for animals. `PetImage` stays a species-placeholder that is upload-ready for a
  future backend field. Not mocked.
- **Structured treatments / medications (§21)** — `medical_records.treatment` is
  a single free-text field; there is no treatment / medication entity with
  dosage / frequency / duration / start-end dates. The pre-Phase-12 audit
  classified this as spec-acknowledged future work (docs 04 §4.4 lists
  "Treatments" with no fields or use case). `OrganizationAnimalDetailScreen`
  keeps a disabled "Treatments" placeholder row.
- **Medical attachments (§22)** — no `content_files`-equivalent for medical
  records / vaccinations; the storage-key prefix `medical-records/` is reserved
  server-side but unused. No upload UI; not mocked.
- **Vaccination `dose` (§20)** — not a backend field; not shown.
- **Medical summary endpoint (§24)** — no `GET …/medical-summary` (last visit /
  latest vaccination / active treatments). The timeline's first page is the
  closest supported view; no client-side aggregation across all records is done.
- **User directory search (§28-style)** — `GET /users/:id` resolves a known id
  but there is no user search / list endpoint, so the ownership-transfer
  recipient is entered as a raw user id (with live name confirmation) rather
  than picked from a searchable list.

## 128. Recommended Mobile Phase 13

**Notifications inbox** (`/notifications` + `/notifications/devices` +
`/notifications/preferences` + `unread-count`; the `src/services/notifications/`
device-token stub is in place) — an owner learns a listing was APPROVED /
REJECTED, a vet learns of a new clinic assignment, without polling. After that,
**chat** (`/conversations`, Pet Owner ↔ Clinic) or **consultations**
(`/consultations`) are the next self-contained workflows with mounted backend
modules. Animal photos + medical attachments + a structured treatment model all
remain **backend-first** work (§127).

---

# Mobile Phase 13 — Consultations & Inquiries

## 129. IMPLEMENTED — new feature module `src/features/support/`

One **thread + message** kernel serving two distinct domain concepts kept in
separate UI sections (never merged): **Consultations** (any authenticated user;
optional owned-animal link) and **Inquiries** (approved-veterinarian only; never
animal-linked). The "description" of a request **is its first message** — the
backend thread DTO has no title / description / category.

| Piece                                                                           | Files                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contract types (mirror `server/src/modules/consultations`)                      | `types/index.ts`                                                                                                                                                                                                           |
| Per-kind wiring (slug, icon, permission keys, supervisor domain, realtime room) | `constants.ts` — `SUPPORT_KIND_META`                                                                                                                                                                                       |
| API wrappers (one factory per kind)                                             | `api/supportApi.ts` — `makeThreadApi`, `consultationApi`, `inquiryApi`, `threadApi(kind)`, `aiSettingsApi`                                                                                                                 |
| Query keys                                                                      | `api/queryKeys.ts` — `supportKeys`                                                                                                                                                                                         |
| Form + error-map validation                                                     | `validation/schemas.ts`                                                                                                                                                                                                    |
| Data hooks                                                                      | `hooks/` — `useMyThreads`, `useAdminThreads`, `useThread`, `useThreadMessages`, `useCreateThread`, `useSendMessage`, `useCloseThread`, `useSetSenderBlocked`, `useThreadRealtime`, `useAiSettings` / `useUpdateAiSettings` |
| Components                                                                      | `components/` — `ThreadCard` (+ skeleton), `ThreadStatusBadge`, `MessageBubble`, `MessageComposer`, `AiSettingsCard`                                                                                                       |
| Screens                                                                         | `screens/` — `ThreadListScreen`, `CreateThreadScreen`, `ThreadDetailScreen`, `AdminThreadListScreen`                                                                                                                       |
| Routes                                                                          | `app/(app)/support/[kind]/{index,create,manage,[threadId]}.tsx` + `_layout.tsx`                                                                                                                                            |

**Navigation.** `Routes.support(slug)` / `supportCreate` / `supportManage` /
`supportThread(slug, id)` — `slug ∈ {consultations, inquiries}`, every value an
absolute deep-link-safe path. Entry points: Pet Owner Home and Veterinarian Home
each carry a "Consultations & Inquiries" section (2 nav cards + conditional
management cards); the Management Centre wires the supervisor review queues and
the AI-settings card. `My Pets` and every earlier section are untouched.

## 130. BACKEND SUPPORTED — endpoints integrated (exactly, no invention)

Mount points `/consultations` and `/inquiries` share one route shape; `/admin/…`
is the supervisor / admin surface.

| Method      | Path                                            | Caller                          | Mobile                                  |
| ----------- | ----------------------------------------------- | ------------------------------- | --------------------------------------- |
| GET         | `/<slug>?page&pageSize&status`                  | creator (own threads)           | `useMyThreads`                          |
| POST        | `/<slug>` — `{ body, animalId? }` \| `{ body }` | auth + eligibility              | `useCreateThread`                       |
| GET         | `/<slug>/:id`                                   | CREATOR or RESPONDER (else 404) | `useThread`                             |
| GET         | `/<slug>/:id/messages?page&pageSize`            | CREATOR or RESPONDER            | `useThreadMessages`                     |
| POST        | `/<slug>/:id/messages` — `{ body }`             | writable thread                 | `useSendMessage`                        |
| POST        | `/<slug>/:id/{close,block,unblock}`             | responder / admin               | `useCloseThread`, `useSetSenderBlocked` |
| GET         | `/admin/<slug>?page&pageSize&status&createdBy`  | `<kind>.admin.read`             | `useAdminThreads`                       |
| GET         | `/admin/<slug>/:id`                             | `<kind>.admin.read`             | `useThread(kind, id, { admin:true })`   |
| GET / PATCH | `/admin/ai-settings`                            | `ai.settings.manage`            | `useAiSettings` / `useUpdateAiSettings` |

`created_by_user_id`, the responder identity, and every message `source`
(`USER` / `SUPERVISOR` / `ADMIN` / `AI` / `SYSTEM`) are **server-derived** — the
client never sends them. The message DTO uses `threadId`; `normalizeMessage`
also accepts `consultationId` / `inquiryId` defensively.

## 131. Authorization — backend permissions only (§21, §26)

No `if (role === 'VETERINARIAN')` anywhere. All gating is `useCapabilities()`:

- **See the review queue / manage card** — `caps.isAdmin ||
caps.isSupervisorOf('CONSULTATION' | 'INQUIRY') || caps.can('<kind>.admin.read')`.
  The two domains are independent: a CONSULTATION system-supervisor is **denied**
  the inquiry queue (`AdminThreadListScreen` renders "not available" and never
  fires `useAdminThreads`), and vice-versa.
- **Respond / close / block a sender** — `caps.can('<kind>.respond' |
'<kind>.close')`; controls are hidden otherwise **and** the backend
  re-authorises every call (§26 — hiding a control is never the only defence).
- **Create an inquiry** — client shows an approved-vet hint and disables submit
  for a non-vet, but the backend `createEligibility` check is authoritative.
- **Consultation Supervisor / Inquiry Supervisor are SYSTEM supervisors** — they
  come from `session.supervisorDomains` (the `system_supervisor_assignments`
  architecture), never from organization `SUPERVISOR` membership.
- A non-participant on `GET /<slug>/:id` gets **404** (existence hidden);
  `useThread` does not retry 404 / 403 and the screen shows a neutral
  "conversation not available" state.

## 132. Query keys & cache invalidation (§28, §29)

`supportKeys` is keyed **by `kind` first** so consultations and inquiries never
share a cache entry: `forKind` → `myList` / `adminList` (scoped `'mine'` vs
`'admin'`, then filter) → `detail` → `messages` (nested under `detail`);
`aiSettings()` is separate. Lists are `useInfiniteQuery` (`staleTime 15 000`);
messages `useInfiniteQuery` (`staleTime 10 000`, oldest→newest); detail
`useQuery`. **No optimistic writes** — mutate → server success → invalidate the
narrowest prefix:

| Mutation              | Invalidates                                                                    |
| --------------------- | ------------------------------------------------------------------------------ |
| `useCreateThread`     | `myLists(kind)`                                                                |
| `useSendMessage`      | `messages(kind,id)` · `detail(kind,id)` · `myLists(kind)` · `adminLists(kind)` |
| `useCloseThread`      | `detail(kind,id)` · `myLists(kind)` · `adminLists(kind)`                       |
| `useSetSenderBlocked` | `detail(kind,id)`                                                              |
| `useUpdateAiSettings` | `setQueryData(aiSettings())`                                                   |

## 133. Realtime integration — IMPLEMENTED via the existing transport (§33)

`useThreadRealtime(kind, threadId)` subscribes through the **already-present**
`realtimeClient` (`src/services/realtime`, connected by `RealtimeGate` when
authenticated). **No new websocket code.** It joins the backend room
`consultation:<id>` / `inquiry:<id>` and listens for
`<singular>.message.created` / `.closed` / `.sender_blocked` /
`.sender_unblocked` — all ids-only payloads — and on any of them invalidates
`supportKeys.messages` + `supportKeys.detail` so the REST hooks refetch. If the
socket is down the screen still works via pull-to-refresh and post-send
invalidation. A full realtime chat UI remains a **FUTURE PHASE** (§25).

## 134. Notification integration — none (no mobile surface yet)

The backend fans `<singular>.message.created` to the creator's user room, but the
mobile app still has **no notifications inbox** (that is the recommended next
phase, §137). Phase 13 adds **no** new notification system (§32). Nothing here
depends on one.

## 135. Message rendering & privacy (§34, §35, §36)

- `MessageBubble` renders every body as a plain RN `<Text>` — no HTML, no
  markup execution. `USER` messages from the signed-in user align end; everyone
  else aligns start with a role label / resolved name; `SYSTEM` is centred and
  muted; a soft-deleted message shows a placeholder, never the original body.
- **Image attachments (added by the image audit).** CONSULTATION / INQUIRY
  accept up to `MAX_THREAD_IMAGES` (6) photos on the thread's **first** message
  — the backend has had `POST /<slug>/attachments/upload-url` + `imageKeys` on
  create and `imageUrls` on every message DTO since Phase 13; only the mobile
  wiring was missing. `CreateThreadScreen` stages them through the shared
  `MultiImagePicker` (presign → direct R2 `PUT` → storage keys), and
  `MessageBubble` renders `message.imageUrls` as `ImageThumbnailRow`
  thumbnails that open the shared `ImageViewer`. A soft-deleted message hides
  its attachments along with its body. SUPPORT ("تواصل معنا") has
  `maxAttachmentImages: 0` server-side, so the picker is hidden for it.
  Follow-up messages stay body-only for every kind.
- **Nothing sensitive is logged or sent to analytics** — no consultation
  descriptions, inquiry content, message bodies, or private URLs. Errors go
  through `supportErrorMessage`, which maps known codes
  (`THREAD_NOT_WRITABLE` → blocked / closed, `PERMISSION_DENIED` / 403 / 404 / 409) to localised copy and never surfaces raw backend text.
- Client-supplied ids are never trusted (§34): every list/detail/mutation is
  re-authorised server-side; the composer is fully **disabled** (not just
  hidden) on a CLOSED thread or for a blocked sender.

## 136. Tests (Phase 13)

`src/features/support/__tests__/` — 5 suites / 51 tests:

- `supportApi.test.ts` — `makeThreadApi` URL construction for both kinds, admin
  surface, `normalizeMessage` id-aliasing, create / send payload shape,
  block/unblock paths, `aiSettingsApi`, `supportKeys` namespacing, validation
  schemas, `supportErrorMessage` mapping.
- `supportHooks.test.tsx` — infinite-list flattening + `total`, `useThread` no
  retry on 404 / 403, `admin` → `getAdmin`, message ordering, every mutation's
  invalidation set, `useAiSettings` no retry on 403.
- `supportComponents.test.tsx` — `MessageBubble` alignment / role label /
  system / soft-deleted; `MessageComposer` disabled-until-typed and
  fully-disabled-with-reason; `ThreadStatusBadge`; `ThreadCard` hints +
  `showCreator`.
- `supportScreens.test.tsx` — list render + open + create nav, manage-chip
  visibility by capability, detail 404 → not-available, creator composer,
  closed-thread disabled composer, non-participant sees no composer, responder
  sees block control; create-screen vet gate + owned-animal picker + body-only
  submit; **admin queue scoping — a CONSULTATION supervisor is denied the
  INQUIRY queue**, admin sees both.
- `supportNavigation.test.tsx` — route builders are absolute deep-link paths,
  `kindFromSlug` / `kindSlug` / `threadRoom` helpers, Pet Owner Home renders the
  Phase 13 entry **alongside** an intact My Pets section, Veterinarian Home
  renders it with management cards gated off.

Full suite after Phase 13: **93 suites / 525 tests** green (was 88 / 474).
`tsc --noEmit`, `eslint`, `prettier --check`, `expo-doctor` (18/18),
`expo export --platform web` all pass.

## 137. Remaining limitations

**BACKEND DEPENDENCY (absent — documented, not mocked):**

- **Attachments / media on threads or messages** — no `content_files`-equivalent,
  no R2 seam for consultations. `MessageComposer` is text-only; there is no
  attach button. Not mocked.
- **Title / description / category fields** — not in the thread DTO. The list
  card surfaces status + kind + last-activity + AI / animal / blocked hints (no
  body preview, because the backend returns none).
- **Message edit / delete by the author** — no endpoint. A `deletedAt` from the
  server is rendered as a placeholder; the client offers no edit/delete action.
- **Search / category / free-text filter** — only `status` (and admin
  `createdBy`) are backend query params; those are the only filters shown.
- **Admin status-change / supervisor-reassignment endpoints** — none. The admin
  surface is read + the same close / block / unblock actions a responder has.

**FUTURE PHASE:**

- **Realtime chat UI** (typing indicators, read receipts, live message stream
  rendered in place) — Phase 13 wires query invalidation through the existing
  transport only (§133); a dedicated realtime phase owns the rest (§25).
- **Notifications inbox** — surfacing `<singular>.message.created` to the user
  outside an open thread (§134, §137-next).

**INTENTIONAL PRODUCT DECISION:**

- Consultation and Inquiry are **separate UI sections** with separate list /
  create / manage routes though they share one backend kernel (§3).
- The ownership-transfer-style "enter a raw id" pattern is **not** reused here —
  a responder never needs to address a specific user; the thread relationship is
  the addressing.

---

# Mobile Phase 14 — Jobs & Freelance Offers — NOT IMPLEMENTED (no backend)

**Status: blocked. No code was written.** Phase 14 re-briefs the same
freelance-marketplace workflow that Mobile Phase 9 already investigated
(§98–§102): a Pet Owner publishes a _Job_, veterinarians browse eligible Jobs
and submit _Offers_, the owner compares Offers and _accepts_ one, plus
Supervisor / Admin management surfaces. The brief's own rule governs the
outcome — _"The backend is the source of truth. DO NOT invent APIs, fields,
statuses, permissions, workflows, or business rules. … If anything required by
this phase is missing from backend: DO NOT mock it. Create a clear report."_

## 138. Backend investigation (re-verified for Phase 14)

Everything below was re-checked against the current `server/` tree, not carried
over from Phase 9.

| Source inspected                                                                    | Result                                                                                                                                                                                                                                                                                                             |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `server/src/modules/` (17 modules)                                                  | animals · audit · auth · authorization · chat · consultations · content · farms · health · notifications · organizations · rbac · supervisors · users · veterinarians · veterinary-care · veterinary-store. **No** jobs / offers / freelance / bids / proposals module                                             |
| `server/src/routes/index.ts` (every mount)                                          | health · auth · veterinarians · users · organizations · animals · veterinary-care · farms · animal-publications · veterinary-store · chat/conversations/messages · consultations/inquiries · content/content-categories · notifications · admin/\*. **No** `/jobs`, `/offers`, `/freelance`, `/bids`, `/proposals` |
| `server/src/database/migrations/` (21)                                              | … `20260903010000_consultations_inquiries` · `20260904010000_content` · `20260905010000_notifications`. **No** job / offer / bid / proposal table                                                                                                                                                                  |
| `server/src/openapi/phase*.ts`                                                      | Server fragments `phase2`…`phase15` map to auth → notifications. Server `phase14.ts` = **Content**; server `phase15.ts` = **Notifications**. **None** defines a job/offer path                                                                                                                                     |
| `PERMISSION_KEYS` (`rbac.constants.ts`, ~52)                                        | auth/user/role/permission/supervisor · veterinarian · animal · chat · consultation · inquiry · content · ai.settings · notification · audit · organization.admin. **No** `job.*` / `offer.*` / `bid.*` / `hire.*` key                                                                                              |
| `SUPERVISOR_DOMAINS` (`rbac.constants.ts`)                                          | `ANIMAL` · `CLINIC` · `STORE` · `CONTENT` · `CONSULTATION` · `INQUIRY`. **No** `JOB` domain — so §22/§23's "Job Supervisor" cannot exist                                                                                                                                                                           |
| Realtime event registry (`*/realtime/*.ts`)                                         | `chat.*` · `consultation.*` / `inquiry.*` · `content.*` · `notification.*`. **No** `job.*` / `offer.*` event                                                                                                                                                                                                       |
| Notification `type` catalogue                                                       | Backend notification types cover chat / consultation / content / org / vet-application events. **No** `job` / `offer` notification type                                                                                                                                                                            |
| `docs/01_SCOPE.md`, `04_MODULES_FEATURES.md`, `05_USE_CASES.md`                     | No Jobs / Freelance / marketplace / service-request module in current **or** future scope. The Arabic "عرض" hits are "display / showcase" (store products), not "offer"                                                                                                                                            |
| Full-source grep `\b(job\|offer\|proposal\|bid\|gig\|freelance\|vacancy\|hiring)\b` | Only incidental hits — "background job runner", "durable queued job" (ops infra). Zero feature code                                                                                                                                                                                                                |

**Conclusion:** unchanged from Phase 9. The Jobs / Freelance Offers system does
not exist at any layer of the backend (module · route · table · DTO · status
enum · permission · supervisor domain · realtime event · notification type) and
is not a planned capability in the product docs. There is nothing to integrate
against, and every screen the brief asks for (My Jobs, Create Job, Job Details,
Offers, Submit Offer, My Offers, Accept/Reject Offer, Job Management, Admin →
Jobs) would require inventing the entire contract.

## 139. BACKEND DEPENDENCY report (§41 format)

| Field               | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Feature**         | Jobs & Freelance Offers (Pet Owner posts a Job → Veterinarians submit Offers → Owner accepts one; + Supervisor & Admin management)                                                                                                                                                                                                                                                                                                                            |
| **Missing**         | Job entity + status enum; Offer entity + status enum; ownership model; vet-eligibility rules; `job.*` / `offer.*` permissions; a `JOB` supervisor domain; create/list/get/edit/cancel Job endpoints; submit/list/get/accept/reject Offer endpoints; server-side search / status / category filters + pagination for both; Job/Offer attachment fields on R2; `job.*` / `offer.*` realtime events; `job` / `offer` notification types; any Job admin endpoints |
| **Expected**        | A `veterinary-jobs` (or `jobs`) backend module — see §100 for an illustrative shape — with its OpenAPI fragment, mirroring how Phase 13 (consultations) and Phase 10 (store) were shipped backend-first                                                                                                                                                                                                                                                       |
| **Current backend** | 17 modules, none jobs-related; highest documented surface is server `phase15` = Notifications. No jobs table in 21 migrations. No jobs permission/domain/event/notification-type                                                                                                                                                                                                                                                                              |
| **Impact**          | The whole of Mobile Phase 14 is blocked. No feature module, screen, route, hook, query key, i18n namespace, component or navigation entry can be built without mocking the contract, which §41 forbids. Definition of Done (§46) is unreachable                                                                                                                                                                                                               |

## 140. Mobile-side impact / what was NOT changed

No feature module, screen, route, hook, query key, i18n namespace, component or
navigation entry was added. Pet Owner Mode, Veterinarian Mode, the Management
Centre and the Admin area are all untouched. `src/features/` still ends at
`support/` (Phase 13). The only change in this phase is this documentation
section. Verification (`tsc` / `eslint` / `prettier` / `jest` 93·525 /
`expo-doctor` 18·18 / `expo export --platform web`) was re-run to confirm the
tree is unchanged and green.

## 141. Recommended path forward

1. **Backend first** — implement a `veterinary-jobs` module (Job + Offer DTOs,
   two status enums, the accept/assign transition, the approved-vet visibility
   model, `job.*` / `offer.*` permissions, and — if wanted — a `JOB` supervisor
   domain). Ship its OpenAPI fragment so the mobile client has a contract. §100
   sketches the minimum surface.
2. **Then Mobile Phase 14** — the architecture is ready to absorb it with no
   redesign: a `src/features/jobs/` module mirroring `support/` /
   `publications/` (infinite lists, centralized query-key factory, no optimistic
   writes, narrowest-prefix invalidation), a Pet Owner Home entry, a
   Veterinarian Home "Available Jobs / My Offers" entry, a dual-mode
   `JobDetailsScreen` following the `PublicationDetailScreen` owner-vs-public
   pattern, and — only if a `JOB` domain is added — a Management Centre queue
   like the Phase 13 consultation/inquiry queues.
3. **Best next Mobile phase that _is_ buildable today** — the **Notifications
   inbox** (`/notifications`, `/notifications/unread-count`,
   `/notifications/read-all`, `/notifications/preferences`,
   `/notifications/devices`; realtime `notification.created` / `notification.read`;
   the `src/services/notifications/` device-token stub is already in place). It
   is fully backed by server `phase15` and is the missing surface that makes
   Phases 8, 13 (and a future 14) usable without polling.

---

# Mobile Phase 15 — Notifications (hybrid backend + mobile)

## 142. Backend audit outcome (§2)

The backend notifications module (`server/src/modules/notifications`) was found
**already complete** — domain aggregates, `notifications` /
`device_push_tokens` / `notification_preferences` tables, three repositories, a
`NotificationService` (deliver / list / unread-count / mark-read / mark-all /
preferences / device register-list-remove / admin broadcast), a post-commit
`NotificationEventHandler` on `EventBus` `ALL_EVENTS` with a loop guard, a
`NotificationPolicy` mapping domain events → recipients, all routes, realtime
`notification.created` / `notification.read` on the recipient's `user:<id>`
room, the Phase-1 FCM push infra with auto-revocation of invalid tokens, audit
on device + preference + broadcast, OpenAPI `phase15`, and 40 backend tests.

|                           |                                                                                                                                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Existing**              | everything above                                                                                                                                                                                         |
| **Partially implemented** | preferences = a single `pushEnabled` boolean (per-type is a documented future extension — brief §16)                                                                                                     |
| **Missing**               | three existing user-facing domain events had **no** `NotificationPolicy` mapping: `veterinarian.approved`, `veterinarian.rejected`, `user.status.changed`                                                |
| **Backend change made**   | see §143 — additive: 2 new `NOTIFICATION_TYPES`, 3 policy branches, 2 one-field event-payload additions. No migration, schema, endpoint, permission or supervisor-domain change. +5 backend tests → 575. |
| **Mobile-ready**          | yes — the mobile side is the bulk of this phase                                                                                                                                                          |

## 143. Backend change — event → notification coverage

- `notification.constants.ts` — added `VETERINARIAN_APPROVED`,
  `VETERINARIAN_REJECTED` to `NOTIFICATION_TYPES`.
- `veterinarian.service.ts` — `veterinarian.approved` / `veterinarian.rejected`
  now also carry `applicationId` (for a stable `sourceEventKey`).
- `notification.policy.ts` — three new `switch` branches:
  `veterinarian.approved` / `.rejected` → the applicant (`entityType:
'VETERINARIAN'`, key `veterinarian.approved:<applicationId>`);
  `user.status.changed` → the user as `ACCOUNT_STATUS_CHANGED` (already in the
  catalogue) with **no** `sourceEventKey` so an ACTIVE↔SUSPENDED cycle
  re-notifies each time.
- `openapi/phase15.ts` — `typeEnum` extended with the two new types.
- Tests: `notification-policy.test.ts` +3, `notifications.test.ts` +2.

## 144. IMPLEMENTED — new feature module `src/features/notifications/`

| Piece                                                                   | Files                                                                                                                                                                  |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contract types (mirror server `NotificationDTO` + `NOTIFICATION_TYPES`) | `types/index.ts`                                                                                                                                                       |
| Per-type icon / tone + `notificationHref` deep-link resolver            | `constants.ts`                                                                                                                                                         |
| API wrappers (1:1 with the backend routes)                              | `api/notificationsApi.ts`                                                                                                                                              |
| Query keys                                                              | `api/queryKeys.ts` — `notificationKeys`                                                                                                                                |
| Data hooks                                                              | `hooks/` — `useNotifications` (infinite), `useUnreadCount`, `useMarkNotificationRead`, `useMarkAllNotificationsRead`, `useNotificationRealtime`, `useOpenNotification` |
| Components                                                              | `components/` — `NotificationCard` (unread badge is an inline `Badge` on the Home entry cards)                                                                         |
| Screen                                                                  | `screens/NotificationsScreen.tsx`                                                                                                                                      |
| App-wide wiring                                                         | `src/providers/NotificationsGate.tsx`                                                                                                                                  |
| Route                                                                   | `app/(app)/notifications.tsx` → `Routes.notifications`                                                                                                                 |

**Navigation (§28).** `Routes.notifications = '/(app)/notifications'` (absolute,
deep-link-safe). Entry points: the Pet Owner Home "Notifications inbox" card and
a Veterinarian Home card, both showing the unread count as a `Badge` and
navigating to the inbox. `<Stack.Screen name="notifications" />` added to
`app/(app)/_layout.tsx`. No second navigation system.

## 145. Event → notification → inbox flow

```
Domain operation → transaction commit → EventBus (post-commit)
   → NotificationEventHandler → NotificationPolicy.resolve → NotificationService
      → notifications row (source of truth)
      → publish notification.created  → realtime user:<id>  → mobile invalidates queries
      → PushNotificationService.sendToUser (FCM, best-effort, gated by push_enabled)
```

Mobile consumes the REST endpoints; realtime and FCM are extra signals. A push
or realtime failure never removes the in-app row.

## 146. Device token lifecycle (§10–§13, §31–§34)

`NotificationsGate` (rendered app-wide next to `RealtimeGate`, inside
`AppProviders`) reacts to `authStore.status`:

- **authenticated** → `notificationService.getDevicePushToken()` (soft
  permission request; returns `null` on simulator / Expo Go / denied — never
  throws) → `notificationService.registerDevice(token)` →
  `POST /notifications/devices` (`userId` is **never** sent — ownership is the
  JWT; the backend schema is `strict()`). The returned device row id is held in
  a ref.
- **logout / logoutAll** → a pre-logout task (`onBeforeLogout`, a new
  best-effort hook in the auth store that runs **before** teardown while the
  session is still valid) calls
  `notificationService.unregisterDevice(id)` → `DELETE /notifications/devices/:id`.
  A failure never blocks sign-out. Silent session-expiry does **not** run it
  (no valid token) — and does not need to: re-registering the same physical
  token on the next login **moves ownership** to the new user (`ON CONFLICT
(token) … user_id = :newUser, revoked_at = null`), so **account switching on
  one device is safe** (§34) even without an explicit unregister.
- Firebase is reached only through the Phase-1 `notificationService`; the app
  ships **no** Firebase Admin / service-account credentials — only the client
  config Expo needs.

## 147. Push handling & deep links (§26–§30, §39)

`notificationHref(notification)` resolves a notification to an in-app route,
using only destinations that exist in this build:

| entityType / type                        | destination                                                                                                 |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `CONSULTATION`                           | `Routes.supportThread('consultations', id)` (id from `entityId` or `data.consultationId`)                   |
| `INQUIRY`                                | `Routes.supportThread('inquiries', id)`                                                                     |
| `ORGANIZATION`                           | `Routes.organizationDetail(id)`                                                                             |
| `VETERINARIAN`                           | `Routes.veterinarian`                                                                                       |
| `ACCOUNT_STATUS_CHANGED`                 | `Routes.account`                                                                                            |
| `CONVERSATION` / `CHAT_MESSAGE_RECEIVED` | `Routes.chatThread(id)` (id from `entityId` or `data.conversationId`) — wired in the Final Completion phase |
| anything else                            | `null` → open / stay on the inbox                                                                           |

The REST DTO carries `entityType` / `entityId`; an FCM push `data` payload
carries only `{ type, <entity>Id }` (no `entityType` column), so the resolver
also infers the entity family from the `type` prefix
(`CONSULTATION_*` / `INQUIRY_*` / `ORGANIZATION_*` / `VETERINARIAN_*`) and reads
the id from `data.*`. Both a card tap and a push tap therefore deep-link.

- **Inbox card tap** — `useOpenNotification()` marks the row read
  (fire-and-forget; backend idempotent) then `router.push(href)` or the inbox.
- **Push tap (foreground / background)** — `notificationService.onNotificationTap`
  → same resolver → navigate.
- **Cold start** — `notificationService.getInitialNotification()` on
  `NotificationsGate` mount, navigated after a short settle delay so the
  navigator is ready (§30). Handled once per launch.
- **Authorization (§27)** — a deep link never assumes access; the destination
  screen re-fetches its own data and shows its normal 404 / error state if the
  backend denies it.

## 148. Realtime, unread count & OS badge (§19, §28, §29)

- `useNotificationRealtime()` (mounted once by `NotificationsGate`) subscribes —
  through the **existing** `realtimeClient` — to `notification.created` /
  `notification.read`. Every authenticated socket is auto-joined to its own
  `user:<id>` room server-side, so **no explicit room subscription** is needed.
  On either event it invalidates the notification lists + the unread count.
  **No new websocket code.**
- `useUnreadCount()` calls `GET /notifications/unread-count` only (never the
  list), `enabled` only while authenticated, `staleTime 30s`, **no polling** —
  realtime keeps it fresh; pull-to-refresh and navigation refetch otherwise.
- `NotificationsGate` mirrors the unread count onto the OS app-icon badge via
  `notificationService.setBadgeCount`.

## 149. Query keys & cache invalidation (§35, §36)

`notificationKeys`: `list(filter)` (one cache per All / Unread filter set),
`unreadCount()`, `preferences()`, `devices()` — all lightweight, separate
entries. Lists are `useInfiniteQuery` (`staleTime 15s`, newest-first). **No
optimistic writes.**

| Action                                                  | Invalidates                                                   |
| ------------------------------------------------------- | ------------------------------------------------------------- |
| `useMarkNotificationRead`                               | `notificationKeys.lists()` · `notificationKeys.unreadCount()` |
| `useMarkAllNotificationsRead`                           | `notificationKeys.lists()` · `notificationKeys.unreadCount()` |
| `notification.created` / `notification.read` (realtime) | `notificationKeys.lists()` · `notificationKeys.unreadCount()` |

## 150. Authorization, security & privacy (§17, §27, §34, §44)

- Every route is authentication + ownership only; the backend scopes every query
  to `recipient_user_id` — a foreign id is a **404**, never a leak. The mobile
  client never sends a `userId`.
- Deep links respect backend authorization — the destination screen enforces it.
- **No Firebase server credentials** in the mobile source (checked).
- Device DTOs expose only `tokenSuffix`; the app never renders a raw token.
- **Nothing sensitive is logged or sent to analytics** — no notification
  bodies, no tokens, no private URLs. `NotificationsGate` logs only a generic
  "device registration skipped" reason string on failure.
- Notification `title` / `body` are backend-rendered plain text and rendered in
  an RN `<Text>` (no markup execution).

## 151. Notification copy & localisation (§40)

Backend `NotificationPolicy` renders English `title` / `body` today; the app
shows them verbatim (an `entityType`-scoped icon + tone is the localised
affordance). All **UI chrome** (screen title, filters, empty / error states,
mark-all copy, a11y labels, home-card text) uses the new `notifications` i18n
namespace — `ar` (`src/i18n/locales/ar/notifications.ts`, primary) and `en`
mirror. Per-key localised notification copy is a **BACKEND DEPENDENCY** (the
policy would need to emit i18n keys + params instead of rendered strings).

## 152. Tests (Phase 15)

**Backend** — `notification-policy.test.ts` +3 (vet approved / rejected / user
status), `notifications.test.ts` +2 (event → row for the applicant; status
transitions not deduped). **575 backend tests total** (was 570).

**Mobile** — `src/features/notifications/__tests__/`, 6 suites / 29 tests:

- `notificationsApi.test.ts` — request shape (page / read-string / type), DTO
  mapping (nullable defaults, unknown type kept visible), unread-count /
  mark-read / mark-all endpoints, `notificationKeys` scoping, `notificationHref`
  resolution for every entity type + null fallback + `data` fallback,
  `notificationMeta`.
- `notificationsHooks.test.tsx` — infinite-list flatten + total, unread filter
  passthrough, `useUnreadCount` gated on auth (idle when logged out),
  mark-read / mark-all invalidation sets, realtime handler invalidates on
  `notification.created`.
- `NotificationCard.test.tsx` — plain-text title / body, `onPress`, unread vs
  read **screen-reader label** (state not conveyed by colour alone).
- `NotificationsScreen.test.tsx` — list + open (marks read + deep-links),
  Arabic empty state, Unread filter re-queries `read=false` with its own empty
  copy, mark-all-read calls the endpoint + toasts the count, error state +
  retry.
- `NotificationsGate.test.tsx` — device register on an authenticated session,
  denied permission (no token) never registers / throws, a pre-logout task
  unregisters exactly this device, unread count mirrored to the OS badge.
- `notificationsNavigation.test.tsx` — `Routes.notifications` is an absolute
  path; Pet Owner Home shows the unread count, navigates to the inbox, and
  keeps an intact My Pets section; hint text when nothing is unread.

Full mobile suite after Phase 15: **99 suites / 554 tests** green (was
93 / 525).

## 153. Verification results

| Gate                                                   | Result                                                                                                                                                     |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend `tsc --noEmit`                                 | pass                                                                                                                                                       |
| Backend `eslint` (changed files)                       | pass                                                                                                                                                       |
| Backend `prettier --check` (changed files)             | pass                                                                                                                                                       |
| Backend `npm run build` (`tsc -p tsconfig.build.json`) | pass                                                                                                                                                       |
| Backend migrate (`migrate.ts latest`)                  | "already up to date" — no Phase 15 migration                                                                                                               |
| Backend `vitest run`                                   | see the Phase-15 status entry in `server/ARCHITECTURE.md` (575 tests; the two notification tests that flake under a doubled test-DB run pass in isolation) |
| Mobile `tsc --noEmit`                                  | pass                                                                                                                                                       |
| Mobile `eslint .`                                      | pass                                                                                                                                                       |
| Mobile `prettier --check`                              | pass                                                                                                                                                       |
| Mobile `jest --ci`                                     | **99 suites / 554 tests pass**                                                                                                                             |
| Mobile `expo-doctor`                                   | 18/18                                                                                                                                                      |
| Mobile `expo export --platform web`                    | pass                                                                                                                                                       |

## 154. Remaining limitations

**BACKEND DEPENDENCY**

- **Localised notification copy** — the policy emits rendered English strings;
  the app shows them verbatim. Per-language copy needs the backend to emit i18n
  keys + params (§151).
- **Per-type / per-channel preferences, quiet hours, digests** — the backend
  has only `pushEnabled`. The app therefore ships **no** preferences screen this
  phase (a single toggle was judged not worth a screen); `notificationsApi`
  exposes `getPreferences` / `updatePreferences` for when the backend grows the
  model.
- **Job / Offer notifications** — no such backend events (Jobs is not in the
  product spec — §162). Nothing to surface.
- **`CHAT_MESSAGE_RECEIVED` deep link** — ~~resolved to `null`~~ **now routes to
  `Routes.chatThread(conversationId)`** (Final Completion phase, §156+).

**FUTURE PHASE**

- **A notification-details screen** — intentionally omitted (§39): the card
  navigates straight to the entity; a details screen adds a dead-end tap.

**ENVIRONMENT LIMITATION**

- **Real FCM push** — requires a Dev Client / production build with
  `google-services.json` / `GoogleService-Info.plist` and valid Firebase
  credentials. Expo Go / simulator cannot obtain an FCM token —
  `getDevicePushToken()` returns `null`, registration is skipped, and the inbox
  - realtime still work fully.

**INTENTIONAL PRODUCT DECISION**

- The unread badge is a `Badge` pill (design-system), not a bespoke red dot.
- Silent session-expiry does not unregister the device (it can't — no valid
  token); account-switch safety comes from the backend token-ownership upsert
  instead (§146).

## 155. Recommended next phase (superseded — see §163)

_Was: Mobile Chat. Delivered in the Final Completion phase below._

---

# Final Mobile Completion — Chat + full audit

## 156. Scope of this phase

A full audit of both repos against `docs/01_SCOPE.md §1.7` "Included in Current
Scope". Every in-scope capability with backend support was already surfaced on
mobile **except Chat** — the backend chat module (Phase 12) had no mobile UI.
That is the one gap this phase closes. Appointments, Follow-ups and Jobs/Offers
are **not in the product spec** (`server/ARCHITECTURE.md §21.1 / §21.2`
authoritatively defer them) and were **not** built. No backend changes were
made — the chat backend is complete.

## 157. IMPLEMENTED — new feature module `src/features/chat/`

| Piece                                                           | Files                                                                                                                                                                                                                                |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Contract types (mirror server `ConversationDTO` / `MessageDTO`) | `types/index.ts`                                                                                                                                                                                                                     |
| Icon / title-side / room helpers                                | `constants.ts`                                                                                                                                                                                                                       |
| API wrappers (1:1 with the backend routes)                      | `api/chatApi.ts`                                                                                                                                                                                                                     |
| Query keys                                                      | `api/queryKeys.ts` — `chatKeys`                                                                                                                                                                                                      |
| Data hooks                                                      | `hooks/` — `useConversations` (infinite, `unreadTotal`), `useConversation`, `useMessages`, `useSendMessage`, `useMarkConversationRead`, `useDeleteMessage`, `useStartConversation`, `useConversationRealtime`, `useChatListRealtime` |
| Components                                                      | `components/` — `ConversationCard`, `ConversationTitle`, `MessageBubble`, `MessageComposer`                                                                                                                                          |
| Screens                                                         | `screens/` — `ConversationListScreen`, `ConversationThreadScreen`                                                                                                                                                                    |
| Routes                                                          | `app/(app)/chat/{_layout,index,[conversationId]}.tsx` → `Routes.chat` / `Routes.chatThread(id)`                                                                                                                                      |

**Navigation.** `Routes.chat = '/(app)/chat'`, `Routes.chatThread(id) =
'/(app)/chat/<id>'` (absolute, deep-link-safe). Pet Owner Home and Veterinarian
Home each carry a "Chats" card with the summed unread count as a `Badge`.
`<Stack.Screen name="chat" />` added to `app/(app)/_layout.tsx`.

## 158. APIs integrated (exactly, no invention)

| Method | Path                                                        | Hook                      |
| ------ | ----------------------------------------------------------- | ------------------------- |
| GET    | `/conversations?page&pageSize&organizationId`               | `useConversations`        |
| GET    | `/conversations/:id`                                        | `useConversation`         |
| GET    | `/conversations/:id/messages?page&pageSize`                 | `useMessages`             |
| POST   | `/conversations/:id/messages` — `{ body }`                  | `useSendMessage`          |
| POST   | `/conversations/:id/read` — `{ messageId }`                 | `useMarkConversationRead` |
| DELETE | `/messages/:messageId`                                      | `useDeleteMessage`        |
| POST   | `/organizations/:orgId/conversations` — `{ targetUserId? }` | `useStartConversation`    |

Access is **relationship-scoped** — the backend resolves the caller's side
(`PET_OWNER` / `CLINIC` / `FARM_OWNER` / `FARM_MEMBER`) from current org
ownership + membership on every call; a non-participant id is **404**, never a
foreign row. `senderUserId`, message `type=SYSTEM`, and the conversation
`viewerSide` are all server-derived.

## 159. Realtime, unread & read state

- `useConversationRealtime(id)` joins the backend `conversation:<id>` room
  through the **existing** `realtimeClient` and, on `chat.message.created` /
  `chat.message.deleted`, invalidates that conversation's `messages` + `detail`
  queries. **No new websocket code.**
- `useChatListRealtime()` (mounted once by `NotificationsGate`) listens on the
  auto-joined `user:<id>` room for `chat.conversation.created` and refreshes the
  conversation list.
- **No duplicate messages** — the POST response and the realtime event both
  invalidate the same `chatKeys.messages(id)` query; a single REST refetch is
  the source of truth, so a sent message renders once (§21 of the brief).
- **Read state** — on load / on arrival, `ConversationThreadScreen` marks the
  newest counterpart message read (`POST …/read`), guarded by a `lastMarkedRef`
  so it fires once per message. `unreadCount` on the list DTO (server-computed,
  `null` for the dynamic clinic side) drives the per-row and Home badges.

## 160. Notification deep link

`notificationHref` now resolves `CHAT_MESSAGE_RECEIVED` / `entityType:
'CONVERSATION'` → `Routes.chatThread(conversationId)` (id from `entityId` or the
FCM `data.conversationId`), completing the Phase 15 story. The thread screen
re-authorises its own fetch, so an unauthorised deep link lands on its
not-available state (404).

## 160b. Account-switch cache isolation (audit finding — fixed)

The audit found the process-wide `QueryClient` was **not** cleared on sign-out,
so a logout → different-user login on the same device could briefly surface the
previous user's cached lists before each query refetched. New
`src/providers/SessionCacheGate` (mounted in `app/_layout.tsx`) calls
`queryClient.clear()` on any transition **into** `unauthenticated` (explicit
logout / logout-all / server-forced expiry) and again on a real login
(`unauthenticated → authenticated`); a cold-start session restore
(`bootstrapping → authenticated`) does not clear. Realtime subscriptions were
already torn down on sign-out (`RealtimeGate` → `realtimeClient.reset()`), and
the device push token is re-owned by the next user on re-register (§146) — so
with this fix there is no cross-user leak on any of pets / animals / medical /
organizations / chat / notifications / consultations / inquiries / admin data.

## 161. Query keys & cache invalidation

`chatKeys`: `list(filter)` (per-org-filter cache), `detail(id)`, `messages(id)`
(nested under `detail`). Lists + messages are `useInfiniteQuery`
(`staleTime 15s` / `10s`). **No optimistic writes.**

| Action                                         | Invalidates                               |
| ---------------------------------------------- | ----------------------------------------- |
| `useSendMessage`                               | `messages(id)` · `detail(id)` · `lists()` |
| `useMarkConversationRead`                      | `detail(id)` · `lists()`                  |
| `useDeleteMessage`                             | `messages(id)`                            |
| `useStartConversation`                         | `lists()`                                 |
| `chat.message.created` / `.deleted` (realtime) | `messages(id)` · `detail(id)`             |
| `chat.conversation.created` (realtime)         | `lists()`                                 |

## 162. Remaining limitations (verified)

**BACKEND DEPENDENCY**

- **Message attachments / media** — the backend `SendMessageRequest` is
  `{ body, type: 'TEXT' }` only; no `content_files`-equivalent, no R2 seam for
  chat. `MessageComposer` is text-only (no attach button). Not mocked.
- **A pet-owner-facing clinic directory** — a pet owner can hold a
  `PET_OWNER_CLINIC` conversation and reply, but there is **no backend endpoint
  to discover a clinic to _start_ one** (`GET /organizations` is membership-
  scoped; no public clinic list). In practice the clinic side initiates
  (`POST /organizations/:id/conversations` naming the pet owner) and the owner
  replies from their conversation list. `useStartConversation` is implemented
  and wired for the org side (clinic member / farm owner / farm member) where
  the target id is in hand.
- **Message edit** — no endpoint (delete-own is the only mutation).
- **Typing indicators / presence / read receipts per message** — not in the
  backend.

**FUTURE PRODUCT SCOPE**

- **Appointments / Scheduling / Follow-ups** — `server/ARCHITECTURE.md §21.1`:
  "the current product specification does not define one". Not built.
- **Jobs / Offers / Freelance marketplace** — `server/ARCHITECTURE.md §21.2`:
  "the current product specification does not define one" (LATER / TBD). Not
  built. (Also documented as a Mobile-phase gap in §138–§141.)
- **Hospital / Syndicate / Pet-Owner-Store organization types** — the backend
  `organizations.type` CHECK allows only `CLINIC` / `FARM` / `VETERINARY_OFFICE`
  / `VETERINARY_STORE` (`§21.4`: "extend the migration when reached"). The
  mobile org-management surface is type-generic and will absorb them when the
  backend adds them.
- **Subscriptions** — `§21.4`: "Admin sets start/end dates per organization" —
  but no `subscription_*` column or endpoint exists yet. In-scope per
  `docs/01_SCOPE.md §1.7 / §8`; a backend gap, deferred by the spec's own
  "no subscription plans" note. Not built.

**MOBILE DEPENDENCY**

- **Admin Control Panel — Users / Organizations / Approvals / Subscriptions /
  Audit-logs screens.** The backend surface is complete
  (`/admin/users`, `/admin/organizations` + `/pending`, `/admin/veterinarians` +
  `/pending`, `/admin/supervisors`, `/admin/audit-logs`,
  `/admin/animal-publications` + approve/reject, `/admin/content`,
  `/admin/notifications`, `/admin/roles`, `/admin/permissions`,
  `/admin/ai-settings`). Mobile currently wires: the Consultation / Inquiry
  **supervisor review queues** + **AI settings** (Phase 13,
  `ManagementScreen` → `support/manage` + `AiSettingsCard`), org **members** and
  **supervisors** management (Phase 4), and animal-publication **create** on the
  owner side (Phase 8). The remaining admin sections render as disabled
  placeholder cards in `ManagementScreen`. This is the single largest remaining
  in-scope mobile gap and is scoped as its own phase (§163).

**ENVIRONMENT LIMITATION**

- **Real FCM push** (unchanged from Phase 15) — needs a Dev Client / production
  build with Firebase credentials.

**INTENTIONAL PRODUCT DECISION**

- Chat is **not** exposed as a bottom-tab; it is reached from the Home cards and
  from notification deep links (matches the reference design's tab set).
- `MessageBubble` long-press deletes only the caller's own, non-deleted message
  (the backend rejects deleting another user's message anyway).

## 163. Recommended next phase

**Admin Control Panel (mobile).** Build `src/features/admin/` screens over the
already-complete `/admin/*` backend: user list + suspend/activate, organization
approvals + subscription window, veterinarian approvals, system-supervisor
assignment, audit-log viewer, and admin broadcast. Everything else in
`docs/01_SCOPE.md §1.7` now has a working mobile surface.
