/**
 * Centralised route hrefs for Expo Router. Import these instead of writing path
 * string literals in components, so a route move is one edit.
 */
export const Routes = {
  authSignIn: '/(auth)/sign-in',

  home: '/(app)/(tabs)',
  account: '/(app)/(tabs)/account',
  animals: '/(app)/(tabs)/animals',
  services: '/(app)/(tabs)/services',
  more: '/(app)/(tabs)/more',

  adminHome: '/(app)/admin',
  showcase: '/(app)/showcase',
} as const;

export type RouteKey = keyof typeof Routes;
