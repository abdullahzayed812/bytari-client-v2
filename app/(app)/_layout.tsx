import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/**
 * Authenticated area. Sub-groups:
 *  - `(tabs)`        → the shared five-tab shell (owner / vet experiences live
 *                      here and read `useAppMode()` to decide what to show)
 *  - `pets`          → Pet Owner stack (My Pets → Details → Edit, + Add) — Phase 3
 *  - `veterinarian`  → Veterinarian Home + apply flow — Phase 4
 *  - `organizations` → Organization management (list → detail → members /
 *                      supervisors / edit, + create) — Phase 4
 *  - `publications`  → Animal community browse (adoption / mating / lost) — Phase 8
 *  - `content`       → Content & Knowledge (articles / magazines / books) — Phase 11
 *  - `support`       → Consultations & Inquiries (thread + messages) — Phase 13
 *  - `notifications` → In-app notification inbox — Phase 15
 *  - `chat`          → Pet Owner ↔ Clinic / Farm Owner ↔ member conversations
 *  - `admin`         → the internal Management Centre for admins / supervisors
 *  - `showcase`      → dev-only design system screen
 *
 * The auth gate itself is `AuthRedirector` in the root layout.
 */
export default function AppLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="pets" />
      <Stack.Screen name="veterinarian" />
      <Stack.Screen name="organizations" />
      <Stack.Screen name="publications" />
      <Stack.Screen name="content" />
      <Stack.Screen name="support" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="admin" />
      <Stack.Screen name="showcase" options={{ presentation: 'card' }} />
    </Stack>
  );
}
