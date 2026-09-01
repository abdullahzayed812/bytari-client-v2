import type { ReactNode } from 'react';

/**
 * Shared Expo Router mock for screen/navigation tests.
 *
 *   jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);
 *   import { routerMock, setSearchParams, resetRouterMock } from '@/test-utils/routerMock';
 */
export const routerMock = {
  push: jest.fn(),
  replace: jest.fn(),
  navigate: jest.fn(),
  back: jest.fn(),
  dismiss: jest.fn(),
  dismissAll: jest.fn(),
  setParams: jest.fn(),
  canGoBack: jest.fn(() => true),
};

let searchParams: Record<string, string> = {};
let segments: string[] = [];

export function setSearchParams(params: Record<string, string>): void {
  searchParams = params;
}
export function setSegments(next: string[]): void {
  segments = next;
}
export function resetRouterMock(): void {
  Object.values(routerMock).forEach((fn) => (fn as jest.Mock).mockClear());
  searchParams = {};
  segments = [];
}

const passthrough = ({ children }: { children?: ReactNode }) => children ?? null;

export const expoRouter = {
  router: routerMock,
  useRouter: () => routerMock,
  useLocalSearchParams: () => searchParams,
  useGlobalSearchParams: () => searchParams,
  useSegments: () => segments,
  useFocusEffect: () => undefined,
  usePathname: () => '/',
  Link: passthrough,
  Redirect: () => null,
  Stack: Object.assign(() => null, { Screen: () => null }),
  Tabs: Object.assign(() => null, { Screen: () => null }),
};
