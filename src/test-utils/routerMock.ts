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
  dismissTo: jest.fn(),
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
/**
 * Navigation-container root state as `AuthRedirector` reads it: by default the
 * root `<Stack>` has registered (nested `state` present). `setRootStackMounted(false)`
 * simulates the first commit after the splash, before the container synced.
 */
let rootStackMounted = true;
const stateListeners = new Set<() => void>();
export function setRootStackMounted(next: boolean): void {
  rootStackMounted = next;
  stateListeners.forEach((listener) => listener());
}
const navigationContainerRef = {
  isReady: () => true,
  getRootState: () => ({
    index: 0,
    routes: [{ name: '__root', state: rootStackMounted ? { index: 0, routes: [] } : undefined }],
  }),
  addListener: (_event: string, listener: () => void) => {
    stateListeners.add(listener);
    return () => {
      stateListeners.delete(listener);
    };
  },
};

export function resetRouterMock(): void {
  Object.values(routerMock).forEach((fn) => (fn as jest.Mock).mockClear());
  searchParams = {};
  segments = [];
  rootStackMounted = true;
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
  useNavigationContainerRef: () => navigationContainerRef,
  Link: passthrough,
  Redirect: () => null,
  Stack: Object.assign(() => null, { Screen: () => null }),
  Tabs: Object.assign(() => null, { Screen: () => null }),
};
