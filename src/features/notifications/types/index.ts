/**
 * Notifications contract — Mobile Phase 15. Mirrors
 * `server/src/modules/notifications` EXACTLY (`notification.constants.ts`,
 * `notification.types.ts` → `NotificationDTO`, OpenAPI `phase15`).
 *
 * In-app notifications are the SOURCE OF TRUTH. FCM push + realtime are extra
 * delivery channels whose failure never removes a row.
 *
 * NOT modelled here (documented in MOBILE_ARCHITECTURE.md, never mocked):
 * per-type notification preferences (backend has only `pushEnabled`), a
 * dedicated Notification-details screen (the card navigates straight to the
 * entity), and notification types for modules with no backend (Jobs / Offers).
 */

/** Backend `NOTIFICATION_TYPES` — the full catalogue as of Phase 15. */
export const NOTIFICATION_TYPES = [
  'ACCOUNT_STATUS_CHANGED',
  'VETERINARIAN_APPROVED',
  'VETERINARIAN_REJECTED',
  'ORGANIZATION_APPROVED',
  'ORGANIZATION_REJECTED',
  'ORGANIZATION_SUSPENDED',
  'ORGANIZATION_ACTIVATED',
  'ORGANIZATION_MEMBER_ADDED',
  'ORGANIZATION_MEMBER_REMOVED',
  'ORGANIZATION_SUPERVISOR_ASSIGNED',
  'SYSTEM_SUPERVISOR_ASSIGNED',
  'CHAT_MESSAGE_RECEIVED',
  'CONSULTATION_CREATED',
  'CONSULTATION_MESSAGE_RECEIVED',
  'CONSULTATION_CLOSED',
  'INQUIRY_CREATED',
  'INQUIRY_MESSAGE_RECEIVED',
  'INQUIRY_CLOSED',
  'CONTENT_PUBLISHED',
  'ADMIN_ANNOUNCEMENT',
  // organization → its followers (Veterinary Office Dashboard "إرسال رسالة للمتابعين")
  'ORGANIZATION_BROADCAST',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export function isNotificationType(v: unknown): v is NotificationType {
  return typeof v === 'string' && (NOTIFICATION_TYPES as readonly string[]).includes(v);
}

/** One notification row (backend `NotificationDTO`). */
export interface AppNotification {
  id: string;
  type: NotificationType;
  /** Backend-rendered text. Localised copy keys are a future backend capability. */
  title: string;
  body: string;
  /** ids-only structured routing hint — never private content, never URLs. */
  data: Record<string, unknown>;
  actorUserId: string | null;
  entityType: string | null;
  entityId: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListFilter {
  page: number;
  pageSize: number;
  /** `true` = read only, `false` = unread only, omitted = all. */
  read?: boolean;
  type?: NotificationType;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  updatedAt: string;
}

export interface RegisteredDevice {
  id: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string | null;
  appVersion: string | null;
  tokenSuffix: string;
  lastSeenAt: string;
  revoked: boolean;
  createdAt: string;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}
