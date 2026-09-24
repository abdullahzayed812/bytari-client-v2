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
 *  - The backend delivers through Firebase Admin (FCM) directly, so it needs
 *    an FCM registration token. On Android `getDevicePushTokenAsync` returns
 *    exactly that. On iOS it returns a raw APNs token, which FCM rejects — iOS
 *    registration is therefore skipped until the app obtains an FCM token on
 *    iOS (e.g. `@react-native-firebase/messaging`), see MOBILE_ARCHITECTURE.md.
 *  - Notification payloads are never logged.
 */
const log = createLogger('notifications');

/**
 * Android channel every push is posted to. The backend sets the same id
 * (`server/src/infra/push/firebase-push-provider.ts` `ANDROID_CHANNEL_ID`) —
 * keep them identical.
 */
export const ANDROID_CHANNEL_ID = 'default';

/**
 * The chat conversation currently on screen (set by the chat thread screen).
 * A foreground push for that same conversation is not shown — the realtime
 * message already appears in the open thread.
 */
let activeConversationId: string | null = null;

function toPlatform(): DevicePlatform {
  return Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
}

// Foreground presentation. The in-app inbox / unread badge update via
// realtime independently; this only decides whether the OS banner shows.
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = (notification.request.content.data ?? {}) as Record<string, unknown>;
    const viewingSameChat =
      data.type === 'CHAT_MESSAGE_RECEIVED' &&
      activeConversationId !== null &&
      data.conversationId === activeConversationId;
    return {
      shouldShowBanner: !viewingSameChat,
      shouldShowList: !viewingSameChat,
      shouldPlaySound: false,
      shouldSetBadge: true,
    };
  },
});

function parse(notification: Notifications.Notification): ReceivedNotification {
  const content = notification.request.content;
  const data = (content.data ?? {}) as Record<string, unknown>;
  return { title: content.title ?? undefined, body: content.body ?? undefined, data };
}

export const notificationService = {
  /** Create the Android channel up-front so pushes that arrive before any token fetch land in it. */
  async ensureAndroidChannel(): Promise<void> {
    if (Platform.OS !== 'android') return;
    try {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'General',
        importance: Notifications.AndroidImportance.HIGH,
      });
    } catch (error) {
      log.warn('android channel setup failed', {
        reason: error instanceof Error ? error.message : 'unknown',
      });
    }
  },

  setActiveConversation(conversationId: string | null): void {
    activeConversationId = conversationId;
  },

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

  /**
   * Native FCM device token. `null` when unavailable (no permission / Expo Go /
   * simulator) and on iOS (APNs token — not deliverable via FCM, see header).
   */
  async getDevicePushToken(): Promise<DevicePushToken | null> {
    try {
      if (!Device.isDevice) return null;
      if (Platform.OS === 'ios') {
        log.info('iOS push registration skipped — needs an FCM token, not an APNs token');
        return null;
      }
      if ((await this.requestPermission()) !== 'granted') return null;

      await this.ensureAndroidChannel();
      const result = await Notifications.getDevicePushTokenAsync();
      return { token: String(result.data), platform: toPlatform() };
    } catch (error) {
      log.warn('device token unavailable', {
        reason: error instanceof Error ? error.message : 'unknown',
      });
      return null;
    }
  },

  /**
   * Register (or refresh) this device with the backend. Ownership is derived
   * from the JWT — the payload never carries a `userId` (the backend schema is
   * `strict()` and rejects one). Re-registering the same token moves it to the
   * current user and clears any revocation, so account-switch on one physical
   * device is safe. Returns the backend device row id (needed to unregister on
   * logout), or `null` if the backend is unreachable / not ready.
   */
  async registerDevice(token: DevicePushToken): Promise<string | null> {
    const payload: RegisterDeviceInput = {
      token: token.token,
      platform: token.platform,
      deviceId: Device.osInternalBuildId ?? Device.modelId ?? undefined,
      appVersion: Constants.expoConfig?.version ?? undefined,
    };
    try {
      const device = await apiClient.post<{ id: string }>('/notifications/devices', payload);
      log.info('device registered for push');
      return device?.id ?? null;
    } catch (error) {
      if (isApiError(error) && error.status === 404) {
        log.info('device registration endpoint unavailable — skipping (backend not ready)');
        return null;
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

  /**
   * FCM rotates tokens (app data cleared, restore on a new device…). Returns
   * an unsubscribe. Android only — iOS registration is disabled (see header).
   */
  onTokenRefresh(handler: (token: DevicePushToken) => void): () => void {
    if (Platform.OS !== 'android') return () => undefined;
    const sub = Notifications.addPushTokenListener((t) =>
      handler({ token: String(t.data), platform: toPlatform() }),
    );
    return () => sub.remove();
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
