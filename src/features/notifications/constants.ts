import type { IconName } from '@/components/content';
import { Routes } from '@/constants/routes';

import type { AppNotification, NotificationType } from './types';

/**
 * Per-type presentation. `icon` is an Ionicons name; `tone` maps to a `Badge`
 * tone. Copy is backend-rendered (`title` / `body`), so there is no per-type
 * copy here — only the visual affordance.
 */
export const NOTIFICATION_TYPE_META: Record<
  NotificationType,
  { icon: IconName; tone: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }
> = {
  ACCOUNT_STATUS_CHANGED: { icon: 'person-circle-outline', tone: 'warning' },
  VETERINARIAN_APPROVED: { icon: 'shield-checkmark-outline', tone: 'success' },
  VETERINARIAN_REJECTED: { icon: 'shield-outline', tone: 'danger' },
  ORGANIZATION_APPROVED: { icon: 'business-outline', tone: 'success' },
  ORGANIZATION_REJECTED: { icon: 'business-outline', tone: 'danger' },
  ORGANIZATION_SUSPENDED: { icon: 'business-outline', tone: 'danger' },
  ORGANIZATION_ACTIVATED: { icon: 'business-outline', tone: 'success' },
  ORGANIZATION_MEMBER_ADDED: { icon: 'people-outline', tone: 'info' },
  ORGANIZATION_MEMBER_REMOVED: { icon: 'people-outline', tone: 'neutral' },
  ORGANIZATION_SUPERVISOR_ASSIGNED: { icon: 'shield-checkmark-outline', tone: 'info' },
  SYSTEM_SUPERVISOR_ASSIGNED: { icon: 'shield-checkmark-outline', tone: 'info' },
  CHAT_MESSAGE_RECEIVED: { icon: 'chatbubble-ellipses-outline', tone: 'primary' },
  CONSULTATION_CREATED: { icon: 'chatbubbles-outline', tone: 'info' },
  CONSULTATION_MESSAGE_RECEIVED: { icon: 'chatbubbles-outline', tone: 'primary' },
  CONSULTATION_CLOSED: { icon: 'chatbubbles-outline', tone: 'neutral' },
  INQUIRY_CREATED: { icon: 'help-buoy-outline', tone: 'info' },
  INQUIRY_MESSAGE_RECEIVED: { icon: 'help-buoy-outline', tone: 'primary' },
  INQUIRY_CLOSED: { icon: 'help-buoy-outline', tone: 'neutral' },
  CONTENT_PUBLISHED: { icon: 'library-outline', tone: 'info' },
  ADMIN_ANNOUNCEMENT: { icon: 'megaphone-outline', tone: 'warning' },
  ORGANIZATION_BROADCAST: { icon: 'megaphone-outline', tone: 'primary' },
};

const FALLBACK_META = { icon: 'notifications-outline' as IconName, tone: 'neutral' as const };

export function notificationMeta(type: string) {
  return NOTIFICATION_TYPE_META[type as NotificationType] ?? FALLBACK_META;
}

/** `data` values the backend attaches are strings; read one safely. */
function pick(data: Record<string, unknown>, key: string): string | undefined {
  const v = data[key];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

/**
 * Resolve a notification to an in-app destination, or `null` when there is no
 * screen for it yet (the caller then just opens / stays on the inbox). Only
 * destinations that actually exist in this build are returned — the backend
 * still re-authorises the destination screen's own data fetch (§27).
 *
 * Works for both the REST DTO (which carries `entityType` / `entityId`) and an
 * FCM push `data` payload (which carries only `{ type, <entity>Id }` — no
 * `entityType` column) — the `type` + `data.*` fallbacks cover the latter.
 */
export function notificationHref(
  n: Pick<AppNotification, 'type' | 'entityType' | 'entityId' | 'data'>,
): string | null {
  const entityId = n.entityId ?? undefined;
  const d = n.data ?? {};
  const kind = n.entityType ?? entityKindFromType(n.type);

  switch (kind) {
    case 'CONSULTATION': {
      const id = entityId ?? pick(d, 'consultationId');
      return id ? Routes.supportThread('consultations', id) : Routes.support('consultations');
    }
    case 'INQUIRY': {
      const id = entityId ?? pick(d, 'inquiryId');
      return id ? Routes.supportThread('inquiries', id) : Routes.support('inquiries');
    }
    case 'ORGANIZATION': {
      const id = entityId ?? pick(d, 'organizationId');
      return id ? Routes.organizationDetail(id) : Routes.organizations;
    }
    case 'VETERINARIAN':
      return Routes.veterinarian;
    case 'CONVERSATION': {
      const id = entityId ?? pick(d, 'conversationId');
      return id ? Routes.chatThread(id) : Routes.chat;
    }
    default:
      break;
  }

  if (n.type === 'ACCOUNT_STATUS_CHANGED') return Routes.account;
  return null;
}

/** Infer the entity family from the notification type (push payloads omit `entityType`). */
function entityKindFromType(type: string): string | null {
  if (type.startsWith('CONSULTATION_')) return 'CONSULTATION';
  if (type.startsWith('INQUIRY_')) return 'INQUIRY';
  if (type.startsWith('ORGANIZATION_')) return 'ORGANIZATION';
  if (type === 'VETERINARIAN_APPROVED' || type === 'VETERINARIAN_REJECTED') return 'VETERINARIAN';
  if (type === 'CHAT_MESSAGE_RECEIVED') return 'CONVERSATION';
  return null;
}
