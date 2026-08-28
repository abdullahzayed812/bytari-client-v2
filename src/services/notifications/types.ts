export type PushPermissionStatus = 'granted' | 'denied' | 'undetermined';

/** Matches the backend `device_push_tokens.platform` CHECK. */
export type DevicePlatform = 'ios' | 'android' | 'web';

export interface DevicePushToken {
  /** Native FCM (Android) / APNs (iOS) device token — what a Firebase backend needs. */
  token: string;
  platform: DevicePlatform;
}

export interface RegisterDeviceInput {
  token: string;
  platform: DevicePlatform;
  deviceId?: string;
  appVersion?: string;
}

/** A parsed, non-sensitive view of a received notification. */
export interface ReceivedNotification {
  title?: string;
  body?: string;
  /** Opaque routing hint set by the backend (e.g. `{ type, entityId }`). */
  data: Record<string, unknown>;
}

export type NotificationTapHandler = (notification: ReceivedNotification) => void;
