/**
 * Notifications contract — Mobile Phase 15. Mirrors
 * `server/src/modules/notifications` EXACTLY (`notification.constants.ts`,
 * `notification.types.ts` → `NotificationDTO`, OpenAPI `phase15`).
 *
 * In-app notifications are the SOURCE OF TRUTH. FCM push + realtime are extra
 * delivery channels whose failure never removes a row.
 *
 * NOT modelled here (documented in MOBILE_ARCHITECTURE.md, never mocked):
 * per-type notification preferences (backend has only `pushEnabled`) and a
 * dedicated Notification-details screen (the card navigates straight to the
 * entity).
 */

/**
 * Backend `NOTIFICATION_TYPES` (`server/src/modules/notifications/domain/notification.constants.ts`)
 * — the full catalogue, in the same order. Keep in sync: an unknown type still
 * renders (generic icon, server text) but loses its deep link.
 */
export const NOTIFICATION_TYPES = [
  'ACCOUNT_STATUS_CHANGED',
  'VETERINARIAN_APPLICATION_SUBMITTED',
  'VETERINARIAN_APPROVED',
  'VETERINARIAN_REJECTED',
  'ORGANIZATION_SUBMITTED',
  'ORGANIZATION_APPROVED',
  'ORGANIZATION_REJECTED',
  'ORGANIZATION_SUSPENDED',
  'ORGANIZATION_ACTIVATED',
  'ORGANIZATION_DEACTIVATED',
  'ORGANIZATION_MEMBER_ADDED',
  'ORGANIZATION_MEMBER_REMOVED',
  'ORGANIZATION_ROLE_CHANGED',
  'ORGANIZATION_SUPERVISOR_ASSIGNED',
  'SUBSCRIPTION_UPDATED',
  'SUBSCRIPTION_EXPIRING',
  'SUBSCRIPTION_EXPIRED',
  'SUBSCRIPTION_RENEWAL_REQUESTED',
  'SUBSCRIPTION_RENEWAL_APPROVED',
  'SUBSCRIPTION_RENEWAL_REJECTED',
  'FARM_MEMBER_JOINED',
  'FARM_APPOINTMENT_CREATED',
  'TRADER_APPLICATION_SUBMITTED',
  'TRADER_APPROVED',
  'TRADER_REJECTED',
  'TRADER_SUSPENDED',
  'TRADER_REACTIVATED',
  'SYSTEM_SUPERVISOR_ASSIGNED',
  'CHAT_MESSAGE_RECEIVED',
  'CONSULTATION_CREATED',
  'CONSULTATION_MESSAGE_RECEIVED',
  'CONSULTATION_CLOSED',
  'INQUIRY_CREATED',
  'INQUIRY_MESSAGE_RECEIVED',
  'INQUIRY_CLOSED',
  'SUPPORT_CREATED',
  'SUPPORT_MESSAGE_RECEIVED',
  'SUPPORT_CLOSED',
  'VET_SERVICE_LISTING_SUBMITTED',
  'VET_SERVICE_LISTING_APPROVED',
  'VET_SERVICE_LISTING_REJECTED',
  'VET_SERVICE_REQUEST_SUBMITTED',
  'VET_SERVICE_REQUEST_APPROVED',
  'VET_SERVICE_REQUEST_REJECTED',
  'VET_SERVICE_OFFER_RECEIVED',
  'VET_SERVICE_OFFER_ACCEPTED',
  'VET_SERVICE_OFFER_REJECTED',
  'VET_SERVICE_LISTING_REQUEST_RECEIVED',
  'VET_SERVICE_LISTING_REQUEST_ACCEPTED',
  'VET_SERVICE_LISTING_REQUEST_REJECTED',
  'VET_SERVICE_DEAL_COMPLETED',
  'VET_COURSE_SUBMITTED',
  'VET_COURSE_APPROVED',
  'VET_COURSE_REJECTED',
  'VET_COURSE_REGISTRATION_CONFIRMED',
  'VET_COURSE_REGISTRATION_RECEIVED',
  'VET_COURSE_CAPACITY_REACHED',
  'VET_COURSE_CANCELLED',
  'VET_JOB_OFFER_SUBMITTED',
  'VET_JOB_OFFER_APPROVED',
  'VET_JOB_OFFER_REJECTED',
  'VET_JOB_SEEKER_PROFILE_SUBMITTED',
  'VET_JOB_SEEKER_PROFILE_APPROVED',
  'VET_JOB_SEEKER_PROFILE_REJECTED',
  'VET_JOB_APPLICATION_RECEIVED',
  'VET_JOB_APPLICATION_ACCEPTED',
  'VET_JOB_APPLICATION_REJECTED',
  'STORE_ORDER_PLACED',
  'STORE_ORDER_STATUS_CHANGED',
  'SYNDICATE_ANNOUNCEMENT_PUBLISHED',
  'SYNDICATE_SUBMISSION_CREATED',
  'SYNDICATE_SUBMISSION_RESPONDED',
  'CONTENT_PUBLISHED',
  'PUBLICATION_SUBMITTED',
  'PUBLICATION_APPROVED',
  'PUBLICATION_REJECTED',
  'PUBLICATION_ADOPTION_REQUESTED',
  'PUBLICATION_MATING_REQUESTED',
  'PUBLICATION_SIGHTING_REPORTED',
  'TRANSFER_REQUEST_RECEIVED',
  'TRANSFER_REQUEST_ACCEPTED',
  'TRANSFER_REQUEST_REJECTED',
  'CLINIC_APPOINTMENT_REQUESTED',
  'CLINIC_APPOINTMENT_CONFIRMED',
  'CLINIC_APPOINTMENT_REJECTED',
  'CLINIC_APPOINTMENT_RESCHEDULE_PROPOSED',
  'CLINIC_APPOINTMENT_CANCELLED',
  'CLINIC_APPOINTMENT_COMPLETED',
  'ADMIN_ANNOUNCEMENT',
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
  /**
   * Backend-rendered text in the default language (Arabic). Other languages
   * re-render from `notifications:types.<TYPE>` — see `localizedNotificationText`.
   */
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
