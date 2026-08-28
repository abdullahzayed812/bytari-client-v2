# Bytari Mobile

One Expo app for every Bytari user — Pet Owners, Veterinarians, Organization
Owners / Supervisors / Staff, System Moderators and Admins. Arabic-first, RTL,
green veterinary identity.

> **Status: Mobile Phase 1 — Foundation & Design System.**
> Design system, navigation shell, theme + typography, i18n + RTL, API client,
> auth foundation, React Query, realtime foundation, push-notification
> foundation, R2 upload abstraction, and tests. **No business features** (pets,
> clinics, chat, consultations, content, jobs, subscriptions, admin operations…)
> — those are later phases. See `MOBILE_ARCHITECTURE.md`.

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
  (auth)/                  unauthenticated: sign-in
  (app)/
    (tabs)/                the 5-tab shell: account · animals · [home] · services · more
    admin/                 Control Centre (admin / supervisor) — gated
    showcase.tsx           DEV design-system screen
src/
  theme/                   colors · typography · spacing · radius · shadows · sizes · zIndex
  components/               design system: layout / typography / actions / forms /
                            content / feedback / navigation / overlays
  services/
    api/                   axios client, error normalisation, auth-bridge
    auth/                  authService + secure token storage
    realtime/              WebSocket client (connect / reconnect / rooms)
    notifications/         push permission + device token + backend registration
    files/                 presigned-upload abstraction (NO R2 credentials)
  store/                   Zustand: auth · appMode · preferences · ui
  hooks/                   useAuth · useCapabilities · useAppMode
  i18n/                    i18next + ar/en resources
  lib/                     env · logger · rtl · queryClient
  providers/               AppProviders · bootstrap · RealtimeGate
  navigation/              AuthRedirector + shared screen helpers
  features/                (empty — one folder per business module, later phases)
```

## Non-negotiables

- No secrets in the app (`EXPO_PUBLIC_*` is public). Tokens live in
  `expo-secure-store`, never AsyncStorage, never logs.
- Backend is the source of truth for authorization. `useCapabilities()` only
  hides UI for UX.
- Consume `@/theme` tokens and `@/components` — no raw hex / font sizes /
  spacing numbers in screens.
- No API calls or business logic in screen files.
