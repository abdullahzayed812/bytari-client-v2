import { render, waitFor } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store';
import { NotificationsGate } from '@/providers/NotificationsGate';
import { notificationService } from '@/services/notifications';
import { makeTestQueryClient } from '@/test-utils/render';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);
jest.mock('@/services/realtime', () => ({
  realtimeClient: { on: jest.fn(() => ({ unsubscribe: jest.fn() })) },
}));
jest.mock('@/services/notifications', () => ({
  notificationService: {
    getDevicePushToken: jest.fn(),
    registerDevice: jest.fn(),
    unregisterDevice: jest.fn(),
    onNotificationTap: jest.fn(() => () => undefined),
    getInitialNotification: jest.fn().mockResolvedValue(null),
    setBadgeCount: jest.fn(),
  },
}));

const svc = notificationService as jest.Mocked<typeof notificationService>;

function authed() {
  const user = {
    id: 'u1',
    email: 'u@x.c',
    firstName: 'ر',
    lastName: 'ز',
    phone: null,
    status: 'ACTIVE' as const,
    veterinarianStatus: 'NOT_APPLIED' as const,
    traderStatus: 'NOT_REGISTERED' as const,
    createdAt: '',
    updatedAt: '',
  };
  useAuthStore.setState({
    user,
    status: 'authenticated',
    session: {
      user,
      roles: ['PET_OWNER'],
      permissions: [],
      isAdmin: false,
      supervisorDomains: [],
      veterinarian: { status: 'NOT_APPLIED', approved: false },
      trader: { status: 'NOT_REGISTERED', approved: false },
    },
  });
}

function mount() {
  const client = makeTestQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <NotificationsGate />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  svc.getInitialNotification.mockResolvedValue(null);
});
afterEach(() => useAuthStore.setState({ session: null, user: null, status: 'unauthenticated' }));

describe('NotificationsGate — device lifecycle', () => {
  it('registers this device with the backend on an authenticated session', async () => {
    svc.getDevicePushToken.mockResolvedValue({ token: 'fcm-abc', platform: 'ios' });
    svc.registerDevice.mockResolvedValue('device-1');
    authed();

    mount();

    await waitFor(() =>
      expect(svc.registerDevice).toHaveBeenCalledWith({
        token: 'fcm-abc',
        platform: 'ios',
      }),
    );
  });

  it('a denied permission (no token) never registers and never throws', async () => {
    svc.getDevicePushToken.mockResolvedValue(null);
    authed();

    expect(() => mount()).not.toThrow();
    await waitFor(() => expect(svc.getDevicePushToken).toHaveBeenCalled());
    expect(svc.registerDevice).not.toHaveBeenCalled();
  });

  it('a pre-logout task unregisters exactly this device', async () => {
    svc.getDevicePushToken.mockResolvedValue({ token: 'fcm-abc', platform: 'android' });
    svc.registerDevice.mockResolvedValue('device-9');
    authed();
    mount();
    await waitFor(() => expect(svc.registerDevice).toHaveBeenCalled());

    // the auth store runs registered pre-logout tasks before it tears down
    await useAuthStore.getState().logout();

    expect(svc.unregisterDevice).toHaveBeenCalledWith('device-9');
  });

  it('mirrors the unread count onto the OS badge', async () => {
    svc.getDevicePushToken.mockResolvedValue(null);
    authed();
    mount();
    await waitFor(() => expect(svc.setBadgeCount).toHaveBeenCalled());
  });
});
