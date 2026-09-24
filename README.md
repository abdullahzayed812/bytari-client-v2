# Bytari Mobile

One Expo app for every Bytari user — Pet Owners, Veterinarians, Organization
Owners / Supervisors / Staff, System Moderators and Admins. Arabic-first, RTL,
green veterinary identity.

> **Status: Final Mobile Completion — Chat + full scope audit.**
> `features/chat/` — the Pet Owner ↔ Clinic / Farm Owner ↔ member conversation
> experience against the shipped backend chat module: conversation list (summed
> unread badge), thread with pagination, send, **realtime** message updates
> (`conversation:<id>` room, `chat.message.*` → query invalidation; no new
> websocket code), per-message read tracking, soft-delete of your own message,
> and the `CHAT_MESSAGE_RECEIVED` notification deep link
> (`Routes.chatThread(id)`). Access is relationship-scoped by the backend — a
> non-participant gets 404. **No backend changes** this phase (the chat module
> was already complete). A full audit against `docs/01_SCOPE.md §1.7` confirmed
> every other in-scope, backend-supported capability already has a mobile
> surface; the remaining in-scope mobile gap is the **Admin Control Panel**
> screens (backend `/admin/*` is complete). Appointments, Follow-ups and Jobs /
> Offers are **not in the product spec** and were not built.
>
> **Status: Mobile Phase 15 — Notifications inbox + FCM device lifecycle.**
> Phases 1–8 + 10–13 (design system, nav shell, i18n + RTL, API client, auth,
> Pet Owner Home + Pet CRUD, Veterinarian Mode + organization management,
> organization animal access, medical records + vaccinations, FARM join-code +
> poultry, Adoption / Mating / Lost publications, Veterinary Store product
> catalogue, Content & Knowledge, ownership transfer + medical-history timeline +
> `features/users` name resolver, Consultations & Inquiries) plus Phase 15:
> `features/notifications/` — the in-app inbox against the shipped backend
> notifications module. `GET /notifications` (All / Unread, paginated),
> `unread-count` (lightweight badge, **realtime**-invalidated via
> `notification.created` / `notification.read` on the auto-joined `user:<id>`
> room — no new websocket code), `mark-read` (idempotent) + `read-all`. A
> `NotificationsGate` provider registers this device's FCM token
> (`POST /notifications/devices`, ownership from the JWT) on an authenticated
> session and unregisters it on explicit logout via a new `onBeforeLogout`
> auth-store hook; account-switch on one device is safe because re-registering
> the token moves ownership backend-side. Notification taps and cold-start
> launches deep-link to the entity (consultation / inquiry / organization /
> veterinarian status / account) when a screen exists — the destination screen
> re-authorises. **Hybrid phase**: the backend was audited and one gap fixed —
> `veterinarian.approved` / `.rejected` / `user.status.changed` had no
> `NotificationPolicy` mapping (additive: 2 new types, 3 branches, no migration).
> Localised notification copy and per-type preferences are **backend
> dependencies**; real FCM needs a Dev Client build. **Phase 9 & 14 (Jobs /
> Freelance Offers) have no backend and were not built.**
> **App mode ≠ role** — Pet Owner Mode keeps working. Authorization is entirely
> backend-derived and enforced.
> **No other business features** (cattle / sheep operations, farm analytics,
> chat, treatments, appointments, cart / checkout / orders, jobs,
> subscriptions, content management, the full admin dashboard…) — those
> are later phases. See `MOBILE_ARCHITECTURE.md`.

## Stack

Expo SDK 53 · React Native 0.79 · React 19 · TypeScript (strict) · Expo Router 5 ·
TanStack Query 5 · Zustand 5 · React Hook Form + Zod · Axios · expo-secure-store ·
i18next · Tajawal / Cairo (Arabic fonts).

## Getting started

```bash
npm install
cp .env.example .env      # set EXPO_PUBLIC_API_BASE_URL to your backend
npm start                 # Expo dev server (press i / a / w)
```

The backend must be running (`../server`, default `http://localhost:3000`).
Android emulator: use `http://10.0.2.2:3000`. Physical device: your LAN IP.

## Scripts

