import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { createLogger } from '@/lib/logger';
import { apiClient, isApiError } from '@/services/api';

import type {
  DevicePlatform,
  DevicePushToken,
  NotificationTapHandler,
  PushPermissionStatus,
  ReceivedNotification,
  RegisterDeviceInput,
} from './types';

/**
 * Push-notification foundation.
 *
 * Phase 1 provides: permission request, native device-token retrieval, backend
 * token registration/removal (`/api/v1/notifications/devices`), and foreground /
 * tap listeners that emit a neutral `ReceivedNotification`. It contains NO
 * business routing — feature phases register a `NotificationTapHandler` that maps
 * `data` to a screen.
 *
 * Notes:
 *  - Real device tokens require a Dev Client or production build with Firebase
 *    configured (`google-services.json` / `GoogleService-Info.plist`). Expo Go
 *    cannot obtain an FCM token on SDK 53+.
 *  - Notification payloads are never logged.
 */
const log = createLogger('notifications');

function toPlatform(): DevicePlatform {
  return Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
}

// Foreground presentation — a sensible default; feature phases can refine.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

function parse(notification: Notifications.Notification): ReceivedNotification {
  const content = notification.request.content;
  const data = (content.data ?? {}) as Record<string, unknown>;
  return { title: content.title ?? undefined, body: content.body ?? undefined, data };
}

export const notificationService = {
  async getPermissionStatus(): Promise<PushPermissionStatus> {
    const { status } = await Notifications.getPermissionsAsync();
    return status as PushPermissionStatus;
  },

  async requestPermission(): Promise<PushPermissionStatus> {
    if (!Device.isDevice) {
      log.info('push not available on simulator/emulator');
      return 'denied';
    }
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status === 'granted') return 'granted';
    const requested = await Notifications.requestPermissionsAsync();
    return requested.status as PushPermissionStatus;
  },

  /** Native FCM/APNs device token. `null` when unavailable (no permission / Expo Go / simulator). */
  async getDevicePushToken(): Promise<DevicePushToken | null> {
    try {
      if (!Device.isDevice) return null;
      if ((await this.requestPermission()) !== 'granted') return null;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'General',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }
      const result = await Notifications.getDevicePushTokenAsync();
      return { token: String(result.data), platform: toPlatform() };
    } catch (error) {
      log.warn('device token unavailable', {
        reason: error instanceof Error ? error.message : 'unknown',
      });
      return null;
    }
  },

  /** Register (or refresh) this device with the backend. Ownership is derived from the JWT. */
  async registerDevice(token: DevicePushToken): Promise<void> {
    const payload: RegisterDeviceInput = {
      token: token.token,
      platform: token.platform,
      deviceId: Device.osInternalBuildId ?? Device.modelId ?? undefined,
      appVersion: Constants.expoConfig?.version ?? undefined,
    };
    try {
      await apiClient.post('/notifications/devices', payload);
      log.info('device registered for push');
    } catch (error) {
      if (isApiError(error) && error.status === 404) {
        log.info('device registration endpoint unavailable — skipping (backend not ready)');
        return;
      }
      throw error;
    }
  },

  async unregisterDevice(deviceId: string): Promise<void> {
    try {
      await apiClient.delete(`/notifications/devices/${deviceId}`);
    } catch (error) {
      log.warn('device unregister failed', {
        reason: error instanceof Error ? error.message : 'unknown',
      });
    }
  },

  /** Foreground receipt listener. Returns an unsubscribe. */
  onForegroundNotification(handler: (n: ReceivedNotification) => void): () => void {
    const sub = Notifications.addNotificationReceivedListener((n) => handler(parse(n)));
    return () => sub.remove();
  },

  /** Notification-tap listener (app foreground/background). Returns an unsubscribe. */
  onNotificationTap(handler: NotificationTapHandler): () => void {
    const sub = Notifications.addNotificationResponseReceivedListener((response) =>
      handler(parse(response.notification)),
    );
    return () => sub.remove();
  },

  /** The notification that cold-started the app, if any. */
  async getInitialNotification(): Promise<ReceivedNotification | null> {
    const response = await Notifications.getLastNotificationResponseAsync();
    return response ? parse(response.notification) : null;
  },

  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(Math.max(0, count));
  },
};

export type NotificationService = typeof notificationService;
