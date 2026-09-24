import { createLogger } from '@/lib/logger';

import type { NotificationService } from './notificationService';

// Re-exported so the `./notifications` barrel's
// `export { type NotificationService } from './notificationService'` still
// resolves when Metro picks this `.web` variant.
export type { NotificationService } from './notificationService';

/**
 * Web stub for `notificationService`.
 *
 * `expo-notifications` is native-only for our use: `getLastNotificationResponseAsync`,
 * `setBadgeCountAsync`, `getDevicePushTokenAsync`, the tap listeners — all throw
 * `UnavailabilityError` on web. Push isn't a web feature of this app, so every
 * method is a safe no-op here. The in-app notifications inbox (plain API calls)
 * is unaffected; only the device-token / OS-badge / cold-start-tap wiring in
 * `NotificationsGate` goes quiet.
 */
const log = createLogger('notifications');

export const notificationService: NotificationService = {
  async ensureAndroidChannel() {
    /* no-op on web */
  },
  setActiveConversation() {
    /* no-op on web */
  },
  async getPermissionStatus() {
    return 'denied';
  },
  async requestPermission() {
    return 'denied';
  },
  async getDevicePushToken() {
    return null;
  },
  async registerDevice() {
    return null;
  },
  async unregisterDevice() {
    /* no-op on web */
  },
  onTokenRefresh() {
    return () => undefined;
  },
  onForegroundNotification() {
    return () => undefined;
  },
  onNotificationTap() {
    return () => undefined;
  },
  async getInitialNotification() {
    return null;
  },
  async setBadgeCount() {
    log.debug('setBadgeCount ignored on web');
  },
};
