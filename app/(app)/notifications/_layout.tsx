import { Stack } from 'expo-router';

/** Route group: /(app)/notifications/* — the inbox and one notification's details. */
export default function NotificationsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