| Command                           | What                                 |
| --------------------------------- | ------------------------------------ |
| `npm start`                       | Expo dev server                      |
| `npm run android` / `ios` / `web` | Platform dev builds                  |
| `npm run typecheck`               | `tsc --noEmit` (strict)              |
| `npm run lint`                    | ESLint (`eslint-config-expo`)        |
| `npm run format` / `format:check` | Prettier                             |
| `npm test`                        | Jest (`jest-expo` + Testing Library) |
| `npm run doctor`                  | `expo-doctor` project validation     |

## Layout

```
app/                       Expo Router routes (file-based)
  (auth)/                  sign-in · register
  (app)/
    (tabs)/                the 5-tab shell: account · animals(→My Pets) · [home] · services · more
                          [home] = ModeAwareHomeScreen (Pet Owner Home | Veterinarian Home)
    pets/                  index · create · [petId]/{index,edit} ·
                          [petId]/{medical-records,vaccinations,medical-history}/… (owner read-only) ·
                          [petId]/{transfer,ownership} · [petId]/publish/[kind] ·
                          [petId]/publications/[publicationId]
    publications/          [kind]/{index (browse APPROVED),[publicationId] (public detail)}
    support/               [kind]/{index (my threads),create,manage (/admin review queue),
                          [threadId] (thread detail)} — kind = consultations | inquiries
    notifications.tsx      the in-app notification inbox (All / Unread)
    chat/                  index (conversation list) · [conversationId] (thread)
    content/               index (Knowledge home) · [type]/index (articles|magazines|books) ·
                          item/[contentId]/{index (reader),files/[fileId] (file reader entry)}
    veterinarian/         index (Vet Home) · apply · join-farm
    organizations/        index · create · [organizationId]/{index (dashboard),edit,
                          members (+?roleKey=VETERINARIAN),members/add,
                          supervisors,supervisors/assign,
                          poultry/{index,create,[flockId]/{index,edit}},
                          products/{index,create,[productId]/{index,edit}}} ·
                          [organizationId]/animals/{index,grant,[animalId]/{index,
                          medical-records/…,vaccinations/…}}
    admin/                 Management Centre (admin / supervisor) — gated
    showcase.tsx           DEV design-system screen
src/
  theme/                   colors · typography · spacing · radius · shadows · sizes · zIndex
  components/               design system: layout / typography / actions / forms /
                            content / feedback / navigation / overlays
  features/
    auth/                  api · services (tokenStorage) · store · hooks · validation ·
                            errors · components · screens (Login / Register)
    account/               AccountScreen
    management/            useManagementAccess + ManagementScreen (placeholder)
    pets/                  api (petsApi · petKeys — incl. ownership) · hooks · validation ·
                            constants · components · screens (My Pets / Details / Add / Edit /
                            Transfer ownership / Ownership history)
    users/                api (usersApi · userKeys) · hooks (useUserSummary) ·
                            components (UserName) — resolves GET /users/:id name summaries
    veterinarian/         api (veterinarianApi) · hooks · validation · screens
                            (Veterinarian Home / Apply)
    organizations/        api (organizationsApi · orgKeys) · hooks · validation ·
                            constants (orgCapabilities · permission groups) · components ·
                            screens (My Orgs / Create / Details / Edit / Members / Add member /
                            Supervisors / Assign supervisor)
    animals/              api (organizationAnimalsApi · orgAnimalKeys) · hooks · validation ·
                            constants (organizationManagesAnimals — CLINIC only) · components ·
                            screens (Organization Animals / Animal Details / Link an animal)
    medical/              api (medicalRecordsApi · vaccinationsApi · medicalHistoryApi ·
                            medicalKeys) · hooks · validation · constants ·
                            components (cards / forms / MedicalTimelineItem) · screens
                            (Records + Vaccinations: list / detail / create / edit —
                            CLINIC full CRUD, OWNER read-only; + scope-aware Medical timeline)
    farm/                 api (farmApi · poultryApi · farmKeys · poultryKeys) · hooks ·
                            validation · constants (organizationIsFarm — FARM only) ·
                            components (FarmJoinCodeCard · PoultryCard · PoultryFlockForm) ·
                            screens (Join a farm · Poultry list / detail / create / edit)
    publications/         api (publicationsApi · publicationKeys) · hooks · validation ·
                            constants (kind meta · slug ↔ kind · status tone) ·
                            components (Kind/Status badge · PublicationCard · PublicationForm) ·
                            screens (Browse APPROVED · Detail (public | owner) · Publish an animal)
    store/               api (productsApi · productKeys) · hooks · validation ·
                            constants (organizationIsVeterinaryStore — VETERINARY_STORE only) ·
                            components (ProductCard · ProductForm · AdjustStockForm) ·
                            screens (Products list / detail / create / edit — store members only)
    content/             api (contentApi · contentKeys) · hooks · constants (type meta ·
                            viewable MIME · file-size fmt) · openExternal (http/https-only opener) ·
                            components (ContentCard · ContentFilters · ContentBody · ContentFileRow) ·
                            screens (Knowledge home · type list · reader · file reader entry)
    support/             api (consultationApi · inquiryApi · aiSettingsApi · supportKeys) · hooks
                            (useMyThreads · useAdminThreads · useThread · useThreadMessages ·
                            create/send/close/block mutations · useThreadRealtime · useAiSettings) ·
                            validation · constants (SUPPORT_KIND_META — per-kind slug / perms /
                            supervisor domain / realtime room) · components (ThreadCard ·
                            ThreadStatusBadge · MessageBubble · MessageComposer · AiSettingsCard) ·
                            screens (My threads · Create · Thread detail · /admin review queue)
    notifications/       api (notificationsApi · notificationKeys) · hooks (useNotifications ·
                            useUnreadCount · mark-read / mark-all mutations ·
                            useNotificationRealtime · useOpenNotification) · constants
                            (per-type icon/tone · notificationHref deep-link resolver) ·
                            components (NotificationCard) ·
                            screens (Notifications inbox — All / Unread)
    chat/                api (chatApi · chatKeys) · hooks (useConversations · useConversation ·
                            useMessages · send / mark-read / delete-message / start mutations ·
                            useConversationRealtime · useChatListRealtime) · constants
                            (icon · title side · conversation room) · components
                            (ConversationCard · ConversationTitle · MessageBubble ·
                            MessageComposer) · screens (conversation list · thread)
    home/                  ModeAwareHomeScreen · HomeScreen + Home section components
  services/
    api/                   axios client, error normalisation, single-flight refresh
    storage/               generic secureStorage abstraction (expo-secure-store)
    realtime/              WebSocket client (connect / reconnect / rooms)
    notifications/         push permission · native FCM token · register/unregister ·
                            foreground / tap / cold-start listeners · OS badge count
    files/                 presigned-upload abstraction (NO R2 credentials)
  store/                   Zustand: appMode · preferences · ui (auth store lives in features/auth)
  hooks/                   useAuth (→ features/auth) · useCapabilities · useAppMode
  i18n/                    i18next + ar/en resources (common · nav · errors · auth · pets ·
                            veterinarian · organizations · orgAnimals · medical · farm ·
                            publications · store · content · chat · users · support ·
                            notifications · showcase)
  lib/                     env · logger · rtl · queryClient
  providers/               AppProviders · useAppBootstrap · RealtimeGate · NotificationsGate
  navigation/              AuthRedirector + shared screen helpers
```

## Non-negotiables

- No secrets in the app (`EXPO_PUBLIC_*` is public). Tokens live in
  `expo-secure-store`, never AsyncStorage, never logs.
- Backend is the source of truth for authorization. `useCapabilities()` only
  hides UI for UX.
- Consume `@/theme` tokens and `@/components` — no raw hex / font sizes /
  spacing numbers in screens.
- No API calls or business logic in screen files.

## Web production build & deployment

```bash
EXPO_PUBLIC_API_BASE_URL=https://api.bytari.com \
EXPO_PUBLIC_REALTIME_URL=wss://api.bytari.com \
EXPO_PUBLIC_ENVIRONMENT=production npm run build:web   # → dist/ (static)
docker build -t bytari-web .                            # nginx image serving dist/ on :8080
```

`EXPO_PUBLIC_*` values are baked into the bundle and are public — never put a
secret in them. A production build refuses non-`https`/`wss` or local API URLs.
The image is deployed to `https://bytari.com` by `.github/workflows/deploy-web.yml`;
the full VPS runbook lives in the server repo: `docs/deployment.md`.

